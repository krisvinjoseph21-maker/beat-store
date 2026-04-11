'use client'

import { X, Check } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useCartStore, LicenseType, QuantityTier } from '@/lib/store'
import { getDiscountPct, applyDiscount } from '@/lib/discount-codes'

interface Props {
  open: boolean
  onClose: () => void
  onCheckout: (discountCode: string) => void
}

const PRICES: Record<LicenseType, Record<QuantityTier, number>> = {
  standard: { 1: 50, 3: 100, 5: 200 },
  unlimited: { 1: 100, 3: 200, 5: 400 },
}

const STANDARD_FEATURES = [
  '500k streams',
  '5,000 paid downloads',
  'Non-exclusive',
  'MP3 + WAV delivery',
  'Credit required',
]

const UNLIMITED_FEATURES = [
  'Unlimited streams',
  'Unlimited paid downloads',
  'Non-exclusive',
  'MP3 + WAV + Track stems',
  'Credit required',
]

export default function LicenseModal({ open, onClose, onCheckout }: Props) {
  const { licenseType, quantityTier, setLicenseType, setQuantityTier, items } =
    useCartStore()
  const [codeInput, setCodeInput] = useState('')
  const [appliedCode, setAppliedCode] = useState('')
  const [discountPct, setDiscountPct] = useState<number | null>(null)
  const [codeError, setCodeError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus trap: run on mount (only renders when open=true)
  useEffect(() => {
    if (!open) return
    const modal = modalRef.current
    if (!modal) return

    const previousFocus = document.activeElement as HTMLElement | null
    const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    // Focus first element on open
    const first = modal.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const focusable = Array.from(modal!.querySelectorAll<HTMLElement>(FOCUSABLE))
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

  if (!open) return null

  const basePrice = PRICES[licenseType][quantityTier]
  const finalPrice = discountPct !== null ? applyDiscount(basePrice, discountPct) : basePrice
  const features = licenseType === 'standard' ? STANDARD_FEATURES : UNLIMITED_FEATURES

  function handleApplyCode() {
    const pct = getDiscountPct(codeInput)
    if (pct === null) {
      setCodeError('Invalid code.')
      setAppliedCode('')
      setDiscountPct(null)
    } else {
      setDiscountPct(pct)
      setAppliedCode(codeInput.trim().toUpperCase())
      setCodeError('')
    }
  }

  function handleRemoveCode() {
    setAppliedCode('')
    setDiscountPct(null)
    setCodeInput('')
    setCodeError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="license-modal-title"
        className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-sm border border-line-card bg-surface-2 p-5 animate-fade-in max-h-[90vh] overflow-y-auto"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="license-modal-title" className="text-lg font-bold text-white">Choose Your License</h2>
          <button
            onClick={onClose}
            aria-label="Close license options"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Cart summary */}
        {items.length > 0 && (
          <div className="mb-4 rounded-sm bg-white/5 p-3">
            <p className="text-xs text-muted-mid mb-2 font-medium">IN CART</p>
            {items.map(({ beat }) => (
              <p key={beat.id} className="text-sm text-white">
                {beat.title}
              </p>
            ))}
          </div>
        )}

        {/* License tabs */}
        <div className="mb-4 flex rounded-sm border border-line-card p-0.5">
          {(['standard', 'unlimited'] as LicenseType[]).map((type) => (
            <button
              key={type}
              onClick={() => setLicenseType(type)}
              aria-pressed={licenseType === type}
              className={`flex-1 rounded-sm py-2 text-sm font-semibold transition-all ${
                licenseType === type
                  ? 'bg-white text-black'
                  : 'text-muted-mid hover:text-white'
              }`}
            >
              {type === 'standard' ? 'Standard Lease' : 'Unlimited Lease'}
            </button>
          ))}
        </div>

        {/* Features */}
        <ul className="mb-4 space-y-1.5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-foreground">
              <Check size={14} className="text-accent flex-shrink-0" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>

        {/* Quantity tiers */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium text-muted-mid uppercase tracking-wide">
            Beat Quantity
          </p>
          <div className="grid grid-cols-3 gap-2">
            {([1, 3, 5] as QuantityTier[]).map((qty) => (
              <button
                key={qty}
                onClick={() => setQuantityTier(qty)}
                aria-pressed={quantityTier === qty}
                aria-label={`${qty} beat${qty > 1 ? 's' : ''} — $${PRICES[licenseType][qty]}`}
                className={`rounded-sm border py-3 text-center transition-all ${
                  quantityTier === qty
                    ? 'border-accent bg-accent/10 text-white'
                    : 'border-line-input text-muted-mid hover:border-muted hover:text-white'
                }`}
              >
                <p className="text-lg font-bold">{qty}</p>
                <p className="text-xs text-muted">
                  beat{qty > 1 ? 's' : ''}
                </p>
                <p className="text-sm font-semibold text-white mt-1">
                  ${PRICES[licenseType][qty]}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Discount code */}
        <div className="mb-4">
          {appliedCode ? (
            <div className="flex items-center justify-between rounded-sm border border-accent/30 bg-accent/10 px-3 py-2">
              <p className="text-sm text-accent font-medium">
                {appliedCode} — {discountPct}% off applied
              </p>
              <button
                onClick={handleRemoveCode}
                className="text-xs text-muted-low hover:text-white transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <label htmlFor="discount-code" className="sr-only">Discount code</label>
              <input
                id="discount-code"
                type="text"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value); setCodeError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCode()}
                placeholder="Discount code"
                autoComplete="off"
                aria-describedby={codeError ? 'discount-code-error' : undefined}
                aria-invalid={!!codeError}
                className="flex-1 rounded-sm border border-line-input bg-surface-2 px-3 py-2 text-sm text-white placeholder-muted-low outline-none focus:border-muted transition-colors"
              />
              <button
                onClick={handleApplyCode}
                className="rounded-sm border border-line-input px-4 py-2 text-sm font-semibold text-foreground hover:text-white hover:border-muted transition-colors"
              >
                Apply
              </button>
            </div>
          )}
          {codeError && <p id="discount-code-error" role="alert" className="mt-1.5 text-xs text-danger">{codeError}</p>}
        </div>

        {/* CTA */}
        <button
          onClick={() => onCheckout(appliedCode)}
          className="w-full rounded-sm bg-white py-4 text-base font-bold text-black hover:bg-white-hover transition-colors"
        >
          {discountPct !== null ? (
            <>
              Checkout —{' '}
              <span className="line-through text-muted-mid mr-1">${basePrice}</span>
              ${finalPrice}
            </>
          ) : (
            <>Checkout — ${finalPrice}</>
          )}
        </button>
        <p className="mt-2 text-center text-xs text-muted-low">
          Powered by Stripe · Secure checkout
        </p>
      </div>
    </div>
  )
}
