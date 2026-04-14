/**
 * Validates that all required environment variables are present at startup.
 * Throws clearly during build/boot rather than silently failing at runtime.
 */

const REQUIRED_SERVER_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'ADMIN_PASSWORD',
  'ADMIN_HMAC_SECRET',
  'NEXT_PUBLIC_SITE_URL',
] as const

export function validateEnv(): void {
  const missing = REQUIRED_SERVER_VARS.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variables:\n  ${missing.join('\n  ')}`
    )
  }
}
