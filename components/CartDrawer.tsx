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
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose} />
      <div className="relative flex w-full max-w-sm flex-col border-l border-[#1a1a1a] animate-fade-in overflow-y-auto" style={{ background: '#111111' }}>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#f5f5f7]">Cart</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/[0.08] transition-colors text-[#6e6e73] hover:text-[#f5f5f7]">
            <X size={16} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-[#424245] text-[13px] p-8 text-center leading-relaxed">
            Your cart is empty.<br />Head to the store to add beats.
          </div>
        ) : (
          <>
            <div className="flex-1 px-5 py-4 space-y-2">
              {items.map(({ beat }) => (
                <div
                  key={beat.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#f5f5f7] truncate">{beat.title}</p>
                    <p className="text-[11px] text-[#6e6e73] mt-0.5">{beat.bpm} BPM · {beat.key}</p>
                  </div>
                  <button
                    onClick={() => removeBeat(beat.id)}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full hover:bg-red-500/15 text-[#424245] hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-white/[0.06] px-5 py-4">
              <button
                onClick={() => setLicenseOpen(true)}
                className="w-full rounded-full bg-white py-3.5 text-[13px] font-semibold text-black hover:bg-[#e8e8ed] transition-colors active:scale-[0.98]"
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
