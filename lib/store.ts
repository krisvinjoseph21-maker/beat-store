'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Beat {
  id: string
  title: string
  bpm: number
  key: string
  genre: string
  subgenre: string
  tags: string[]
  file_url: string | null
  preview_url: string | null
  cover_url: string | null
  stems_path: string | null
  is_active: boolean
  created_at: string
}

export interface CartItem {
  beat: Beat
}

export type LicenseType = 'standard' | 'premium' | 'unlimited'
export type QuantityTier = 1 | 3 | 5

interface CartStore {
  items: CartItem[]
  licenseType: LicenseType
  quantityTier: QuantityTier
  cartOpen: boolean
  addBeat: (beat: Beat) => void
  removeBeat: (beatId: string) => void
  clearCart: () => void
  setLicenseType: (type: LicenseType) => void
  setQuantityTier: (tier: QuantityTier) => void
  isInCart: (beatId: string) => boolean
  total: () => number
  openCart: () => void
  closeCart: () => void
}

const PRICES: Record<LicenseType, Record<QuantityTier, number>> = {
  standard: { 1: 39.95, 3: 80, 5: 160 },
  premium: { 1: 49.95, 3: 100, 5: 200 },
  unlimited: { 1: 149.95, 3: 300, 5: 600 },
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      licenseType: 'standard',
      quantityTier: 1,
      cartOpen: false,

      addBeat: (beat) => {
        const { items } = get()
        if (items.find((i) => i.beat.id === beat.id)) return
        set({ items: [...items, { beat }] })
      },

      removeBeat: (beatId) => {
        set({ items: get().items.filter((i) => i.beat.id !== beatId) })
      },

      clearCart: () => set({ items: [] }),

      setLicenseType: (type) => set({ licenseType: type }),

      setQuantityTier: (tier) => set({ quantityTier: tier }),

      isInCart: (beatId) => !!get().items.find((i) => i.beat.id === beatId),

      total: () => {
        const { items, licenseType, quantityTier } = get()
        if (quantityTier === 1) return PRICES[licenseType][1] * items.length
        return PRICES[licenseType][quantityTier]
      },

      openCart: () => set({ cartOpen: true }),
      closeCart: () => set({ cartOpen: false }),
    }),
    { name: 'prodkj-cart', partialize: (s) => ({ items: s.items, licenseType: s.licenseType, quantityTier: s.quantityTier }) }
  )
)

// Favorites store — persisted to localStorage
interface FavoritesStore {
  ids: string[]
  toggle: (beatId: string) => void
  isFavorited: (beatId: string) => boolean
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (beatId) => {
        const { ids } = get()
        set({ ids: ids.includes(beatId) ? ids.filter((id) => id !== beatId) : [...ids, beatId] })
      },
      isFavorited: (beatId) => get().ids.includes(beatId),
    }),
    { name: 'prodkj-favorites' }
  )
)

// Player store — not persisted
interface PlayerStore {
  currentBeat: Beat | null
  isPlaying: boolean
  progress: number
  duration: number
  queue: Beat[]
  setCurrentBeat: (beat: Beat) => void
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  setProgress: (progress: number) => void
  setDuration: (duration: number) => void
  setQueue: (beats: Beat[]) => void
  playNext: () => void
  playPrev: () => void
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentBeat: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  queue: [],

  setCurrentBeat: (beat) => set({ currentBeat: beat, progress: 0 }),
  togglePlay: () => set({ isPlaying: !get().isPlaying }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  setQueue: (beats) => set({ queue: beats }),

  playNext: () => {
    const { currentBeat, queue } = get()
    if (!currentBeat || queue.length === 0) return
    const idx = queue.findIndex((b) => b.id === currentBeat.id)
    const next = queue[(idx + 1) % queue.length]
    set({ currentBeat: next, progress: 0, isPlaying: true })
  },

  playPrev: () => {
    const { currentBeat, queue } = get()
    if (!currentBeat || queue.length === 0) return
    const idx = queue.findIndex((b) => b.id === currentBeat.id)
    const prev = queue[(idx - 1 + queue.length) % queue.length]
    set({ currentBeat: prev, progress: 0, isPlaying: true })
  },
}))
