/**
 * Discount codes are loaded from the DISCOUNT_CODES env var at runtime.
 * Format: comma-separated CODE:PERCENT pairs
 * Example: DISCOUNT_CODES=SAVE10:10,VIP25:25,NEWARTIST:20
 *
 * This keeps codes out of source code so they can't be seen on GitHub.
 */
function loadCodes(): Record<string, number> {
  const raw = process.env.DISCOUNT_CODES ?? ''
  if (!raw) return {}
  const result: Record<string, number> = {}
  for (const entry of raw.split(',')) {
    const [code, pct] = entry.trim().split(':')
    if (code && pct) {
      const n = parseInt(pct, 10)
      if (!isNaN(n) && n > 0 && n <= 100) {
        result[code.trim().toUpperCase()] = n
      }
    }
  }
  return result
}

export function getDiscountPct(code: string): number | null {
  const codes = loadCodes()
  return codes[code.trim().toUpperCase()] ?? null
}

export function applyDiscount(price: number, pct: number): number {
  return Math.round(price * (1 - pct / 100))
}
