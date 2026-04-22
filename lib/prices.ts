import type { LicenseType, QuantityTier } from '@/lib/store'

export const PRICES: Record<LicenseType, Record<QuantityTier, number>> = {
  standard: { 1: 39.95, 3: 80, 5: 160 },
  premium: { 1: 49.95, 3: 100, 5: 200 },
  unlimited: { 1: 149.95, 3: 300, 5: 600 },
}
