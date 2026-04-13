import { NextRequest } from 'next/server'
import { stripe, getLicensePrice } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'
import { getDiscountPct, applyDiscount } from '@/lib/discount-codes'
import { rateLimit, getIp } from '@/lib/rate-limit'
import type { LicenseType, QuantityTier } from '@/lib/stripe'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 10, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const { beatIds, licenseType, quantityTier, discountCode } = (await req.json()) as {
      beatIds: string[]
      licenseType: LicenseType
      quantityTier: QuantityTier
      discountCode?: string
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

    // Fetch beat titles for line item description
    const supabase = createAdminClient()
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

    const basePrice = getLicensePrice(licenseType, quantityTier)
    const discountPct = discountCode ? getDiscountPct(discountCode) : null
    const price = discountPct !== null ? applyDiscount(basePrice, discountPct) : basePrice
    const licenseLabel = licenseType === 'standard' ? 'Standard Lease' : 'Unlimited Lease'
    const discountNote = discountPct !== null ? ` (${discountPct}% off)` : ''
    const description = `${licenseLabel}${discountNote} · ${quantityTier} beat${quantityTier > 1 ? 's' : ''}: ${beatTitles.join(', ')}`

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
        quantityTier: String(quantityTier),
        beatTitles: JSON.stringify(beatTitles),
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
