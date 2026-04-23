'use client'

import { X, ShoppingBag } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useCartStore, LicenseType } from '@/lib/store'
import { PRICES } from '@/lib/prices'
import { useLocaleStore, formatPrice } from '@/lib/locale'
import LicenseModal from './LicenseModal'
import { useRouter } from 'next/navigation'
import { useT } from '@/lib/i18n'

const LICENSE_LABELS: Record<LicenseType, string> = {
  standard: 'MP3 LICENSE',
  premium: 'PREMIUM LICENSE',
  unlimited: 'UNLIMITED LICENSE',
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeBeat, clearCart, total, licenseType, quantityTier } = useCartStore()
  const { currency } = useLocaleStore()
  const t = useT()
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

  async function handleCheckout(discountCode: string, useBogo?: boolean) {
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
          useBogo: useBogo || undefined,
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
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div ref={drawerRef} className="relative flex w-full max-w-sm flex-col border-l border-line animate-slide-in-right overflow-y-auto" style={{ background: 'var(--surface-1)' }} role="dialog" aria-modal="true" aria-label="Cart">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">Your Cart</h2>
            <p className="text-xs text-muted mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} aria-label="Close cart" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors text-muted hover:text-foreground">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.06]">
              <ShoppingBag size={22} className="text-muted-low" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground mb-1">{t.cart.empty}</p>
              <p className="text-[12px] text-muted-low leading-relaxed">{t.cart.emptyDesc}</p>
            </div>
            <Link
              href="/store"
              onClick={onClose}
              className="text-[12px] font-semibold text-foreground underline underline-offset-4 hover:text-muted transition-colors"
            >
              {t.cart.browseBeats}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 px-5 py-4 space-y-2">
              {items.map(({ beat }) => (
                <div
                  key={beat.id}
                  className={`flex items-start justify-between gap-3 rounded-sm border border-white/[0.06] bg-white/[0.03] px-4 py-3 ${
                    removingId === beat.id ? 'animate-item-fade-out' : ''
                  }`}
                  onAnimationEnd={() => handleRemoveAnimationEnd(beat.id)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-foreground truncate">{beat.title}</p>
                    <p className="text-[10px] font-bold text-accent uppercase mt-1">{LICENSE_LABELS[licenseType]}</p>
                    <p className="text-[16px] font-bold text-foreground mt-1">{formatPrice(PRICES[licenseType][1], currency)}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(beat.id)}
                    aria-label={`Remove ${beat.title} from cart`}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full hover:bg-white/[0.08] text-muted-low hover:text-foreground transition-colors mt-0.5"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-white/[0.06] px-5 py-5 space-y-3">
              {checkoutError && (
                <p role="alert" className="animate-shake text-[11px] text-danger text-center">
                  {checkoutError}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Total</span>
                <span className="text-2xl font-bold text-foreground">{formatPrice(total(), currency)}</span>
              </div>
              <button
                onClick={() => setLicenseOpen(true)}
                disabled={loading}
                className="w-full rounded bg-red-600 py-4 text-[15px] font-bold text-white uppercase hover:bg-red-700 transition-[background-color,transform,opacity] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Redirecting…
                  </>
                ) : 'Checkout →'}
              </button>
              <button
                onClick={clearCart}
                className="w-full text-center text-xs text-muted-low hover:text-muted transition-colors py-1"
              >
                Clear cart
              </button>
            </div>
          </>
        )}
      </div>

      <LicenseModal
        open={licenseOpen}
        onClose={() => setLicenseOpen(false)}
        onCheckout={(discountCode, useBogo) => {
          setLicenseOpen(false)
          handleCheckout(discountCode, useBogo)
        }}
      />
    </div>
  )
}
