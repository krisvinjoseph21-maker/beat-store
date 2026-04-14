export const runtime = 'edge'

import { NextRequest } from 'next/server'
import { sendContactEmail } from '@/lib/resend'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 5, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return Response.json({ error: 'All fields are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/
    if (
      typeof name !== 'string' || name.length > 100 ||
      typeof email !== 'string' || email.length > 254 || !emailRegex.test(email) ||
      typeof subject !== 'string' || subject.length > 200 ||
      typeof message !== 'string' || message.length > 2000
    ) {
      return Response.json({ error: 'Invalid input' }, { status: 400 })
    }

    await sendContactEmail({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() })
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
