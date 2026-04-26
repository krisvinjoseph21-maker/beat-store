'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { BadgeCheck, Check, Heart, Play, Pause, ShoppingCart } from 'lucide-react'
import { Beat, LicenseType, usePlayerStore, useCartStore, useFavoritesStore } from '@/lib/store'
import { sharedAudioElement } from '@/lib/player-ref'
import ShareButton from './ShareButton'
import { PRICES } from '@/lib/prices'
import { useT } from '@/lib/i18n'
import { trackAddToCart } from '@/lib/analytics'

const WaveformVisualizer = dynamic(() => import('./WaveformVisualizer'), { ssr: false })

interface Props {
  beat: Beat
  index: number
  onBuyClick: (beat: Beat) => void
}

function BeatCard({ beat, index, onBuyClick }: Props) {
  const t = useT()
  // Fine-grained player selector: inactive beats won't re-render on progress/duration changes
  const { isThisActive, isThisPlaying, progressPct, setCurrentBeat, togglePlay, setPlaying } =
    usePlayerStore(
      useShallow((s) => {
        const isActive = s.currentBeat?.id === beat.id
        return {
          isThisActive: isActive,
          isThisPlaying: isActive && s.isPlaying,
          progressPct: isActive && s.duration > 0 ? Math.min((s.progress / s.duration) * 100, 100) : 0,
          setCurrentBeat: s.setCurrentBeat,
          togglePlay: s.togglePlay,
          setPlaying: s.setPlaying,
        }
      })
    )
  const LICENSE_OPTIONS = [
    { id: 'standard' as const,  name: t.beatCard.mp3License,   desc: t.beatCard.mp3Desc },
    { id: 'premium' as const,   name: t.beatCard.wavLicense,   desc: t.beatCard.wavDesc },
    { id: 'unlimited' as const, name: t.beatCard.stemLicense,  desc: t.beatCard.stemDesc },
    { id: null,                 name: t.beatCard.exclusive,    desc: t.beatCard.exclusiveDesc },
  ]
  // Granular cart selector: only re-renders when this beat's cart status changes
  const isInCartRaw = useCartStore((s) => s.items.some((i) => i.beat.id === beat.id))
  const { addBeat, setLicenseType, openCart } = useCartStore(
    useShallow((s) => ({ addBeat: s.addBeat, setLicenseType: s.setLicenseType, openCart: s.openCart }))
  )
  // Granular favorites selector: only re-renders when this beat's favorite status changes
  const isFavoritedRaw = useFavoritesStore((s) => s.ids.includes(beat.id))
  const toggleFavorite = useFavoritesStore((s) => s.toggle)
  const [mounted, setMounted] = useState(false)
  const [licenseOpen, setLicenseOpen] = useState(false)
  const [heartPlaying, setHeartPlaying] = useState(false)
  const [showCheckAnim, setShowCheckAnim] = useState(false)
  const prevInCartRef = useRef(false)
  useEffect(() => { setMounted(true) }, [])

  const favorited = mounted && isFavoritedRaw
  const inCart    = mounted && isInCartRaw

  useEffect(() => {
    if (inCart && !prevInCartRef.current) setShowCheckAnim(true)
    prevInCartRef.current = inCart
  }, [inCart])
  const hasAudio = !!beat.preview_url
  const hasCredit = beat.tags.includes('verified-credit')
  const isNew = useMemo(
    () => beat.created_at && Date.now() - new Date(beat.created_at).getTime() < 7 * 24 * 60 * 60 * 1000,
    [beat.created_at]
  )

  function handlePlay() {
    if (!hasAudio) return
    if (isThisActive) {
      togglePlay()
    } else {
      // Call audio.src + play() synchronously within the gesture context so iOS Safari
      // doesn't block playback. BottomPlayer's useEffect detects the already-playing
      // src and skips the re-load.
      const audio = sharedAudioElement.current
      if (audio && beat.preview_url) {
        audio.src = beat.preview_url
        audio.play().catch(() => {})
      }
      setCurrentBeat(beat)
      setPlaying(true)
    }
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation()
    setLicenseType('standard')
    addBeat(beat)
    openCart()
    trackAddToCart({ id: beat.id, name: beat.title, category: beat.genre, price: PRICES.standard[1] })
  }

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    if (!favorited) setHeartPlaying(true)
    toggleFavorite(beat.id)
  }

  function handleSelectLicense(e: React.MouseEvent, id: LicenseType) {
    e.stopPropagation()
    setLicenseType(id)
    addBeat(beat)
    setLicenseOpen(false)
    openCart()
    trackAddToCart({ id: beat.id, name: beat.title, category: beat.genre, price: PRICES[id][1] })
  }

  return (
    <div className="w-full" role="listitem">

      {/* ── Main row ─────────────────────────────────────────── */}
      <div
        className="bg-black transition-colors duration-150 border-b border-line relative hover:bg-surface-2 cursor-pointer"
        onClick={() => setLicenseOpen(o => !o)}
      >

        {/* Keyboard expand target — native button activates on Space/Enter */}
        <button
          type="button"
          className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-inset"
          aria-expanded={licenseOpen}
          aria-label={`${beat.title} — ${licenseOpen ? 'close' : 'open'} license options`}
          onClick={(e) => { e.stopPropagation(); setLicenseOpen(o => !o) }}
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
            aria-label={isThisPlaying ? `Pause ${beat.title}` : `Play ${beat.title}`}
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
                className="font-montserrat leading-tight truncate"
                style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}
                title={beat.title}
              >
                {beat.title}
              </h3>
              {isNew && (
                <span
                  className="font-montserrat text-[9px] font-bold uppercase tracking-wider shrink-0"
                  style={{ color: 'var(--accent)' }}
                >
                  {t.beatCard.new}
                </span>
              )}
              {hasCredit && (
                <span
                  className="inline-flex items-center gap-1 shrink-0"
                  title="Verified placement credit"
                  aria-label="Verified placement credit"
                >
                  <BadgeCheck size={11} style={{ color: 'var(--accent)' }} aria-hidden="true" />
                  <span
                    className="font-montserrat text-[9px] font-semibold uppercase"
                    style={{ letterSpacing: '0.12em', color: 'var(--accent)' }}
                  >
                    Credit
                  </span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {beat.subgenre && (
                <span className="font-montserrat" style={{ fontSize: '10px', color: 'var(--muted-low)' }}>
                  {beat.subgenre.toLowerCase()}
                </span>
              )}
              <span className="font-montserrat" style={{ fontSize: '10px', color: 'var(--muted-low)' }}>
                {beat.genre.toLowerCase()} {t.beatCard.typeBeat}
              </span>
            </div>
            {/* BPM + key — visible on mobile where the metadata columns are hidden */}
            <div className="flex md:hidden gap-2 mt-0.5">
              <span className="font-montserrat" style={{ fontSize: '10px', color: 'var(--muted-low)' }}>
                {beat.bpm} BPM
              </span>
              <span className="font-montserrat" style={{ fontSize: '10px', color: 'var(--line-hover)' }}>·</span>
              <span className="font-montserrat" style={{ fontSize: '10px', color: 'var(--muted-low)' }}>
                {beat.key}
              </span>
            </div>
          </div>

          {/* BPM / Key / Genre */}
          <div className="hidden md:flex items-center shrink-0" style={{ gap: '20px' }}>
            <div className="text-center w-[32px]">
              <div className="font-montserrat" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', lineHeight: 1.2 }}>{beat.bpm}</div>
              <div className="font-montserrat" style={{ fontSize: '10px', color: 'var(--muted-low)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>BPM</div>
            </div>
            <div className="text-center w-[40px]">
              <div className="font-montserrat" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', lineHeight: 1.2 }}>{beat.key}</div>
              <div className="font-montserrat" style={{ fontSize: '10px', color: 'var(--muted-low)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>Key</div>
            </div>
            <div className="text-center w-[120px]">
              <div className="font-montserrat truncate" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', lineHeight: 1.2 }} title={beat.genre}>{beat.genre}</div>
            </div>
          </div>

          {/* Price + CTA + icons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="shrink-0 min-w-[96px] max-w-[148px]">
              {inCart ? (
                <button
                  onClick={(e) => { e.stopPropagation(); openCart() }}
                  aria-label={`${beat.title} — already in cart, click to view cart`}
                  className="font-montserrat w-full flex items-center justify-center gap-1.5 h-[44px] sm:h-[40px] whitespace-nowrap transition-opacity hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--foreground)', fontSize: '12px', fontWeight: 600 }}
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
                  className="font-montserrat w-full flex items-center justify-center gap-1.5 h-[44px] sm:h-[40px] whitespace-nowrap transition-opacity hover:opacity-90"
                  style={{ background: 'var(--white-hover)', color: 'var(--surface-1)', fontSize: '12px', fontWeight: 600 }}
                >
                  <ShoppingCart size={12} aria-hidden="true" />
                  From ${PRICES.standard[1]}
                </button>
              )}
            </div>

            <button
              onClick={handleFavorite}
              className="flex h-11 w-11 items-center justify-center hover:opacity-70 transition-opacity"
              aria-label={favorited ? `Remove ${beat.title} from favorites` : `Add ${beat.title} to favorites`}
            >
              <Heart
                size={12}
                fill={favorited ? 'currentColor' : 'none'}
                className={`${favorited ? 'text-accent' : 'text-muted-low'} ${heartPlaying ? 'animate-heart-pop' : ''}`}
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

      <span className="sr-only" role="status" aria-live="polite">
        {licenseOpen ? `${beat.title} license options expanded` : ''}
      </span>

      {/* ── License drawer ───────────────────────────────────── */}
      <div className={`license-drawer-grid${licenseOpen ? ' is-open' : ''}`}>
        <div className="license-drawer-inner" inert={!licenseOpen}>
          <div className="bg-surface-2 border-b border-line px-4 sm:pl-[72px] sm:pr-10 py-3">
            {/* Column headers — desktop only */}
            <div className="hidden sm:grid grid-cols-4 gap-px mb-px">
              {([t.beatCard.mp3License, t.beatCard.wavLicense, t.beatCard.stemLicense, t.beatCard.exclusive]).map((label) => (
                <div key={label} className="font-montserrat px-4 py-2 text-[9px] font-semibold uppercase text-muted-low"
                  style={{ letterSpacing: '0.18em' }}>
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
                      <div className="font-montserrat text-[10px] text-muted-low sm:hidden mb-1">{opt.name}</div>
                      <div className="font-montserrat text-[11px] text-muted-low">{opt.desc}</div>
                    </div>
                    <span className="font-montserrat mt-3 text-[11px] font-semibold text-foreground group-hover:text-accent transition-colors">
                      {t.beat.inquire}
                    </span>
                  </Link>
                ) : (
                  <button
                    key={i}
                    onClick={(e) => handleSelectLicense(e, opt.id as LicenseType)}
                    className="bg-surface-2 flex flex-col justify-between p-4 text-left hover:bg-surface-1 transition-colors duration-150 group min-h-[88px]"
                  >
                    <div>
                      <div className="font-montserrat text-[10px] text-muted-low sm:hidden mb-1">{opt.name}</div>
                      <div className="font-montserrat text-[11px] text-muted-low">{opt.desc}</div>
                    </div>
                    <span className="font-montserrat mt-3 text-[11px] font-semibold text-foreground group-hover:text-accent transition-colors">
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

export default memo(BeatCard)
