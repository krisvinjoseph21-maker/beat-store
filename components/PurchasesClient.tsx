'use client'

import { useRouter } from 'next/navigation'
import { ShoppingBag, Music } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase'

interface Purchase {
  id: string
  beatTitles: string[]
  licenseType: string
  totalPrice: number
  createdAt: string
}

export default function PurchasesClient({ purchases }: { purchases: Purchase[] }) {
  const router = useRouter()
  const supabase = createBrowserClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Sign out */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
        >
          Sign out
        </button>
      </div>

      {purchases.length === 0 ? (
        <div className="rounded-sm border border-gray-200 py-16 text-center">
          <ShoppingBag size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-500">No purchases yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Your orders will appear here after checkout.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="mb-4 text-xs uppercase tracking-widest text-gray-400">
            {purchases.length} order{purchases.length !== 1 ? 's' : ''}
          </p>
          {purchases.map((p) => (
            <div
              key={p.id}
              className="rounded-sm border border-gray-200 bg-gray-50 p-5 text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <Music size={14} className="flex-shrink-0 text-gray-400" />
                <p className="text-sm font-bold text-gray-900">
                  {p.beatTitles.join(', ')}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="capitalize">{p.licenseType} License</span>
                <span>·</span>
                <span>${Number(p.totalPrice).toFixed(2)}</span>
                <span>·</span>
                <span>{formatDate(p.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
