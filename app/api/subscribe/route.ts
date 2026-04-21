export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { sendSubscribeNotificationEmail } from '@/lib/resend'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'

const emailRegex = /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/

export async function POST(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/subscribe'), 3, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const { name, email } = await req.json()

    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Email is required.' }, { status: 400 })
    }
    if (email.length > 254 || !emailRegex.test(email)) {
      return Response.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }
    if (name !== undefined && (typeof name !== 'string' || name.length > 100)) {
      return Response.json({ error: 'Invalid input.' }, { status: 400 })
    }

    await sendSubscribeNotificationEmail({
      name: (name ?? '').trim(),
      email: email.trim(),
    })

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Failed to subscribe. Please try again.' }, { status: 500 })
  }
}
