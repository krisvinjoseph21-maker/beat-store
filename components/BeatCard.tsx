'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Play, Pause, ShoppingCart, Check, Heart } from 'lucide-react'
import { Beat, usePlayerStore, useCartStore, useFavoritesStore } from '@/lib/store'
import ShareButton from './ShareButton'

interface Props {
  beat: Beat
  index: number
  onBuyClick: (beat: Beat) => void
}

const GENRE_BG: Record<string, string> = {
  Trap: 'bg-red-600',
  Drill: 'bg-blue-600',
  'R&B': 'bg-purple-600',
  Afrobeats: 'bg-emerald-600',
}

const GENRE_TEXT: Record<string, string> = {
  Trap: 'text-red-400',
  Drill: 'text-blue-400',
  'R&B': 'text-purple-400',
  Afrobeats: 'text-emerald-400',
}

const GENRE_BORDER: Record<string, string> = {
  Trap: 'border-red-500/40',
  Drill: 'border-blue-500/40',
  'R&B': 'border-purple-500/40',
  Afrobeats: 'border-emerald-500/40',
}

export default function BeatCard({ beat, index, onBuyClick }: Props) {
  const { currentBeat, isPlaying, setCurrentBeat, togglePlay, setPlaying } =
    usePlayerStore()
  const { isInCart, addBeat } = useCartStore()
  const { toggle: toggleFavorite, isFavorited } = useFavoritesStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const favorited = mounted && isFavorited(beat.id)

  const isThisPlaying = currentBeat?.id === beat.id && isPlaying
  const isThisActive = currentBeat?.id === beat.id
  const inCart = mounted && isInCart(beat.id)
  const hasAudio = !!(beat.preview_url ?? beat.file_url)
  const isNew = beat.created_at && (Date.now() - new Date(beat.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000

  const genreBg = GENRE_BG[beat.genre] ?? 'bg-zinc-600'
  const genreTextColor = GENRE_TEXT[beat.genre] ?? 'text-zinc-400'
  const genreBorderColor = GENRE_BORDER[beat.genre] ?? 'border-zinc-700'

  function handlePlay() {
    if (!hasAudio) return
    if (currentBeat?.id === beat.id) {
      togglePlay()
    } else {
      setCurrentBeat(beat)
      setPlaying(true)
    }
  }

  return (
    <div
      className={`group flex items-center gap-4 px-5 py-4 border-b border-[#191919] transition-colors ${
        isThisActive ? 'bg-[#141414]' : 'hover:bg-[#0f0f0f]'
      }`}
    >
      {/* Row index */}
      <span
        className={`hidden sm:inline-block w-8 flex-shrink-0 text-center text-sm font-mono tabular-nums select-none ${
          isThisPlaying ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'
        }`}
      >
        {isThisPlaying ? '♪' : String(index).padStart(2, '0')}
      </span>

      {/* Play button */}
      <button
        onClick={handlePlay}
        disabled={!hasAudio}
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all ${
          !hasAudio
            ? 'bg-white/5 text-zinc-600 cursor-not-allowed'
            : isThisActive
            ? 'bg-white text-black'
            : 'bg-white/10 hover:bg-white text-white hover:text-black'
        }`}
        aria-label={isThisPlaying ? 'Pause' : 'Play'}
      >
        {isThisPlaying ? (
          <Pause size={15} fill="currentColor" />
        ) : (
          <Play size={15} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      {/* Cover image or genre square */}
      {beat.cover_url ? (
        <Image
          src={beat.cover_url}
          alt={beat.title}
          width={48}
          height={48}
          className="h-12 w-12 flex-shrink-0 rounded-sm object-cover"
        />
      ) : (
        <div className={`h-12 w-12 flex-shrink-0 rounded-lg ${genreBg} flex items-center justify-center select-none`}>
          <span className="text-[11px] font-black text-white/90 uppercase tracking-wider">
            {beat.genre === 'R&B' ? 'R&B' : beat.genre.slice(0, 3)}
          </span>
        </div>
      )}

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <p
            className={`truncate text-base font-bold leading-tight transition-colors ${
              isThisActive ? 'text-white' : 'text-zinc-100 group-hover:text-white'
            }`}
          >
            {beat.title}
          </p>
          {isNew && (
            <span className="flex-shrink-0 rounded bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-orange-400">
              New
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 overflow-hidden">
          <span className="whitespace-nowrap text-xs text-zinc-500">{beat.bpm} BPM</span>
          <span className="text-zinc-700 text-xs">·</span>
          <span className="whitespace-nowrap text-xs text-zinc-500">{beat.key}</span>
          {beat.subgenre && (
            <>
              <span className="text-zinc-700 text-xs">·</span>
              <span className="truncate text-xs text-zinc-500">{beat.subgenre}</span>
            </>
          )}
        </div>
      </div>

      {/* Tags — hidden on small screens */}
      <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
        {beat.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded bg-white/5 px-2.5 py-1 text-xs text-zinc-500"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Genre pill — hidden on mobile */}
      <span
        className={`hidden md:inline-flex flex-shrink-0 items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${genreTextColor} ${genreBorderColor}`}
      >
        {beat.genre}
      </span>

      {/* Favorite button */}
      <button
        onClick={() => toggleFavorite(beat.id)}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10"
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart
          size={16}
          className={favorited ? 'text-red-500' : 'text-zinc-500 hover:text-red-400'}
          fill={favorited ? 'currentColor' : 'none'}
        />
      </button>

      {/* Share button */}
      <ShareButton beatId={beat.id} />

      {/* Cart button */}
      <button
        onClick={() => {
          addBeat(beat)
          onBuyClick(beat)
        }}
        className={`flex h-10 flex-shrink-0 items-center justify-center gap-2 rounded-sm px-4 text-sm font-bold transition-all ${
          inCart
            ? 'bg-white/10 text-zinc-400'
            : 'bg-white text-black hover:bg-zinc-200'
        }`}
        aria-label={inCart ? 'In cart' : 'Add to cart'}
      >
        {inCart ? (
          <Check size={15} />
        ) : (
          <>
            <ShoppingCart size={14} />
            <span className="hidden sm:inline">$75</span>
          </>
        )}
      </button>
    </div>
  )
}
