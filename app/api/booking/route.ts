export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { sendBookingEmail, sendBookingConfirmationEmail } from '@/lib/resend'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { bookingBodySchema } from '@/lib/schemas'

export async function POST(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/booking'), 3, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const result = bookingBodySchema.safeParse(await req.json())
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 })
    }
    const booking = result.data

    await Promise.all([
      sendBookingEmail(booking),
      sendBookingConfirmationEmail(booking),
    ])

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Failed to submit. Please try again.' }, { status: 500 })
  }
}
