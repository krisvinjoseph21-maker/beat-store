import { describe, it, expect, beforeEach, vi } from 'vitest'

// Use fake timers to control Date.now() in rate limiter
vi.useFakeTimers()

// Re-import after timers are faked so the module-level setInterval is harmless
const { rateLimit, getRateLimitKey } = await import('../lib/rate-limit')

describe('rateLimit', () => {
  beforeEach(() => {
    vi.setSystemTime(0)
  })

  it('allows the first request through', () => {
    expect(rateLimit('127.0.0.1:/api/test', 5, 60_000)).toBe(true)
  })

  it('allows requests up to the limit', () => {
    const key = `unique-allow-${Math.random()}:/api/test`
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 60_000)).toBe(true)
    }
  })

  it('blocks the request that exceeds the limit', () => {
    const key = `unique-block-${Math.random()}:/api/test`
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000)
    expect(rateLimit(key, 5, 60_000)).toBe(false)
  })

  it('resets after the window expires', () => {
    const key = `unique-reset-${Math.random()}:/api/test`
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000)
    expect(rateLimit(key, 5, 60_000)).toBe(false)

    vi.advanceTimersByTime(60_001)
    expect(rateLimit(key, 5, 60_000)).toBe(true)
  })

  it('rejects keys longer than 256 chars', () => {
    expect(rateLimit('a'.repeat(257), 10, 60_000)).toBe(false)
  })

  it('rejects empty keys', () => {
    expect(rateLimit('', 10, 60_000)).toBe(false)
  })
})

describe('getRateLimitKey', () => {
  const makeReq = (headers: Record<string, string>) =>
    new Request('https://example.com/api/test', { headers })

  it('uses x-vercel-forwarded-for when present', () => {
    const req = makeReq({ 'x-vercel-forwarded-for': '1.2.3.4, 5.6.7.8' })
    expect(getRateLimitKey(req, '/api/beats')).toBe('1.2.3.4:/api/beats')
  })

  it('uses rightmost x-forwarded-for entry as fallback', () => {
    const req = makeReq({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3' })
    expect(getRateLimitKey(req, '/api/beats')).toBe('3.3.3.3:/api/beats')
  })

  it('uses x-real-ip as last resort', () => {
    const req = makeReq({ 'x-real-ip': '9.9.9.9' })
    expect(getRateLimitKey(req, '/api/beats')).toBe('9.9.9.9:/api/beats')
  })

  it('falls back to unknown when no IP header is present', () => {
    const req = makeReq({})
    expect(getRateLimitKey(req, '/api/beats')).toBe('unknown:/api/beats')
  })

  it('sanitises non-hex characters from headers', () => {
    // Sanitiser keeps only [0-9a-fA-F.:] — strips spaces, symbols, non-hex letters
    const req = makeReq({ 'x-vercel-forwarded-for': '1.2.3.4 xyz!' })
    expect(getRateLimitKey(req, '/api/beats')).toBe('1.2.3.4:/api/beats')
  })

  it('includes the route in the key', () => {
    const req = makeReq({ 'x-real-ip': '5.5.5.5' })
    expect(getRateLimitKey(req, '/api/checkout')).toBe('5.5.5.5:/api/checkout')
  })
})
