import { NextRequest } from 'next/server'
import { sendServiceInquiryEmail } from '@/lib/resend'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 5, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const { artistName, email, serviceType, projectDetails } = await req.json()

    if (!artistName || !email || !serviceType || !projectDetails) {
      return Response.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (
      typeof artistName !== 'string' || artistName.length > 100 ||
      typeof email !== 'string' || email.length > 254 || !email.includes('@') ||
      typeof serviceType !== 'string' || serviceType.length > 100 ||
      typeof projectDetails !== 'string' || projectDetails.length > 2000
    ) {
      return Response.json({ error: 'Invalid input' }, { status: 400 })
    }

    await sendServiceInquiryEmail({
      artistName: artistName.trim(),
      email: email.trim(),
      serviceType: serviceType.trim(),
      projectDetails: projectDetails.trim(),
    })
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Failed to send inquiry' }, { status: 500 })
  }
}
