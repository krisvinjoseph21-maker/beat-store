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
  Trap: 'bg-red-500',
  Drill: 'bg-blue-500',
  'R&B': 'bg-purple-500',
  Afrobeats: 'bg-emerald-500',
}

const GENRE_TEXT: Record<string, string> = {
  Trap: 'text-red-600',
  Drill: 'text-blue-600',
  'R&B': 'text-purple-600',
  Afrobeats: 'text-emerald-600',
}

const GENRE_BORDER: Record<string, string> = {
  Trap: 'border-red-300',
  Drill: 'border-blue-300',
  'R&B': 'border-purple-300',
  Afrobeats: 'border-emerald-300',
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

  const genreBg = GENRE_BG[beat.genre] ?? 'bg-gray-400'
  const genreTextColor = GENRE_TEXT[beat.genre] ?? 'text-gray-500'
  const genreBorderColor = GENRE_BORDER[beat.genre] ?? 'border-gray-300'

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
      className={`group flex items-center gap-4 px-5 py-4 border-b border-gray-100 transition-colors ${
        isThisActive ? 'bg-gray-100' : 'hover:bg-gray-50'
      }`}
    >
      {/* Row index */}
      <span
        className={`hidden sm:inline-block w-8 flex-shrink-0 text-center text-sm font-mono tabular-nums select-none ${
          isThisPlaying ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'
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
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : isThisActive
            ? 'bg-gray-900 text-white'
            : 'bg-gray-200 hover:bg-gray-900 text-gray-700 hover:text-white'
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
          <span className="text-[11px] font-black text-white uppercase tracking-wider">
            {beat.genre === 'R&B' ? 'R&B' : beat.genre.slice(0, 3)}
          </span>
        </div>
      )}

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <p
            className={`truncate text-base font-bold leading-tight transition-colors ${
              isThisActive ? 'text-gray-900' : 'text-gray-800 group-hover:text-gray-900'
            }`}
          >
            {beat.title}
          </p>
          {isNew && (
            <span className="flex-shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-orange-600">
              New
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 overflow-hidden">
          <span className="whitespace-nowrap text-xs text-gray-400">{beat.bpm} BPM</span>
          <span className="text-gray-300 text-xs">·</span>
          <span className="whitespace-nowrap text-xs text-gray-400">{beat.key}</span>
          {beat.subgenre && (
            <>
              <span className="text-gray-300 text-xs">·</span>
              <span className="truncate text-xs text-gray-400">{beat.subgenre}</span>
            </>
          )}
        </div>
      </div>

      {/* Tags — hidden on small screens */}
      <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
        {beat.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded bg-gray-100 px-2.5 py-1 text-xs text-gray-500"
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
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart
          size={16}
          className={favorited ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}
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
            ? 'bg-gray-100 text-gray-400'
            : 'bg-gray-900 text-white hover:bg-gray-700'
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
