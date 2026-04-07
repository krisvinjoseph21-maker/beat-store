'use client'

import { useEffect, useState } from 'react'
import { Check, Heart } from 'lucide-react'
import { Beat, usePlayerStore, useCartStore, useFavoritesStore } from '@/lib/store'
import ShareButton from './ShareButton'
import Link from 'next/link'

interface Props {
  beat: Beat
  index: number
  onBuyClick: (beat: Beat) => void
}

const LICENSE_OPTIONS = [
  { id: 'standard' as const, name: 'MP3 License',  price: '$34.99',  desc: 'Non-exclusive · MP3'  },
  { id: 'standard' as const, name: 'WAV License',  price: '$59.99',  desc: 'Non-exclusive · WAV'  },
  { id: 'unlimited' as const,name: 'Stem License', price: '$99.99',  desc: 'Trackout stems'        },
  { id: null,                 name: 'Exclusive',    price: '$299.99', desc: 'Full ownership'        },
]

export default function BeatCard({ beat, index, onBuyClick }: Props) {
  const { currentBeat, isPlaying, progress, duration, setCurrentBeat, togglePlay, setPlaying } =
    usePlayerStore()
  const { isInCart, addBeat, setLicenseType } = useCartStore()
  const { toggle: toggleFavorite, isFavorited } = useFavoritesStore()
  const [mounted, setMounted] = useState(false)
  const [licenseOpen, setLicenseOpen] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const favorited    = mounted && isFavorited(beat.id)
  const isThisActive = currentBeat?.id === beat.id
  const isThisPlaying= isThisActive && isPlaying
  const inCart       = mounted && isInCart(beat.id)
  const hasAudio     = !!(beat.preview_url ?? beat.file_url)
  const isNew        = beat.created_at &&
    Date.now() - new Date(beat.created_at).getTime() < 7 * 24 * 60 * 60 * 1000

  const progressPct  = isThisActive && duration > 0
    ? Math.min((progress / duration) * 100, 100)
    : 0

  function handlePlay() {
    if (!hasAudio) return
    if (currentBeat?.id === beat.id) togglePlay()
    else { setCurrentBeat(beat); setPlaying(true) }
  }

  function handleSelectLicense(id: 'standard' | 'unlimited') {
    setLicenseType(id)
    addBeat(beat)
    setLicenseOpen(false)
    onBuyClick(beat)
  }

  return (
    <div className="w-full relative">

      {/* ── Main row ──────────────────────────────────────── */}
      <div
        onClick={!inCart ? () => setLicenseOpen(o => !o) : undefined}
        className={`bg-[#0a0a0a] transition-colors duration-150 ${!inCart ? 'cursor-pointer hover:bg-[#111]' : ''}`}
        style={{
          borderLeft: `2px solid ${isThisActive ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
        }}
      >
        <div className="flex flex-row items-center gap-4 px-5 py-5" style={{ color: '#f5f5f7' }}>

          {/* Track number */}
          <div className="text-[11px] font-medium w-6 text-center shrink-0 select-none text-[#424245]">
            {isThisPlaying ? '♪' : String(index).padStart(2, '0')}
          </div>

          {/* Play button */}
          <button
            onClick={(e) => { e.stopPropagation(); handlePlay() }}
            disabled={!hasAudio}
            aria-label={isThisPlaying ? 'Pause' : 'Play'}
            className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="text-[11px]" style={{ marginLeft: isThisPlaying ? '0' : '1px' }}>
              {isThisPlaying ? '⏸' : '▶'}
            </span>
          </button>

          {/* Track info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="text-[14px] font-semibold truncate leading-none mb-1 text-[#f5f5f7]">
              {beat.title}
              {isNew && (
                <span className="ml-2 text-[8px] font-bold uppercase tracking-wider bg-white/[0.08] px-1.5 py-0.5 rounded-full text-[#6e6e73]">
                  New
                </span>
              )}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {beat.subgenre && (
                <span className="text-[10px] text-[#424245]">{beat.subgenre}</span>
              )}
              <span className="text-[10px] text-[#424245]">{beat.genre} Type Beat</span>
            </div>
          </div>

          {/* Metadata */}
          <div className="hidden md:flex items-center gap-6 shrink-0">
            <div className="text-center w-[30px]">
              <div className="text-[12px] font-medium text-[#f5f5f7]">{beat.bpm}</div>
              <div className="text-[9px] uppercase tracking-wider text-[#424245]">BPM</div>
            </div>
            <div className="text-center w-[46px]">
              <div className="text-[12px] font-medium text-[#f5f5f7]">{beat.key}</div>
              <div className="text-[9px] uppercase tracking-wider text-[#424245]">Key</div>
            </div>
            <div className="text-center w-[80px]">
              <div className="text-[12px] font-medium text-[#f5f5f7] truncate">{beat.subgenre ?? beat.genre}</div>
              <div className="text-[9px] uppercase tracking-wider text-[#424245]">Genre</div>
            </div>
          </div>

          {/* Price + CTA */}
          <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="text-[13px] font-semibold text-[#f5f5f7] whitespace-nowrap hidden sm:block">
              from $34.99
            </div>

            {inCart ? (
              <button
                disabled
                className="flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-white/[0.06] text-[10px] font-semibold text-[#424245] uppercase tracking-wide cursor-default"
              >
                <Check size={10} /> In Cart
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setLicenseOpen(o => !o) }}
                className="rounded-full bg-white text-black text-[10px] font-semibold uppercase tracking-wide px-3.5 h-8 flex items-center justify-center whitespace-nowrap hover:bg-[#e8e8ed] transition-all active:scale-95"
              >
                Add to Cart
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(beat.id) }}
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/[0.06] transition-colors"
              aria-label={favorited ? 'Unfavorite' : 'Favorite'}
            >
              <Heart
                size={12}
                fill={favorited ? 'currentColor' : 'none'}
                className={favorited ? 'text-red-500' : 'text-[#424245] hover:text-red-400'}
              />
            </button>

            <div className="hidden sm:block">
              <ShareButton beatId={beat.id} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress bar ──────────────────────────────────── */}
      <div className="h-px bg-white/[0.04] w-full relative">
        <div
          className="absolute left-0 top-0 h-full bg-white/20 transition-all duration-100 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── License drawer ────────────────────────────────── */}
      {licenseOpen && !inCart && (
        <div
          className="bg-[#050505] grid border-t border-white/[0.04]"
          style={{
            padding: '14px 24px 14px 88px',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
          }}
        >
          {LICENSE_OPTIONS.map((opt, i) =>
            opt.id === null ? (
              <Link
                key={i}
                href="/about"
                className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] flex flex-col p-4 hover:border-white/[0.15] hover:bg-[#111] transition-all"
                style={{ minHeight: '130px' }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6e6e73] mb-2">
                  {opt.name}
                </div>
                <div className="font-display text-[22px] text-[#f5f5f7] mb-1 leading-none">
                  {opt.price}
                </div>
                <div className="text-[10px] text-[#424245] mb-auto leading-relaxed">
                  {opt.desc}
                </div>
                <div className="mt-3 w-full rounded-full border border-white/[0.12] text-[10px] font-semibold text-[#6e6e73] flex items-center justify-center py-1.5 hover:bg-white hover:text-black hover:border-white transition-all">
                  Contact
                </div>
              </Link>
            ) : (
              <button
                key={i}
                onClick={() => handleSelectLicense(opt.id as 'standard' | 'unlimited')}
                className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] flex flex-col p-4 text-left hover:border-white/[0.15] hover:bg-[#111] transition-all"
                style={{ minHeight: '130px' }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6e6e73] mb-2">
                  {opt.name}
                </div>
                <div className="font-display text-[22px] text-[#f5f5f7] mb-1 leading-none">
                  {opt.price}
                </div>
                <div className="text-[10px] text-[#424245] mb-auto leading-relaxed">
                  {opt.desc}
                </div>
                <div className="mt-3 w-full rounded-full bg-white text-black text-[10px] font-semibold flex items-center justify-center py-1.5 hover:bg-[#e8e8ed] transition-all">
                  Select
                </div>
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
