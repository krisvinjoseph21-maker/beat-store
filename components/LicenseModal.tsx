'use client'

import { X, Check, Zap, Tag } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useCartStore, LicenseType, QuantityTier } from '@/lib/store'
import { bogoIsActive, sitewideIsActive, effectiveDiscountPct } from '@/lib/promos'
import type { PromoConfig } from '@/lib/promos'
import { PRICES } from '@/lib/prices'
import { useLocaleStore, formatPrice } from '@/lib/locale'
import { useT } from '@/lib/i18n'

// Inlined — discount-codes.ts must NOT be imported in client components
// (it contains the full code list which would be exposed in the JS bundle)
function applyDiscount(price: number, pct: number): number {
  return Math.round(price * (1 - pct / 100))
}

interface Props {
  open: boolean
  onClose: () => void
  onCheckout: (discountCode: string, useBogo?: boolean) => void
}

const STANDARD_FEATURES = [
  '500k streams',
  '25,000 paid downloads',
  'Non-exclusive',
  'MP3 + WAV delivery',
  'Credit required',
]

const PREMIUM_FEATURES = [
  '1M streams',
  '75,000 paid downloads',
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
  const { currency } = useLocaleStore()
  const t = useT()
  const [codeInput, setCodeInput] = useState('')
  const [appliedCode, setAppliedCode] = useState('')
  const [discountPct, setDiscountPct] = useState<number | null>(null)
  const [codeError, setCodeError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [promo, setPromo] = useState<PromoConfig>({ sitewide_discount_pct: null, bogo_free_count: null })
  const [bogoSelected, setBogoSelected] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Fetch active promos when modal opens
  useEffect(() => {
    if (!open) return
    fetch('/api/promos')
      .then((r) => r.json())
      .then((data: PromoConfig) => setPromo(data))
      .catch(() => {})
  }, [open])

  // Focus trap
  useEffect(() => {
    if (!open) return
    const modal = modalRef.current
    if (!modal) return

    const previousFocus = document.activeElement as HTMLElement | null
    const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

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

  const hasBogo = bogoIsActive(promo)
  const hasSitewide = sitewideIsActive(promo)

  // Coupon discount (from code input)
  const couponPct = appliedCode ? discountPct : null
  // Best discount: sitewide vs coupon, whichever is larger
  const sitewisePct = hasSitewide ? promo.sitewide_discount_pct : null
  const bestPct = effectiveDiscountPct(sitewisePct, couponPct)

  // Price helpers
  function displayPrice(base: number): number {
    if (bogoSelected) {
      // BOGO: price as 1-beat tier with any active discount
      const bogoBase = PRICES[licenseType][1]
      return bestPct !== null ? applyDiscount(bogoBase, bestPct) : bogoBase
    }
    return bestPct !== null ? applyDiscount(base, bestPct) : base
  }

  const basePrice = bogoSelected ? PRICES[licenseType][1] : PRICES[licenseType][quantityTier]
  const finalPrice = displayPrice(basePrice)
  const features = licenseType === 'standard' ? STANDARD_FEATURES : licenseType === 'premium' ? PREMIUM_FEATURES : UNLIMITED_FEATURES

  async function handleApplyCode() {
    const trimmed = codeInput.trim()
    if (!trimmed) return
    setCodeLoading(true)
    setCodeError('')
    try {
      const res = await fetch('/api/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })
      const data = await res.json()
      if (data.valid) {
        setDiscountPct(data.pct)
        setAppliedCode(trimmed.toUpperCase())
        setCodeError('')
      } else {
        setCodeError('Invalid code.')
        setAppliedCode('')
        setDiscountPct(null)
      }
    } catch {
      setCodeError('Could not validate code. Try again.')
    } finally {
      setCodeLoading(false)
    }
  }

  function handleRemoveCode() {
    setAppliedCode('')
    setDiscountPct(null)
    setCodeInput('')
    setCodeError('')
  }

  function handleTierClick(tier: QuantityTier) {
    setQuantityTier(tier)
    setBogoSelected(false)
  }

  function handleCheckoutClick() {
    onCheckout(appliedCode, bogoSelected ? true : undefined)
  }

  // Which discount label to show on the CTA
  const activeCouponPct = couponPct !== null && couponPct > (sitewisePct ?? 0) ? couponPct : null
  const activeSitewisePct = sitewisePct !== null && sitewisePct >= (couponPct ?? 0) ? sitewisePct : null

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
          <h2 id="license-modal-title" className="text-lg font-bold text-foreground">{t.license.title}</h2>
          <button
            onClick={onClose}
            aria-label="Close license options"
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Sitewide discount banner */}
        {hasSitewide && (
          <div className="mb-4 flex items-center gap-2 rounded-sm border border-accent/30 bg-accent/10 px-3 py-2.5">
            <Tag size={13} className="text-accent flex-shrink-0" aria-hidden="true" />
            <p className="text-sm font-semibold text-accent">
              {promo.sitewide_discount_pct}% off everything — applied automatically
              {activeCouponPct !== null && ` (your code gives ${activeCouponPct}% — whichever is better is applied)`}
            </p>
          </div>
        )}

        {/* BOGO banner */}
        {hasBogo && (
          <div className="mb-4 flex items-center gap-2 rounded-sm px-3 py-2.5" style={{ border: '1px solid var(--promo-border)', background: 'var(--promo-dim)' }}>
            <Zap size={13} style={{ color: 'var(--promo)' }} className="flex-shrink-0" aria-hidden="true" />
            <p className="text-sm font-semibold" style={{ color: 'var(--promo)' }}>
              Limited offer: Buy 1 get {promo.bogo_free_count} free — see deal below
            </p>
          </div>
        )}

        {/* Cart summary */}
        {items.length > 0 && (
          <div className="mb-4 rounded-sm bg-white/5 p-3">
            <p className="text-xs text-muted-mid mb-2 font-medium">IN CART</p>
            {items.map(({ beat }) => (
              <p key={beat.id} className="text-sm text-foreground">
                {beat.title}
              </p>
            ))}
          </div>
        )}

        {/* License tabs */}
        <div className="mb-4 flex rounded-sm border border-line-card p-0.5">
          {(['standard', 'premium', 'unlimited'] as LicenseType[]).map((type) => (
            <button
              key={type}
              onClick={() => setLicenseType(type)}
              aria-pressed={licenseType === type}
              className={`flex-1 rounded-sm py-2 text-xs font-semibold transition-[background-color,color] ${
                licenseType === type
                  ? 'bg-white text-black'
                  : 'text-muted-mid hover:text-white'
              }`}
            >
              {type === 'standard' ? 'Basic' : type === 'premium' ? 'Premium' : 'Unlimited'}
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
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-muted-mid uppercase tracking-wide">
            {t.license.beatQty}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {([1, 3, 5] as QuantityTier[]).map((qty) => {
              const raw = PRICES[licenseType][qty]
              const shown = bestPct !== null ? applyDiscount(raw, bestPct) : raw
              const isSelected = !bogoSelected && quantityTier === qty
              return (
                <button
                  key={qty}
                  onClick={() => handleTierClick(qty)}
                  aria-pressed={isSelected}
                  aria-label={`${qty} beat${qty > 1 ? 's' : ''} — ${formatPrice(shown, currency)}`}
                  className={`rounded-sm border py-3 text-center transition-[border-color,background-color,color] ${
                    isSelected
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-line-input text-muted-mid hover:border-muted hover:text-white'
                  }`}
                >
                  <p className="text-lg font-bold">{qty}</p>
                  <p className="text-xs text-muted">beat{qty > 1 ? 's' : ''}</p>
                  {bestPct !== null ? (
                    <p className="text-sm font-semibold text-foreground mt-1">
                      <span className="line-through text-muted-low text-xs mr-1">{formatPrice(raw, currency)}</span>
                      {formatPrice(shown, currency)}
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-foreground mt-1">{formatPrice(raw, currency)}</p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* BOGO deal option */}
        {hasBogo && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-mid uppercase tracking-wide">
              {t.license.limitedOffer}
            </p>
            <button
              onClick={() => setBogoSelected((s) => !s)}
              aria-pressed={bogoSelected}
              className="w-full rounded-sm border p-3.5 text-left transition-[border-color,background-color]"
              style={{
                borderColor: bogoSelected ? 'var(--promo-border)' : 'var(--line-input)',
                background: bogoSelected ? 'var(--promo-dim)' : 'transparent',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Zap size={13} style={{ color: 'var(--promo)' }} aria-hidden="true" />
                    <p className="text-sm font-bold" style={{ color: 'var(--promo)' }}>
                      Buy 1 Get {promo.bogo_free_count} Free
                    </p>
                  </div>
                  <p className="text-xs text-muted-mid ml-5">
                    {1 + (promo.bogo_free_count ?? 0)} beats total — pay for 1 only
                    {items.length > 0 && items.length !== 1 + (promo.bogo_free_count ?? 0) && (
                      <span className="text-muted-low"> · add {1 + (promo.bogo_free_count ?? 0) - items.length} more beat{1 + (promo.bogo_free_count ?? 0) - items.length !== 1 ? 's' : ''} to your cart to use this deal</span>
                    )}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {bestPct !== null ? (
                    <>
                      <p className="text-xs line-through text-muted-low">{formatPrice(PRICES[licenseType][1], currency)}</p>
                      <p className="text-base font-bold text-foreground">{formatPrice(applyDiscount(PRICES[licenseType][1], bestPct), currency)}</p>
                    </>
                  ) : (
                    <p className="text-base font-bold text-foreground">{formatPrice(PRICES[licenseType][1], currency)}</p>
                  )}
                  <p className="text-[10px]" style={{ color: 'var(--promo)' }}>1-beat price</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Discount code */}
        <div className="mb-4">
          {appliedCode ? (
            <div className="flex items-center justify-between rounded-sm border border-accent/30 bg-accent/10 px-3 py-2">
              <p className="text-sm text-accent font-medium">
                {appliedCode} — {discountPct}% off
                {sitewisePct !== null && sitewisePct >= (discountPct ?? 0) && (
                  <span className="text-muted-low text-xs ml-1">(sitewide {sitewisePct}% is better)</span>
                )}
              </p>
              <button
                onClick={handleRemoveCode}
                className="text-xs text-muted-low hover:text-white transition-colors"
              >
                {t.license.remove}
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
                placeholder={t.license.discountCode}
                autoComplete="off"
                aria-describedby={codeError ? 'discount-code-error' : undefined}
                aria-invalid={!!codeError}
                className="flex-1 rounded-sm border border-line-input bg-surface-2 px-3 py-2 text-sm text-foreground placeholder-muted-low outline-none focus:border-muted transition-colors"
              />
              <button
                onClick={handleApplyCode}
                disabled={codeLoading}
                className="rounded-sm border border-line-input px-4 py-2 text-sm font-semibold text-foreground hover:text-white hover:border-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {codeLoading ? '…' : t.license.apply}
              </button>
            </div>
          )}
          {codeError && <p id="discount-code-error" role="alert" className="mt-1.5 text-xs text-danger">{codeError}</p>}
        </div>

        {/* CTA */}
        <button
          onClick={handleCheckoutClick}
          className="w-full rounded-sm bg-white py-4 text-base font-bold text-black hover:bg-white-hover transition-colors"
        >
          {bestPct !== null || bogoSelected ? (
            <>
              {t.license.checkout} —{' '}
              <span className="line-through text-black/40 mr-1 font-normal text-sm">{formatPrice(basePrice, currency)}</span>
              {formatPrice(finalPrice, currency)}
            </>
          ) : (
            <>{t.license.checkout} — {formatPrice(finalPrice, currency)}</>
          )}
        </button>

        {/* Discount label under CTA */}
        {(activeSitewisePct !== null || activeCouponPct !== null || bogoSelected) && (
          <p className="mt-1.5 text-center text-xs text-muted-low">
            {bogoSelected && `BOGO deal applied`}
            {bogoSelected && (activeSitewisePct !== null || activeCouponPct !== null) && ' · '}
            {activeSitewisePct !== null && `${activeSitewisePct}% sitewide discount`}
            {activeCouponPct !== null && `${activeCouponPct}% off with ${appliedCode}`}
          </p>
        )}

        <p className="mt-2 text-center text-xs text-muted-low">
          {t.license.secure}
        </p>
      </div>
    </div>
  )
}
