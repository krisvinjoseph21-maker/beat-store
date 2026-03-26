'use client'

import { useEffect } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Log to your error reporting service here (e.g. Sentry)
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Error</p>
      <h1 className="mb-3 text-3xl font-black text-gray-900">Something went wrong.</h1>
      <p className="mb-8 text-sm text-gray-500 max-w-xs">
        An unexpected error occurred. Try refreshing the page.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-sm bg-gray-900 px-6 py-3 text-sm font-bold text-white hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={14} /> Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-sm border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} /> Home
        </Link>
      </div>
    </div>
  )
}
