// Discount codes — validated on both client (preview) and server (enforcement)
export const DISCOUNT_CODES: Record<string, number> = {
  PRODKJ10: 10,
  NEWARTIST: 20,
  VIBES25: 25,
}

export function getDiscountPct(code: string): number | null {
  return DISCOUNT_CODES[code.trim().toUpperCase()] ?? null
}

export function applyDiscount(price: number, pct: number): number {
  return Math.round(price * (1 - pct / 100))
}
