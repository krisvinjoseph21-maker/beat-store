import 'server-only'
import crypto from 'crypto'
import { headers } from 'next/headers'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import type { NextRequest } from 'next/server'

/**
 * Constant-time admin password check.
 *
 * Security properties:
 *   - HMAC so timingSafeEqual always compares fixed-length digests, preventing
 *     both timing attacks and length oracle attacks.
 *   - Requires ADMIN_HMAC_SECRET to be set — fails closed on misconfiguration.
 *   - Rejects passwords shorter than 16 characters — fails closed on weak config.
 */
export function verifyAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? ''
  if (!expected) return false

  // Minimum length guard — a password this short is misconfiguration, fail closed.
  if (expected.length < 16) {
    console.error('[admin-auth] ADMIN_PASSWORD must be ≥ 16 characters — refusing auth')
    return false
  }

  const secret = process.env.ADMIN_HMAC_SECRET
  // Require an explicit HMAC secret — no fallback, so misconfigured deployments
  // fail closed rather than using a known/guessable string.
  if (!secret) {
    console.error('[admin-auth] ADMIN_HMAC_SECRET is not set — refusing auth')
    return false
  }

  const inputHash    = crypto.createHmac('sha256', secret).update(input).digest()
  const expectedHash = crypto.createHmac('sha256', secret).update(expected).digest()
  return crypto.timingSafeEqual(inputHash, expectedHash)
}

/**
 * Rate-limited admin auth check for use in admin API routes.
 *
 * Uses a SHARED rate-limit bucket (`admin-auth:<ip>`) across ALL admin routes,
 * so an attacker cannot multiply their guesses by spreading attempts across
 * multiple endpoints. Limit: 5 attempts per minute per IP.
 *
 * Returns { ok: false, rateLimited: true }  → respond 429
 * Returns { ok: false, rateLimited: false } → respond 401
 * Returns { ok: true }                      → proceed
 */
export async function checkAdminAuth(
  req: NextRequest
): Promise<{ ok: boolean; rateLimited: boolean }> {
  // Shared key across all admin routes — one bucket, not per-route
  const key = getRateLimitKey(req, 'admin-auth')
  if (!rateLimit(key, 5, 60_000)) {
    return { ok: false, rateLimited: true }
  }

  const headersList = await headers()
  const password = headersList.get('x-admin-password') ?? ''
  if (!verifyAdminPassword(password)) {
    return { ok: false, rateLimited: false }
  }

  return { ok: true, rateLimited: false }
}
