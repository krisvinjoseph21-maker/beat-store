'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'

export default function AuthClient() {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect') ?? ''
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/purchases'

  const supabase = createBrowserClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push(redirectTo)
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/purchases`,
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email to confirm your account, then sign in.')
        setTab('login')
        setPassword('')
      }
    }

    setLoading(false)
  }

  function switchTab(t: 'login' | 'signup') {
    setTab(t)
    setError('')
    setMessage('')
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      {/* Tab switcher */}
      <div className="mb-6 flex rounded-lg border border-[#1f1f1f] p-0.5">
        {(['login', 'signup'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
              tab === t ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          required
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-sm border border-[#1f1f1f] bg-[#111] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors"
        />
        <input
          required
          type="password"
          placeholder="Password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-sm border border-[#1f1f1f] bg-[#111] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors"
        />

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        {message && <p className="text-sm text-emerald-400 text-center">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-white py-3 text-sm font-bold text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? '…' : tab === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-zinc-600">
        {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button
          type="button"
          onClick={() => switchTab(tab === 'login' ? 'signup' : 'login')}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          {tab === 'login' ? 'Create one' : 'Sign in'}
        </button>
      </p>
    </div>
  )
}
