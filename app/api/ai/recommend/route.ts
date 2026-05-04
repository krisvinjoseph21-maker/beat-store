import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAnonClient } from '@/lib/supabase-anon'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { recommendBodySchema } from '@/lib/schemas'
import { getTracer } from '@/lib/tracer'
import { SpanStatusCode } from '@opentelemetry/api'

const client = new Anthropic()

interface Beat {
  id: string
  title: string
  bpm: number
  key: string | null
  genre: string | null
  subgenre: string | null
  tags: string[] | null
}

interface Recommendation {
  id: string
  title: string
  reason: string
}

export async function POST(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/ai/recommend'), 5, 60_000)) {
    return Response.json({ error: 'Too many requests.' }, { status: 429 })
  }

  let query: string
  try {
    const result = recommendBodySchema.safeParse(await req.json())
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 })
    }
    query = result.data.query
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const tracer = getTracer()

  // Fetch beat catalog
  const { beats, catalogError } = await tracer.startActiveSpan('supabase.beats.fetch', async (span) => {
    try {
      const supabase = createAnonClient()
      const { data, error } = await supabase
        .from('beats')
        .select('id, title, bpm, key, genre, subgenre, tags')
        .eq('is_active', true)
        .order('pin_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      span.setAttribute('beat.count', data?.length ?? 0)
      if (error) span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
      return { beats: (data ?? []) as Beat[], catalogError: error }
    } finally {
      span.end()
    }
  })

  if (catalogError) {
    console.error('[ai/recommend] supabase error', catalogError)
    return Response.json({ error: 'Failed to load beat catalog.' }, { status: 500 })
  }

  if (beats.length === 0) {
    return Response.json({ recommendations: [] })
  }

  const catalog = beats
    .map((b) => {
      const tags = b.tags?.join(', ') ?? ''
      const parts = [
        `ID:${b.id}`,
        `Title:${b.title}`,
        `BPM:${b.bpm}`,
        b.key ? `Key:${b.key}` : null,
        b.genre ? `Genre:${b.genre}` : null,
        b.subgenre ? `Subgenre:${b.subgenre}` : null,
        tags ? `Tags:${tags}` : null,
      ]
      return parts.filter(Boolean).join(' | ')
    })
    .join('\n')

  // Call Claude with prompt caching on the beats catalog
  const message = await tracer.startActiveSpan('anthropic.messages.create', async (span) => {
    try {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: [
          {
            type: 'text',
            // The catalog is static between requests — cache it to avoid re-tokenizing on every call.
            text: `You are a beat recommendation engine for a music production marketplace.
You will be given a catalog of beats and a user's description of the vibe or sound they need.
Return the 3 most relevant beats as a JSON array with this exact shape:
[{"id":"<beat_id>","title":"<beat_title>","reason":"<one sentence explaining why it fits>"}]
Respond with ONLY the JSON array — no markdown, no explanation outside the array.

BEAT CATALOG:
${catalog}`,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: `Find beats for this description: ${query}` }],
      })
      span.setAttribute('llm.input_tokens', msg.usage.input_tokens)
      span.setAttribute('llm.output_tokens', msg.usage.output_tokens)
      // cache_read_input_tokens is present when the catalog was served from cache
      const usage = msg.usage as typeof msg.usage & { cache_read_input_tokens?: number }
      if (usage.cache_read_input_tokens) {
        span.setAttribute('llm.cache_read_tokens', usage.cache_read_input_tokens)
      }
      return msg
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw err
    } finally {
      span.end()
    }
  })

  const raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''

  let recommendations: Recommendation[] = []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      recommendations = parsed
        .filter(
          (r): r is Recommendation =>
            typeof r?.id === 'string' &&
            typeof r?.title === 'string' &&
            typeof r?.reason === 'string'
        )
        .slice(0, 3)
    }
  } catch {
    console.error('[ai/recommend] failed to parse Claude response', raw)
    return Response.json({ error: 'Recommendation engine returned an unexpected response.' }, { status: 500 })
  }

  return Response.json({ recommendations })
}
