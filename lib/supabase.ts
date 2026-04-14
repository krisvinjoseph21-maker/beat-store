import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'

// Browser client — uses anon key + cookies for auth session.
// Safe to use in client components.
export function createBrowserClient() {
  return createSSRBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
