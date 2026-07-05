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

// Producers searching by feel ("around 140", "140 bpm") never mean an exact
// match — but an LLM asked for a min/max will happily hand back a ±0.5 window,
// which zeroes out every result against a real catalog. Guarantee a sane
// minimum tolerance regardless of what the model extracted.
const MIN_BPM_WINDOW = 16

/** Widens an overly-narrow bpmMin/bpmMax pair to at least a ±(MIN_BPM_WINDOW/2) window around their center. Leaves wider/explicit ranges untouched. */
export function normalizeBpmRange(filters: ExtractedFilters): ExtractedFilters {
  if (filters.bpmMin == null || filters.bpmMax == null) return filters
  const width = filters.bpmMax - filters.bpmMin
  if (width >= MIN_BPM_WINDOW) return filters
  const center = (filters.bpmMin + filters.bpmMax) / 2
  return { ...filters, bpmMin: center - MIN_BPM_WINDOW / 2, bpmMax: center + MIN_BPM_WINDOW / 2 }
}

/** Applies the BPM/genre/key filters extracted from a query to a candidate row set. */
export function applyStructuredFilters<T extends FilterableRow>(rows: T[], filters: ExtractedFilters | null): T[] {
  if (!filters) return rows
  const normalized = normalizeBpmRange(filters)
  let result = rows
  if (normalized.bpmMin != null) result = result.filter((r) => r.bpm >= normalized.bpmMin!)
  if (normalized.bpmMax != null) result = result.filter((r) => r.bpm <= normalized.bpmMax!)
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
