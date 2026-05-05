import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { PLACEHOLDER_BEATS } from '@/lib/placeholder-data'
import { findSimilar } from '@/lib/similarity'
import { LRUCache } from '@/lib/lru-cache'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import type { Beat } from '@/lib/store'

// Cache up to 100 similarity results; each entry is a small array of IDs + scores
const cache = new LRUCache<string, ReturnType<typeof findSimilar>>(100)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!rateLimit(getRateLimitKey(req, '/api/beats/similar'), 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const { id } = await params
  const limit = Math.min(Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') ?? '5')), 10)
  const cacheKey = `${id}:${limit}`

  const cached = cache.get(cacheKey)
  if (cached) {
    return NextResponse.json({ similar: cached, cached: true })
  }

  let beats: Beat[] = PLACEHOLDER_BEATS
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('beats')
      .select('id, title, bpm, key, genre, subgenre, tags, is_active, file_url, preview_url, cover_url, stems_path, created_at')
      .eq('is_active', true)
    if (data && data.length > 0) beats = data as Beat[]
  } catch {
    // Fall through to placeholder data
  }

  const target = beats.find((b) => b.id === id)
  if (!target) {
    return NextResponse.json({ error: 'Beat not found.' }, { status: 404 })
  }

  const similar = findSimilar(target, beats, limit)
  cache.set(cacheKey, similar)

  return NextResponse.json({ similar, cached: false })
}
