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

// User's 4 license tiers — prices from licensing page
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

      {/* ── Main row ──────────────────────────────────────────── */}
      <div
        onClick={!inCart ? () => setLicenseOpen(o => !o) : undefined}
        className={`bg-[#111111] transition-colors duration-200 ${!inCart ? 'cursor-pointer hover:bg-[#161616]' : ''}`}
        style={{ borderLeft: `3px solid ${isThisActive ? 'rgba(255,255,255,0.25)' : 'transparent'}` }}
      >
        <div
          className="flex flex-row items-center gap-5 px-6 py-[20px]"
          style={{ color: '#f0ede8' }}
        >
          {/* Track number */}
          <div
            className="font-display text-xs w-6 text-center shrink-0 select-none"
            style={{ color: '#444' }}
          >
            {isThisPlaying ? '♪' : String(index).padStart(2, '0')}
          </div>

          {/* Play button */}
          <button
            onClick={(e) => { e.stopPropagation(); handlePlay() }}
            disabled={!hasAudio}
            aria-label={isThisPlaying ? 'Pause' : 'Play'}
            className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 hover:bg-[#252525] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="text-xs" style={{ marginLeft: isThisPlaying ? '0' : '2px' }}>
              {isThisPlaying ? '⏸' : '▶'}
            </span>
          </button>

          {/* Track info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3
              className="text-[15px] font-semibold truncate leading-none mb-1"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {beat.title}
              {isNew && (
                <span className="ml-2 text-[9px] font-black uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded" style={{ color: '#888' }}>
                  New
                </span>
              )}
            </h3>
            <div className="flex flex-wrap gap-[6px]">
              {beat.subgenre && (
                <span
                  className="text-[10px] tracking-[0.6px]"
                  style={{ color: '#555', fontFamily: 'var(--font-inter)' }}
                >
                  {beat.subgenre}
                </span>
              )}
              <span
                className="text-[10px] tracking-[0.6px]"
                style={{ color: '#555', fontFamily: 'var(--font-inter)' }}
              >
                {beat.genre} Type Beat
              </span>
            </div>
          </div>

          {/* Metadata — BPM / Key / Genre */}
          <div className="hidden md:flex items-center gap-6 shrink-0">
            <div className="text-center w-[28px]">
              <div className="text-[13px] font-medium leading-tight">{beat.bpm}</div>
              <div className="text-[10px] tracking-wider uppercase leading-tight" style={{ color: '#555' }}>BPM</div>
            </div>
            <div className="text-center w-[46px]">
              <div className="text-[13px] font-medium leading-tight">{beat.key}</div>
              <div className="text-[10px] tracking-wider uppercase leading-tight" style={{ color: '#555' }}>Key</div>
            </div>
            <div className="text-center w-[85px]">
              <div className="text-[13px] font-medium leading-tight truncate">{beat.subgenre ?? beat.genre}</div>
              <div className="text-[10px] tracking-wider uppercase leading-tight" style={{ color: '#555' }}>Genre</div>
            </div>
          </div>

          {/* Price + CTA + extras */}
          <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div
              className="text-sm font-semibold whitespace-nowrap"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              from $34.99
            </div>

            {inCart ? (
              <button
                disabled
                className="flex items-center gap-1 h-[32.5px] px-4 bg-white/10 text-[11px] font-bold tracking-[1.1px] uppercase"
                style={{ color: '#555', fontFamily: 'var(--font-inter)' }}
              >
                <Check size={11} /> In Cart
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setLicenseOpen(o => !o) }}
                className="bg-white text-black text-[11px] font-bold tracking-[1.1px] uppercase px-4 h-[32.5px] flex items-center justify-center whitespace-nowrap hover:bg-zinc-100 transition-all"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Add to Cart
              </button>
            )}

            {/* Favorite */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(beat.id) }}
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              aria-label={favorited ? 'Unfavorite' : 'Favorite'}
            >
              <Heart
                size={13}
                className={favorited ? 'text-red-500' : 'hover:text-red-400'}
                style={{ color: favorited ? undefined : '#444' }}
                fill={favorited ? 'currentColor' : 'none'}
              />
            </button>

            {/* Share */}
            <div className="hidden sm:block">
              <ShareButton beatId={beat.id} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress bar ──────────────────────────────────────── */}
      <div className="h-[2px] bg-[#1a1a1a] w-full relative">
        <div
          className="absolute left-0 top-0 h-full bg-white/30 transition-all duration-100 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── License drawer ────────────────────────────────────── */}
      {licenseOpen && !inCart && (
        <div
          className="bg-[#0d0d0d] grid"
          style={{
            padding: '16px 40px 16px 100px',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
          }}
        >
          {LICENSE_OPTIONS.map((opt, i) =>
            opt.id === null ? (
              /* Exclusive — link to contact */
              <Link
                key={i}
                href="/about"
                className="bg-[#111] border border-[#1a1a1a] flex flex-col p-[14px_16px] hover:border-[#2a2a2a] transition-colors"
                style={{ height: '145px' }}
              >
                <div
                  className="text-[11px] font-semibold uppercase mb-[6px]"
                  style={{ letterSpacing: '1.1px', color: '#888', fontFamily: 'var(--font-montserrat)', lineHeight: '16.5px' }}
                >
                  {opt.name}
                </div>
                <div className="font-display text-[20px] mb-[4px]" style={{ lineHeight: '30px', color: '#f0ede8' }}>
                  {opt.price}
                </div>
                <div
                  className="text-[10px] mb-[12px]"
                  style={{ color: '#555', fontFamily: 'var(--font-montserrat)', lineHeight: '15px' }}
                >
                  {opt.desc}
                </div>
                <div
                  className="w-full border text-[10px] font-bold uppercase p-2 text-center transition-colors duration-200 hover:bg-[#e01f1f] hover:text-white hover:border-[#e01f1f] mt-auto"
                  style={{ height: '32px', borderColor: '#e01f1f', color: '#e01f1f', letterSpacing: '1px', fontFamily: 'var(--font-montserrat)' }}
                >
                  Contact
                </div>
              </Link>
            ) : (
              /* Standard / Unlimited */
              <button
                key={i}
                onClick={() => handleSelectLicense(opt.id as 'standard' | 'unlimited')}
                className="bg-[#111] border border-[#1a1a1a] flex flex-col p-[14px_16px] text-left hover:border-[#2a2a2a] transition-colors"
                style={{ height: '145px' }}
              >
                <div
                  className="text-[11px] font-semibold uppercase mb-[6px]"
                  style={{ letterSpacing: '1.1px', color: '#888', fontFamily: 'var(--font-montserrat)', lineHeight: '16.5px' }}
                >
                  {opt.name}
                </div>
                <div className="font-display text-[20px] mb-[4px]" style={{ lineHeight: '30px', color: '#f0ede8' }}>
                  {opt.price}
                </div>
                <div
                  className="text-[10px] mb-[12px]"
                  style={{ color: '#555', fontFamily: 'var(--font-montserrat)', lineHeight: '15px' }}
                >
                  {opt.desc}
                </div>
                <div
                  className="w-full border text-[10px] font-bold uppercase p-2 text-center transition-colors duration-200 hover:bg-[#e01f1f] hover:text-white hover:border-[#e01f1f] mt-auto"
                  style={{ height: '32px', borderColor: '#e01f1f', color: '#e01f1f', letterSpacing: '1px', fontFamily: 'var(--font-montserrat)' }}
                >
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
