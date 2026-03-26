import Link from 'next/link'
import { Check } from 'lucide-react'

export const metadata = { title: 'Order Confirmed — PRODKJBEATS' }

export default function SuccessPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <Check size={40} className="text-green-500" />
      </div>
      <h1 className="mb-3 text-3xl font-black text-gray-900">Order Confirmed!</h1>
      <p className="mb-2 max-w-md text-gray-500">
        Your payment was successful. Check your email for a secure download link.
      </p>
      <p className="mb-8 text-xs text-gray-400">
        The download link expires in 48 hours and is one-time use only.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/store"
          className="rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-bold text-white hover:bg-gray-700 transition-colors"
        >
          Shop More Beats
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-gray-200 px-6 py-3.5 text-sm font-semibold text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
