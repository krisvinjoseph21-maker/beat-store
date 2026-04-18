export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('mixing_mastering_reviews')
    .select('id, author, rating, body, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[reviews GET]', error)
    return Response.json({ error: 'Failed to load reviews.' }, { status: 500 })
  }

  return Response.json(data ?? [])
}

export async function POST(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/reviews'), 3, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { author, rating, review } = body as Record<string, unknown>

  if (
    typeof author !== 'string' || author.trim().length === 0 || author.length > 80 ||
    typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5 ||
    typeof review !== 'string' || review.trim().length === 0 || review.length > 1000
  ) {
    return Response.json({ error: 'Invalid input.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('mixing_mastering_reviews')
    .insert({ author: author.trim(), rating, body: review.trim() })

  if (error) {
    console.error('[reviews POST]', error)
    return Response.json({ error: 'Failed to submit review.' }, { status: 500 })
  }

  return Response.json({ success: true }, { status: 201 })
}
