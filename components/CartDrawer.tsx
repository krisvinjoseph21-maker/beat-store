'use client'

import { X, Trash2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
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
  const [checkoutError, setCheckoutError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const router = useRouter()
  const drawerRef = useRef<HTMLDivElement>(null)

  // Focus trap: keep keyboard focus inside drawer while open
  useEffect(() => {
    if (!open) return
    const drawer = drawerRef.current
    if (!drawer) return

    const previousFocus = document.activeElement as HTMLElement | null
    const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const first = drawer.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const focusable = Array.from(drawer!.querySelectorAll<HTMLElement>(FOCUSABLE))
      const firstEl = focusable[0]
      const lastEl  = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === firstEl) { e.preventDefault(); lastEl?.focus() }
      } else {
        if (document.activeElement === lastEl)  { e.preventDefault(); firstEl?.focus() }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleRemove(beatId: string) {
    setRemovingId(beatId)
  }

  function handleRemoveAnimationEnd(beatId: string) {
    if (removingId === beatId) {
      removeBeat(beatId)
      setRemovingId(null)
    }
  }

  async function handleCheckout(discountCode: string) {
    setLoading(true)
    setCheckoutError('')
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
        setCheckoutError('Checkout failed. Please try again.')
      }
    } catch {
      setCheckoutError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose} aria-hidden="true" />
      <div ref={drawerRef} className="relative flex w-full max-w-sm flex-col border-l border-line animate-slide-in-right overflow-y-auto" style={{ background: 'var(--surface-1)' }} role="dialog" aria-modal="true" aria-label="Cart">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-foreground">Cart</h2>
          <button onClick={onClose} aria-label="Close cart" className="rounded-full p-1.5 hover:bg-white/[0.08] transition-colors text-muted hover:text-foreground">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-muted-low text-[13px] p-8 text-center leading-relaxed">
            Your cart is empty.<br />Head to the store to add beats.
          </div>
        ) : (
          <>
            <div className="flex-1 px-5 py-4 space-y-2">
              {items.map(({ beat }) => (
                <div
                  key={beat.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 ${
                    removingId === beat.id ? 'animate-item-fade-out' : ''
                  }`}
                  onAnimationEnd={() => handleRemoveAnimationEnd(beat.id)}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{beat.title}</p>
                    <p className="text-[11px] text-muted mt-0.5">{beat.bpm} BPM · {beat.key}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(beat.id)}
                    aria-label={`Remove ${beat.title} from cart`}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full hover:bg-danger/10 text-muted-low hover:text-danger transition-colors"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-white/[0.06] px-5 py-4 space-y-2">
              {checkoutError && (
                <p role="alert" className="text-[11px] text-danger text-center">
                  {checkoutError}
                </p>
              )}
              <button
                onClick={() => setLicenseOpen(true)}
                className="w-full rounded bg-white py-3.5 text-[13px] font-semibold text-black hover:bg-white-hover transition-colors active:scale-[0.98]"
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
