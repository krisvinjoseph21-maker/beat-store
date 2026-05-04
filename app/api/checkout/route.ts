export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { stripe, getLicensePrice } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { getDiscountPct } from '@/lib/discount-codes'
import { checkoutBodySchema } from '@/lib/schemas'
import { getTracer } from '@/lib/tracer'
import { SpanStatusCode } from '@opentelemetry/api'
import type { LicenseType } from '@/lib/stripe'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/checkout'), 10, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const parsed = checkoutBodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    // Per-item format (from CartDrawer): { items: [{ beatId, licenseType }] }
    // Global format (from HomeFeaturedBeats/LicenseModal): { beatIds, licenseType }
    let beatIds: string[]
    let licenseType: LicenseType
    let perItemLicenses: Record<string, LicenseType> | null = null

    if ('items' in parsed.data) {
      const { items } = parsed.data
      beatIds = items.map((i) => i.beatId)
      // Dominant license for DB/email fallback: unlimited > premium > standard
      const LICENSE_RANK: Record<LicenseType, number> = { standard: 0, premium: 1, unlimited: 2 }
      licenseType = items.reduce<LicenseType>((best, i) =>
        LICENSE_RANK[i.licenseType] > LICENSE_RANK[best] ? i.licenseType : best, 'standard')
      perItemLicenses = Object.fromEntries(items.map((i) => [i.beatId, i.licenseType]))
    } else {
      beatIds = parsed.data.beatIds
      licenseType = parsed.data.licenseType
    }

    const tracer = getTracer()
    const supabase = createAdminClient()

    // Verify all requested beats exist and are active — reject before touching Stripe
    const { validBeats, beatsError } = await tracer.startActiveSpan('supabase.beats.verify', async (span) => {
      try {
        span.setAttribute('beat.requested', beatIds.length)
        const { data, error } = await supabase
          .from('beats')
          .select('id, title')
          .in('id', beatIds)
          .eq('is_active', true)
        span.setAttribute('beat.valid', data?.length ?? 0)
        if (error) span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
        return { validBeats: data, beatsError: error }
      } finally {
        span.end()
      }
    })

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
    const rawPrice = perItemLicenses
      ? Math.max(beatIds.reduce((sum, id) => sum + getLicensePrice(perItemLicenses![id] ?? licenseType, 1), 0), 1)
      : Math.max(getLicensePrice(licenseType, 1) * beatIds.length, 1)

    // Server-side discount validation — never trust the client-computed price
    const rawDiscountCode = parsed.data.discountCode ?? null
    let appliedDiscountPct = 0
    let validatedCode: string | null = null

    await tracer.startActiveSpan('discount.validate', async (span) => {
      try {
        span.setAttribute('discount.code_present', !!rawDiscountCode)
        if (rawDiscountCode) {
          const pct = getDiscountPct(rawDiscountCode)
          if (pct !== null) {
            appliedDiscountPct = pct
            validatedCode = rawDiscountCode.toUpperCase()
          }
          span.setAttribute('discount.applied', pct !== null)
          span.setAttribute('discount.pct', appliedDiscountPct)
        }
      } finally {
        span.end()
      }
    })

    const price = appliedDiscountPct > 0
      ? Math.max(Math.round(rawPrice * (1 - appliedDiscountPct / 100) * 100) / 100, 1)
      : rawPrice

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
    if (validatedCode) {
      metadata.discountCode = validatedCode
      metadata.discountPct = String(appliedDiscountPct)
    }

    const session = await tracer.startActiveSpan('stripe.checkout.session.create', async (span) => {
      try {
        span.setAttribute('checkout.beat_count', beatIds.length)
        span.setAttribute('checkout.price_usd', price)
        span.setAttribute('checkout.license_type', licenseType)
        const s = await stripe.checkout.sessions.create({
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
        span.setAttribute('checkout.session_id', s.id)
        return s
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR })
        throw err
      } finally {
        span.end()
      }
    })

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('[checkout]', err)
    return Response.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
