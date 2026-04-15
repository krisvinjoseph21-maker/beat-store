import type { LicenseType, QuantityTier } from '@/lib/store'

export const PRICES: Record<LicenseType, Record<QuantityTier, number>> = {
  standard: { 1: 50, 3: 100, 5: 200 },
  unlimited: { 1: 100, 3: 200, 5: 400 },
}
