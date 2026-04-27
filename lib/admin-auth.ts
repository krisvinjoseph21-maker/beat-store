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
 * Two separate buckets:
 *   - `admin-fail:<ip>`  — only incremented on wrong-password attempts.
 *                          Strict: 10 failures per minute prevents brute force.
 *   - `admin-ops:<ip>`   — incremented only after a successful auth check.
 *                          Generous: 200 requests per minute so normal admin
 *                          usage (toggling beats, editing, uploading) never hits it.
 *
 * Returns { ok: false, rateLimited: true }  → respond 429
 * Returns { ok: false, rateLimited: false } → respond 401
 * Returns { ok: true }                      → proceed
 */
export async function checkAdminAuth(
  req: NextRequest
): Promise<{ ok: boolean; rateLimited: boolean }> {
  const headersList = await headers()
  const password = headersList.get('x-admin-password') ?? ''

  if (!verifyAdminPassword(password)) {
    // Count failures — brute-force protection lives here only
    const failKey = getRateLimitKey(req, 'admin-fail')
    if (!rateLimit(failKey, 5, 60_000)) {
      return { ok: false, rateLimited: true }
    }
    return { ok: false, rateLimited: false }
  }

  // Password is correct — now enforce a generous ops limit so normal
  // admin work never triggers a 429
  const opsKey = getRateLimitKey(req, 'admin-ops')
  if (!rateLimit(opsKey, 200, 60_000)) {
    return { ok: false, rateLimited: true }
  }

  return { ok: true, rateLimited: false }
}
