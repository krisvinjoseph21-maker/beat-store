/**
 * Server-Sent Events endpoint for real-time beat play counts.
 *
 * GET  /api/stream/plays  — subscribe to live play count updates
 * POST /api/stream/plays  — record a play event (increments count, broadcasts to all subscribers)
 *
 * Counts are in-memory and intentionally reset on server restart.
 * In production you would persist to a DB and hydrate on connect.
 */

import { NextRequest } from 'next/server'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'

const playCounts = new Map<string, number>()

// Active SSE controller set — entries are removed when clients disconnect
const subscribers = new Set<ReadableStreamDefaultController<Uint8Array>>()

const encoder = new TextEncoder()

function sseFrame(data: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
}

function broadcast(beatId: string, count: number): void {
  const frame = sseFrame({ beatId, count })
  for (const ctrl of subscribers) {
    try {
      ctrl.enqueue(frame)
    } catch {
      // Client disconnected before cancel fired — clean up eagerly
      subscribers.delete(ctrl)
    }
  }
}

export async function GET(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/stream/plays'), 10, 60_000)) {
    return new Response('Too many connections.', { status: 429 })
  }

  let controller: ReadableStreamDefaultController<Uint8Array>

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl
      subscribers.add(ctrl)

      // Send full snapshot to the new subscriber so their UI is immediately consistent
      for (const [beatId, count] of playCounts) {
        ctrl.enqueue(sseFrame({ beatId, count }))
      }

      // Keepalive comment every 25s to prevent proxy/browser timeouts
      const keepalive = setInterval(() => {
        try {
          ctrl.enqueue(encoder.encode(': keepalive\n\n'))
        } catch {
          clearInterval(keepalive)
        }
      }, 25_000)

      // Store the interval reference so cancel() can clear it
      ;(ctrl as unknown as { _keepalive: ReturnType<typeof setInterval> })._keepalive = keepalive
    },
    cancel(ctrl) {
      subscribers.delete(controller)
      const interval = (controller as unknown as { _keepalive?: ReturnType<typeof setInterval> })._keepalive
      if (interval) clearInterval(interval)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering for streaming
    },
  })
}

export async function POST(req: NextRequest) {
  if (!rateLimit(getRateLimitKey(req, '/api/stream/plays/post'), 60, 60_000)) {
    return Response.json({ error: 'Too many requests.' }, { status: 429 })
  }

  let beatId: string
  try {
    const body = await req.json() as { beatId?: unknown }
    if (typeof body.beatId !== 'string' || !body.beatId.trim()) {
      return Response.json({ error: 'beatId must be a non-empty string.' }, { status: 400 })
    }
    beatId = body.beatId.trim().slice(0, 128)
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const count = (playCounts.get(beatId) ?? 0) + 1
  playCounts.set(beatId, count)
  broadcast(beatId, count)

  return Response.json({ beatId, count, subscribers: subscribers.size })
}
