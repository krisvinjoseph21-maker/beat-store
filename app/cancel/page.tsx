import Link from 'next/link'
import { X } from 'lucide-react'

export const metadata = { title: 'Order Cancelled — PRODKJBEATS' }

export default function CancelPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
        <X size={40} className="text-red-400" />
      </div>
      <h1 className="mb-3 text-3xl font-black text-white">Payment Cancelled</h1>
      <p className="mb-8 max-w-md text-muted-mid">
        Your order was not completed. Your cart is still saved — head back to checkout when you&apos;re ready.
      </p>
      <Link
        href="/store"
        className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-black hover:bg-white-hover transition-colors"
      >
        Back to Store
      </Link>
    </div>
  )
}
