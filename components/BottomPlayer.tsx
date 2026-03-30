'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Play, Pause, SkipBack, SkipForward, Lock, Volume2, VolumeX } from 'lucide-react'
import { usePlayerStore } from '@/lib/store'

const PREVIEW_LIMIT = 30 // seconds

function formatTime(s: number) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const GENRE_BG: Record<string, string> = {
  Trap: 'bg-red-600',
  Drill: 'bg-blue-600',
  'R&B': 'bg-purple-600',
  Afrobeats: 'bg-emerald-600',
}

export default function BottomPlayer() {
  const {
    currentBeat,
    isPlaying,
    progress,
    duration,
    togglePlay,
    setPlaying,
    setProgress,
    setDuration,
    playNext,
    playPrev,
  } = usePlayerStore()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isPlayingRef = useRef(isPlaying)
  const [previewEnded, setPreviewEnded] = useState(false)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)

  // Keep ref in sync so canplay callback always reads the latest value
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])

  function handleVolumeChange(v: number) {
    setVolume(v)
    setMuted(v === 0)
    if (audioRef.current) audioRef.current.volume = v
  }

  function toggleMute() {
    const next = !muted
    setMuted(next)
    if (audioRef.current) audioRef.current.volume = next ? 0 : volume
  }

  // Runs when the beat changes — loads new src, plays via canplay once ready
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentBeat) return
    const src = currentBeat.preview_url ?? currentBeat.file_url ?? ''
    setPreviewEnded(false)
    audio.pause()
    if (!src) {
      setPlaying(false)
      return
    }
    audio.src = src
    audio.load()
    const handleCanPlay = () => {
      // Use ref so we always get the current isPlaying, not a stale closure
      if (isPlayingRef.current) audio.play().catch(() => setPlaying(false))
    }
    audio.addEventListener('canplay', handleCanPlay, { once: true })
    return () => audio.removeEventListener('canplay', handleCanPlay)
  }, [currentBeat]) // eslint-disable-line react-hooks/exhaustive-deps

  // Runs when play/pause is toggled — skip if audio is still loading
  // (readyState < 2 means canplay hasn't fired yet; it will call play() itself)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying && audio.readyState < 2) return
    if (isPlaying) audio.play().catch(() => setPlaying(false))
    else audio.pause()
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cap progress display at PREVIEW_LIMIT for the bar
  const cappedProgress = Math.min(progress, PREVIEW_LIMIT)
  const barMax = duration > 0 ? Math.min(duration, PREVIEW_LIMIT) : PREVIEW_LIMIT
  const pct = barMax > 0 ? (cappedProgress / barMax) * 100 : 0

  if (!currentBeat) return null

  const genreBg = GENRE_BG[currentBeat.genre] ?? 'bg-zinc-600'
  const genreLabel =
    currentBeat.genre === 'R&B' ? 'R&B' : currentBeat.genre.slice(0, 3)

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => {
          const t = (e.target as HTMLAudioElement).currentTime
          setProgress(t)
          if (t >= PREVIEW_LIMIT) {
            ;(e.target as HTMLAudioElement).pause()
            setPlaying(false)
            setPreviewEnded(true)
          }
        }}
        onDurationChange={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onEnded={() => { setPlaying(false); setProgress(0) }}
        onError={() => setPlaying(false)}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#191919] bg-[#0a0a0a] animate-fade-in">
        {/* Progress bar */}
        <div className="relative h-0.5 w-full bg-[#1f1f1f]">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
          <input
            type="range"
            min={0}
            max={barMax}
            value={cappedProgress}
            onChange={(e) => {
              const val = Number(e.target.value)
              if (val >= PREVIEW_LIMIT) return
              setProgress(val)
              setPreviewEnded(false)
              if (audioRef.current) audioRef.current.currentTime = val
            }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
            aria-label="Seek"
          />
        </div>

        <div className="mx-auto flex max-w-6xl items-center justify-between py-3" style={{ paddingLeft: '55px', paddingRight: '55px' }}>
          {/* Left — artwork + beat info */}
          <div className="flex min-w-0 items-center gap-3 flex-1">
            {currentBeat.cover_url ? (
              <Image
                src={currentBeat.cover_url}
                alt={currentBeat.title}
                width={40}
                height={40}
                className="h-10 w-10 flex-shrink-0 rounded-md object-cover"
              />
            ) : (
              <div className={`h-10 w-10 flex-shrink-0 rounded-md ${genreBg} flex items-center justify-center select-none`}>
                <span className="text-[9px] font-black text-white/90 uppercase tracking-wider">
                  {genreLabel}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white leading-tight">
                {currentBeat.title}
              </p>
              <p className="text-xs text-zinc-500 leading-tight">
                {currentBeat.bpm} BPM · {currentBeat.key}
              </p>
            </div>
          </div>

          {/* Right — controls + time + volume */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={playPrev}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
              aria-label="Previous"
            >
              <SkipBack size={17} />
            </button>
            {previewEnded ? (
              <a
                href="/store"
                className="flex h-10 items-center gap-1.5 rounded-sm bg-white px-4 text-black hover:bg-zinc-200 transition-colors"
              >
                <Lock size={13} />
                <span className="text-xs font-bold">Buy to unlock</span>
              </a>
            ) : (
              <button
                onClick={togglePlay}
                disabled={!currentBeat?.preview_url && !currentBeat?.file_url}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" />}
              </button>
            )}
            <button
              onClick={playNext}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
              aria-label="Next"
            >
              <SkipForward size={17} />
            </button>
            <span className="hidden sm:block text-[11px] text-zinc-600 tabular-nums w-20 text-center">
              {formatTime(cappedProgress)} / {formatTime(Math.min(duration || 0, PREVIEW_LIMIT))}
            </span>
            <button
              onClick={toggleMute}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={muted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="hidden sm:block w-10 accent-white cursor-pointer"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </>
  )
}
