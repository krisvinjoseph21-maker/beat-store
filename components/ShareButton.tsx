'use client'

import { useState, useEffect, useRef } from 'react'
import { Share2, Check } from 'lucide-react'

export default function ShareButton({ beatId }: { beatId: string }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up timeout if component unmounts before it fires
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])

  function handleCopy() {
    const url = `${window.location.origin}/beat/${beatId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleCopy() }}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-3 sm:py-1.5 text-xs font-semibold transition-all ${
        copied
          ? 'border-green-500/40 bg-green-500/10 text-green-400'
          : 'border-line-input text-muted hover:border-muted hover:text-white'
      }`}
      aria-label={copied ? 'Link copied' : 'Copy link'}
    >
      {copied ? <><Check size={12} /> Copied!</> : <><Share2 size={12} /> Share</>}
    </button>
  )
}
