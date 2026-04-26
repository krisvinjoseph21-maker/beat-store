'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import BeatCard from './BeatCard'
import { Beat, useCartStore, usePlayerStore, useFavoritesStore } from '@/lib/store'
import { BadgeCheck, ChevronDown, Heart } from 'lucide-react'
import { useT } from '@/lib/i18n'

const LicenseModal = dynamic(() => import('./LicenseModal'), { ssr: false })
const StoreAmbient = dynamic(() => import('./StoreAmbient'), { ssr: false })

const PLACEMENT_CREDITS = [
  { artist: 'GloRilla',     detail: 'CMG / Interscope' },
  { artist: 'DeeBaby',      detail: '"Chicago Baby" · 500K+' },
  { artist: 'Paris Bryant', detail: '"A Crush"' },
  { artist: 'Shenseea',     detail: 'Interscope Records' },
  { artist: 'Seyi Vibez',   detail: 'Afrobeats' },
  { artist: 'Est Gee',      detail: 'Trap' },
]

const BPM_RANGES = [
  { label: 'All BPM', min: 0, max: Infinity },
  { label: '70–90', min: 70, max: 90 },
  { label: '90–110', min: 90, max: 110 },
  { label: '110–130', min: 110, max: 130 },
  { label: '130–150', min: 130, max: 150 },
  { label: '150+', min: 150, max: Infinity },
]

