import { createAdminClient } from '@/lib/supabase'
import { PROMO_DEFAULTS } from '@/lib/promos'

// Public endpoint — returns active promo config for the storefront.
// No auth required; no sensitive data exposed.
export async function GET() {
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
