export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createAnonClient } from '@/lib/supabase-anon'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { reviewBodySchema } from '@/lib/schemas'

export async function GET(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/reviews'), 30, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }
  const supabase = createAnonClient()
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
  const supabaseUser = await createSupabaseServerClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    return Response.json({ error: 'You must be signed in to submit a review.' }, { status: 401 })
  }

  if (!rateLimit(getRateLimitKey(req, '/api/reviews'), 3, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  let parsed: ReturnType<typeof reviewBodySchema.safeParse>
  try {
    parsed = reviewBodySchema.safeParse(await req.json())
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const { author, rating, review } = parsed.data

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('mixing_mastering_reviews')
    .insert({ author, rating, body: review })

  if (error) {
    console.error('[reviews POST]', error)
    return Response.json({ error: 'Failed to submit review.' }, { status: 500 })
  }

  return Response.json({ success: true }, { status: 201 })
}
