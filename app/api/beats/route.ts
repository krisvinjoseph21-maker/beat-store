import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { validateEnv } from '@/lib/env'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  if (!rateLimit(getIp(req), 30, 60_000)) {
    return Response.json({ error: 'Too many requests.' }, { status: 429 })
  }
  validateEnv()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('beats')
    .select('id, title, bpm, key, genre, subgenre, tags, preview_url, file_url, cover_url, is_active, created_at, pin_order')
    .eq('is_active', true)
    .order('pin_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[beats]', error)
    return Response.json({ error: 'Failed to load beats' }, { status: 500 })
  }

  // Strip file_url entirely — it must never reach the client.
  // If a beat has no dedicated preview_url, the player will simply be disabled
  // for that beat until the admin uploads a preview file.
  const beats = (data ?? []).map(({ file_url: _fileUrl, ...b }) => ({
    ...b,
    preview_url: b.preview_url ?? null,
    cover_url: b.cover_url ?? null,
  }))

  return Response.json(beats)
}
