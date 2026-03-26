'use client'

import { Play, Pause, ShoppingCart, Check, Flame } from 'lucide-react'
import { usePlayerStore, useCartStore, type Beat } from '@/lib/store'
import ShareButton from './ShareButton'

const GENRE_BG: Record<string, string> = {
  Trap: 'from-red-900/60 to-red-600/20',
  Drill: 'from-blue-900/60 to-blue-600/20',
  'R&B': 'from-purple-900/60 to-purple-600/20',
  Afrobeats: 'from-emerald-900/60 to-emerald-600/20',
}

const GENRE_ACCENT: Record<string, string> = {
  Trap: 'bg-red-600',
  Drill: 'bg-blue-600',
  'R&B': 'bg-purple-600',
  Afrobeats: 'bg-emerald-600',
}

export default function FeaturedTrack({ beat }: { beat: Beat }) {
  const { currentBeat, isPlaying, setCurrentBeat, togglePlay } = usePlayerStore()
  const { addBeat, isInCart } = useCartStore()

  const isThisPlaying = currentBeat?.id === beat.id && isPlaying
  const inCart = isInCart(beat.id)
  const gradientBg = GENRE_BG[beat.genre] ?? 'from-zinc-900/60 to-zinc-800/20'
  const accentBg = GENRE_ACCENT[beat.genre] ?? 'bg-zinc-600'

  function handlePlay() {
    if (currentBeat?.id === beat.id) togglePlay()
    else setCurrentBeat(beat)
  }

  return (
    <div className={`w-full rounded-sm border border-white/10 bg-gradient-to-br ${gradientBg} overflow-hidden relative`}>
      {/* Glow behind card */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className={`absolute -top-10 -left-10 h-40 w-40 rounded-full blur-3xl ${accentBg}`} />
      </div>

      <div className="relative flex flex-col sm:flex-row items-stretch">
        {/* Artwork */}
        <div className={`${accentBg} w-full sm:w-44 h-36 sm:h-auto flex-shrink-0 flex flex-col items-center justify-center select-none`}>
          <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1">Featured</span>
          <span className="text-3xl font-black text-white uppercase tracking-tight">
            {beat.genre === 'R&B' ? 'R&B' : beat.genre.slice(0, 3)}
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Flame size={13} className="text-orange-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">
                Featured Track
              </span>
            </div>
            <h2 className="text-2xl font-black text-white leading-tight sm:text-3xl">
              {beat.title}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
              <span className="rounded bg-white/10 px-2 py-0.5">{beat.bpm} BPM</span>
              <span className="rounded bg-white/10 px-2 py-0.5">{beat.key}</span>
              {beat.subgenre && (
                <span className="rounded bg-white/10 px-2 py-0.5">{beat.subgenre}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePlay}
              disabled={!beat.preview_url}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200 transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0 shadow-lg"
              aria-label={isThisPlaying ? 'Pause' : 'Play'}
            >
              {isThisPlaying
                ? <Pause size={18} fill="black" />
                : <Play size={18} fill="black" />}
            </button>

            <button
              onClick={() => addBeat(beat)}
              disabled={inCart}
              className={`flex items-center gap-2 rounded-sm px-5 py-2.5 text-sm font-bold transition-all ${
                inCart
                  ? 'bg-white/10 text-zinc-400 cursor-default'
                  : 'bg-white text-black hover:bg-zinc-100 hover:scale-105 shadow-lg'
              }`}
            >
              {inCart
                ? <><Check size={14} /> Added to Cart</>
                : <><ShoppingCart size={14} /> Add to Cart — $75</>}
            </button>

            <div className="ml-auto flex items-center gap-2">
              <ShareButton beatId={beat.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
