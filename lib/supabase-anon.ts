import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Anon client — respects RLS. Use for all public read endpoints.
// Never use the service role key for data that unauthenticated users can request.
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
