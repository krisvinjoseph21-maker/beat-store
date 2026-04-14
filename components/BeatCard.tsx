'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Heart, Play, Pause, ShoppingCart } from 'lucide-react'
import { Beat, usePlayerStore, useCartStore, useFavoritesStore } from '@/lib/store'
import ShareButton from './ShareButton'
import WaveformVisualizer from './WaveformVisualizer'
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
  const [heartPlaying, setHeartPlaying] = useState(false)
  const [showCheckAnim, setShowCheckAnim] = useState(false)
  const prevInCartRef = useRef(false)
  useEffect(() => { setMounted(true) }, [])

  const favorited     = mounted && isFavorited(beat.id)
  const isThisActive  = currentBeat?.id === beat.id
  const isThisPlaying = isThisActive && isPlaying
  const inCart        = mounted && isInCart(beat.id)

  useEffect(() => {
    if (inCart && !prevInCartRef.current) setShowCheckAnim(true)
    prevInCartRef.current = inCart
  }, [inCart])
  const hasAudio      = !!beat.preview_url
  const isNew         = beat.created_at &&
    Date.now() - new Date(beat.created_at).getTime() < 7 * 24 * 60 * 60 * 1000

  const progressPct = isThisActive && duration > 0
    ? Math.min((progress / duration) * 100, 100)
    : 0

  function handlePlay() {
    if (!hasAudio) return
    if (currentBeat?.id === beat.id) togglePlay()
    else { setCurrentBeat(beat); setPlaying(true) }
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation()
    addBeat(beat)
    onBuyClick(beat)
  }

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    if (!favorited) setHeartPlaying(true)
    toggleFavorite(beat.id)
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
      <div className="bg-black transition-colors duration-150 border-b border-line relative hover:bg-surface-2 cursor-pointer">

        {/* Expand/collapse button — fills the row behind all content. Real <button>, no nested-button violation. */}
        <button
          className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-inset"
          onClick={() => setLicenseOpen(o => !o)}
          aria-expanded={licenseOpen}
          aria-label={`${beat.title} — ${licenseOpen ? 'close' : 'open'} license options`}
        />

        {isThisActive && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] z-10 pointer-events-none" style={{ background: 'var(--accent)' }} />
        )}

        {/* Frequency visualiser — absolutely positioned at row bottom */}
        {isThisActive && (
          <WaveformVisualizer progressPct={progressPct} isPlaying={isThisPlaying} />
        )}

        {/* Content row — z-10 sits above the expand button; inner buttons capture their own clicks without stopPropagation */}
        <div className="relative z-10 flex flex-row items-center w-full px-4 sm:px-10" style={{ color: 'var(--foreground)', gap: '12px', paddingTop: '18px', paddingBottom: '18px' }}>

          {/* Track number */}
          <div
            className="text-center shrink-0 select-none tabular-nums"
            style={{ width: '24px', fontSize: '12px', color: isThisPlaying ? 'var(--accent)' : 'var(--muted-low)', fontFamily: 'var(--font-inter)' }}
            aria-hidden="true"
          >
            {isThisPlaying ? '♪' : String(index).padStart(2, '0')}
          </div>

          {/* Play button */}
          <button
            onClick={handlePlay}
            disabled={!hasAudio}
            aria-label={isThisPlaying ? 'Pause' : 'Play'}
            className="rounded-full bg-line flex items-center justify-center shrink-0 hover:bg-line-mid active:scale-90 transition-all duration-100 disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ width: '44px', height: '44px' }}
          >
            {isThisPlaying
              ? <Pause size={14} fill="var(--accent)" stroke="none" aria-hidden="true" />
              : <Play size={14} fill="var(--muted-low)" stroke="none" style={{ marginLeft: '2px' }} aria-hidden="true" />
            }
          </button>

          {/* Track info */}
          <div className="flex-1 flex flex-col justify-center mr-2 sm:mr-8 min-w-0">
            <div className="flex items-baseline gap-2" style={{ marginBottom: '4px' }}>
              <h3
                className="leading-tight truncate"
                style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}
                title={beat.title}
              >
                {beat.title}
              </h3>
              {isNew && (
                <span
                  className="text-[9px] font-bold uppercase tracking-wider shrink-0"
                  style={{ color: 'var(--accent)', fontFamily: 'var(--font-montserrat)' }}
                >
                  new
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {beat.subgenre && (
                <span style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '10px', color: 'var(--muted-low)' }}>
                  {beat.subgenre.toLowerCase()}
                </span>
              )}
              <span style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '10px', color: 'var(--muted-low)' }}>
                {beat.genre.toLowerCase()} type beat
              </span>
            </div>
            {/* BPM + key — visible on mobile where the metadata columns are hidden */}
            <div className="flex md:hidden gap-2 mt-0.5">
              <span style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '10px', color: 'var(--muted-low)' }}>
                {beat.bpm} BPM
              </span>
              <span style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '10px', color: 'var(--line-hover)' }}>·</span>
              <span style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '10px', color: 'var(--muted-low)' }}>
                {beat.key}
              </span>
            </div>
          </div>

          {/* BPM / Key / Genre */}
          <div className="hidden md:flex items-center shrink-0" style={{ gap: '20px' }}>
            <div className="text-center w-[32px]">
              <div style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', lineHeight: 1.2 }}>{beat.bpm}</div>
              <div style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '10px', color: 'var(--muted-low)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>BPM</div>
            </div>
            <div className="text-center w-[40px]">
              <div style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', lineHeight: 1.2 }}>{beat.key}</div>
              <div style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '10px', color: 'var(--muted-low)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>Key</div>
            </div>
            <div className="text-center" style={{ minWidth: '120px' }}>
              <div style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', lineHeight: 1.2 }}>{beat.genre}</div>
            </div>
          </div>

          {/* Price + CTA + icons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {inCart ? (
              <button
                onClick={handleAddToCart}
                aria-label={`${beat.title} — already in cart`}
                className="flex items-center gap-1.5 rounded-full h-[44px] sm:h-[30px] px-3 sm:px-4 whitespace-nowrap transition-all hover:opacity-80 shrink-0"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--foreground)', fontFamily: 'var(--font-montserrat)', fontSize: '12px', fontWeight: 600 }}
              >
                <Check
                  size={11}
                  className={showCheckAnim ? 'animate-check-in' : ''}
                  onAnimationEnd={() => setShowCheckAnim(false)}
                  aria-hidden="true"
                />
                In Cart
              </button>
            ) : (
              <button
                onClick={() => setLicenseOpen(o => !o)}
                aria-label={`Add ${beat.title} to cart`}
                className="flex items-center gap-1.5 rounded-full h-[44px] sm:h-[30px] px-3 sm:px-4 whitespace-nowrap transition-all hover:opacity-90 shrink-0"
                style={{ background: 'var(--white-hover)', color: 'var(--surface-1)', fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '12px', fontWeight: 600 }}
              >
                <ShoppingCart size={12} aria-hidden="true" />
                $34.99
              </button>
            )}

            <button
              onClick={handleFavorite}
              className="flex h-11 w-11 items-center justify-center hover:opacity-70 transition-opacity"
              aria-label={favorited ? 'Unfavorite' : 'Favorite'}
            >
              <Heart
                size={12}
                fill={favorited ? 'currentColor' : 'none'}
                className={`${favorited ? 'text-danger' : 'text-muted-low'} ${heartPlaying ? 'animate-heart-pop' : ''}`}
                onAnimationEnd={() => setHeartPlaying(false)}
                aria-hidden="true"
              />
            </button>

            <div>
              <ShareButton beatId={beat.id} />
            </div>
          </div>
        </div>

        {/* Progress bar — pointer-events-none so clicks pass through to the expand button */}
        <div className="relative z-10 h-[2px] bg-line w-full pointer-events-none" aria-hidden="true">
          {!isThisActive && (
            <div
              className="absolute left-0 top-0 h-full transition-all duration-100 ease-linear"
              style={{ width: `${progressPct}%`, background: 'rgba(255,255,255,0.3)' }}
            />
          )}
        </div>
      </div>

      {/* ── License drawer ───────────────────────────────────── */}
      <div className={`license-drawer-grid${licenseOpen ? ' is-open' : ''}`}>
        <div className="license-drawer-inner">
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface-2 border-b border-line p-4 sm:pl-[72px] sm:pr-10 sm:py-4"
        >
          {LICENSE_OPTIONS.map((opt, i) =>
            opt.id === null ? (
              <Link
                key={i}
                href="/about"
                aria-label="Inquire about exclusive license — opens contact page"
                className="bg-surface-1 border border-line flex flex-col hover:border-line-input hover:-translate-y-0.5 transition-all duration-200 min-h-[145px]"
                style={{ padding: '14px 16px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[11px] font-semibold uppercase mb-[6px]" style={{ letterSpacing: '1.1px', color: 'var(--muted-low)', fontFamily: 'var(--font-montserrat)', lineHeight: '16.5px' }}>
                  {opt.name}
                </div>
                <div className="font-display text-[20px] mb-[4px]" style={{ lineHeight: '30px', color: 'var(--foreground)' }}>
                  {opt.price}
                </div>
                <div className="text-[10px] mb-[12px]" style={{ color: 'var(--muted-low)', fontFamily: 'var(--font-montserrat)', lineHeight: '15px' }}>
                  {opt.desc}
                </div>
                <div
                  className="w-full border text-[10px] font-bold uppercase flex items-center justify-center px-4 transition-colors duration-200 hover:bg-white hover:text-black hover:border-white mt-auto"
                  style={{ height: '32px', borderColor: 'var(--foreground)', color: 'var(--foreground)', letterSpacing: '1px', fontFamily: 'var(--font-montserrat)' }}
                >
                  Inquire
                </div>
              </Link>
            ) : (
              <button
                key={i}
                onClick={(e) => handleSelectLicense(e, opt.id as 'standard' | 'unlimited')}
                className="bg-surface-1 border border-line flex flex-col text-left hover:border-line-input hover:-translate-y-0.5 transition-all duration-200 min-h-[145px]"
                style={{ padding: '14px 16px' }}
              >
                <div className="text-[11px] font-semibold uppercase mb-[6px]" style={{ letterSpacing: '1.1px', color: 'var(--muted-low)', fontFamily: 'var(--font-montserrat)', lineHeight: '16.5px' }}>
                  {opt.name}
                </div>
                <div className="font-display text-[20px] mb-[4px]" style={{ lineHeight: '30px', color: 'var(--foreground)' }}>
                  {opt.price}
                </div>
                <div className="text-[10px] mb-[12px]" style={{ color: 'var(--muted-low)', fontFamily: 'var(--font-montserrat)', lineHeight: '15px' }}>
                  {opt.desc}
                </div>
                <div
                  className="w-full border text-[10px] font-bold uppercase flex items-center justify-center px-4 transition-colors duration-200 hover:bg-white hover:text-black hover:border-white mt-auto"
                  style={{ height: '32px', borderColor: 'var(--foreground)', color: 'var(--foreground)', letterSpacing: '1px', fontFamily: 'var(--font-montserrat)' }}
                >
                  Select
                </div>
              </button>
            )
          )}
        </div>
        </div>
      </div>
    </div>
  )
}
