'use client'

import { X, Check } from 'lucide-react'
import { useState } from 'react'
import { useCartStore, LicenseType, QuantityTier } from '@/lib/store'
import { getDiscountPct, applyDiscount } from '@/lib/discount-codes'

interface Props {
  open: boolean
  onClose: () => void
  onCheckout: (discountCode: string) => void
}

const PRICES: Record<LicenseType, Record<QuantityTier, number>> = {
  standard: { 1: 75, 3: 150, 5: 225 },
  unlimited: { 1: 150, 3: 300, 5: 450 },
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
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-sm border border-gray-200 bg-white p-5 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Choose Your License</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cart summary */}
        {items.length > 0 && (
          <div className="mb-4 rounded-sm bg-gray-50 border border-gray-100 p-3">
            <p className="text-xs text-gray-400 mb-2 font-medium">IN CART</p>
            {items.map(({ beat }) => (
              <p key={beat.id} className="text-sm text-gray-900">
                {beat.title}
              </p>
            ))}
          </div>
        )}

        {/* License tabs */}
        <div className="mb-4 flex rounded-sm border border-gray-200 p-0.5">
          {(['standard', 'unlimited'] as LicenseType[]).map((type) => (
            <button
              key={type}
              onClick={() => setLicenseType(type)}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                licenseType === type
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {type === 'standard' ? 'Standard Lease' : 'Unlimited Lease'}
            </button>
          ))}
        </div>

        {/* Features */}
        <ul className="mb-4 space-y-1.5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
              <Check size={14} className="text-green-500 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* Quantity tiers */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Beat Quantity
          </p>
          <div className="grid grid-cols-3 gap-2">
            {([1, 3, 5] as QuantityTier[]).map((qty) => (
              <button
                key={qty}
                onClick={() => setQuantityTier(qty)}
                className={`rounded-sm border py-3 text-center transition-all ${
                  quantityTier === qty
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900'
                }`}
              >
                <p className="text-lg font-bold">{qty}</p>
                <p className={`text-xs ${quantityTier === qty ? 'text-gray-300' : 'text-gray-400'}`}>
                  beat{qty > 1 ? 's' : ''}
                </p>
                <p className={`text-sm font-semibold mt-1 ${quantityTier === qty ? 'text-white' : 'text-gray-900'}`}>
                  ${PRICES[licenseType][qty]}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Discount code */}
        <div className="mb-4">
          {appliedCode ? (
            <div className="flex items-center justify-between rounded-sm border border-green-200 bg-green-50 px-3 py-2">
              <p className="text-sm text-green-600 font-medium">
                {appliedCode} — {discountPct}% off applied
              </p>
              <button
                onClick={handleRemoveCode}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value); setCodeError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCode()}
                placeholder="Discount code"
                className="flex-1 rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 transition-colors"
              />
              <button
                onClick={handleApplyCode}
                className="rounded-sm border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors"
              >
                Apply
              </button>
            </div>
          )}
          {codeError && <p className="mt-1.5 text-xs text-red-500">{codeError}</p>}
        </div>

        {/* CTA */}
        <button
          onClick={() => onCheckout(appliedCode)}
          className="w-full rounded-sm bg-gray-900 py-4 text-base font-bold text-white hover:bg-gray-700 transition-colors"
        >
          {discountPct !== null ? (
            <>
              Checkout —{' '}
              <span className="line-through text-gray-400 mr-1">${basePrice}</span>
              ${finalPrice}
            </>
          ) : (
            <>Checkout — ${finalPrice}</>
          )}
        </button>
        <p className="mt-2 text-center text-xs text-gray-400">
          Powered by Stripe · Secure checkout
        </p>
      </div>
    </div>
  )
}
