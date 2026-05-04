export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { sendContactEmail } from '@/lib/resend'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { containsHarmfulContent } from '@/lib/content-filter'
import { contactBodySchema } from '@/lib/schemas'

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
    const result = contactBodySchema.safeParse(await req.json())
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 })
    }
    const { name, email, subject, message } = result.data

    if (containsHarmfulContent(subject, message)) {
      return Response.json({ error: 'Your message could not be sent. Please review your content and try again.' }, { status: 422 })
    }

    await sendContactEmail({ name, email, subject, message })
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
