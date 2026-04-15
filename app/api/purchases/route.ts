export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { randomBytes } from 'crypto'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  // Rate-limit before any DB work
  if (!rateLimit(getRateLimitKey(req, '/api/purchases'), 5, 60_000)) {
    return Response.json({ error: 'Too many requests.' }, { status: 429 })
  }

  // Require an authenticated Supabase session — no session, no data
  const serverClient = await createSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email } = (await req.json()) as { email: string }

    if (!email?.trim()) {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    // Enforce that the authenticated user can only look up THEIR OWN purchases.
    // Case-insensitive comparison prevents trivial bypass attempts.
    if (email.toLowerCase().trim() !== user.email?.toLowerCase()) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Fetch paid orders for this email
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, beat_ids, license_type, total_price, created_at')
      .eq('customer_email', email.toLowerCase().trim())
      .eq('status', 'paid')
      .order('created_at', { ascending: false })

    if (error) {
      return Response.json({ error: 'Lookup failed' }, { status: 500 })
    }

    if (!orders?.length) {
      return Response.json({ orders: [] })
    }

    // Collect all beat IDs across all orders
    const allBeatIds = [...new Set(orders.flatMap((o) => o.beat_ids as string[]))]
    const { data: beats } = await supabase
      .from('beats')
      .select('id, title')
      .in('id', allBeatIds)

    const beatMap: Record<string, string> = {}
    for (const b of beats ?? []) {
      beatMap[b.id] = b.title
    }

    // For each order, get or refresh the download token
    const result = await Promise.all(
      orders.map(async (order) => {
        // Get the latest download record for this order
        const { data: downloads } = await supabase
          .from('downloads')
          .select('token, expires_at, used')
          .eq('order_id', order.id)
          .order('created_at', { ascending: false })
          .limit(1)

        let token: string

        const existing = downloads?.[0]
        const isExpired = existing
          ? new Date(existing.expires_at) < new Date()
          : true
        // Only reuse the token if it exists, hasn't expired, and hasn't been used
        const isReusable = existing && !isExpired && existing.used === false

        if (isReusable) {
          token = existing.token
        } else {
          // 256-bit token — same entropy as the webhook
          token = randomBytes(32).toString('hex')
          const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          await supabase.from('downloads').insert({
            order_id: order.id,
            token,
            expires_at: expiresAt,
            used: false,  // explicit — never rely on DB default
          })
        }

        const beatTitles = (order.beat_ids as string[]).map(
          (id) => beatMap[id] ?? 'Unknown Beat'
        )

        return {
          id: order.id,
          beatTitles,
          licenseType: order.license_type,
          totalPrice: order.total_price,
          createdAt: order.created_at,
          downloadUrl: `${SITE_URL}/api/download/${token}`,
        }
      })
    )

    return Response.json({ orders: result })
  } catch (err) {
    console.error('[purchases]', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
