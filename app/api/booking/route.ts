import { NextRequest } from 'next/server'
import { sendBookingEmail, sendBookingConfirmationEmail } from '@/lib/resend'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 3, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const { artistName, email, genre, projectType, deadline, budget, referenceTracks } =
      await req.json()

    if (!artistName || !email || !genre || !projectType || !deadline || !budget) {
      return Response.json({ error: 'All required fields must be filled in.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/
    if (
      typeof artistName !== 'string' || artistName.length > 100 ||
      typeof email !== 'string' || email.length > 254 || !emailRegex.test(email) ||
      typeof genre !== 'string' || genre.length > 100 ||
      typeof projectType !== 'string' || projectType.length > 100 ||
      typeof deadline !== 'string' || deadline.length > 50 ||
      typeof budget !== 'string' || budget.length > 100 ||
      (referenceTracks !== undefined && (typeof referenceTracks !== 'string' || referenceTracks.length > 2000))
    ) {
      return Response.json({ error: 'Invalid input.' }, { status: 400 })
    }

    const trimmed = {
      artistName: artistName.trim(),
      email: email.trim(),
      genre: genre.trim(),
      projectType: projectType.trim(),
      deadline: deadline.trim(),
      budget: budget.trim(),
      referenceTracks: (referenceTracks ?? '').trim(),
    }

    await Promise.all([
      sendBookingEmail(trimmed),
      sendBookingConfirmationEmail(trimmed),
    ])

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Failed to submit. Please try again.' }, { status: 500 })
  }
}
