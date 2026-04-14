import { NextRequest } from 'next/server'
import { stripe, getLicensePrice } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'
import { getDiscountPct, applyDiscount } from '@/lib/discount-codes'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { bogoIsActive, sitewideIsActive, effectiveDiscountPct } from '@/lib/promos'
import type { LicenseType, QuantityTier } from '@/lib/stripe'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 10, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const { beatIds, licenseType, quantityTier, discountCode, useBogo } = (await req.json()) as {
      beatIds: string[]
      licenseType: LicenseType
      quantityTier: QuantityTier
      discountCode?: string
      useBogo?: boolean
    }

    // Whitelist validation — never trust client-provided values
    const VALID_LICENSE_TYPES: LicenseType[] = ['standard', 'unlimited']
    const VALID_QTY_TIERS: QuantityTier[] = [1, 3, 5]

    if (!beatIds?.length || !Array.isArray(beatIds)) {
      return Response.json({ error: 'No beats selected' }, { status: 400 })
    }
    if (beatIds.length > 20) {
      return Response.json({ error: 'Too many beats' }, { status: 400 })
    }
    if (!beatIds.every((id) => typeof id === 'string' && id.length < 128)) {
      return Response.json({ error: 'Invalid beat ID' }, { status: 400 })
    }
    if (!VALID_LICENSE_TYPES.includes(licenseType)) {
      return Response.json({ error: 'Invalid license type' }, { status: 400 })
    }
    if (!VALID_QTY_TIERS.includes(quantityTier)) {
      return Response.json({ error: 'Invalid quantity tier' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Fetch active promo config from DB (server-side enforcement)
    let promo = { sitewide_discount_pct: null as number | null, bogo_free_count: null as number | null }
    try {
      const { data } = await supabase
        .from('promos')
        .select('sitewide_discount_pct, bogo_free_count')
        .eq('id', 1)
        .single()
      if (data) promo = data
    } catch {
      // Continue without promo if DB read fails
    }

    // Fetch beat titles for line item description
    let beatTitles: string[] = beatIds.map((id) => `Beat ${id}`)
    try {
      const { data } = await supabase
        .from('beats')
        .select('id, title')
        .in('id', beatIds)
      if (data?.length) {
        beatTitles = data.map((b: { title: string }) => b.title)
      }
    } catch {
      // Use fallback titles
    }

    // Determine pricing tier — BOGO overrides quantityTier to 1-beat price
    let pricingTier: QuantityTier = quantityTier
    let promoNotes: string[] = []

    if (useBogo && bogoIsActive(promo)) {
      pricingTier = 1
      promoNotes.push(`BOGO: Buy 1 Get ${promo.bogo_free_count} Free`)
    }

    const basePrice = getLicensePrice(licenseType, pricingTier)

    // Coupon code discount
    const couponPct = discountCode ? getDiscountPct(discountCode) : null
    // Sitewide discount — take the better of sitewide vs coupon (no stacking)
    const sitewisePct = sitewideIsActive(promo) ? promo.sitewide_discount_pct : null
    const bestDiscountPct = effectiveDiscountPct(sitewisePct, couponPct)

    if (sitewisePct !== null) promoNotes.push(`${sitewisePct}% sitewide discount`)
    if (couponPct !== null && couponPct > (sitewisePct ?? 0)) promoNotes.push(`${couponPct}% coupon (${discountCode})`)

    const rawPrice = bestDiscountPct !== null ? applyDiscount(basePrice, bestDiscountPct) : basePrice
    // Never allow a $0 or negative checkout — enforce $1 minimum
    const price = Math.max(rawPrice, 1)
    const licenseLabel = licenseType === 'standard' ? 'Standard Lease' : 'Unlimited Lease'
    const promoNote = promoNotes.length > 0 ? ` · ${promoNotes.join(' · ')}` : ''
    const description = `${licenseLabel}${promoNote} · ${beatIds.length} beat${beatIds.length > 1 ? 's' : ''}: ${beatTitles.join(', ')}`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: price * 100,
            product_data: {
              name: `PRODKJBEATS — ${licenseLabel}`,
              description,
            },
          },
        },
      ],
      metadata: {
        beatIds: JSON.stringify(beatIds),
        licenseType,
        quantityTier: String(pricingTier),
        // Stripe metadata values max 500 chars — truncate if needed
        beatTitles: JSON.stringify(beatTitles).slice(0, 490),
      },
      customer_email: undefined,
      billing_address_collection: 'auto',
      success_url: `${SITE_URL}/success`,
      cancel_url: `${SITE_URL}/cancel`,
    })

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('[checkout]', err)
    return Response.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
