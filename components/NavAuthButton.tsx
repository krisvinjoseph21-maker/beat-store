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
        className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-900 transition-colors"
      >
        <User size={13} />
        <span className="hidden sm:inline">Sign In</span>
      </Link>
    )
  }

  return (
    <Link
      href="/purchases"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
      title={user.email}
    >
      <User size={15} className="text-gray-700" />
    </Link>
  )
}
