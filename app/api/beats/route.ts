import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { validateEnv } from '@/lib/env'

export async function GET(_req: NextRequest) {
  validateEnv()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('beats')
    .select('id, title, bpm, key, genre, subgenre, tags, preview_url, file_url, cover_url, is_active, created_at, pin_order')
    .eq('is_active', true)
    .order('pin_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Use file_url as fallback preview if no dedicated preview_url exists,
  // then strip file_url so the clean file is never exposed in the response.
  const beats = (data ?? []).map(({ file_url, ...b }) => ({
    ...b,
    preview_url: b.preview_url ?? (file_url?.startsWith('http') ? file_url : null),
    cover_url: b.cover_url ?? null,
  }))

  return Response.json(beats)
}
