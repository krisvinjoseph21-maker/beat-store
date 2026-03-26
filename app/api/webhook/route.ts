import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'
import { sendDownloadEmail } from '@/lib/resend'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.text()
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(`Webhook Error: ${msg}`, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response('OK', { status: 200 })
  }

  const session = event.data.object
  const { beatIds, licenseType, quantityTier, beatTitles } = session.metadata ?? {}

  const customerEmail = session.customer_details?.email ?? ''
  const customerName = session.customer_details?.name ?? 'Customer'

  let parsedBeatIds: string[] = []
  let parsedBeatTitles: string[] = []
  try {
    parsedBeatIds = beatIds ? JSON.parse(beatIds) : []
    parsedBeatTitles = beatTitles ? JSON.parse(beatTitles) : []
  } catch {
    console.error('[webhook] Failed to parse metadata beat fields')
    return new Response('Invalid metadata', { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_email: customerEmail,
      customer_name: customerName,
      beat_ids: parsedBeatIds,
      license_type: licenseType ?? 'standard',
      quantity_tier: Number(quantityTier ?? 1),
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
      beatTitles: parsedBeatTitles,
      downloadToken: token,
      licenseType: licenseType ?? 'standard',
    })
  } catch (emailErr) {
    // Log but don't fail — order is recorded, customer can contact support
    console.error('[webhook] email send failed:', emailErr)
  }

  return new Response('OK', { status: 200 })
}