const SORT_OPTIONS = [
  { value: 'default',   label: 'Default List' },
  { value: 'bpm_asc',  label: 'BPM: Low → High' },
  { value: 'bpm_desc', label: 'BPM: High → Low' },
  { value: 'newest',   label: 'Newest' },
  { value: 'oldest',   label: 'Oldest' },
]

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  label: string
}) {
  return (
    <div className="relative flex-1 min-w-[120px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="w-full h-11 appearance-none border border-line-input bg-transparent py-0 pl-3.5 pr-8 text-[11px] font-medium outline-none transition-colors cursor-pointer hover:border-line-hover"
        style={{ color: 'var(--muted-low)', fontFamily: 'var(--font-inter)' }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface-1">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-low" aria-hidden="true" />
    </div>
  )
}

export default function BeatStore({ initialBeats }: { initialBeats: Beat[] }) {
  const t = useT()
  const [category, setCategory] = useState('All Genres')
  const [bpmRange, setBpmRange] = useState('All BPM')
  const [sortBy, setSortBy] = useState('default')
  const [showAll, setShowAll] = useState(false)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const searchParams = useSearchParams()
  const MAX_QUERY_LEN = 100
  const [search, setSearch] = useState((searchParams.get('q') ?? '').slice(0, MAX_QUERY_LEN))
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])
  const [modalOpen, setModalOpen] = useState(false)
  const { openCart } = useCartStore()
  const { ids: favoriteIds } = useFavoritesStore()
  const { setQueue } = usePlayerStore()

  useEffect(() => {
    setQueue(initialBeats)
  }, [initialBeats, setQueue])

  useEffect(() => {
    setShowAll(false)
  }, [category, bpmRange, sortBy, debouncedSearch, favoritesOnly])

  // Deduplicate genres case-insensitively so 'trap' and 'Trap' merge into one entry.
  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    for (const b of initialBeats) {
      const g = b.genre?.trim()
      if (g && !seen.has(g.toLowerCase())) seen.set(g.toLowerCase(), g)
    }
    return ['All Genres', ...[...seen.values()].sort()]
  }, [initialBeats])

  const filtered = useMemo(() => {
    const bpmOpt = BPM_RANGES.find((r) => r.label === bpmRange) ?? BPM_RANGES[0]
    const q = debouncedSearch.toLowerCase()

    let results = initialBeats.filter((b) => {
      if (favoritesOnly && !favoriteIds.includes(b.id)) return false
      if (category !== 'All Genres' && b.genre?.trim().toLowerCase() !== category.toLowerCase()) return false
      if (b.bpm < bpmOpt.min || b.bpm > bpmOpt.max) return false
      if (q && !(
        b.title.toLowerCase().includes(q) ||
        b.key.toLowerCase().includes(q) ||
        (b.subgenre ?? '').toLowerCase().includes(q) ||
        b.tags.some((tag) => tag.toLowerCase().includes(q))
      )) return false
      return true
    })

    switch (sortBy) {
      case 'bpm_asc':  results = [...results].sort((a, b) => a.bpm - b.bpm); break
      case 'bpm_desc': results = [...results].sort((a, b) => b.bpm - a.bpm); break
      case 'newest':   results = [...results].sort((a, b) => b.created_at.localeCompare(a.created_at)); break
      case 'oldest':   results = [...results].sort((a, b) => a.created_at.localeCompare(b.created_at)); break
    }

    return results
  }, [initialBeats, category, bpmRange, sortBy, debouncedSearch, favoritesOnly, favoriteIds])

  const handleBuyClick = useCallback(() => setModalOpen(true), [])

  function handleModalCheckout() {
    setModalOpen(false)
    openCart()
  }

  return (
    <div className="w-full flex flex-col items-center">

      {/* Hero header with dot-grid background */}
      <div
        className="w-full relative overflow-hidden flex flex-col items-center"
        style={{
          background: 'var(--surface-3)',
        }}
      >
        <div className="w-full max-w-6xl px-6 sm:px-10 lg:px-16 pt-12 pb-8">
          <p
            className="font-montserrat mb-3 text-[11px] font-semibold uppercase"
            style={{ letterSpacing: '0.15em', color: 'var(--accent)' }}
          >
            {t.store.fullCatalog}
          </p>

          <h1
            className="font-display uppercase leading-none mb-8"
            style={{ fontSize: 'clamp(52px, 9vw, 112px)', color: 'var(--foreground)' }}
          >
            {t.store.allBeatsHeading}
          </h1>

          {/* Placement credit strip */}
          <div
            className="mb-6 flex items-center gap-0 overflow-hidden"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', height: '30px' }}
            aria-label="Verified artist placements"
          >
            <div
              className="flex items-center gap-1.5 pr-4 shrink-0"
              style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}
            >
              <BadgeCheck size={11} style={{ color: 'var(--accent)' }} aria-hidden="true" />
              <span
                className="font-montserrat text-[9px] font-bold uppercase whitespace-nowrap"
                style={{ letterSpacing: '0.18em', color: 'var(--accent)' }}
              >
                {t.store.verifiedCredits}
              </span>
            </div>
            <div className="relative flex-1 overflow-hidden" aria-hidden="true">
              <div className="ticker-wrap flex items-center whitespace-nowrap pl-5" style={{ animationDuration: '28s' }}>
                {[...PLACEMENT_CREDITS, ...PLACEMENT_CREDITS].map(({ artist, detail }, i) => (
                  <span key={i} className="inline-flex items-center gap-3 mr-8">
                    <span
                      className="font-montserrat text-[10px] font-semibold"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {artist}
                    </span>
                    <span
                      className="text-[9px]"
                      style={{ color: 'var(--muted-low)', fontFamily: 'var(--font-inter)' }}
                    >
                      {detail}
                    </span>
                    <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Search + genre pills row */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              aria-label={t.store.searchPlaceholder}
              placeholder={t.store.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value.slice(0, MAX_QUERY_LEN))}
              maxLength={MAX_QUERY_LEN}
              className="border border-line-input bg-black/60 py-2.5 px-4 text-[13px] outline-none focus:border-white/30 transition-colors placeholder:text-muted-low backdrop-blur-sm"
              style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)', width: 'clamp(180px, 22vw, 280px)' }}
            />

            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              {categories.map((c) => {
                const active = category === c
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    aria-pressed={active}
                    className="font-montserrat h-11 px-5 text-[12px] font-semibold border transition-[background-color,border-color,color] whitespace-nowrap flex-shrink-0 active:scale-95"
                    style={{
                      background: active ? 'var(--accent)' : 'rgba(0,0,0,0.5)',
                      borderColor: active ? 'var(--accent)' : 'rgba(255,255,255,0.18)',
                      color: 'var(--foreground)',
                    }}
                  >
                    {c === 'All Genres' ? t.store.filterAll.toUpperCase() : c.toUpperCase()}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary filter row */}
      <div className="w-full max-w-6xl px-6 sm:px-10 lg:px-16 py-4 flex flex-wrap items-center gap-2">
        <Select
          label="Filter by BPM range"
          value={bpmRange}
          onChange={setBpmRange}
          options={BPM_RANGES.map((r) => ({ value: r.label, label: r.label }))}
        />
        <Select
          label="Sort beats"
          value={sortBy}
          onChange={setSortBy}
          options={SORT_OPTIONS}
        />
        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          aria-pressed={favoritesOnly}
          className={`font-montserrat flex items-center gap-1.5 border h-11 px-3.5 text-[11px] font-medium transition-[background-color,border-color,color] flex-shrink-0 ${favoritesOnly ? 'bg-accent/10' : 'bg-transparent'}`}
          style={{
            borderColor: favoritesOnly ? 'var(--accent)' : 'var(--line-input)',
            color: favoritesOnly ? 'var(--accent)' : 'var(--muted-low)',
          }}
        >
          <Heart size={11} fill={favoritesOnly ? 'currentColor' : 'none'} aria-hidden="true" />
          {t.store.saved}
        </button>
        <p className="ml-auto text-[12px] shrink-0" style={{ color: 'var(--muted-low)', fontFamily: 'var(--font-inter)' }}>
          {filtered.length} {filtered.length !== 1 ? 'beats' : 'beat'}
        </p>
      </div>

      {/* Beat list */}
      <div className="w-full max-w-6xl px-6 sm:px-10 lg:px-16 pb-12">
        {filtered.length === 0 ? (
          <div
            role="status"
            aria-live="polite"
            className="flex h-40 items-center justify-center border border-line text-[13px]"
            style={{ color: 'var(--muted-low)', fontFamily: 'var(--font-inter)' }}
          >
            {t.store.noBeats}
          </div>
        ) : (
          <>
            <div className="relative border border-line overflow-hidden">
              <StoreAmbient />
              <div className="hidden sm:flex items-center gap-3 px-4 sm:px-10 py-3 border-b border-line bg-black">
                <span className="w-6 flex-shrink-0" />
                <span className="w-11 flex-shrink-0" />
                <span
                  className="font-montserrat flex-1 text-[10px] font-bold uppercase"
                  style={{ letterSpacing: '0.18em', color: 'var(--muted-low)' }}
                >
                  {t.store.tableTitle}
                </span>
                <span
                  className="font-montserrat hidden md:block text-[10px] font-bold uppercase text-center"
                  style={{ letterSpacing: '0.18em', color: 'var(--muted-low)', width: '200px' }}
                >
                  {t.store.tableGenre}
                </span>
                <span style={{ width: '160px' }} />
              </div>
              <div role="list" aria-label="Beat tracks">
                {(showAll ? filtered : filtered.slice(0, 10)).map((beat, i) => (
                  <BeatCard
                    key={beat.id}
                    beat={beat}
                    index={i + 1}
                    onBuyClick={handleBuyClick}
                  />
                ))}
              </div>
            </div>
            {!showAll && filtered.length > 10 && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setShowAll(true)}
                  aria-expanded={showAll}
                  aria-label={`Browse all tracks - ${filtered.length - 10} more`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-[13px] font-semibold text-foreground hover:border-white/40 hover:bg-white/5 transition-[border-color,background-color,transform] active:scale-95"
                >
                  {t.store.browseAll} ({filtered.length - 10} more)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <LicenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCheckout={handleModalCheckout}
      />
    </div>
  )
}