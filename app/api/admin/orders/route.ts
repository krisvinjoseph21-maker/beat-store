import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { headers } from 'next/headers'
import { rateLimit, getIp } from '@/lib/rate-limit'
import crypto from 'crypto'

function verifyAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? ''
  if (!expected) return false
  const secret = 'prodkjbeats-admin'
  const inputHash = crypto.createHmac('sha256', secret).update(input).digest()
  const expectedHash = crypto.createHmac('sha256', secret).update(expected).digest()
  return crypto.timingSafeEqual(inputHash, expectedHash)
}

async function checkAuth() {
  const headersList = await headers()
  const auth = headersList.get('x-admin-password') ?? ''
  return verifyAdminPassword(auth)
}

export async function GET(req: NextRequest) {
  if (!rateLimit(getIp(req), 20, 60_000)) {
    return Response.json({ error: 'Too many requests.' }, { status: 429 })
  }
  if (!(await checkAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
