export const runtime = 'edge'

import { type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { PROMO_DEFAULTS } from '@/lib/promos'
import { rateLimit, getIp } from '@/lib/rate-limit'

// Public endpoint — returns active promo config for the storefront.
// No auth required; no sensitive data exposed.
export async function GET(req: NextRequest) {
  if (!rateLimit(getIp(req), 60, 60_000)) {
    return Response.json(PROMO_DEFAULTS, { status: 429 })
  }
  try {
    const supabase = createAdminClient()
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
