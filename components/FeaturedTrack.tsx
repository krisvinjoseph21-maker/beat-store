'use client'

import { Play, Pause, ShoppingCart, Check } from 'lucide-react'
import Image from 'next/image'
import { usePlayerStore, useCartStore, type Beat } from '@/lib/store'
import ShareButton from './ShareButton'
import { PRICES } from '@/lib/prices'

export default function FeaturedTrack({ beat }: { beat: Beat }) {
  const { currentBeat, isPlaying, setCurrentBeat, togglePlay } = usePlayerStore()
  const { addBeat, isInCart } = useCartStore()

  const isThisPlaying = currentBeat?.id === beat.id && isPlaying
  const inCart = isInCart(beat.id)

  function handlePlay() {
    if (currentBeat?.id === beat.id) togglePlay()
    else setCurrentBeat(beat)
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
        ) : (
          <div className="absolute inset-0 flex flex-col items-start justify-end p-4">
            <span
              className="font-display text-[56px] leading-none text-foreground/10 uppercase select-none"
              aria-hidden="true"
            >
              {beat.genre.slice(0, 2)}
            </span>
          </div>
        )}
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

          <button
            onClick={() => addBeat(beat)}
            disabled={inCart}
            aria-label={inCart ? `${beat.title} — in cart` : `Add ${beat.title} to cart`}
            className={`inline-flex items-center gap-2 border text-[12px] font-semibold transition-[background-color,border-color,color] px-4 py-2.5 ${
              inCart
                ? 'border-line-input text-muted-low cursor-default'
                : 'border-foreground bg-transparent text-foreground hover:bg-white hover:text-black'
            }`}
            style={{ fontFamily: 'var(--font-montserrat)' }}
          >
            {inCart
              ? <><Check size={12} aria-hidden="true" /> In Cart</>
              : <><ShoppingCart size={12} aria-hidden="true" /> Add to Cart — From ${PRICES.standard[1]}</>}
          </button>

          <div className="ml-auto">
            <ShareButton beatId={beat.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
