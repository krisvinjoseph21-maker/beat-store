'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import BeatCard from './BeatCard'
import { Beat, useCartStore, usePlayerStore, useFavoritesStore } from '@/lib/store'
import { BadgeCheck, ChevronDown, Heart, Loader2, Sparkles } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { useRowSpring } from '@/lib/use-row-spring'

const LicenseModal = dynamic(() => import('./LicenseModal'), { ssr: false })
const StoreAmbient = dynamic(() => import('./StoreAmbient'), { ssr: false })

interface AiResult {
  id: string
  title: string
  reason: string
}

const PLACEMENT_CREDITS = [
  { artist: 'GloRilla',     detail: 'CMG / Interscope' },
  { artist: 'DeeBaby',      detail: '"Chicago Baby" · 500K+' },
  { artist: 'Paris Bryant', detail: '"A Crush"' },
  { artist: 'Shenseea',     detail: 'Interscope Records' },
  { artist: 'Seyi Vibez',   detail: 'Afrobeats' },
  { artist: 'Est Gee',      detail: 'Trap' },
]

const PLACEMENT_CREDITS_DOUBLED = [...PLACEMENT_CREDITS, ...PLACEMENT_CREDITS]

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
  const [aiMode, setAiMode] = useState(false)
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResults, setAiResults] = useState<AiResult[]>([])
  const [aiError, setAiError] = useState<string | null>(null)
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
  const listContainerRef = useRef<HTMLDivElement>(null)
  useRowSpring(listContainerRef)

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

  async function handleAiSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!aiQuery.trim() || aiLoading) return
    setAiLoading(true)
    setAiError(null)
    setAiResults([])
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery }),
      })
      const data = await res.json() as { recommendations?: AiResult[]; error?: string }
      if (!res.ok) {
        setAiError(data.error ?? 'Something went wrong.')
      } else {
        setAiResults(data.recommendations ?? [])
      }
    } catch {
      setAiError('Failed to reach AI service.')
    } finally {
      setAiLoading(false)
    }
  }

  function toggleAiMode() {
    setAiMode((prev) => !prev)
    setAiResults([])
    setAiError(null)
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
            className="mb-6 flex items-center gap-0 overflow-hidden border-y border-white/[0.07]"
            style={{ height: '30px' }}
            role="region"
            aria-label="Verified artist placements"
          >
            <div className="flex items-center gap-1.5 pr-4 shrink-0 border-r border-white/[0.07]">
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
                {PLACEMENT_CREDITS_DOUBLED.map(({ artist, detail }, i) => (
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
                    <span className="text-[8px] text-white/[0.15]">·</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Search + genre pills row */}
          <div className="flex flex-wrap items-center gap-3">
            {!aiMode && (
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
            )}
            <button
              onClick={toggleAiMode}
              aria-pressed={aiMode}
              className="font-montserrat flex items-center gap-1.5 border h-11 px-3.5 text-[11px] font-semibold transition-[background-color,border-color,color] whitespace-nowrap flex-shrink-0"
              style={{
                background: aiMode ? 'var(--accent)' : 'transparent',
                borderColor: aiMode ? 'var(--accent)' : 'var(--line-input)',
                color: aiMode ? '#000' : 'var(--muted-low)',
              }}
            >
              <Sparkles size={11} aria-hidden="true" />
              AI PICKS
            </button>

            <div className="relative min-w-0 flex-1">
              <div role="group" aria-label="Filter by genre" className="flex items-center gap-2 overflow-x-auto pb-0.5">
              {categories.map((c) => {
                const active = category === c
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    aria-pressed={active}
                    className="font-montserrat h-11 px-5 text-[12px] font-semibold border transition-[background-color,border-color,color] whitespace-nowrap flex-shrink-0 active:scale-95"
                    style={{
                      background: active ? 'var(--accent)' : 'var(--surface-overlay)',
                      borderColor: active ? 'var(--accent)' : 'var(--border-mid)',
                      color: 'var(--foreground)',
                    }}
                  >
                    {c === 'All Genres' ? t.store.filterAll.toUpperCase() : c.toUpperCase()}
                  </button>
                )
              })}
              </div>
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#0a0a0a] to-transparent" aria-hidden="true" />
            </div>
          </div>

          {/* AI query form */}
          {aiMode && (
            <form onSubmit={handleAiSubmit} className="mt-4 flex gap-3">
              <input
                type="text"
                placeholder="Describe the vibe you need — dark 808s, melodic, around 140 BPM..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value.slice(0, 500))}
                maxLength={500}
                autoFocus
                className="flex-1 border bg-black/60 py-2.5 px-4 text-[13px] outline-none transition-colors placeholder:text-muted-low backdrop-blur-sm"
                style={{
                  borderColor: 'rgba(245,158,11,0.4)',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-inter)',
                }}
              />
              <button
                type="submit"
                disabled={aiLoading || !aiQuery.trim()}
                className="font-montserrat flex items-center gap-1.5 border h-11 px-5 text-[11px] font-semibold whitespace-nowrap disabled:opacity-40 transition-opacity"
                style={{
                  borderColor: 'rgba(245,158,11,0.4)',
                  background: 'rgba(245,158,11,0.08)',
                  color: 'var(--foreground)',
                }}
              >
                {aiLoading
                  ? <><Loader2 size={11} className="animate-spin" aria-hidden="true" /> THINKING</>
                  : <><Sparkles size={11} aria-hidden="true" /> FIND BEATS</>
                }
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Secondary filter row */}
      <div className="w-full max-w-6xl px-6 sm:px-10 lg:px-16 py-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
        {/* Selects always share one row */}
        <div className="flex gap-2">
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
        </div>
        {/* Favorites toggle + beat count share the second row on mobile */}
        <div className="flex items-center gap-2">
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
          <p className="ml-auto sm:ml-0 text-[12px] shrink-0" style={{ color: 'var(--muted-low)', fontFamily: 'var(--font-inter)' }}>
            {filtered.length} {filtered.length !== 1 ? 'beats' : 'beat'}
          </p>
        </div>
      </div>

      {/* AI results */}
      {aiMode && (aiResults.length > 0 || aiError) && (
        <div className="w-full max-w-6xl px-6 sm:px-10 lg:px-16 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={12} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <span
              className="font-montserrat text-[10px] font-bold uppercase"
              style={{ letterSpacing: '0.18em', color: 'var(--accent)' }}
            >
              AI PICKS
            </span>
          </div>
          {aiError ? (
            <p
              className="text-[13px]"
              style={{ color: 'var(--muted-low)', fontFamily: 'var(--font-inter)' }}
            >
              {aiError}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {aiResults.map((r) => {
                const beat = initialBeats.find((b) => b.id === r.id)
                return (
                  <div
                    key={r.id}
                    className="flex flex-col gap-3 border p-5"
                    style={{
                      borderColor: 'rgba(245,158,11,0.25)',
                      background: 'rgba(245,158,11,0.03)',
                    }}
                  >
                    <p
                      className="font-display uppercase leading-tight"
                      style={{ fontSize: 'clamp(16px, 2vw, 22px)', color: 'var(--foreground)' }}
                    >
                      {r.title}
                    </p>
                    <p
                      className="text-[12px] italic flex-1"
                      style={{ color: 'var(--muted-low)', fontFamily: 'var(--font-inter)' }}
                    >
                      &ldquo;{r.reason}&rdquo;
                    </p>
                    {beat && (
                      <p
                        className="text-[11px]"
                        style={{ color: 'var(--muted-low)', fontFamily: 'var(--font-inter)' }}
                      >
                        {beat.bpm} BPM{beat.genre ? ` · ${beat.genre}` : ''}{beat.key ? ` · ${beat.key}` : ''}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

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
            <div ref={listContainerRef} className="relative border border-line overflow-hidden" style={{ perspective: '1200px' }}>
              <StoreAmbient />
              <div className="hidden sm:flex items-center gap-3 px-4 sm:px-10 py-3 border-b border-line bg-background">
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