export const runtime = 'edge'

import { type NextRequest } from 'next/server'
import { createAnonClient } from '@/lib/supabase-anon'
import { PROMO_DEFAULTS } from '@/lib/promos'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'

// Public endpoint — returns active promo config for the storefront.
// No auth required; no sensitive data exposed.
export async function GET(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/promos'), 60, 60_000)) {
    return Response.json({ error: 'Too many requests.' }, { status: 429 })
  }
  try {
    const supabase = createAnonClient()
    const { data, error } = await supabase
      .from('promos')
      .select('sitewide_discount_pct, bogo_free_count')
      .eq('id', 1)
      .single()

    if (error || !data) return Response.json(PROMO_DEFAULTS)
    return Response.json(data)
  } catch {
    return Response.json(PROMO_DEFAULTS)
  }
}
