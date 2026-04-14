import crypto from 'crypto'
import { headers } from 'next/headers'

/**
 * Constant-time admin password check.
 * Uses HMAC so timingSafeEqual always compares fixed-length digests,
 * preventing both timing attacks and length oracle attacks.
 * The HMAC key is read from ADMIN_HMAC_SECRET env var — set this to a
 * random string in your Vercel environment variables.
 */
export function verifyAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? ''
  if (!expected) return false
  const secret = process.env.ADMIN_HMAC_SECRET ?? 'prodkjbeats-admin'
  const inputHash = crypto.createHmac('sha256', secret).update(input).digest()
  const expectedHash = crypto.createHmac('sha256', secret).update(expected).digest()
  return crypto.timingSafeEqual(inputHash, expectedHash)
}

export async function checkAdminAuth(): Promise<boolean> {
  const headersList = await headers()
  const auth = headersList.get('x-admin-password') ?? ''
  return verifyAdminPassword(auth)
}
