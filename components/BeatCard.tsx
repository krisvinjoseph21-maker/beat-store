'use client'

import { useEffect, useState } from 'react'
import { Play, Pause, Check, Heart, ChevronDown, ChevronUp } from 'lucide-react'
import { Beat, usePlayerStore, useCartStore, useFavoritesStore } from '@/lib/store'
import ShareButton from './ShareButton'

interface Props {
  beat: Beat
  index: number
  onBuyClick: (beat: Beat) => void
}

const LICENSE_OPTIONS = [
  {
    id: 'standard' as const,
    name: 'Standard Lease',
    price: '$75',
    desc: 'Non-exclusive · MP3 + WAV',
  },
  {
    id: 'unlimited' as const,
    name: 'Unlimited Lease',
    price: '$150',
    desc: 'Non-exclusive · MP3 + WAV + Stems',
  },
]

export default function BeatCard({ beat, index, onBuyClick }: Props) {
  const { currentBeat, isPlaying, setCurrentBeat, togglePlay, setPlaying } = usePlayerStore()
  const { isInCart, addBeat, setLicenseType } = useCartStore()
  const { toggle: toggleFavorite, isFavorited } = useFavoritesStore()
  const [mounted, setMounted] = useState(false)
  const [licenseOpen, setLicenseOpen] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const favorited = mounted && isFavorited(beat.id)
  const isThisPlaying = currentBeat?.id === beat.id && isPlaying
  const isThisActive = currentBeat?.id === beat.id
  const inCart = mounted && isInCart(beat.id)
  const hasAudio = !!(beat.preview_url ?? beat.file_url)
  const isNew = beat.created_at &&
    Date.now() - new Date(beat.created_at).getTime() < 7 * 24 * 60 * 60 * 1000

  function handlePlay() {
    if (!hasAudio) return
    if (currentBeat?.id === beat.id) togglePlay()
    else { setCurrentBeat(beat); setPlaying(true) }
  }

  function handleSelectLicense(licenseId: 'standard' | 'unlimited') {
    setLicenseType(licenseId)
    addBeat(beat)
    setLicenseOpen(false)
    onBuyClick(beat)
  }

  const STATS = [
    { value: String(beat.bpm),            label: 'BPM'   },
    { value: beat.key,                     label: 'Key'   },
    { value: beat.subgenre ?? beat.genre,  label: 'Genre' },
  ]

  return (
    <div className={`border-b border-[#1a1a1a] transition-colors ${isThisActive ? 'bg-[#111]' : 'hover:bg-[#0d0d0d]'}`}>

      {/* ── Main row ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 sm:gap-5 px-4 sm:px-8 py-5 sm:py-6">

        {/* Row number */}
        <span className="hidden sm:block w-6 text-center text-xs font-mono text-zinc-700 select-none flex-shrink-0">
          {isThisPlaying ? '♪' : String(index).padStart(2, '0')}
        </span>

        {/* Play button */}
        <button
          onClick={handlePlay}
          disabled={!hasAudio}
          aria-label={isThisPlaying ? 'Pause' : 'Play'}
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all ${
            !hasAudio
              ? 'bg-white/5 text-zinc-700 cursor-not-allowed'
              : isThisActive
              ? 'bg-white text-black scale-105'
              : 'bg-white/10 text-white hover:bg-white hover:text-black'
          }`}
        >
          {isThisPlaying
            ? <Pause size={14} fill="currentColor" />
            : <Play  size={14} fill="currentColor" className="ml-0.5" />}
        </button>

        {/* Title + subgenre */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className={`truncate text-base sm:text-lg font-black leading-tight ${
              isThisActive ? 'text-white' : 'text-zinc-100'
            }`}>
              {beat.title}
            </p>
            {isNew && (
              <span className="flex-shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-zinc-400">
                New
              </span>
            )}
          </div>
          {beat.subgenre && (
            <p className="mt-0.5 text-xs text-zinc-600 truncate">{beat.subgenre}</p>
          )}
        </div>

        {/* Stats — value large / label small below */}
        <div className="hidden md:flex items-start gap-6 flex-shrink-0">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-sm font-black text-white leading-none">{value}</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-700">{label}</span>
            </div>
          ))}
        </div>

        {/* Price + cart button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden lg:inline text-xs text-zinc-600">from $75</span>
          {inCart ? (
            <button disabled className="flex h-9 items-center gap-1.5 rounded-sm bg-white/10 px-3 text-xs font-bold text-zinc-400">
              <Check size={12} /> In Cart
            </button>
          ) : (
            <button
              onClick={() => setLicenseOpen(o => !o)}
              className="flex h-9 items-center gap-1.5 rounded-sm bg-white px-4 text-xs font-black text-black hover:bg-zinc-100 transition-colors"
            >
              Add to Cart
              {licenseOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          )}
        </div>

        {/* Favorite + Share */}
        <div className="hidden sm:flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => toggleFavorite(beat.id)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label={favorited ? 'Unfavorite' : 'Favorite'}
          >
            <Heart
              size={14}
              className={favorited ? 'text-red-500' : 'text-zinc-600 hover:text-red-400'}
              fill={favorited ? 'currentColor' : 'none'}
            />
          </button>
          <ShareButton beatId={beat.id} />
        </div>
      </div>

      {/* ── License panel ────────────────────────────────── */}
      {licenseOpen && !inCart && (
        <div className="border-t border-[#1a1a1a] grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#161616]">
          {LICENSE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSelectLicense(opt.id)}
              className="group flex items-center justify-between bg-[#0c0c0c] hover:bg-[#111] px-6 sm:px-10 py-5 text-left transition-colors"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-black text-white">{opt.name}</span>
                <span className="text-xs text-zinc-600">{opt.desc}</span>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-xl font-black text-white">{opt.price}</span>
                <span className="rounded-sm border border-[#2a2a2a] px-3 py-1.5 text-xs font-bold text-zinc-500 group-hover:border-zinc-500 group-hover:text-white transition-colors">
                  Select
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
