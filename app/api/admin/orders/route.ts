export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (auth.rateLimited) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) {
    console.error('[admin/orders]', error)
    return Response.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
  return Response.json(data)
}
