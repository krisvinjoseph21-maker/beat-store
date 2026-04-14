export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { checkAdminAuth } from '@/lib/admin-auth'
import type { PromoConfig } from '@/lib/promos'

// GET — return current promo config
export async function GET(req: NextRequest) {
  if (!rateLimit(getIp(req), 20, 60_000)) {
    return Response.json({ error: 'Too many requests.' }, { status: 429 })
  }
  if (!(await checkAdminAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('promos')
    .select('sitewide_discount_pct, bogo_free_count')
    .eq('id', 1)
    .single()

  if (error) {
    // Row may not exist yet — return defaults
    return Response.json({ sitewide_discount_pct: null, bogo_free_count: null })
  }
  return Response.json(data)
}

// PATCH — update promo config
export async function PATCH(req: NextRequest) {
  if (!rateLimit(getIp(req), 20, 60_000)) {
    return Response.json({ error: 'Too many requests.' }, { status: 429 })
  }
  if (!(await checkAdminAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await req.json()) as Partial<PromoConfig>

    const updates: Partial<PromoConfig> = {}

    if ('sitewide_discount_pct' in body) {
      const pct = body.sitewide_discount_pct
      if (pct === null || (typeof pct === 'number' && pct >= 0 && pct <= 100)) {
        updates.sitewide_discount_pct = pct === 0 ? null : pct
      } else {
        return Response.json({ error: 'sitewide_discount_pct must be 0–100 or null' }, { status: 400 })
      }
    }

    if ('bogo_free_count' in body) {
      const count = body.bogo_free_count
      if (count === null || (typeof count === 'number' && count >= 0 && count <= 50)) {
        updates.bogo_free_count = count === 0 ? null : count
      } else {
        return Response.json({ error: 'bogo_free_count must be 0–50 or null' }, { status: 400 })
      }
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('promos')
      .upsert({ id: 1, ...updates }, { onConflict: 'id' })
      .select('sitewide_discount_pct, bogo_free_count')
      .single()

    if (error) {
      console.error('[admin/promos PATCH]', error)
      return Response.json({ error: 'Failed to update promo' }, { status: 500 })
    }
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}
