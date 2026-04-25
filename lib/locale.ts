'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Currency = 'USD' | 'CAD' | 'GBP'
export type Language = 'en' | 'es' | 'fr'

interface LocaleStore {
  currency: Currency
  language: Language
  setCurrency: (c: Currency) => void
  setLanguage: (l: Language) => void
}

const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  CAD: 1.38,
  GBP: 0.79,
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  CAD: 'CA$',
  GBP: '£',
}

export function formatPrice(usdAmount: number, currency: Currency): string {
  const converted = usdAmount * EXCHANGE_RATES[currency]
  const str = converted.toFixed(2)
  return `${CURRENCY_SYMBOLS[currency]}${str.endsWith('.00') ? str.slice(0, -3) : str}`
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      currency: 'USD',
      language: 'en',
      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'prodkj-locale' }
  )
)
