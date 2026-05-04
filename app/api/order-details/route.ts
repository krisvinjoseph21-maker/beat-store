export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/order-details'), 20, 60_000)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId || !/^cs_(test|live)_/.test(sessionId)) {
    return Response.json({ error: 'Invalid session' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return Response.json({ error: 'Session not found' }, { status: 404 })
    }

    const { beatIds, licenseType, beatTitles, packIds, packTitles } = session.metadata ?? {}

    let parsedBeatIds: string[] = []
    let parsedBeatTitles: string[] = []
    let parsedPackIds: string[] = []
    let parsedPackTitles: string[] = []
    try {
      parsedBeatIds = beatIds ? JSON.parse(beatIds) : []
      parsedBeatTitles = beatTitles ? JSON.parse(beatTitles) : []
      parsedPackIds = packIds ? JSON.parse(packIds) : []
      parsedPackTitles = packTitles ? JSON.parse(packTitles) : []
    } catch { /* ignore parse errors */ }

    const allIds = [...parsedBeatIds, ...parsedPackIds]
    const allTitles = [...parsedBeatTitles, ...parsedPackTitles]
    const totalValue = (session.amount_total ?? 0) / 100
    const perItemPrice =
      allIds.length > 0
        ? Math.round((totalValue / allIds.length) * 100) / 100
        : totalValue

    const items = allIds.map((id, i) => ({
      id,
      name: allTitles[i] ?? id,
      category: licenseType ?? 'standard',
      price: perItemPrice,
    }))

    return Response.json({
      transactionId: session.id,
      value: totalValue,
      items,
    })
  } catch {
    return Response.json({ error: 'Session not found' }, { status: 404 })
  }
}
