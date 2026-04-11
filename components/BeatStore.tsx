'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import BeatCard from './BeatCard'
import LicenseModal from './LicenseModal'
import { Beat, useCartStore, usePlayerStore, useFavoritesStore } from '@/lib/store'
import { Search, ChevronDown, Heart } from 'lucide-react'

const BPM_RANGES = [
  { label: 'All BPM', min: 0, max: Infinity },
  { label: '70–90', min: 70, max: 90 },
  { label: '90–110', min: 90, max: 110 },
  { label: '110–130', min: 110, max: 130 },
  { label: '130–150', min: 130, max: 150 },
  { label: '150+', min: 150, max: Infinity },
]

const MOODS = ['All Moods', 'Dark', 'Melodic', 'Hard', 'Chill', 'Aggressive', 'Emotional', 'Hype', 'Wavy']

const SORT_OPTIONS = [
  { value: 'default', label: 'Default List' },
  { value: 'relevance', label: 'Relevance' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
  { value: 'bpm_asc', label: 'BPM: Low → High' },
  { value: 'bpm_desc', label: 'BPM: High → Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
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
        className="w-full appearance-none border border-line-input bg-surface-1 py-2 pl-3.5 pr-8 text-[11px] font-medium outline-none transition-colors cursor-pointer hover:border-line-hover"
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
  const [category, setCategory] = useState('All Genres')
  const [bpmRange, setBpmRange] = useState('All BPM')
  const [mood, setMood] = useState('All Moods')

  const [sortBy, setSortBy] = useState('default')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [modalOpen, setModalOpen] = useState(false)
  const { licenseType, quantityTier, items, openCart } = useCartStore()
  const { ids: favoriteIds } = useFavoritesStore()
  const { setQueue } = usePlayerStore()

  useEffect(() => {
    setQueue(initialBeats)
  }, [initialBeats, setQueue])

  // Derive available genres from actual beat data.
  // Deduplicate case-insensitively so "trap" and "Trap" merge into one entry.
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
    const q = search.toLowerCase()

    let results = initialBeats.filter((b) => {
      if (favoritesOnly && !favoriteIds.includes(b.id)) return false
      if (category !== 'All Genres' && b.genre?.trim().toLowerCase() !== category.toLowerCase()) return false
      if (b.bpm < bpmOpt.min || b.bpm > bpmOpt.max) return false
      if (mood !== 'All Moods' && !b.tags.some((t) => t.toLowerCase() === mood.toLowerCase())) return false
      if (q && !(
        b.title.toLowerCase().includes(q) ||
        b.key.toLowerCase().includes(q) ||
        (b.subgenre ?? '').toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q))
      )) return false
      return true
    })

    switch (sortBy) {
      case 'az': results = [...results].sort((a, b) => a.title.localeCompare(b.title)); break
      case 'za': results = [...results].sort((a, b) => b.title.localeCompare(a.title)); break
      case 'bpm_asc': results = [...results].sort((a, b) => a.bpm - b.bpm); break
      case 'bpm_desc': results = [...results].sort((a, b) => b.bpm - a.bpm); break
      case 'newest': results = [...results].sort((a, b) => b.created_at.localeCompare(a.created_at)); break
      case 'oldest': results = [...results].sort((a, b) => a.created_at.localeCompare(b.created_at)); break
      // 'default' and 'relevance' keep original order (server returns newest first)
    }

    return results
  }, [initialBeats, category, bpmRange, mood, sortBy, search, favoritesOnly, favoriteIds])

  function handleModalCheckout() {
    setModalOpen(false)
    openCart()
  }

  return (
    <div className="max-w-6xl mx-auto overflow-x-hidden px-6 sm:px-10 lg:px-16 py-12">
      {/* Header */}
      <div className="mb-10">
        <p
          className="text-[11px] font-bold uppercase mb-3"
          style={{ letterSpacing: '0.28em', color: 'var(--muted-low)', fontFamily: 'var(--font-montserrat)' }}
        >
          Full Catalog
        </p>
        <div className="flex items-end justify-between">
          <h1
            className="font-display uppercase leading-none"
            style={{ fontSize: 'clamp(52px, 8vw, 96px)', color: 'var(--foreground)' }}
          >
            Beat Store.
          </h1>
          <p className="text-[12px] mb-1" style={{ color: 'var(--muted-low)', fontFamily: 'var(--font-inter)' }}>
            {initialBeats.length} beats
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-low)' }} aria-hidden="true" />
        <input
          type="text"
          aria-label="Search beats"
          placeholder="Search beats, keys, tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-line-input bg-surface-1 py-2.5 pl-10 pr-4 text-[13px] outline-none focus:border-line-hover transition-colors placeholder:text-muted-low"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
        />
      </div>

      {/* Filter dropdowns */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Select
          label="Filter by genre"
          value={category}
          onChange={setCategory}
          options={categories.map((c) => ({ value: c, label: c }))}
        />
        <Select
          label="Filter by BPM range"
          value={bpmRange}
          onChange={setBpmRange}
          options={BPM_RANGES.map((r) => ({ value: r.label, label: r.label }))}
        />
        <Select
          label="Filter by mood"
          value={mood}
          onChange={setMood}
          options={MOODS.map((m) => ({ value: m, label: m }))}
        />
        <Select
          label="Sort beats"
          value={sortBy}
          onChange={setSortBy}
          options={SORT_OPTIONS}
        />
        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className="flex items-center gap-1.5 border px-3.5 py-2 text-[11px] font-medium transition-all flex-shrink-0"
          style={{
            borderColor: favoritesOnly ? 'var(--danger)' : 'var(--line-input)',
            background: favoritesOnly ? 'rgba(224,31,31,0.1)' : 'var(--surface-1)',
            color: favoritesOnly ? 'var(--danger)' : 'var(--muted-low)',
            fontFamily: 'var(--font-montserrat)',
          }}
        >
          <Heart size={11} fill={favoritesOnly ? 'currentColor' : 'none'} />
          Favorites
        </button>
      </div>

      {/* Beat list */}
      {filtered.length === 0 ? (
        <div
          className="flex h-40 items-center justify-center border border-line text-[13px]"
          style={{ color: 'var(--muted-low)', fontFamily: 'var(--font-inter)' }}
        >
          No beats found. Try a different filter.
        </div>
      ) : (
        <div className="border border-line">
          {/* Table header */}
          <div className="hidden sm:flex items-center gap-3 px-4 sm:px-10 py-3 border-b border-line bg-black">
            <span className="w-6 flex-shrink-0" />
            <span className="w-11 flex-shrink-0" />
            <span
              className="flex-1 text-[10px] font-bold uppercase"
              style={{ letterSpacing: '0.18em', color: 'var(--muted-low)', fontFamily: 'var(--font-montserrat)' }}
            >
              Title
            </span>
            <span
              className="hidden md:block text-[10px] font-bold uppercase text-center"
              style={{ letterSpacing: '0.18em', color: 'var(--muted-low)', fontFamily: 'var(--font-montserrat)', width: '200px' }}
            >
              Genre
            </span>
            <span style={{ width: '160px' }} />
          </div>
          {filtered.map((beat, i) => (
            <BeatCard
              key={beat.id}
              beat={beat}
              index={i + 1}
              onBuyClick={(_beat) => setModalOpen(true)}
            />
          ))}
        </div>
      )}

      <LicenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCheckout={handleModalCheckout}
      />
    </div>
  )
}
