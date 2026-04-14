import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Admin client with service role key — bypasses RLS.
// This file is server-only: importing it from a client component will throw a build error.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
