export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { stripe, getLicensePrice } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import type { LicenseType } from '@/lib/stripe'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/checkout'), 10, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const body = await req.json()

    const VALID_LICENSE_TYPES: LicenseType[] = ['standard', 'premium', 'unlimited']

    // Per-item format (from CartDrawer): { items: [{ beatId, licenseType }] }
    // Global format (from HomeFeaturedBeats/LicenseModal): { beatIds, licenseType, quantityTier? }
    let beatIds: string[]
    let licenseType: LicenseType
    let perItemLicenses: Record<string, LicenseType> | null = null

    if (Array.isArray(body.items)) {
      const items = body.items as Array<{ beatId: string; licenseType: LicenseType }>
      if (!items.length) return Response.json({ error: 'No beats selected' }, { status: 400 })
      if (items.length > 20) return Response.json({ error: 'Too many beats' }, { status: 400 })
      if (!items.every((i) => typeof i.beatId === 'string' && i.beatId.length < 128)) {
        return Response.json({ error: 'Invalid beat ID' }, { status: 400 })
      }
      if (!items.every((i) => VALID_LICENSE_TYPES.includes(i.licenseType))) {
        return Response.json({ error: 'Invalid license type' }, { status: 400 })
      }
      beatIds = items.map((i) => i.beatId)
      // Dominant license for DB/email fallback: unlimited > premium > standard
      const LICENSE_RANK: Record<LicenseType, number> = { standard: 0, premium: 1, unlimited: 2 }
      licenseType = items.reduce<LicenseType>((best, i) =>
        LICENSE_RANK[i.licenseType] > LICENSE_RANK[best] ? i.licenseType : best, 'standard')
      perItemLicenses = Object.fromEntries(items.map((i) => [i.beatId, i.licenseType]))
    } else {
      beatIds = body.beatIds as string[]
      licenseType = body.licenseType as LicenseType
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
    }

    const supabase = createAdminClient()

    // Verify all requested beats exist and are active — reject before touching Stripe
    const { data: validBeats, error: beatsError } = await supabase
      .from('beats')
      .select('id, title')
      .in('id', beatIds)
      .eq('is_active', true)

    if (beatsError) {
      return Response.json({ error: 'Failed to verify beats' }, { status: 500 })
    }

    const validIds = new Set((validBeats ?? []).map((b: { id: string }) => b.id))
    const invalidIds = beatIds.filter((id) => !validIds.has(id))
    if (invalidIds.length > 0) {
      return Response.json({ error: 'One or more beats are no longer available' }, { status: 400 })
    }

    const beatTitles = (validBeats ?? []).map((b: { title: string }) => b.title)

    // Per-item pricing: sum each beat's individual license price
    // Global pricing: per-beat rate × count (used by bundle flow)
    const price = perItemLicenses
      ? Math.max(beatIds.reduce((sum, id) => sum + getLicensePrice(perItemLicenses![id] ?? licenseType, 1), 0), 1)
      : Math.max(getLicensePrice(licenseType, 1) * beatIds.length, 1)

    const licenseLabel = licenseType === 'standard' ? 'Basic Lease' : licenseType === 'premium' ? 'Premium Lease' : 'Unlimited Lease'
    const description = `${licenseLabel} · ${beatIds.length} beat${beatIds.length > 1 ? 's' : ''}: ${beatTitles.join(', ')}`

    const metadata: Record<string, string> = {
      beatIds: JSON.stringify(beatIds),
      licenseType,
      // Stripe metadata values max 500 chars — truncate if needed
      beatTitles: JSON.stringify(beatTitles).slice(0, 490),
    }
    if (perItemLicenses) {
      metadata.beatLicenses = JSON.stringify(perItemLicenses).slice(0, 490)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(price * 100),
            product_data: {
              name: `PRODKJBEATS — ${licenseLabel}`,
              description,
            },
          },
        },
      ],
      metadata,
      customer_email: undefined,
      billing_address_collection: 'auto',
      success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/cancel`,
    })

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('[checkout]', err)
    return Response.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
