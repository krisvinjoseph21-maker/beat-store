export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const VALID_PLANS = ['1-month', '3-month', '6-month', '12-month', 'lifetime'] as const
type PlanId = (typeof VALID_PLANS)[number]

const PLAN_PRICES: Record<PlanId, { usdPrice: number; label: string }> = {
  '1-month':  { usdPrice: 7,  label: '1 Month Subscription' },
  '3-month':  { usdPrice: 18, label: '3 Month Subscription' },
  '6-month':  { usdPrice: 30, label: '6 Month Subscription' },
  '12-month': { usdPrice: 50, label: '12 Month Subscription (Best Value)' },
  'lifetime': { usdPrice: 99, label: 'Lifetime Access' },
}

export async function POST(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/loop-subscription'), 10, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const body = (await req.json()) as { planId?: unknown }
    const planId = body.planId

    if (typeof planId !== 'string' || !(VALID_PLANS as readonly string[]).includes(planId)) {
      return Response.json({ error: 'Invalid plan selected.' }, { status: 400 })
    }

    const plan = PLAN_PRICES[planId as PlanId]

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: plan.usdPrice * 100,
            product_data: {
              name: 'PRODKJBEATS — Loop Subscription',
              description: plan.label,
            },
          },
        },
      ],
      metadata: {
        product: 'loop-subscription',
        planId,
      },
      success_url: `${SITE_URL}/success`,
      cancel_url: `${SITE_URL}/sample-packs/weekly-loop-subscription`,
    })

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('[loop-subscription]', err)
    return Response.json({ error: 'Checkout failed. Please try again.' }, { status: 500 })
  }
}
