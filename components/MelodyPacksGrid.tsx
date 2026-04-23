'use client'

import { useState, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import MelodyPackCard, { type MelodyPack } from './MelodyPackCard'

type SortKey = 'date-new' | 'date-old' | 'price-low' | 'price-high' | 'title-az'
type Availability = 'all' | 'paid' | 'free'

const SORT_LABELS: Record<SortKey, string> = {
  'date-new': 'Date, new to old',
  'date-old': 'Date, old to new',
  'price-low': 'Price, low to high',
  'price-high': 'Price, high to low',
  'title-az': 'Title, A–Z',
}

export default function MelodyPacksGrid({ initialPacks }: { initialPacks: MelodyPack[] }) {
  const [sort, setSort] = useState<SortKey>('date-new')
  const [availability, setAvailability] = useState<Availability>('all')
  const [sortOpen, setSortOpen] = useState(false)
  const [availOpen, setAvailOpen] = useState(false)

  const filtered = useMemo(() => {
    let packs = [...initialPacks]

    if (availability === 'paid') packs = packs.filter((p) => p.price > 0)
    if (availability === 'free') packs = packs.filter((p) => p.price === 0)

    switch (sort) {
      case 'date-new':  packs.sort((a, b) => b.created_at.localeCompare(a.created_at)); break
      case 'date-old':  packs.sort((a, b) => a.created_at.localeCompare(b.created_at)); break
      case 'price-low': packs.sort((a, b) => a.price - b.price); break
      case 'price-high':packs.sort((a, b) => b.price - a.price); break
      case 'title-az':  packs.sort((a, b) => a.title.localeCompare(b.title)); break
    }

    return packs
  }, [initialPacks, sort, availability])

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10 lg:px-16">
      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-5xl md:text-6xl font-display uppercase text-foreground"
          style={{ fontFamily: 'var(--font-bebas)', letterSpacing: '0.02em' }}
        >
          Melody Packs
        </h1>
      </div>

      {/* Filter / Sort bar */}
      <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-[var(--line)] pb-4">
        {/* Availability filter */}
        <div className="relative">
          <button
            onClick={() => { setAvailOpen((o) => !o); setSortOpen(false) }}
            className="flex items-center gap-1.5 border-b border-foreground/40 text-[12px] text-foreground pb-0.5"
          >
            Availability
            <ChevronDown size={11} className={`transition-transform ${availOpen ? 'rotate-180' : ''}`} />
          </button>
          {availOpen && (
            <div className="absolute top-full left-0 mt-2 w-36 border border-[var(--line-card)] bg-[var(--surface-1)] py-1 z-20">
              {(['all', 'paid', 'free'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => { setAvailability(v); setAvailOpen(false) }}
                  className={`block w-full px-4 py-2 text-left text-[12px] capitalize transition-colors ${availability === v ? 'text-foreground font-semibold' : 'text-muted hover:text-foreground'}`}
                >
                  {v === 'all' ? 'All' : v === 'paid' ? 'In Stock' : 'Free'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => { setSortOpen((o) => !o); setAvailOpen(false) }}
            className="flex items-center gap-1.5 text-[12px] text-muted"
          >
            <span className="text-foreground">Sort by</span>
            &nbsp;{SORT_LABELS[sort]}
            <ChevronDown size={11} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
          </button>
          {sortOpen && (
            <div className="absolute top-full right-0 mt-2 w-44 border border-[var(--line-card)] bg-[var(--surface-1)] py-1 z-20">
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => { setSort(k); setSortOpen(false) }}
                  className={`block w-full px-4 py-2 text-left text-[12px] transition-colors ${sort === k ? 'text-foreground font-semibold' : 'text-muted hover:text-foreground'}`}
                >
                  {SORT_LABELS[k]}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-[12px] text-muted">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-muted text-[14px]">No melody packs found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((pack) => (
            <MelodyPackCard key={pack.id} pack={pack} />
          ))}
        </div>
      )}
    </div>
  )
}
