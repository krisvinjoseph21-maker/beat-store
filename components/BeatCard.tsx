'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Heart, Play, Pause, ShoppingCart } from 'lucide-react'
import { Beat, usePlayerStore, useCartStore, useFavoritesStore } from '@/lib/store'
import ShareButton from './ShareButton'
import WaveformVisualizer from './WaveformVisualizer'
import Link from 'next/link'
import { PRICES } from '@/lib/prices'
import { useT } from '@/lib/i18n'

interface Props {
  beat: Beat
  index: number
  onBuyClick: (beat: Beat) => void
}

export default function BeatCard({ beat, index, onBuyClick }: Props) {
  const t = useT()
  const { currentBeat, isPlaying, progress, duration, setCurrentBeat, togglePlay, setPlaying } =
    usePlayerStore()
  const LICENSE_OPTIONS = [
    { id: 'standard' as const, name: t.beatCard.mp3License,   desc: t.beatCard.mp3Desc },
    { id: 'standard' as const, name: t.beatCard.wavLicense,   desc: t.beatCard.wavDesc },
    { id: 'unlimited' as const, name: t.beatCard.stemLicense, desc: t.beatCard.stemDesc },
    { id: null,                 name: t.beatCard.exclusive,    desc: t.beatCard.exclusiveDesc },
  ]
  const { isInCart, addBeat, setLicenseType, openCart } = useCartStore()
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
  const hasAudio = !!beat.preview_url
  const isNew = useMemo(
    () => beat.created_at && Date.now() - new Date(beat.created_at).getTime() < 7 * 24 * 60 * 60 * 1000,
    [beat.created_at]
  )

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
    setLicenseType('standard')
    addBeat(beat)
    openCart()
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
    openCart()
  }

  return (
    <div className="w-full">

      {/* ── Main row ─────────────────────────────────────────── */}
      <div
        className="bg-black transition-colors duration-150 border-b border-line relative hover:bg-surface-2 cursor-pointer"
        onClick={() => setLicenseOpen(o => !o)}
      >

        {/* Hidden focus target for keyboard users — click bubbles to the row div above */}
        <span
          className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-inset"
          aria-expanded={licenseOpen}
          aria-label={`${beat.title} — ${licenseOpen ? 'close' : 'open'} license options`}
          tabIndex={-1}
        />

        {isThisActive && (
          <div
            className={`absolute left-0 top-0 bottom-0 w-[3px] z-10 pointer-events-none${isThisPlaying ? ' accent-bar-playing' : ''}`}
            style={{ background: 'var(--accent)' }}
          />
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
            onClick={(e) => { e.stopPropagation(); handlePlay() }}
            disabled={!hasAudio}
            aria-label={isThisPlaying ? 'Pause' : 'Play'}
            className="rounded-full bg-line flex items-center justify-center shrink-0 hover:bg-line-mid active:scale-90 transition-[background-color,transform,opacity] duration-100 disabled:opacity-25 disabled:cursor-not-allowed"
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
                  {t.beatCard.new}
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
                {beat.genre.toLowerCase()} {t.beatCard.typeBeat}
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
            <div className="text-center w-[120px]">
              <div className="truncate" style={{ fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', lineHeight: 1.2 }} title={beat.genre}>{beat.genre}</div>
            </div>
          </div>

          {/* Price + CTA + icons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {inCart ? (
              <button
                onClick={(e) => { e.stopPropagation(); openCart() }}
                aria-label={`${beat.title} — already in cart, click to view cart`}
                className="flex items-center gap-1.5 h-[44px] sm:h-[40px] px-3 sm:px-4 whitespace-nowrap transition-opacity hover:opacity-80 shrink-0"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--foreground)', fontFamily: 'var(--font-montserrat)', fontSize: '12px', fontWeight: 600 }}
              >
                <Check
                  size={11}
                  className={showCheckAnim ? 'animate-check-in' : ''}
                  onAnimationEnd={() => setShowCheckAnim(false)}
                  aria-hidden="true"
                />
                {t.beat.inCart}
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                aria-label={`Add ${beat.title} to cart`}
                className="flex items-center gap-1.5 h-[44px] sm:h-[40px] px-3 sm:px-4 whitespace-nowrap transition-opacity hover:opacity-90 shrink-0"
                style={{ background: 'var(--white-hover)', color: 'var(--surface-1)', fontFamily: 'Montserrat, var(--font-montserrat), sans-serif', fontSize: '12px', fontWeight: 600 }}
              >
                <ShoppingCart size={12} aria-hidden="true" />
                From ${PRICES.standard[1]}
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

            <div onClick={(e) => e.stopPropagation()}>
              <ShareButton beatId={beat.id} />
            </div>
          </div>
        </div>

        {/* Progress bar — pointer-events-none so clicks pass through to the expand button */}
        <div className="relative z-10 h-[2px] bg-line w-full pointer-events-none" aria-hidden="true">
          {!isThisActive && (
            <div
              className="absolute left-0 top-0 h-full transition-[width] duration-100 ease-linear"
              style={{ width: `${progressPct}%`, background: 'rgba(255,255,255,0.3)' }}
            />
          )}
        </div>
      </div>

      {/* ── License drawer ───────────────────────────────────── */}
      <div className={`license-drawer-grid${licenseOpen ? ' is-open' : ''}`}>
        <div className="license-drawer-inner">
          <div className="bg-surface-2 border-b border-line px-4 sm:pl-[72px] sm:pr-10 py-3">
            {/* Column headers — desktop only */}
            <div className="hidden sm:grid grid-cols-4 gap-px mb-px">
              {([t.beatCard.mp3License, t.beatCard.wavLicense, t.beatCard.stemLicense, t.beatCard.exclusive]).map((label) => (
                <div key={label} className="px-4 py-2 text-[9px] font-semibold uppercase text-muted-low"
                  style={{ letterSpacing: '0.18em', fontFamily: 'var(--font-montserrat)' }}>
                  {label}
                </div>
              ))}
            </div>
            {/* Option rows */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line">
              {LICENSE_OPTIONS.map((opt, i) =>
                opt.id === null ? (
                  <Link
                    key={i}
                    href="/about"
                    aria-label="Inquire about exclusive license"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-surface-2 flex flex-col justify-between p-4 hover:bg-surface-1 transition-colors duration-150 group min-h-[88px]"
                  >
                    <div>
                      <div className="text-[10px] text-muted-low sm:hidden mb-1"
                        style={{ fontFamily: 'var(--font-montserrat)' }}>{opt.name}</div>
                      <div className="text-[11px] text-muted-low"
                        style={{ fontFamily: 'var(--font-montserrat)' }}>{opt.desc}</div>
                    </div>
                    <span className="mt-3 text-[11px] font-semibold text-foreground group-hover:text-accent transition-colors"
                      style={{ fontFamily: 'var(--font-montserrat)' }}>
                      {t.beat.inquire}
                    </span>
                  </Link>
                ) : (
                  <button
                    key={i}
                    onClick={(e) => handleSelectLicense(e, opt.id as 'standard' | 'unlimited')}
                    className="bg-surface-2 flex flex-col justify-between p-4 text-left hover:bg-surface-1 transition-colors duration-150 group min-h-[88px]"
                  >
                    <div>
                      <div className="text-[10px] text-muted-low sm:hidden mb-1"
                        style={{ fontFamily: 'var(--font-montserrat)' }}>{opt.name}</div>
                      <div className="text-[11px] text-muted-low"
                        style={{ fontFamily: 'var(--font-montserrat)' }}>{opt.desc}</div>
                    </div>
                    <span className="mt-3 text-[11px] font-semibold text-foreground group-hover:text-accent transition-colors"
                      style={{ fontFamily: 'var(--font-montserrat)' }}>
                      {t.beat.select}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
