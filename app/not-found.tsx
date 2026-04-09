import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-muted-low">404</p>
      <h1 className="mb-3 text-3xl font-black text-white sm:text-4xl">Page not found.</h1>
      <p className="mb-8 text-sm text-muted max-w-xs">
        This page doesn&apos;t exist or was removed.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-sm bg-white px-6 py-3 text-sm font-bold text-black hover:bg-white-hover transition-colors"
      >
        <ArrowLeft size={14} /> Back to Home
      </Link>
    </div>
  )
}
