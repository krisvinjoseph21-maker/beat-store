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
 * @param key      - Compound key — MUST include both IP and route, e.g. `${ip}:/api/checkout`.
 *                   Using just an IP lets limits bleed across routes sharing the same store entry.
 * @param limit    - Max requests per window
 * @param windowMs - Window duration in ms
 */
export function rateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  // Reject suspiciously long keys — prevents memory abuse via crafted headers
  if (!key || key.length > 256) return false

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
 * Returns a compound rate-limit key: `<ip>:<route>`.
 * Including the route prevents limits from bleeding across different endpoints
 * that share the same in-memory store.
 *
 * IP extraction security:
 * - On Vercel, `x-vercel-forwarded-for` is set by the platform and cannot be
 *   spoofed by the client — we trust it unconditionally.
 * - The `x-forwarded-for` fallback takes the RIGHTMOST value, which is appended
 *   by the outermost trusted proxy. Clients can inject fake IPs at the front of
 *   this list but cannot control the rightmost entry added by the infrastructure.
 * - If no IP can be determined, the key falls back to `unknown:<route>`.
 *   This means all anonymous requests share one bucket — a safe fail-closed
 *   behaviour under misconfiguration rather than bypassing rate limits entirely.
 */
export function getRateLimitKey(req: Request, route: string): string {
  let ip = 'unknown'

  // Vercel sets this to the actual client IP — not user-controllable
  const vercelIp = req.headers.get('x-vercel-forwarded-for')
  if (vercelIp) {
    const candidate = vercelIp.split(',')[0].trim()
    if (candidate) ip = candidate
  } else {
    // Rightmost entry in x-forwarded-for is the one added by the CDN/proxy
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) {
      const parts = forwarded.split(',').map((s) => s.trim()).filter(Boolean)
      if (parts.length > 0) ip = parts[parts.length - 1]
    } else {
      const realIp = req.headers.get('x-real-ip')?.trim()
      if (realIp) ip = realIp
    }
  }

  // Sanitise: only allow valid IP characters to prevent key injection
  ip = ip.replace(/[^0-9a-fA-F.:]/g, '').slice(0, 45) || 'unknown'
  return `${ip}:${route}`
}

/** @deprecated Use getRateLimitKey(req, route) instead to get per-route isolation. */
export function getIp(req: Request): string {
  return getRateLimitKey(req, 'legacy').split(':')[0]
}
