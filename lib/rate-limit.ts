/**
 * In-memory rate limiter.
 *
 * WARNING: This Map resets on every serverless cold start (Vercel, etc.).
 * For production rate limiting across multiple instances, replace the Map
 * with an Upstash Redis client:
 *   https://github.com/upstash/ratelimit
 * Until then, this provides best-effort protection on warm instances only.
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// Prune expired entries every 5 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

/**
 * Returns true if the request is within the allowed rate, false if it should be blocked.
 * @param key    - Unique identifier (e.g. IP address)
 * @param limit  - Max requests per window (default: 10)
 * @param windowMs - Window duration in ms (default: 60s)
 */
export function rateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

/**
 * Extract the real client IP from Next.js request headers.
 *
 * Security note: x-forwarded-for is a comma-separated list where each proxy
 * appends the IP it received the request from. Clients can inject fake IPs at
 * the front of this list. We trust Vercel's platform header first, then fall
 * back to the LAST (rightmost) value in x-forwarded-for — the one added by the
 * outermost trusted proxy — rather than the first (client-controlled) value.
 */
export function getIp(req: Request): string {
  // Vercel sets this to the actual client IP, not user-controllable
  const vercelIp = req.headers.get('x-vercel-forwarded-for')
  if (vercelIp) return vercelIp.split(',')[0].trim()

  // Rightmost entry in x-forwarded-for is the one added by the CDN/proxy
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length > 0) return parts[parts.length - 1]
  }

  return req.headers.get('x-real-ip') ?? 'unknown'
}
