'use client'

import { Play, Pause, ShoppingCart, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { usePlayerStore, useCartStore, type Beat } from '@/lib/store'
import ShareButton from './ShareButton'
import ExclusiveOfferForm from './ExclusiveOfferForm'

const GENRE_BG: Record<string, string> = {
  Trap: 'bg-red-600',
  Drill: 'bg-blue-600',
  'R&B': 'bg-purple-600',
  Afrobeats: 'bg-emerald-600',
}

export default function BeatPageClient({ beat }: { beat: Beat }) {
  const { currentBeat, isPlaying, setCurrentBeat, togglePlay } = usePlayerStore()
  const { addBeat, isInCart } = useCartStore()

  const isThisPlaying = currentBeat?.id === beat.id && isPlaying
  const inCart = isInCart(beat.id)
  const genreBg = GENRE_BG[beat.genre] ?? 'bg-zinc-600'

  function handlePlay() {
    if (currentBeat?.id === beat.id) togglePlay()
    else setCurrentBeat(beat)
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <Link
        href="/store"
        className="mb-8 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
      >
        <ArrowLeft size={13} /> Back to Store
      </Link>

      <div className="rounded-sm border border-[#1a1a1a] bg-[#0d0d0d] overflow-hidden">
        {/* Artwork banner */}
        <div className={`${genreBg} h-40 flex items-center justify-center select-none`}>
          <span className="text-4xl font-black text-white/20 uppercase tracking-widest">
            {beat.genre}
          </span>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-white leading-tight">{beat.title}</h1>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                <span>{beat.bpm} BPM</span>
                <span>·</span>
                <span>{beat.key}</span>
                <span>·</span>
                <span>{beat.genre}{beat.subgenre ? ` / ${beat.subgenre}` : ''}</span>
              </div>
            </div>
            <ShareButton beatId={beat.id} />
          </div>

          {beat.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-1.5">
              {beat.tags.map((tag) => (
                <span key={tag} className="rounded bg-white/5 px-2 py-1 text-xs text-zinc-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handlePlay}
              disabled={!beat.preview_url}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isThisPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" />}
            </button>

            <button
              onClick={() => addBeat(beat)}
              disabled={inCart}
              className={`flex flex-1 items-center justify-center gap-2 rounded-sm px-5 py-3 text-sm font-bold transition-colors ${
                inCart ? 'bg-white/10 text-zinc-400 cursor-default' : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              {inCart ? <><Check size={15} /> Added to Cart</> : <><ShoppingCart size={15} /> Add to Cart — From $75</>}
            </button>
          </div>

          <ExclusiveOfferForm beatId={beat.id} beatTitle={beat.title} />
        </div>
      </div>
    </div>
  )
}
