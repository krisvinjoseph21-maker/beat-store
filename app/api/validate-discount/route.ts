export const runtime = 'edge'

import { NextRequest } from 'next/server'
import { getDiscountPct } from '@/lib/discount-codes'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 5, 60_000)) {
    return Response.json({ error: 'Too many requests.' }, { status: 429 })
  }

  try {
    const { code } = (await req.json()) as { code?: unknown }

    if (!code || typeof code !== 'string' || code.length > 50) {
      return Response.json({ valid: false }, { status: 200 })
    }

    const pct = getDiscountPct(code)
    if (pct === null) {
      return Response.json({ valid: false })
    }
    return Response.json({ valid: true, pct })
  } catch {
    return Response.json({ valid: false })
  }
}
