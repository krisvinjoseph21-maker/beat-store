/**
 * In-memory rate limiter.
 *
 * Suitable for single-process deployments (Vercel functions, Railway, etc.).
 * For multi-instance deployments, swap the Map for a Redis/Upstash store.
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

/** Extract the real client IP from Next.js request headers. */
export function getIp(req: Request): string {
  return (
    (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}
