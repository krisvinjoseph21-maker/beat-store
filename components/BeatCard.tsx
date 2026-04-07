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
    new Date(beat.created_at).getTime() > new Date('2026-04-08').getTime()

  const progressPct = isThisActive && duration > 0
    ? Math.min((progress / duration) * 100, 100)
    : 0

  function handlePlay() {
    if (!hasAudio) return
    const audioUrl = beat.preview_url ?? beat.file_url
    console.log('[BeatCard] playing:', beat.title, '| url:', audioUrl)
    if (currentBeat?.id === beat.id) togglePlay()
    else { setCurrentBeat(beat); setPlaying(true) }
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation()
    addBeat(beat)
    onBuyClick(beat)
  }

  function handleSelectLicense(e: React.MouseEvent, id: 'standard' | 'unlimited') {
    e.stopPropagation()
    setLicenseType(id)
    addBeat(beat)
    setLicenseOpen(false)
    onBuyClick(beat)
  }

  return (
    <div className="w-full">

      {/* ── Main row ─────────────────────────────────────────── */}
      <div
        className="bg-black transition-colors duration-150 border-b border-[#1a1a1a] relative hover:bg-[#0d0d0d] cursor-pointer"
        onClick={() => setLicenseOpen(o => !o)}
      >
        {isThisActive && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-white/25" />
        )}
        <div className="flex flex-row items-center w-full" style={{ color: '#f0ede8', gap: '16px', padding: '18px 40px' }}>

          {/* Track number */}
          <div
            className="text-center shrink-0 select-none tabular-nums"
            style={{ width: '24px', fontSize: '12px', color: '#444', fontFamily: 'var(--font-inter)' }}
          >
            {isThisPlaying ? '♪' : String(index).padStart(2, '0')}
          </div>

          {/* Play button */}
          <button
            onClick={(e) => { e.stopPropagation(); handlePlay() }}
            disabled={!hasAudio}
            aria-label={isThisPlaying ? 'Pause' : 'Play'}
            className="rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 hover:bg-[#252525] transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ width: '40px', height: '40px' }}
          >
            <span className="text-xs" style={{ marginLeft: isThisPlaying ? '0' : '2px', color: '#aaa' }}>
              {isThisPlaying ? '⏸' : '▶'}
            </span>
          </button>

          {/* Track info */}
          <div className="flex-1 flex flex-col justify-center mr-8">
            <div className="flex items-baseline gap-2" style={{ marginBottom: '4px' }}>
              <h3
                className="leading-tight break-words"
                style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '15px', fontWeight: 600, color: '#f0ede8', wordBreak: 'break-word' }}
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
            <div className="flex flex-wrap gap-2">
              {beat.subgenre && (
                <span style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '10px', color: '#555' }}>
                  {beat.subgenre.toLowerCase()}
                </span>
              )}
              <span style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '10px', color: '#555' }}>
                {beat.genre.toLowerCase()} type beat
              </span>
            </div>
          </div>

          {/* BPM / Key / Genre */}
          <div className="hidden md:flex items-center shrink-0" style={{ gap: '20px' }}>
            <div className="text-center w-[32px]">
              <div style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '13px', fontWeight: 500, color: '#f0ede8', lineHeight: 1.2 }}>{beat.bpm}</div>
              <div style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>BPM</div>
            </div>
            <div className="text-center w-[40px]">
              <div style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '13px', fontWeight: 500, color: '#f0ede8', lineHeight: 1.2 }}>{beat.key}</div>
              <div style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>Key</div>
            </div>
            <div className="text-center" style={{ minWidth: '120px' }}>
              <div style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '13px', fontWeight: 500, color: '#f0ede8', lineHeight: 1.2 }}>{beat.genre}</div>
              <div style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>Genre</div>
            </div>
          </div>

          {/* Price + CTA + icons */}
          <div className="flex items-center gap-2 shrink-0 pr-6" onClick={(e) => e.stopPropagation()}>
            <div
              className="whitespace-nowrap hidden sm:block"
              style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '14px', fontWeight: 600, color: '#f0ede8' }}
            >
              from $34.99
            </div>

            {inCart ? (
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-1 h-[30px] px-3 text-[10px] font-bold tracking-[1.1px] uppercase transition-all hover:opacity-80"
                style={{ color: '#f0ede8', fontFamily: 'var(--font-montserrat)', background: 'rgba(255,255,255,0.1)' }}
              >
                <Check size={10} /> In Cart
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setLicenseOpen(o => !o) }}
                className="text-white text-[10px] font-bold tracking-[1.1px] uppercase px-3 h-[30px] flex items-center justify-center whitespace-nowrap transition-all hover:opacity-90"
                style={{ background: '#e01f1f', fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '11px', fontWeight: 700 }}
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
      {licenseOpen && (
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
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[11px] font-semibold uppercase mb-[6px]" style={{ letterSpacing: '1.1px', color: '#888', fontFamily: 'var(--font-montserrat)', lineHeight: '16.5px' }}>
                  {opt.name}
                </div>
                <div className="font-display text-[20px] mb-[4px]" style={{ lineHeight: '30px', color: '#f0ede8' }}>
                  {opt.price}
                </div>
                <div className="text-[10px] mb-[12px]" style={{ color: '#555', fontFamily: 'var(--font-montserrat)', lineHeight: '15px' }}>
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
                onClick={(e) => handleSelectLicense(e, opt.id as 'standard' | 'unlimited')}
                className="bg-[#111] border border-[#1a1a1a] flex flex-col text-left hover:border-[#2a2a2a] transition-colors"
                style={{ height: '145px', padding: '14px 16px' }}
              >
                <div className="text-[11px] font-semibold uppercase mb-[6px]" style={{ letterSpacing: '1.1px', color: '#888', fontFamily: 'var(--font-montserrat)', lineHeight: '16.5px' }}>
                  {opt.name}
                </div>
                <div className="font-display text-[20px] mb-[4px]" style={{ lineHeight: '30px', color: '#f0ede8' }}>
                  {opt.price}
                </div>
                <div className="text-[10px] mb-[12px]" style={{ color: '#555', fontFamily: 'var(--font-montserrat)', lineHeight: '15px' }}>
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
