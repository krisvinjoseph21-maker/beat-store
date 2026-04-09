'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function NavAuthButton() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    setMounted(true)
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex h-11 sm:h-9 items-center gap-1.5 rounded-lg border border-[#2a2a2a] px-3 text-xs font-semibold text-muted-mid hover:border-muted hover:text-white transition-colors"
      >
        <User size={13} />
        <span className="hidden sm:inline">Sign In</span>
      </Link>
    )
  }

  return (
    <Link
      href="/purchases"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      aria-label={`My Purchases (${user.email})`}
    >
      <User size={15} className="text-white" />
    </Link>
  )
}
