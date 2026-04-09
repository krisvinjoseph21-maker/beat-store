import Link from 'next/link'
import { Check } from 'lucide-react'

export const metadata = { title: 'Order Confirmed — PRODKJBEATS' }

export default function SuccessPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
        <Check size={40} className="text-green-400" />
      </div>
      <h1 className="mb-3 text-3xl font-black text-white">Order Confirmed!</h1>
      <p className="mb-2 max-w-md text-muted-mid">
        Your payment was successful. Check your email for a secure download link.
      </p>
      <p className="mb-8 text-xs text-muted-low">
        The download link expires in 48 hours and is one-time use only.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/store"
          className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-black hover:bg-white-hover transition-colors"
        >
          Shop More Beats
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-line-input px-6 py-3.5 text-sm font-semibold text-foreground hover:text-white hover:border-muted transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
