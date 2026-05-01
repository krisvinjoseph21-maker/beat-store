'use client'

import { useState } from 'react'
import { Play, Pause, ShoppingCart, Check, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePlayerStore, useCartStore, type Beat, type LicenseType } from '@/lib/store'
import { sharedAudioElement } from '@/lib/player-ref'
import ShareButton from './ShareButton'
import { PRICES } from '@/lib/prices'
import { useT } from '@/lib/i18n'
import { trackAddToCart } from '@/lib/analytics'

export default function FeaturedTrack({ beat }: { beat: Beat }) {
  const t = useT()
  const { currentBeat, isPlaying, setCurrentBeat, togglePlay, setPlaying } = usePlayerStore()
  const { addBeat, openCart, isInCart } = useCartStore()
  const [licenseOpen, setLicenseOpen] = useState(false)

  const isThisPlaying = currentBeat?.id === beat.id && isPlaying
  const inCart = isInCart(beat.id)

  const LICENSE_OPTIONS = [
    { id: 'standard' as const,  name: t.beatCard.mp3License,  desc: t.beatCard.mp3Desc },
    { id: 'premium' as const,   name: t.beatCard.wavLicense,  desc: t.beatCard.wavDesc },
    { id: 'unlimited' as const, name: t.beatCard.stemLicense, desc: t.beatCard.stemDesc },
    { id: null,                 name: t.beatCard.exclusive,   desc: t.beatCard.exclusiveDesc },
  ]

  function handlePlay() {
    if (currentBeat?.id === beat.id) {
      togglePlay()
    } else {
      const audio = sharedAudioElement.current
      if (audio && beat.preview_url) {
        audio.src = beat.preview_url
        audio.play().catch(() => { setPlaying(false) })
      }
      setCurrentBeat(beat)
      setPlaying(true)
    }
  }

  function handleSelectLicense(id: LicenseType) {
    addBeat(beat, id)
    setLicenseOpen(false)
    openCart()
    trackAddToCart({ id: beat.id, name: beat.title, category: beat.genre, price: PRICES[id][1] })
  }

  return (
    <div className="w-full border-y border-line relative">
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] z-10 pointer-events-none${isThisPlaying ? ' accent-bar-playing' : ''}`}
        style={{ background: 'var(--accent)' }}
      />

      <div className="flex flex-col sm:flex-row">
        {/* Artwork */}
        <div className="w-full sm:w-44 h-36 sm:h-auto flex-shrink-0 relative overflow-hidden bg-surface-2">
          {beat.cover_url ? (
            <Image
              src={beat.cover_url}
              alt={`Cover art for ${beat.title}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 176px"
            />
          ) : null}
          {isThisPlaying && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex items-end gap-[3px] h-5">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="w-[3px] bg-accent accent-bar-playing rounded-sm"
                    style={{ height: `${40 + i * 15}%`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between px-5 py-5 sm:px-8 sm:py-6 gap-5 min-w-0">
          <div className="min-w-0">
            <p
              className="text-[9px] font-semibold uppercase mb-2"
              style={{ letterSpacing: '0.22em', fontFamily: 'var(--font-montserrat)', color: 'var(--accent)' }}
            >
              Featured
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground uppercase leading-none truncate mb-3">
              {beat.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-[11px] text-muted-low" style={{ fontFamily: 'var(--font-inter)' }}>
                {beat.bpm} BPM
              </span>
              <span className="text-[10px] text-line-hover" aria-hidden="true">·</span>
              <span className="text-[11px] text-muted-low" style={{ fontFamily: 'var(--font-inter)' }}>
                {beat.key}
              </span>
              {beat.subgenre && (
                <>
                  <span className="text-[10px] text-line-hover" aria-hidden="true">·</span>
                  <span className="text-[11px] text-muted-low" style={{ fontFamily: 'var(--font-inter)' }}>
                    {beat.subgenre}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePlay}
              disabled={!beat.preview_url}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-line hover:bg-line-mid transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              aria-label={isThisPlaying ? `Pause ${beat.title}` : `Play ${beat.title} preview`}
            >
              {isThisPlaying
                ? <Pause size={15} fill="var(--accent)" stroke="none" aria-hidden="true" />
                : <Play size={15} fill="var(--muted-low)" stroke="none" style={{ marginLeft: '2px' }} aria-hidden="true" />}
            </button>

            {inCart ? (
              <button
                onClick={openCart}
                aria-label={`${beat.title} — already in cart, click to view cart`}
                className="inline-flex items-center gap-2 border border-line-input text-muted-low text-[11px] font-semibold px-4 py-2 cursor-default"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                <Check size={11} aria-hidden="true" /> In Cart
              </button>
            ) : (
              <button
                onClick={() => setLicenseOpen(o => !o)}
                aria-expanded={licenseOpen}
                aria-label={`Add ${beat.title} to cart — select license`}
                className="inline-flex items-center gap-2 border border-line-input text-muted-mid text-[11px] font-semibold px-4 py-2 transition-[border-color,color] hover:border-line-hover hover:text-foreground"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                <ShoppingCart size={11} aria-hidden="true" />
                Add to Cart — From ${PRICES.standard[1]}
                <ChevronDown size={11} className={`transition-transform duration-200 ${licenseOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            )}

            <div className="ml-auto">
              <ShareButton beatId={beat.id} />
            </div>
          </div>
        </div>
      </div>

      {/* License drawer */}
      <div className={`license-drawer-grid${licenseOpen ? ' is-open' : ''}`}>
        <div className="license-drawer-inner" inert={!licenseOpen}>
          <div className="bg-surface-2 border-t border-line px-5 sm:px-8 py-3">
            <div className="hidden sm:grid grid-cols-4 gap-px mb-px">
              {LICENSE_OPTIONS.map((opt) => (
                <div key={opt.name} className="font-montserrat px-4 py-2 text-[9px] font-semibold uppercase text-muted-low" style={{ letterSpacing: '0.18em' }}>
                  {opt.name}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line">
              {LICENSE_OPTIONS.map((opt, i) =>
                opt.id === null ? (
                  <Link
                    key={i}
                    href="/about"
                    aria-label="Full ownership — inquire about exclusive license"
                    className="bg-surface-2 flex flex-col justify-between p-4 hover:bg-surface-1 transition-colors duration-150 group min-h-[88px]"
                  >
                    <div>
                      <div className="font-montserrat text-[10px] text-muted-low sm:hidden mb-1" aria-hidden="true">{opt.name}</div>
                      <div className="font-montserrat text-[11px] text-muted-low">{opt.desc}</div>
                    </div>
                    <span className="font-montserrat mt-3 text-[11px] font-semibold text-foreground group-hover:text-accent transition-colors">
                      {t.beat.inquire}
                    </span>
                  </Link>
                ) : (
                  <button
                    key={i}
                    onClick={() => handleSelectLicense(opt.id as LicenseType)}
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
