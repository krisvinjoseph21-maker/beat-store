import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { createAnonClient } from '@/lib/supabase-anon'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { vibeSearchBodySchema } from '@/lib/schemas'
import { embedText } from '@/lib/embeddings'
import { checkPriceFloor, applyStructuredFilters, type ExtractedFilters } from '@/lib/vibe-filters'
import { getTracer } from '@/lib/tracer'
import { SpanStatusCode } from '@opentelemetry/api'
import type { Beat } from '@/lib/store'

export const runtime = 'nodejs'

// Constructed lazily inside extractFilters (not at module scope): the Groq
// SDK throws synchronously if GROQ_API_KEY is missing, which would crash
// every request to this route before the try/catch fallback below ever runs.
let client: Groq | null = null
function getGroqClient(): Groq {
  if (!client) client = new Groq()
  return client
}

const MATCH_COUNT = 50
const FINAL_LIMIT = 20

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
  created_at: string
  similarity: number
}

const EXTRACT_TOOL: Groq.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'extract_filters',
    description: 'Extract structured search filters mentioned in a natural-language beat search query. Omit any field not mentioned.',
    parameters: {
      type: 'object',
      properties: {
        priceMax: { type: 'number', description: 'Maximum price in USD the user mentioned (e.g. "under $30" -> 30).' },
        bpmMin: {
          type: 'number',
          description:
            'Lower bound of the tempo the user wants. Producers never mean an exact BPM, so always extract a window, never a single point: ' +
            '"around 140 bpm" or "140 bpm" -> bpmMin 132, bpmMax 148 (±8). ' +
            '"uptempo"/"fast"/"high energy"/"hype" -> bpmMin 140 (no bpmMax). ' +
            '"slow"/"chill"/"laid back"/"mellow"/"relaxed" -> bpmMax 95 (no bpmMin). ' +
            'An explicit range like "130-150 bpm" -> use those exact bounds. ' +
            'Do not set this for purely emotional/mood words (dark, moody, smooth, sad) that are not about tempo.',
        },
        bpmMax: { type: 'number', description: 'Upper bound of the tempo window — see bpmMin for how to derive it.' },
        key: { type: 'string', description: 'Musical key mentioned, e.g. "Am", "F#m".' },
        licenseType: { type: 'string', enum: ['standard', 'premium', 'unlimited'], description: 'License tier mentioned, if any.' },
        genre: { type: 'string', description: 'Genre mentioned, e.g. "Trap", "Drill", "R&B", "Afrobeats".' },
      },
    },
  },
}

/** Single attempt, no retries — a Groq error/timeout falls back to plain semantic search instead of burning quota on retries. */
async function extractFilters(query: string): Promise<ExtractedFilters | null> {
  const completion = await getGroqClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 256,
    messages: [
      { role: 'system', content: 'Extract structured beat-search filters from the user query by calling extract_filters. Only include a field if the query actually implies it — omit any field entirely rather than guessing a default or placeholder value (e.g. never invent priceMax: 0 just because price was not mentioned).' },
      { role: 'user', content: query },
    ],
    tools: [EXTRACT_TOOL],
    tool_choice: { type: 'function', function: { name: 'extract_filters' } },
  })

  const call = completion.choices[0]?.message?.tool_calls?.[0]
  if (!call) return null

  const parsed = JSON.parse(call.function.arguments)
  return {
    // The model occasionally hallucinates priceMax: 0 for queries that never
    // mention price at all — nobody actually asks for a $0 beat, and 0 would
    // otherwise trip the price-floor short-circuit and wipe every result.
    priceMax: typeof parsed.priceMax === 'number' && parsed.priceMax > 0 ? parsed.priceMax : null,
    bpmMin: typeof parsed.bpmMin === 'number' ? parsed.bpmMin : null,
    bpmMax: typeof parsed.bpmMax === 'number' ? parsed.bpmMax : null,
    key: typeof parsed.key === 'string' ? parsed.key : null,
    licenseType: ['standard', 'premium', 'unlimited'].includes(parsed.licenseType) ? parsed.licenseType : null,
    genre: typeof parsed.genre === 'string' ? parsed.genre : null,
  }
}

function toBeat(r: MatchRow): Beat {
  return {
    id: r.id,
    title: r.title,
    bpm: r.bpm,
    key: r.key ?? '',
    genre: r.genre ?? '',
    subgenre: r.subgenre ?? '',
    tags: r.tags ?? [],
    file_url: null,
    preview_url: r.preview_url,
    cover_url: r.cover_url,
    stems_path: null,
    is_active: true,
    created_at: r.created_at,
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/vibe-search/agent'), 5, 60_000)) {
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

  let filters: ExtractedFilters | null = null
  try {
    filters = await tracer.startActiveSpan('groq.extract_filters', async (span) => {
      try {
        return await extractFilters(query)
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR })
        console.error('[vibe-search/agent] groq extraction failed, falling back to plain semantic search', err)
        return null
      } finally {
        span.end()
      }
    })
  } catch {
    filters = null
  }

  const priceWarning = checkPriceFloor(filters?.priceMax ?? null)
  if (priceWarning) {
    return Response.json({ results: [], appliedFilters: filters, priceWarning })
  }

  let embedding: number[]
  try {
    embedding = await tracer.startActiveSpan('embeddings.embedText', async (span) => {
      try {
        return await embedText(query)
      } finally {
        span.end()
      }
    })
  } catch (err) {
    console.error('[vibe-search/agent] embedding error', err)
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
    console.error('[vibe-search/agent] supabase error', matchError)
    return Response.json({ error: 'Search is temporarily unavailable.' }, { status: 500 })
  }

  const filtered = applyStructuredFilters(rows, filters)
  const results: Beat[] = filtered.slice(0, FINAL_LIMIT).map(toBeat)

  return Response.json({ results, appliedFilters: filters })
}
