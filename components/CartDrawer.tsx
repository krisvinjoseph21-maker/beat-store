'use client'

import { X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useCartStore, LicenseType } from '@/lib/store'
import { PRICES } from '@/lib/prices'
import { useLocaleStore, formatPrice } from '@/lib/locale'
import { useRouter } from 'next/navigation'
import { useT } from '@/lib/i18n'
import { trackBeginCheckout, trackCartAbandonment } from '@/lib/analytics'

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
  const { items, removeBeat, clearCart, total } = useCartStore()
  const { currency } = useLocaleStore()
  const t = useT()
  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [discountInput, setDiscountInput] = useState('')
  const [discountStatus, setDiscountStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [appliedCode, setAppliedCode] = useState('')
  const [discountPct, setDiscountPct] = useState(0)
  const router = useRouter()
  const drawerRef = useRef<HTMLDivElement>(null)
  const checkoutInitiatedRef = useRef(false)
  const checkoutInProgressRef = useRef(false)
  const prevOpenRef = useRef(false)

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

  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = open
    if (open && !wasOpen) {
      checkoutInitiatedRef.current = false
      return
    }
    if (!wasOpen || open) return
    // Cart just closed — fire abandonment if items remain and checkout wasn't started
    const { items: currentItems, total: currentTotal } = useCartStore.getState()
    if (currentItems.length > 0 && !checkoutInitiatedRef.current) {
      trackCartAbandonment(
        currentItems.map((i) => ({ id: i.beat.id, name: i.beat.title, category: i.licenseType ?? 'standard', price: PRICES[i.licenseType ?? 'standard'][1] })),
        currentTotal()
      )
    }
  }, [open])

  function handleRemove(beatId: string) {
    setRemovingId(beatId)
  }

  function handleRemoveAnimationEnd(beatId: string) {
    if (removingId === beatId) {
      removeBeat(beatId)
      setRemovingId(null)
    }
  }

  function handleClearCart() {
    clearCart()
    setDiscountInput('')
    setDiscountStatus('idle')
    setAppliedCode('')
    setDiscountPct(0)
  }

  async function handleApplyDiscount() {
    const code = discountInput.trim()
    if (!code || discountStatus === 'loading') return
    setDiscountStatus('loading')
    try {
      const res = await fetch('/api/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (res.status === 429) {
        setDiscountStatus('invalid')
        setCheckoutError('Too many attempts. Please wait a moment.')
        return
      }
      const data = await res.json()
      if (data.valid && typeof data.pct === 'number') {
        setAppliedCode(code.toUpperCase())
        setDiscountPct(data.pct)
        setDiscountStatus('valid')
      } else {
        setDiscountStatus('invalid')
      }
    } catch {
      setDiscountStatus('invalid')
    }
  }

  function handleRemoveDiscount() {
    setDiscountInput('')
    setDiscountStatus('idle')
    setAppliedCode('')
    setDiscountPct(0)
  }

  async function handleCheckout() {
    if (checkoutInProgressRef.current) return
    checkoutInProgressRef.current = true
    setLoading(true)
    setCheckoutError('')
    checkoutInitiatedRef.current = true
    trackBeginCheckout(
      items.map((i) => ({ id: i.beat.id, name: i.beat.title, category: i.licenseType ?? 'standard', price: PRICES[i.licenseType ?? 'standard'][1] })),
      total()
    )
    const controller = new AbortController()
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          items: items.map((i) => ({ beatId: i.beat.id, licenseType: i.licenseType ?? 'standard' })),
          ...(appliedCode ? { discountCode: appliedCode } : {}),
        }),
      })
      const data = await res.json()
      if (data.url) {
        router.push(data.url)
      } else {
        setCheckoutError('Checkout failed. Please try again.')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setCheckoutError('Network error. Please check your connection and try again.')
    } finally {
      checkoutInProgressRef.current = false
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
            <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">{t.cart.cartTitle}</h2>
            <p className="text-xs text-muted mt-0.5">{items.length} {items.length !== 1 ? t.cart.itemPlural : t.cart.itemSingle}</p>
          </div>
          <button onClick={onClose} aria-label="Close cart" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors text-muted hover:text-foreground">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-low mb-5">Nothing here yet</p>
            <p className="text-[22px] font-bold text-foreground leading-tight mb-2">{t.cart.empty}</p>
            <p className="text-[12px] text-muted-low leading-relaxed mb-6">{t.cart.emptyDesc}</p>
            <Link
              href="/store"
              onClick={onClose}
              className="text-[12px] font-semibold text-foreground hover:text-muted transition-colors"
            >
              {t.cart.browseBeats}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 px-5 py-4 space-y-2">
              {items.map(({ beat, licenseType: itemLicense }) => {
                const license = itemLicense ?? 'standard'
                return (
                  <div
                    key={beat.id}
                    className={`flex items-start justify-between gap-3 rounded-sm border border-white/[0.06] bg-white/[0.03] px-4 py-3 ${
                      removingId === beat.id ? 'animate-item-fade-out' : ''
                    }`}
                    onAnimationEnd={() => handleRemoveAnimationEnd(beat.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-foreground truncate">{beat.title}</p>
                      <p className="text-[10px] font-bold text-accent uppercase mt-1">{LICENSE_LABELS[license]}</p>
                      <p className="text-[16px] font-bold text-foreground mt-1">{formatPrice(PRICES[license][1], currency)}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(beat.id)}
                      aria-label={`Remove ${beat.title} from cart`}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full hover:bg-white/[0.08] text-muted-low hover:text-foreground transition-colors mt-0.5"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-white/[0.06] px-5 py-5 space-y-3">
              {/* Discount code input */}
              <div className="space-y-1.5">
                {discountStatus !== 'valid' ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountInput}
                      onChange={(e) => {
                        setDiscountInput(e.target.value.toUpperCase().slice(0, 50))
                        if (discountStatus === 'invalid') setDiscountStatus('idle')
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleApplyDiscount() }}
                      placeholder="DISCOUNT CODE"
                      aria-label="Discount code"
                      maxLength={50}
                      disabled={discountStatus === 'loading'}
                      className="flex-1 min-w-0 rounded bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-[11px] font-bold text-foreground placeholder:text-muted-low uppercase focus:outline-none focus:border-white/[0.18] transition-colors disabled:opacity-50"
                    />
                    <button
                      onClick={handleApplyDiscount}
                      disabled={!discountInput.trim() || discountStatus === 'loading'}
                      className="px-3 py-2 rounded bg-white/[0.08] text-[11px] font-bold text-foreground hover:bg-white/[0.14] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      {discountStatus === 'loading' ? (
                        <svg className="animate-spin h-3 w-3 text-foreground" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      ) : 'APPLY'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded bg-white/[0.04] border border-white/[0.08] px-3 py-2">
                    <span className="text-[11px] font-bold text-accent uppercase">{appliedCode} — {discountPct}% off</span>
                    <button
                      onClick={handleRemoveDiscount}
                      aria-label="Remove discount code"
                      className="flex items-center justify-center h-5 w-5 rounded-full hover:bg-white/[0.08] text-muted-low hover:text-foreground transition-colors ml-2 shrink-0"
                    >
                      <X size={10} aria-hidden="true" />
                    </button>
                  </div>
                )}
                {discountStatus === 'invalid' && (
                  <p role="alert" className="text-[10px] text-danger">Invalid or expired code.</p>
                )}
              </div>

              {checkoutError && (
                <p role="alert" className="animate-shake text-[11px] text-danger text-center">
                  {checkoutError}
                </p>
              )}

              {/* Total */}
              {discountPct > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">{t.cart.total}</span>
                  <div className="text-right">
                    <span className="text-xs text-muted-low line-through mr-2">{formatPrice(total(), currency)}</span>
                    <span className="text-2xl font-bold text-foreground">
                      {formatPrice(Math.round(total() * (1 - discountPct / 100) * 100) / 100, currency)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">{t.cart.total}</span>
                  <span className="text-2xl font-bold text-foreground">{formatPrice(total(), currency)}</span>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full rounded bg-white py-4 text-[15px] font-bold text-black uppercase hover:bg-white-hover transition-[background-color,transform,opacity] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-black" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    {t.cart.redirecting}
                  </>
                ) : t.cart.checkoutArrow}
              </button>
              <button
                onClick={handleClearCart}
                className="w-full text-center text-xs text-muted-low hover:text-muted transition-colors py-1"
              >
                {t.cart.clearCart}
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  )
}
