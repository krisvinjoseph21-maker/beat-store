import { NextRequest } from 'next/server'
import { sendExclusiveOfferEmail } from '@/lib/resend'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 5, 60_000)) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const { beatId, artistName, email, offerPrice, message } = await req.json()

    // Validate required fields
    if (!beatId || !artistName || !email || !offerPrice) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (
      typeof artistName !== 'string' || artistName.length > 100 ||
      typeof email !== 'string' || email.length > 254 || !email.includes('@') ||
      typeof offerPrice !== 'number' || offerPrice < 1 || offerPrice > 100000 ||
      (message && (typeof message !== 'string' || message.length > 1000))
    ) {
      return Response.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Verify beat exists and is active
    const supabase = createAdminClient()
    const { data: beat, error } = await supabase
      .from('beats')
      .select('id, title')
      .eq('id', beatId)
      .eq('is_active', true)
      .single()

    if (error || !beat) {
      return Response.json({ error: 'Beat not found' }, { status: 404 })
    }

    await sendExclusiveOfferEmail({
      artistName: artistName.trim(),
      email: email.trim(),
      beatTitle: beat.title,
      beatId: beat.id,
      offerPrice,
      message: message?.trim() || undefined,
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('[exclusive-offer]', err)
    return Response.json({ error: 'Failed to send offer' }, { status: 500 })
  }
}
