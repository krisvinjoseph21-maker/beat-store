export interface PromoConfig {
  sitewide_discount_pct: number | null  // e.g. 20 = 20% off all beats; null = inactive
  bogo_free_count: number | null        // e.g. 2 = "buy 1 get 2 free"; null = BOGO inactive
}

export const PROMO_DEFAULTS: PromoConfig = {
  sitewide_discount_pct: null,
  bogo_free_count: null,
}

export function bogoIsActive(p: PromoConfig): p is PromoConfig & { bogo_free_count: number } {
  return typeof p.bogo_free_count === 'number' && p.bogo_free_count > 0
}

export function sitewideIsActive(p: PromoConfig): p is PromoConfig & { sitewide_discount_pct: number } {
  return typeof p.sitewide_discount_pct === 'number' && p.sitewide_discount_pct > 0
}

/** Returns the effective discount % to apply at checkout (best of sitewide vs coupon code). */
export function effectiveDiscountPct(
  sitewisePct: number | null,
  couponPct: number | null
): number | null {
  if (sitewisePct === null && couponPct === null) return null
  return Math.max(sitewisePct ?? 0, couponPct ?? 0)
}
