'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

export default function ShareButton({ beatId }: { beatId: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const url = `${window.location.origin}/beat/${beatId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
        copied
          ? 'border-green-200 bg-green-50 text-green-600'
          : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900'
      }`}
      title="Copy link"
    >
      {copied ? <><Check size={12} /> Copied!</> : <><Share2 size={12} /> Share</>}
    </button>
  )
}
