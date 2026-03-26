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
        className="w-full appearance-none rounded-sm border border-[#2a2a2a] bg-[#111] py-2 pl-3 pr-8 text-xs font-medium text-zinc-300 outline-none focus:border-zinc-500 transition-colors cursor-pointer hover:border-zinc-600"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
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
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black text-white sm:text-3xl">Beat Store</h1>
        <p className="mt-1 text-sm text-zinc-500">{initialBeats.length} beats available</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search beats, keys, tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors"
        />
      </div>

      {/* Filter dropdowns */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
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
          className={`flex items-center gap-1.5 rounded-sm border px-3 py-2 text-xs font-semibold transition-colors flex-shrink-0 ${
            favoritesOnly
              ? 'border-red-500/40 bg-red-500/10 text-red-400'
              : 'border-[#2a2a2a] text-zinc-400 hover:border-zinc-500 hover:text-white'
          }`}
        >
          <Heart size={12} fill={favoritesOnly ? 'currentColor' : 'none'} />
          Favorites
        </button>
      </div>

      {/* Beat list */}
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-[#1a1a1a] text-zinc-500 text-sm">
          No beats found. Try a different filter.
        </div>
      ) : (
        <div className="rounded-xl border border-[#1a1a1a] overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 border-b border-[#1a1a1a] bg-[#0d0d0d]">
            <span className="w-7 flex-shrink-0" />
            <span className="w-9 flex-shrink-0" />
            <span className="w-10 flex-shrink-0" />
            <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Title
            </span>
            <span className="hidden lg:block text-[10px] font-bold uppercase tracking-widest text-zinc-600 w-24">
              Tags
            </span>
            <span className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-zinc-600 w-20">
              Genre
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 w-16 text-right">
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
