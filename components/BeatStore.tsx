'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative flex-1 min-w-[120px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-full border border-white/[0.08] bg-[#0a0a0a] py-2 pl-3.5 pr-8 text-[11px] font-medium text-[#6e6e73] outline-none focus:border-white/20 transition-colors cursor-pointer hover:border-white/15 hover:text-[#f5f5f7]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#1d1d1f]">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#424245]" />
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
  const [loading, setLoading] = useState(false)
  const { licenseType, quantityTier, items } = useCartStore()
  const { ids: favoriteIds } = useFavoritesStore()
  const { setQueue } = usePlayerStore()
  const router = useRouter()

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

  async function handleCheckout(discountCode?: string) {
    if (items.length === 0) {
      alert('Add some beats to your cart first!')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beatIds: items.map((i) => i.beat.id),
          licenseType,
          quantityTier,
          discountCode: discountCode || undefined,
        }),
      })
      const data = await res.json()
      if (data.url) router.push(data.url)
      else alert('Checkout failed. Please try again.')
    } catch {
      alert('Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#424245] mb-3">Browse</p>
        <div className="flex items-end justify-between">
          <h1 className="font-display text-5xl sm:text-6xl text-[#f5f5f7] uppercase leading-none">Beat Store.</h1>
          <p className="text-[12px] text-[#424245] mb-1">{initialBeats.length} beats</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#424245]" />
        <input
          type="text"
          placeholder="Search beats, keys, tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-white/[0.08] bg-[#0a0a0a] py-2.5 pl-10 pr-4 text-[13px] text-[#f5f5f7] placeholder-[#424245] outline-none focus:border-white/20 transition-colors"
        />
      </div>

      {/* Filter dropdowns */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Select
          value={category}
          onChange={setCategory}
          options={categories.map((c) => ({ value: c, label: c }))}
        />
        <Select
          value={bpmRange}
          onChange={setBpmRange}
          options={BPM_RANGES.map((r) => ({ value: r.label, label: r.label }))}
        />
        <Select
          value={mood}
          onChange={setMood}
          options={MOODS.map((m) => ({ value: m, label: m }))}
        />
        <Select
          value={sortBy}
          onChange={setSortBy}
          options={SORT_OPTIONS}
        />
        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[11px] font-medium transition-all flex-shrink-0 ${
            favoritesOnly
              ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : 'border-white/[0.08] text-[#6e6e73] hover:border-white/20 hover:text-[#f5f5f7]'
          }`}
        >
          <Heart size={11} fill={favoritesOnly ? 'currentColor' : 'none'} />
          Favorites
        </button>
      </div>

      {/* Beat list */}
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-white/[0.06] text-[#6e6e73] text-[13px]">
          No beats found. Try a different filter.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-[#050505]">
            <span className="w-6 flex-shrink-0" />
            <span className="w-9 flex-shrink-0" />
            <span className="flex-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#424245]">
              Title
            </span>
            <span className="hidden md:block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#424245] w-20 text-center">
              Genre
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#424245] w-16 text-right pr-2">
              &nbsp;
            </span>
          </div>
          {filtered.map((beat, i) => (
            <BeatCard
              key={beat.id}
              beat={beat}
              index={i + 1}
              onBuyClick={() => setModalOpen(true)}
            />
          ))}
        </div>
      )}

      <LicenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCheckout={(discountCode) => {
          setModalOpen(false)
          handleCheckout(discountCode)
        }}
      />
    </div>
  )
}
