export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendDownloadEmail } from '@/lib/resend'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import crypto from 'crypto'

// Maximum webhook body size: 1 MB. Stripe payloads are tiny (<10 KB);
// anything larger is either malicious or corrupt.
const MAX_BODY_BYTES = 1_048_576

export async function POST(req: NextRequest) {
  // Rate-limit: Stripe retries are legitimate, but unlimited flooding is not.
  // 120/min is generous for real Stripe traffic on a single IP.
  if (!rateLimit(getRateLimitKey(req, '/api/webhook'), 120, 60_000)) {
    return new Response('Too many requests', { status: 429 })
  }

  // Reject oversized bodies before reading them into memory
  const contentLength = Number(req.headers.get('content-length') ?? 0)
  if (contentLength > MAX_BODY_BYTES) {
    return new Response('Payload too large', { status: 413 })
  }

  const body = await req.text()

  // Secondary size check for chunked transfers that omit Content-Length
  if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
    return new Response('Payload too large', { status: 413 })
  }

  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    return new Response('Missing stripe-signature', { status: 400 })
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not configured')
    return new Response('Server misconfiguration', { status: 500 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response('OK', { status: 200 })
  }

  const session = event.data.object
  const { beatIds, licenseType, quantityTier, beatTitles, packIds, packTitles } = session.metadata ?? {}

  const customerEmail = session.customer_details?.email ?? ''
  const customerName = session.customer_details?.name ?? 'Customer'

  let parsedBeatIds: string[] = []
  let parsedBeatTitles: string[] = []
  let parsedPackIds: string[] = []
  let parsedPackTitles: string[] = []
  try {
    parsedBeatIds = beatIds ? JSON.parse(beatIds) : []
    parsedBeatTitles = beatTitles ? JSON.parse(beatTitles) : []
    parsedPackIds = packIds ? JSON.parse(packIds) : []
    parsedPackTitles = packTitles ? JSON.parse(packTitles) : []
  } catch {
    console.error('[webhook] Failed to parse metadata fields')
    return new Response('Invalid metadata', { status: 400 })
  }

  if (parsedBeatIds.length === 0 && parsedPackIds.length === 0) {
    console.error('[webhook] No beat IDs or pack IDs in metadata')
    return new Response('Invalid metadata', { status: 400 })
  }

  const supabase = createAdminClient()

  // Idempotency — if Stripe retries the webhook, don't create a duplicate order
  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_session_id', session.id)
    .single()

  if (existing) {
    // Already processed — return 200 so Stripe stops retrying
    return new Response('OK', { status: 200 })
  }

  const VALID_QTY_TIERS = [1, 3, 5]
  const parsedTier = Number(quantityTier ?? 1)
  const validatedTier = VALID_QTY_TIERS.includes(parsedTier) ? parsedTier : 1

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_email: customerEmail,
      customer_name: customerName,
      beat_ids: parsedBeatIds,
      melody_pack_ids: parsedPackIds,
      license_type: licenseType ?? 'standard',
      quantity_tier: validatedTier,
      total_price: (session.amount_total ?? 0) / 100,
      stripe_session_id: session.id,
      status: 'paid',
    })
    .select()
    .single()

  if (orderError) {
    console.error('[webhook] order insert error:', orderError.message)
    return new Response('DB error', { status: 500 })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  await supabase.from('downloads').insert({
    order_id: order.id,
    token,
    expires_at: expiresAt,
    used: false,
  })

  try {
    await sendDownloadEmail({
      customerEmail,
      customerName,
      beatTitles: [...parsedBeatTitles, ...parsedPackTitles],
      downloadToken: token,
      licenseType: licenseType ?? 'standard',
    })
  } catch (emailErr) {
    // Log but don't fail — order is recorded, customer can contact support
    console.error('[webhook] email send failed:', emailErr)
  }

  return new Response('OK', { status: 200 })
}
