export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(_req: NextRequest) {
  const supabase = createAdminClient()
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
