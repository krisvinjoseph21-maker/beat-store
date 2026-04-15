export const runtime = 'edge'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { validateEnv } from '@/lib/env'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/beats'), 30, 60_000)) {
    return Response.json({ error: 'Too many requests.' }, { status: 429 })
  }
  validateEnv()
  const supabase = createAdminClient()
  // Never select file_url, file_path, or stems_path — they must never reach the client.
  const { data, error } = await supabase
    .from('beats')
    .select('id, title, bpm, key, genre, subgenre, tags, preview_url, cover_url, is_active, created_at, pin_order')
    .eq('is_active', true)
    .order('pin_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[beats]', error)
    return Response.json({ error: 'Failed to load beats' }, { status: 500 })
  }

  const beats = (data ?? []).map((b) => ({
    ...b,
    preview_url: b.preview_url ?? null,
    cover_url: b.cover_url ?? null,
  }))

  return Response.json(beats)
}
