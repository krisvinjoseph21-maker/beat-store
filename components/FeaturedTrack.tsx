'use client'

import { useState } from 'react'
import { Play, Pause, ShoppingCart, Check, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePlayerStore, useCartStore, type Beat, type LicenseType } from '@/lib/store'
import ShareButton from './ShareButton'
import { PRICES } from '@/lib/prices'
import { useT } from '@/lib/i18n'
import { trackAddToCart } from '@/lib/analytics'

export default function FeaturedTrack({ beat }: { beat: Beat }) {
  const t = useT()
  const { currentBeat, isPlaying, setCurrentBeat, togglePlay } = usePlayerStore()
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
    if (currentBeat?.id === beat.id) togglePlay()
    else setCurrentBeat(beat)
  }

  function handleSelectLicense(id: LicenseType) {
    addBeat(beat, id)
    setLicenseOpen(false)
    openCart()
    trackAddToCart({ id: beat.id, name: beat.title, category: beat.genre, price: PRICES[id][1] })
  }

  return (
    <div className="w-full border border-line-card bg-surface-3 flex flex-col sm:flex-row">

      {/* Artwork */}
      <div className="w-full sm:w-48 h-40 sm:h-auto flex-shrink-0 relative overflow-hidden bg-surface-1">
        {beat.cover_url ? (
          <Image
            src={beat.cover_url}
            alt={beat.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 192px"
          />
        ) : null}
        {/* Playing indicator overlay */}
        {isThisPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
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
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 gap-6 min-w-0">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase text-muted-low mb-2"
            style={{ letterSpacing: '0.22em', fontFamily: 'var(--font-montserrat)' }}>
            Featured
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-foreground uppercase leading-none truncate mb-3">
            {beat.title}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[12px] text-muted-low" style={{ fontFamily: 'var(--font-inter)' }}>
              {beat.bpm} BPM
            </span>
            <span className="text-[10px] text-line-hover" aria-hidden="true">·</span>
            <span className="text-[12px] text-muted-low" style={{ fontFamily: 'var(--font-inter)' }}>
              {beat.key}
            </span>
            {beat.subgenre && (
              <>
                <span className="text-[10px] text-line-hover" aria-hidden="true">·</span>
                <span className="text-[12px] text-muted-low" style={{ fontFamily: 'var(--font-inter)' }}>
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
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:bg-white-hover transition-[background-color,transform] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            aria-label={isThisPlaying ? 'Pause' : 'Play preview'}
          >
            {isThisPlaying
              ? <Pause size={15} fill="black" aria-hidden="true" />
              : <Play size={15} fill="black" style={{ marginLeft: '2px' }} aria-hidden="true" />}
          </button>

          {inCart ? (
            <button
              onClick={openCart}
              aria-label={`${beat.title} — already in cart, click to view cart`}
              className="inline-flex items-center gap-2 border border-line-input text-muted-low text-[12px] font-semibold px-4 py-2.5 cursor-default"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              <Check size={12} aria-hidden="true" /> In Cart
            </button>
          ) : (
            <button
              onClick={() => setLicenseOpen(o => !o)}
              aria-expanded={licenseOpen}
              aria-label={`Add ${beat.title} to cart — select license`}
              className="inline-flex items-center gap-2 border border-foreground bg-transparent text-foreground text-[12px] font-semibold transition-[background-color,border-color,color] px-4 py-2.5 hover:bg-white hover:text-black"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              <ShoppingCart size={12} aria-hidden="true" />
              Add to Cart — From ${PRICES.standard[1]}
              <ChevronDown size={12} className={`transition-transform duration-200 ${licenseOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          )}

          <div className="ml-auto">
            <ShareButton beatId={beat.id} />
          </div>
        </div>

        {/* License drawer */}
        <div className={`license-drawer-grid${licenseOpen ? ' is-open' : ''}`}>
          <div className="license-drawer-inner" inert={!licenseOpen}>
            <div className="bg-surface-2 border-t border-line px-5 sm:px-6 py-3">
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
                      aria-label="Inquire about exclusive license"
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
    </div>
  )
}
