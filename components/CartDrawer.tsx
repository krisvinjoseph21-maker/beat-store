'use client'

import { X, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '@/lib/store'
import LicenseModal from './LicenseModal'
import { useRouter } from 'next/navigation'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeBeat, total, licenseType, quantityTier } = useCartStore()
  const [licenseOpen, setLicenseOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCheckout(discountCode: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beatIds: items.map((i) => i.beat.id),
          licenseType,
          quantityTier,
          discountCode: discountCode || undefined,
        }),
      })
      const data = await res.json()
      if (data.url) {
        router.push(data.url)
      } else {
        alert('Checkout failed. Please try again.')
      }
    } catch {
      alert('Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex w-full max-w-sm flex-col bg-[#0d0d0d] border-l border-[#1f1f1f] animate-fade-in overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#1f1f1f] px-5 py-4">
          <h2 className="font-bold text-white text-lg">Cart</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-zinc-500 text-sm p-8 text-center">
            Your cart is empty. Head to the store to add beats.
          </div>
        ) : (
          <>
            <div className="flex-1 px-5 py-4 space-y-3">
              {items.map(({ beat }) => (
                <div
                  key={beat.id}
                  className="flex items-center justify-between gap-3 rounded-sm bg-white/5 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{beat.title}</p>
                    <p className="text-xs text-zinc-500">{beat.bpm} BPM · {beat.key}</p>
                  </div>
                  <button
                    onClick={() => removeBeat(beat.id)}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-[#1f1f1f] px-5 py-4 space-y-3">
              <button
                onClick={() => setLicenseOpen(true)}
                className="w-full rounded-sm bg-white py-4 text-base font-bold text-black hover:bg-zinc-200 transition-colors"
              >
                Choose License & Checkout
              </button>
            </div>
          </>
        )}
      </div>

      <LicenseModal
        open={licenseOpen}
        onClose={() => setLicenseOpen(false)}
        onCheckout={(discountCode) => {
          setLicenseOpen(false)
          handleCheckout(discountCode)
        }}
      />
    </div>
  )
}
