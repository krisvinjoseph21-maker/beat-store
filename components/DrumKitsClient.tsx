'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

type Availability = 'all' | 'in_stock' | 'out_of_stock'

interface DrumKit {
  id: string
  title: string
  vendor: string
  originalPrice: number
  salePrice: number | null
  image: string | null
  availability: 'in_stock' | 'out_of_stock'
}

const DRUM_KITS: DrumKit[] = [
  {
    id: '1',
    title: 'Go-To Drum Kit 2025',
    vendor: 'PRODKJBEATS',
    originalPrice: 28,
    salePrice: 14,
    image: null,
    availability: 'in_stock',
  },
]

const SORT_OPTIONS = [
  { value: 'best_selling', label: 'Best selling' },
  { value: 'price_asc', label: 'Price, low to high' },
  { value: 'price_desc', label: 'Price, high to low' },
  { value: 'newest', label: 'Newest' },
  { value: 'az', label: 'Alphabetically, A–Z' },
  { value: 'za', label: 'Alphabetically, Z–A' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'out_of_stock', label: 'Out of stock' },
]

function ChevronDown() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Dropdown({
  open,
  onClose,
  children,
  align = 'left',
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className={`absolute top-full mt-1 w-52 bg-surface-2 border border-white/[0.08] rounded-xl shadow-2xl z-30 overflow-hidden ${align === 'right' ? 'right-0' : 'left-0'}`}
    >
      {children}
    </div>
  )
}

export default function DrumKitsClient() {
  const [availability, setAvailability] = useState<Availability>('all')
  const [sortBy, setSortBy] = useState('best_selling')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const filtered = DRUM_KITS.filter((kit) => {
    if (availability === 'in_stock') return kit.availability === 'in_stock'
    if (availability === 'out_of_stock') return kit.availability === 'out_of_stock'
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const aPrice = a.salePrice ?? a.originalPrice
    const bPrice = b.salePrice ?? b.originalPrice
    switch (sortBy) {
      case 'price_asc': return aPrice - bPrice
      case 'price_desc': return bPrice - aPrice
      case 'az': return a.title.localeCompare(b.title)
      case 'za': return b.title.localeCompare(a.title)
      default: return 0
    }
  })

  const currentAvailLabel = AVAILABILITY_OPTIONS.find((o) => o.value === availability)?.label ?? 'Availability'
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Best selling'

  return (
    <div className="min-h-screen bg-black">
      {/* Page header */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-14 pb-8">
        <h1
          className="font-display uppercase text-foreground leading-none"
          style={{ fontSize: 'clamp(44px, 8vw, 96px)' }}
        >
          Drum Kits
        </h1>
      </div>

      {/* Filter / sort bar */}
      <div className="border-t border-b border-white/[0.06] bg-surface-1 sticky top-12 z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-2.5 flex items-center justify-between gap-4">
          {/* Filter */}
          <div className="flex items-center gap-2.5">
            <span className="text-[12px] text-muted hidden sm:block">Filter:</span>
            <div className="relative">
              <button
                onClick={() => { setFilterOpen((v) => !v); setSortOpen(false) }}
                className="flex items-center gap-2 text-[12px] text-foreground border border-white/[0.1] rounded-full px-3.5 py-1.5 hover:border-white/25 transition-colors"
                aria-expanded={filterOpen}
              >
                {currentAvailLabel}
                <ChevronDown />
              </button>
              <Dropdown open={filterOpen} onClose={() => setFilterOpen(false)}>
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setAvailability(opt.value as Availability); setFilterOpen(false) }}
                    className={`w-full text-left px-4 py-2.5 text-[12px] hover:bg-surface-1 transition-colors ${availability === opt.value ? 'text-accent' : 'text-foreground'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </Dropdown>
            </div>
          </div>

          {/* Sort + count */}
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-muted">
              {sorted.length} {sorted.length === 1 ? 'product' : 'products'}
            </span>
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] text-muted hidden sm:block">Sort by:</span>
              <div className="relative">
                <button
                  onClick={() => { setSortOpen((v) => !v); setFilterOpen(false) }}
                  className="flex items-center gap-2 text-[12px] text-foreground border border-white/[0.1] rounded-full px-3.5 py-1.5 hover:border-white/25 transition-colors min-w-[120px] justify-between"
                  aria-expanded={sortOpen}
                >
                  {currentSortLabel}
                  <ChevronDown />
                </button>
                <Dropdown open={sortOpen} onClose={() => setSortOpen(false)} align="right">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-[12px] hover:bg-surface-1 transition-colors ${sortBy === opt.value ? 'text-accent' : 'text-foreground'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </Dropdown>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-10 pb-20">
        {sorted.length === 0 ? (
          <p className="text-muted text-[13px] py-24 text-center">No drum kits match your filters.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {sorted.map((kit) => (
              <KitCard key={kit.id} kit={kit} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function KitCard({ kit }: { kit: DrumKit }) {
  const displayPrice = kit.salePrice ?? kit.originalPrice
  const onSale = kit.salePrice !== null && kit.salePrice < kit.originalPrice

  return (
    <div className="flex flex-col group">
      {/* Image */}
      <div className="relative aspect-square bg-surface-1 rounded-2xl overflow-hidden border border-white/[0.06] mb-3">
        {kit.image ? (
          <Image
            src={kit.image}
            alt={kit.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-low" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r="7" />
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
              </svg>
            </div>
          </div>
        )}
        {onSale && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="bg-black/85 border border-white/10 text-foreground text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
              Sale
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 mb-3 flex-1">
        <p className="text-[13px] font-medium text-foreground leading-snug">{kit.title}</p>
        <p className="text-[10px] uppercase font-normal text-muted-low" style={{ letterSpacing: '0.08em' }}>
          {kit.vendor}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {onSale && (
            <span className="text-[12px] text-muted-low line-through">
              ${kit.originalPrice.toFixed(2)} USD
            </span>
          )}
          <span className="text-[13px] font-medium text-foreground">
            ${displayPrice.toFixed(2)} USD
          </span>
        </div>
      </div>

      {/* CTA */}
      <button className="w-full border border-white/[0.12] text-foreground text-[12px] font-medium py-2.5 rounded-lg hover:bg-surface-1 hover:border-white/25 transition-colors active:scale-[0.98]">
        Add to cart
      </button>
    </div>
  )
}
