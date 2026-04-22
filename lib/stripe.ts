import 'server-only'
import Stripe from 'stripe'

// Lazy singleton — avoids build-time instantiation without env vars
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
    })
  }
  return _stripe
}

// Keep named export for compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string, unknown>)[prop as string]
  },
})

// License pricing matrix
export const LICENSE_PRICES: Record<string, Record<number, number>> = {
  standard: { 1: 39.95, 3: 80, 5: 160 },
  premium: { 1: 49.95, 3: 100, 5: 200 },
  unlimited: { 1: 149.95, 3: 300, 5: 600 },
}

export function getLicensePrice(
  type: 'standard' | 'premium' | 'unlimited',
  qty: 1 | 3 | 5
): number {
  return LICENSE_PRICES[type][qty]
}

export type LicenseType = 'standard' | 'premium' | 'unlimited'
export type QuantityTier = 1 | 3 | 5
