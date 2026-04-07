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
  { id: 'standard' as const, name: 'MP3 License',  price: '$34.99',  desc: 'Non-exclusive · MP3' },
  { id: 'standard' as const, name: 'WAV License',  price: '$59.99',  desc: 'Non-exclusive · WAV' },
  { id: 'unlimited' as const,name: 'Stem License', price: '$99.99',  desc: 'Trackout stems'       },
  { id: null,                 name: 'Exclusive',    price: '$299.99', desc: 'Full ownership'       },
]

export default function BeatCard({ beat, index, onBuyClick }: Props) {
  const { currentBeat, isPlaying, progress, duration, setCurrentBeat, togglePlay, setPlaying } =
    usePlayerStore()
  const { isInCart, addBeat, setLicenseType } = useCartStore()
  const { toggle: toggleFavorite, isFavorited } = useFavoritesStore()
  const [mounted, setMounted] = useState(false)
  const [licenseOpen, setLicenseOpen] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const favorited     = mounted && isFavorited(beat.id)
  const isThisActive  = currentBeat?.id === beat.id
  const isThisPlaying = isThisActive && isPlaying
  const inCart        = mounted && isInCart(beat.id)
  const hasAudio      = !!(beat.preview_url ?? beat.file_url)
  const isNew         = beat.created_at &&
    new Date(beat.created_at).getTime() > new Date('2026-04-07').getTime()

  const progressPct = isThisActive && duration > 0
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
    <div className="w-full">

      {/* ── Main row ─────────────────────────────────────────── */}
      <div
        onClick={!inCart ? () => setLicenseOpen(o => !o) : undefined}
        className={`bg-black transition-colors duration-150 border-b border-[#1a1a1a] relative ${!inCart ? 'cursor-pointer hover:bg-[#0d0d0d]' : ''}`}
      >
        {/* Active indicator — absolute so it doesn't shift row content */}
        {isThisActive && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-white/25" />
        )}
        <div className="flex flex-row items-center gap-4 px-6 py-[13px]" style={{ color: '#f0ede8' }}>

          {/* Track number */}
          <div
            className="text-[10px] w-5 text-center shrink-0 select-none tabular-nums"
            style={{ color: '#3a3a3a', fontFamily: 'var(--font-inter)' }}
          >
            {isThisPlaying ? '♪' : String(index).padStart(2, '0')}
          </div>

          {/* Play button — bare icon, no circle */}
          <button
            onClick={(e) => { e.stopPropagation(); handlePlay() }}
            disabled={!hasAudio}
            aria-label={isThisPlaying ? 'Pause' : 'Play'}
            className="w-6 h-6 flex items-center justify-center shrink-0 hover:opacity-70 transition-opacity disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <span className="text-[10px]" style={{ marginLeft: isThisPlaying ? '0' : '1px', color: '#888' }}>
              {isThisPlaying ? '⏸' : '▶'}
            </span>
          </button>

          {/* Track info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-baseline gap-2 mb-[3px]">
              <h3
                className="text-[14px] font-extrabold truncate leading-none"
                style={{ fontFamily: 'var(--font-inter)', color: '#f0ede8' }}
              >
                {beat.title}
              </h3>
              {isNew && (
                <span
                  className="text-[9px] font-bold uppercase tracking-wider shrink-0"
                  style={{ color: '#555', fontFamily: 'var(--font-montserrat)' }}
                >
                  new
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-[5px]">
              {beat.subgenre && (
                <span className="text-[10px]" style={{ color: '#444', fontFamily: 'var(--font-inter)' }}>
                  {beat.subgenre.toLowerCase()}
                </span>
              )}
              <span className="text-[10px]" style={{ color: '#444', fontFamily: 'var(--font-inter)' }}>
                {beat.genre.toLowerCase()} type beat
              </span>
            </div>
          </div>

          {/* BPM / Key / Genre */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            <div className="text-center w-[32px]">
              <div className="text-[12px] font-semibold leading-tight" style={{ color: '#f0ede8' }}>{beat.bpm}</div>
              <div className="text-[8px] tracking-widest uppercase leading-tight mt-[2px]" style={{ color: '#444' }}>BPM</div>
            </div>
            <div className="text-center w-[40px]">
              <div className="text-[12px] font-semibold leading-tight" style={{ color: '#f0ede8' }}>{beat.key}</div>
              <div className="text-[8px] tracking-widest uppercase leading-tight mt-[2px]" style={{ color: '#444' }}>Key</div>
            </div>
            <div className="text-center w-[75px]">
              <div className="text-[12px] font-semibold leading-tight truncate" style={{ color: '#f0ede8' }}>{beat.subgenre ?? beat.genre}</div>
              <div className="text-[8px] tracking-widest uppercase leading-tight mt-[2px]" style={{ color: '#444' }}>Genre</div>
            </div>
          </div>

          {/* Price + CTA + icons */}
          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div
              className="text-[13px] font-bold whitespace-nowrap hidden sm:block"
              style={{ fontFamily: 'var(--font-inter)', color: '#f0ede8' }}
            >
              from $34.99
            </div>

            {inCart ? (
              <button
                disabled
                className="flex items-center gap-1 h-[30px] px-3 text-[10px] font-bold tracking-[1.1px] uppercase"
                style={{ color: '#555', fontFamily: 'var(--font-montserrat)', background: 'rgba(255,255,255,0.06)' }}
              >
                <Check size={10} /> In Cart
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setLicenseOpen(o => !o) }}
                className="text-white text-[10px] font-bold tracking-[1.1px] uppercase px-3 h-[30px] flex items-center justify-center whitespace-nowrap transition-all hover:opacity-90"
                style={{ background: '#e01f1f', fontFamily: 'var(--font-montserrat)' }}
              >
                Add to Cart
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(beat.id) }}
              className="flex h-7 w-7 items-center justify-center hover:opacity-70 transition-opacity"
              aria-label={favorited ? 'Unfavorite' : 'Favorite'}
            >
              <Heart
                size={12}
                fill={favorited ? 'currentColor' : 'none'}
                className={favorited ? 'text-red-500' : 'text-[#444]'}
              />
            </button>

            <div>
              <ShareButton beatId={beat.id} />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-[2px] bg-[#1a1a1a] w-full relative">
          <div
            className="absolute left-0 top-0 h-full transition-all duration-100 ease-linear"
            style={{ width: `${progressPct}%`, background: 'rgba(255,255,255,0.3)' }}
          />
        </div>
      </div>

      {/* ── License drawer ───────────────────────────────────── */}
      {licenseOpen && !inCart && (
        <div
          className="grid bg-[#0d0d0d] border-b border-[#1a1a1a]"
          style={{
            padding: '16px 40px 16px 100px',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
          }}
        >
          {LICENSE_OPTIONS.map((opt, i) =>
            opt.id === null ? (
              <Link
                key={i}
                href="/about"
                className="bg-[#111] border border-[#1a1a1a] flex flex-col hover:border-[#2a2a2a] transition-colors"
                style={{ height: '145px', padding: '14px 16px' }}
              >
                <div
                  className="text-[11px] font-semibold uppercase mb-[6px]"
                  style={{ letterSpacing: '1.1px', color: '#888', fontFamily: 'var(--font-montserrat)', lineHeight: '16.5px' }}
                >
                  {opt.name}
                </div>
                <div
                  className="font-display text-[20px] mb-[4px]"
                  style={{ lineHeight: '30px', color: '#f0ede8' }}
                >
                  {opt.price}
                </div>
                <div
                  className="text-[10px] mb-[12px]"
                  style={{ color: '#555', fontFamily: 'var(--font-montserrat)', lineHeight: '15px' }}
                >
                  {opt.desc}
                </div>
                <div
                  className="w-full border text-[10px] font-bold uppercase flex items-center justify-center transition-colors duration-200 hover:bg-[#e01f1f] hover:text-white hover:border-[#e01f1f] mt-auto"
                  style={{ height: '32px', borderColor: '#e01f1f', color: '#e01f1f', letterSpacing: '1px', fontFamily: 'var(--font-montserrat)' }}
                >
                  Contact
                </div>
              </Link>
            ) : (
              <button
                key={i}
                onClick={() => handleSelectLicense(opt.id as 'standard' | 'unlimited')}
                className="bg-[#111] border border-[#1a1a1a] flex flex-col text-left hover:border-[#2a2a2a] transition-colors"
                style={{ height: '145px', padding: '14px 16px' }}
              >
                <div
                  className="text-[11px] font-semibold uppercase mb-[6px]"
                  style={{ letterSpacing: '1.1px', color: '#888', fontFamily: 'var(--font-montserrat)', lineHeight: '16.5px' }}
                >
                  {opt.name}
                </div>
                <div
                  className="font-display text-[20px] mb-[4px]"
                  style={{ lineHeight: '30px', color: '#f0ede8' }}
                >
                  {opt.price}
                </div>
                <div
                  className="text-[10px] mb-[12px]"
                  style={{ color: '#555', fontFamily: 'var(--font-montserrat)', lineHeight: '15px' }}
                >
                  {opt.desc}
                </div>
                <div
                  className="w-full border text-[10px] font-bold uppercase flex items-center justify-center transition-colors duration-200 hover:bg-[#e01f1f] hover:text-white hover:border-[#e01f1f] mt-auto"
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
