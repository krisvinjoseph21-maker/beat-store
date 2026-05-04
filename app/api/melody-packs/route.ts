export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createAnonClient } from '@/lib/supabase-anon'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/melody-packs'), 30, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }
  const supabase = createAnonClient()
  const { data, error } = await supabase
    .from('melody_packs')
    .select('id, title, vendor, description, price, compare_at_price, cover_url, is_featured, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[melody-packs GET]', error)
    return Response.json({ error: 'Failed to fetch melody packs' }, { status: 500 })
  }
  return Response.json(data ?? [])
}
