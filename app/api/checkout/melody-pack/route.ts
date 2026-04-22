export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/checkout/melody-pack'), 10, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const { packId } = await req.json()

    if (!packId || typeof packId !== 'string' || packId.length > 128) {
      return Response.json({ error: 'Invalid pack ID' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: pack, error } = await supabase
      .from('melody_packs')
      .select('id, title, price')
      .eq('id', packId)
      .eq('is_active', true)
      .single()

    if (error || !pack) {
      return Response.json({ error: 'Melody pack not found or unavailable' }, { status: 404 })
    }

    // Enforce $1 minimum (Stripe requires at least $0.50; we use $1 to be safe)
    const unitAmount = Math.max(Math.round(pack.price * 100), 100)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: pack.title,
              description: 'Digital Download — Melody Pack',
            },
          },
        },
      ],
      metadata: {
        packIds: JSON.stringify([pack.id]),
        packTitles: JSON.stringify([pack.title]),
      },
      billing_address_collection: 'auto',
      success_url: `${SITE_URL}/success`,
      cancel_url: `${SITE_URL}/sample-packs/melody-packs`,
    })

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('[checkout/melody-pack]', err)
    return Response.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
