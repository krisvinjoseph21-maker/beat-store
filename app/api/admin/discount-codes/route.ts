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
    .from('discount_codes')
    .select('code, pct, created_at')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: 'Failed to fetch codes' }, { status: 500 })
  return Response.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (auth.rateLimited) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await req.json()) as { code?: unknown; pct?: unknown }

    if (typeof body.code !== 'string' || !body.code.trim() || body.code.length > 50) {
      return Response.json({ error: 'Invalid code' }, { status: 400 })
    }
    const pct = Number(body.pct)
    if (!Number.isInteger(pct) || pct < 1 || pct > 100) {
      return Response.json({ error: 'pct must be 1–100' }, { status: 400 })
    }

    const code = body.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!code) return Response.json({ error: 'Code must contain letters or numbers' }, { status: 400 })

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('discount_codes')
      .upsert({ code, pct }, { onConflict: 'code' })
      .select('code, pct, created_at')
      .single()

    if (error) return Response.json({ error: 'Failed to save code' }, { status: 500 })
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (auth.rateLimited) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await req.json()) as { code?: unknown }
    if (typeof body.code !== 'string' || !body.code.trim()) {
      return Response.json({ error: 'Invalid code' }, { status: 400 })
    }

    const code = body.code.trim().toUpperCase()
    const supabase = createAdminClient()
    const { error } = await supabase.from('discount_codes').delete().eq('code', code)

    if (error) return Response.json({ error: 'Failed to delete code' }, { status: 500 })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}
