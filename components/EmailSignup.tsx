'use client'

import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'

export default function EmailSignup() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    setError('')
    // TODO: wire up to mailing list service
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line-input bg-surface-1">
          <Check size={20} className="text-white" />
        </div>
        <p className="text-sm font-bold text-white">You&apos;re in — check your inbox.</p>
        <p className="text-xs text-muted-low">Beat on its way to {email}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 rounded-sm border border-line-input bg-surface-1 px-4 py-3.5 text-sm text-white placeholder-muted-low outline-none focus:border-muted transition-colors"
        />
        <button
          type="submit"
          className="flex-shrink-0 inline-flex items-center gap-2 rounded-sm bg-white px-6 py-3.5 text-sm font-black text-black hover:bg-[#f0f0f0] transition-colors"
        >
          Get Beat <ArrowRight size={14} />
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-[11px] text-muted-low text-center">No spam. Unsubscribe any time.</p>
    </form>
  )
}
