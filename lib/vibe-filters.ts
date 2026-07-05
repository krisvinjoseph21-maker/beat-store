import { PRICES } from '@/lib/prices'

// No beat can ever cost less than the cheapest license (standard, 1x).
export const CHEAPEST_LICENSE_PRICE = PRICES.standard[1]

export interface ExtractedFilters {
  priceMax: number | null
  bpmMin: number | null
  bpmMax: number | null
  key: string | null
  licenseType: 'standard' | 'premium' | 'unlimited' | null
  genre: string | null
}

interface FilterableRow {
  bpm: number
  key: string | null
  genre: string | null
}

/**
 * Price isn't a per-beat attribute (lib/prices.ts is a flat catalog-wide
 * table), so a ceiling below the cheapest license can never match anything.
 * Returns a user-facing message when that's the case, or null when the
 * ceiling imposes no constraint (>= the cheapest license price).
 */
export function checkPriceFloor(priceMax: number | null): string | null {
  if (priceMax == null || priceMax >= CHEAPEST_LICENSE_PRICE) return null
  return `No beats available under $${priceMax} — licenses start at $${CHEAPEST_LICENSE_PRICE}.`
}

/** Applies the BPM/genre/key filters extracted from a query to a candidate row set. */
export function applyStructuredFilters<T extends FilterableRow>(rows: T[], filters: ExtractedFilters | null): T[] {
  if (!filters) return rows
  let result = rows
  if (filters.bpmMin != null) result = result.filter((r) => r.bpm >= filters.bpmMin!)
  if (filters.bpmMax != null) result = result.filter((r) => r.bpm <= filters.bpmMax!)
  if (filters.genre) {
    const g = filters.genre.toLowerCase()
    result = result.filter((r) => r.genre?.toLowerCase().includes(g))
  }
  if (filters.key) {
    const k = filters.key.toLowerCase()
    result = result.filter((r) => r.key?.toLowerCase() === k)
  }
  return result
}
