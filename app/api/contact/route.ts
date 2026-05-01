export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { sendContactEmail } from '@/lib/resend'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { containsHarmfulContent } from '@/lib/content-filter'

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, '/api/contact')

  // Burst: max 5 per minute
  if (!rateLimit(key, 5, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }
  // Sustained: max 10 per hour
  if (!rateLimit(key + ':h', 10, 60 * 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const { name, email, subject, message } = await req.json()

    const emailRegex = /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/
    if (
      typeof name !== 'string' || !name.trim() || name.length > 100 ||
      typeof email !== 'string' || !email.trim() || email.length > 254 || !emailRegex.test(email.trim()) ||
      typeof subject !== 'string' || !subject.trim() || subject.length > 200 ||
      typeof message !== 'string' || !message.trim() || message.length > 2000
    ) {
      return Response.json({ error: 'All fields are required' }, { status: 400 })
    }

    const trimmed = {
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    }

    if (containsHarmfulContent(trimmed.subject, trimmed.message)) {
      return Response.json({ error: 'Your message could not be sent. Please review your content and try again.' }, { status: 422 })
    }

    await sendContactEmail(trimmed)
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
