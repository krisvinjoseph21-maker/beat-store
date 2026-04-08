'use client'

import { Play, Pause, ShoppingCart, Check } from 'lucide-react'
import { usePlayerStore, useCartStore, type Beat } from '@/lib/store'
import ShareButton from './ShareButton'

const GENRE_DOT: Record<string, string> = {
  Trap:      'bg-red-500',
  Drill:     'bg-blue-500',
  'R&B':     'bg-purple-500',
  Afrobeats: 'bg-emerald-500',
}

export default function FeaturedTrack({ beat }: { beat: Beat }) {
  const { currentBeat, isPlaying, setCurrentBeat, togglePlay } = usePlayerStore()
  const { addBeat, isInCart } = useCartStore()

  const isThisPlaying = currentBeat?.id === beat.id && isPlaying
  const inCart = isInCart(beat.id)
  const dot = GENRE_DOT[beat.genre] ?? 'bg-zinc-500'

  function handlePlay() {
    if (currentBeat?.id === beat.id) togglePlay()
    else setCurrentBeat(beat)
  }

  return (
    <div className="w-full rounded-2xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden">
      <div className="relative flex flex-col sm:flex-row items-stretch">

        {/* Artwork slab */}
        <div className="w-full sm:w-40 h-32 sm:h-auto flex-shrink-0 flex flex-col items-center justify-center select-none bg-[#111] relative overflow-hidden">
          <div className={`absolute inset-0 opacity-20 ${dot}`} style={{ filter: 'blur(40px)', transform: 'scale(2)' }} />
          <div className="relative z-10 flex flex-col items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${dot}`} />
            <span className="text-[9px] font-bold text-[var(--muted-low)] uppercase tracking-[0.3em] mt-2">Featured</span>
            <span className="text-[11px] font-semibold text-[#f5f5f7] uppercase tracking-wider mt-0.5">
              {beat.genre === 'R&B' ? 'R&B' : beat.genre}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 gap-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-low)] mb-2">
              Featured Track
            </p>
            <h2 className="text-xl font-bold text-[#f5f5f7] leading-tight sm:text-2xl">
              {beat.title}
            </h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[`${beat.bpm} BPM`, beat.key, beat.subgenre].filter(Boolean).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/[0.1] px-2.5 py-0.5 text-[11px] text-[#6e6e73]"
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
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:bg-[#e8e8ed] transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
              aria-label={isThisPlaying ? 'Pause' : 'Play'}
            >
              {isThisPlaying
                ? <Pause size={16} fill="black" />
                : <Play size={16} fill="black" />}
            </button>

            <button
              onClick={() => addBeat(beat)}
              disabled={inCart}
              className={`inline-flex items-center gap-2 rounded-full text-[12px] font-semibold transition-all ${
                inCart
                  ? 'bg-white/[0.06] text-[var(--muted-low)] cursor-default px-4 py-2'
                  : 'bg-white text-black hover:bg-[#e8e8ed] hover:scale-105 px-4 py-2'
              }`}
            >
              {inCart
                ? <><Check size={13} /> Added</>
                : <><ShoppingCart size={13} /> Add to Cart — $75</>}
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
