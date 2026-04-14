import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { checkAdminAuth } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  if (!rateLimit(getIp(req), 20, 60_000)) {
    return Response.json({ error: 'Too many requests.' }, { status: 429 })
  }
  if (!(await checkAdminAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
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
