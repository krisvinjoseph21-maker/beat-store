'use client'

import { Play, Pause, ShoppingCart, Check } from 'lucide-react'
import { usePlayerStore, useCartStore, type Beat } from '@/lib/store'
import ShareButton from './ShareButton'
import { GENRE_COLORS, GENRE_COLOR_FALLBACK } from '@/lib/genre-colors'
import { PRICES } from '@/lib/prices'

export default function FeaturedTrack({ beat }: { beat: Beat }) {
  const { currentBeat, isPlaying, setCurrentBeat, togglePlay } = usePlayerStore()
  const { addBeat, isInCart } = useCartStore()

  const isThisPlaying = currentBeat?.id === beat.id && isPlaying
  const inCart = isInCart(beat.id)
  const dot = GENRE_COLORS[beat.genre] ?? GENRE_COLOR_FALLBACK

  function handlePlay() {
    if (currentBeat?.id === beat.id) togglePlay()
    else setCurrentBeat(beat)
  }

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-surface-3">
      <div className="relative flex flex-col sm:flex-row items-stretch">

        {/* Artwork slab */}
        <div className="w-full sm:w-40 h-32 sm:h-auto flex-shrink-0 flex flex-col items-center justify-center select-none bg-surface-1 relative overflow-hidden">
          <div className={`absolute inset-0 opacity-20 ${dot}`} style={{ filter: 'blur(40px)', transform: 'scale(2)' }} />
          <div className="relative z-10 flex flex-col items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${dot}`} />
            <span className="text-[9px] font-bold text-accent uppercase tracking-[0.3em] mt-2">Featured</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 gap-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent mb-2">
              Featured Track
            </p>
            <h2 className="text-xl font-bold text-foreground leading-tight sm:text-2xl">
              {beat.title}
            </h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[`${beat.bpm} BPM`, beat.key, beat.subgenre].filter(Boolean).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/[0.1] px-2.5 py-0.5 text-[11px] text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePlay}
              disabled={!beat.preview_url}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:bg-white-hover transition-[background-color,transform] disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              aria-label={isThisPlaying ? 'Pause' : 'Play'}
            >
              {isThisPlaying
                ? <Pause size={16} fill="black" aria-hidden="true" />
                : <Play size={16} fill="black" aria-hidden="true" />}
            </button>

            <button
              onClick={() => addBeat(beat)}
              disabled={inCart}
              aria-label={inCart ? `${beat.title} — added to cart` : `Add ${beat.title} to cart`}
              className={`inline-flex items-center gap-2 rounded-full text-[12px] font-semibold transition-[background-color,color] ${
                inCart
                  ? 'bg-white/[0.06] text-[var(--muted-low)] cursor-default px-4 py-2'
                  : 'bg-white text-black hover:bg-white-hover px-4 py-2'
              }`}
            >
              {inCart
                ? <><Check size={13} aria-hidden="true" /> Added</>
                : <><ShoppingCart size={13} aria-hidden="true" /> Add to Cart — From ${PRICES.standard[1]}</>}
            </button>

            <div className="ml-auto">
              <ShareButton beatId={beat.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
