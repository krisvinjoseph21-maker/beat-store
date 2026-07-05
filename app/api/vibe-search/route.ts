import { NextRequest } from 'next/server'
import { createAnonClient } from '@/lib/supabase-anon'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { vibeSearchBodySchema } from '@/lib/schemas'
import { embedText } from '@/lib/embeddings'
import { getTracer } from '@/lib/tracer'
import { SpanStatusCode } from '@opentelemetry/api'
import type { Beat } from '@/lib/store'

export const runtime = 'nodejs'

interface MatchRow {
  id: string
  title: string
  bpm: number
  key: string | null
  genre: string | null
  subgenre: string | null
  tags: string[] | null
  cover_url: string | null
  preview_url: string | null
  preview_is_tagged: boolean | null
  created_at: string
  similarity: number
}

const MATCH_COUNT = 24

export async function POST(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/vibe-search'), 10, 60_000)) {
    return Response.json({ error: 'Too many requests.' }, { status: 429 })
  }

  let query: string
  try {
    const result = vibeSearchBodySchema.safeParse(await req.json())
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 })
    }
    query = result.data.query
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const tracer = getTracer()

  let embedding: number[]
  try {
    embedding = await tracer.startActiveSpan('embeddings.embedText', async (span) => {
      try {
        return await embedText(query)
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR })
        throw err
      } finally {
        span.end()
      }
    })
  } catch (err) {
    console.error('[vibe-search] embedding error', err)
    return Response.json({ error: 'Failed to process search query.' }, { status: 500 })
  }

  const { rows, matchError } = await tracer.startActiveSpan('supabase.match_beats', async (span) => {
    try {
      const supabase = createAnonClient()
      const { data, error } = await supabase.rpc('match_beats', {
        query_embedding: embedding,
        match_count: MATCH_COUNT,
        min_similarity: 0,
      })
      span.setAttribute('match.count', data?.length ?? 0)
      if (error) span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
      return { rows: (data ?? []) as MatchRow[], matchError: error }
    } finally {
      span.end()
    }
  })

  if (matchError) {
    console.error('[vibe-search] supabase error', matchError)
    return Response.json({ error: 'Search is temporarily unavailable.' }, { status: 500 })
  }

  const results: Beat[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    bpm: r.bpm,
    key: r.key ?? '',
    genre: r.genre ?? '',
    subgenre: r.subgenre ?? '',
    tags: r.tags ?? [],
    file_url: null,
    preview_url: r.preview_url,
    preview_is_tagged: r.preview_is_tagged ?? false,
    cover_url: r.cover_url,
    stems_path: null,
    is_active: true,
    created_at: r.created_at,
  }))

  return Response.json({ results })
}
