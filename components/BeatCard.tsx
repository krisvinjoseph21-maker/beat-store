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
  const { currentBeat, isPlaying, setCurrentBeat, togglePlay, setPlaying } =
    usePlayerStore()
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
  const isNew = beat.created_at && (Date.now() - new Date(beat.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000

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

  return (
    <div className={`border-b border-[#191919] transition-colors ${isThisActive ? 'bg-[#111]' : 'hover:bg-[#0e0e0e]'}`}>
      {/* ── Main row ── */}
      <div className="flex items-center gap-3 px-4 py-5 sm:px-6">

        {/* Row number */}
        <span className="hidden sm:flex w-7 flex-shrink-0 items-center justify-center text-xs font-mono text-zinc-700 select-none">
          {isThisPlaying
            ? <span className="text-white text-base leading-none">♪</span>
            : String(index).padStart(2, '0')}
        </span>

        {/* Play button */}
        <button
          onClick={handlePlay}
          disabled={!hasAudio}
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all ${
            !hasAudio
              ? 'bg-white/5 text-zinc-700 cursor-not-allowed'
              : isThisActive
              ? 'bg-white text-black scale-105'
              : 'bg-white/10 text-white hover:bg-white hover:text-black'
          }`}
          aria-label={isThisPlaying ? 'Pause' : 'Play'}
        >
          {isThisPlaying
            ? <Pause size={14} fill="currentColor" />
            : <Play size={14} fill="currentColor" className="ml-0.5" />}
        </button>

        {/* Info block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className={`truncate text-base font-black leading-tight transition-colors ${
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
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600">
              <span className="text-zinc-700 text-[10px] uppercase tracking-wide">BPM</span>
              <span className="text-zinc-400 font-semibold">{beat.bpm}</span>
            </span>
            <span className="text-zinc-800">·</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600">
              <span className="text-zinc-700 text-[10px] uppercase tracking-wide">Key</span>
              <span className="text-zinc-400 font-semibold">{beat.key}</span>
            </span>
            <span className="text-zinc-800">·</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600">
              <span className="text-zinc-700 text-[10px] uppercase tracking-wide">Genre</span>
              <span className="text-zinc-400 font-semibold">{beat.subgenre ?? beat.genre}</span>
            </span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Favorite */}
          <button
            onClick={() => toggleFavorite(beat.id)}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            aria-label={favorited ? 'Unfavorite' : 'Favorite'}
          >
            <Heart
              size={14}
              className={favorited ? 'text-red-500' : 'text-zinc-600 hover:text-red-400'}
              fill={favorited ? 'currentColor' : 'none'}
            />
          </button>

          {/* Share */}
          <div className="hidden sm:block">
            <ShareButton beatId={beat.id} />
          </div>

          {/* Price + cart button */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-xs text-zinc-600 font-medium">from $75</span>
            {inCart ? (
              <button
                className="flex h-9 items-center gap-1.5 rounded-sm bg-white/10 px-3 text-xs font-bold text-zinc-400"
                disabled
              >
                <Check size={12} /> In Cart
              </button>
            ) : (
              <button
                onClick={() => setLicenseOpen((o) => !o)}
                className="flex h-9 items-center gap-1.5 rounded-sm bg-white px-3 text-xs font-black text-black hover:bg-zinc-100 transition-colors"
              >
                Add to Cart
                {licenseOpen
                  ? <ChevronUp size={12} />
                  : <ChevronDown size={12} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── License panel ── */}
      {licenseOpen && !inCart && (
        <div className="border-t border-[#191919] grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#191919] px-0">
          {LICENSE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSelectLicense(opt.id)}
              className="group flex items-center justify-between bg-[#0d0d0d] hover:bg-[#111] px-6 sm:px-8 py-4 text-left transition-colors"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-black text-white group-hover:text-white">{opt.name}</span>
                <span className="text-xs text-zinc-600">{opt.desc}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-lg font-black text-white">{opt.price}</span>
                <span className="rounded-sm border border-[#2a2a2a] px-3 py-1.5 text-xs font-bold text-zinc-400 group-hover:border-zinc-500 group-hover:text-white transition-colors">
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
