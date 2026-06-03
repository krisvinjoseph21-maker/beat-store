import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Invalid Link — KJYOUCRAZY',
  robots: { index: false, follow: false },
}

export default function DownloadInvalidPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-3 text-3xl font-black text-white">Invalid Link</h1>
      <p className="mb-6 max-w-sm text-muted-mid">
        This download link is invalid or doesn't exist. If you believe this is a mistake, please contact us with your order details.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-black hover:bg-white-hover transition-colors"
      >
        Back to Store
      </Link>
    </div>
  )
}
