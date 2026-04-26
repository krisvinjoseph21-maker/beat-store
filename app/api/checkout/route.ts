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
    const { beatIds, licenseType } = (await req.json()) as {
      beatIds: string[]
      licenseType: LicenseType
    }

    const VALID_LICENSE_TYPES: LicenseType[] = ['standard', 'premium', 'unlimited']

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

    // Price: per-beat rate × number of beats in cart
    const perBeatPrice = getLicensePrice(licenseType, 1)
    const price = Math.max(perBeatPrice * beatIds.length, 1)

    const licenseLabel = licenseType === 'standard' ? 'Basic Lease' : licenseType === 'premium' ? 'Premium Lease' : 'Unlimited Lease'
    const description = `${licenseLabel} · ${beatIds.length} beat${beatIds.length > 1 ? 's' : ''}: ${beatTitles.join(', ')}`

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
      metadata: {
        beatIds: JSON.stringify(beatIds),
        licenseType,
        // Stripe metadata values max 500 chars — truncate if needed
        beatTitles: JSON.stringify(beatTitles).slice(0, 490),
      },
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
