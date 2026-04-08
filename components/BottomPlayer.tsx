'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Play, Pause, SkipBack, SkipForward, Lock, Volume2, VolumeX } from 'lucide-react'
import { usePlayerStore } from '@/lib/store'

const PREVIEW_LIMIT = 30

function formatTime(s: number) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const GENRE_DOT: Record<string, string> = {
  Trap:      'bg-[#6b2e1e]',  // dark brick — raw, hard
  Drill:     'bg-[#1a3348]',  // midnight steel — cold, sharp
  'R&B':     'bg-[#422038]',  // deep plum — smooth, sensual
  Afrobeats: 'bg-[#6b4e18]',  // dark earth amber — warm, rhythmic
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

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentBeat) return
    const src = currentBeat.preview_url ?? currentBeat.file_url ?? ''
    setPreviewEnded(false)
    audio.pause()
    if (!src) { setPlaying(false); return }
    audio.src = src
    audio.load()
    const handleCanPlay = () => {
      if (isPlayingRef.current) audio.play().catch(() => setPlaying(false))
    }
    audio.addEventListener('canplay', handleCanPlay, { once: true })
    return () => audio.removeEventListener('canplay', handleCanPlay)
  }, [currentBeat]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying && audio.readyState < 2) return
    if (isPlaying) audio.play().catch(() => setPlaying(false))
    else audio.pause()
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  const cappedProgress = Math.min(progress, PREVIEW_LIMIT)
  const barMax = duration > 0 ? Math.min(duration, PREVIEW_LIMIT) : PREVIEW_LIMIT
  const pct = barMax > 0 ? (cappedProgress / barMax) * 100 : 0

  if (!currentBeat) return null

  const dot = GENRE_DOT[currentBeat.genre] ?? 'bg-zinc-500'
  const genreLabel = currentBeat.genre === 'R&B' ? 'R&B' : currentBeat.genre.slice(0, 3)

  return (
    <>
      <audio
        ref={audioRef}
        aria-hidden="true"
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

      <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/[0.06] animate-fade-in" role="region" aria-label="Music player">
        {/* Progress bar */}
        <div className="relative h-px w-full bg-white/[0.06]">
          <div
            className="h-full bg-white/40 transition-all duration-100"
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
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            style={{ height: '4px', top: '-1.5px' }}
            aria-label="Seek"
          />
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 lg:px-8" style={{ height: '63px' }}>

          {/* Left — artwork + beat info */}
          <div className="flex min-w-0 items-center gap-3 flex-1">
            {currentBeat.cover_url ? (
              <Image
                src={currentBeat.cover_url}
                alt={currentBeat.title}
                width={36}
                height={36}
                className="h-9 w-9 flex-shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className={`h-9 w-9 flex-shrink-0 rounded-lg ${dot} flex items-center justify-center select-none`}>
                <span className="text-[8px] font-bold text-white/80 uppercase tracking-wider">
                  {genreLabel}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[#f5f5f7] leading-tight">
                {currentBeat.title}
              </p>
              <p className="text-[11px] text-[#6e6e73] leading-tight">
                {currentBeat.bpm} BPM · {currentBeat.key}
              </p>
            </div>
          </div>

          {/* Center — controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={playPrev}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors text-[#6e6e73] hover:text-[#f5f5f7]"
              aria-label="Previous"
            >
              <SkipBack size={15} aria-hidden="true" />
            </button>

            {previewEnded ? (
              <a
                href="/store"
                className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-black hover:bg-[#e8e8ed] transition-colors"
              >
                <Lock size={12} />
                <span className="text-[11px] font-semibold">Buy to unlock</span>
              </a>
            ) : (
              <button
                onClick={togglePlay}
                disabled={!currentBeat?.preview_url}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black hover:bg-[#e8e8ed] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={16} fill="black" aria-hidden="true" /> : <Play size={16} fill="black" aria-hidden="true" />}
              </button>
            )}

            <button
              onClick={playNext}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors text-[#6e6e73] hover:text-[#f5f5f7]"
              aria-label="Next"
            >
              <SkipForward size={15} aria-hidden="true" />
            </button>
          </div>

          {/* Right — time + volume */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <span className="hidden sm:block text-[10px] text-[#767676] tabular-nums">
              {formatTime(cappedProgress)} / {formatTime(Math.min(duration || 0, PREVIEW_LIMIT))}
            </span>
            <button
              onClick={toggleMute}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors text-[#6e6e73] hover:text-[#f5f5f7]"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? <VolumeX size={13} aria-hidden="true" /> : <Volume2 size={13} aria-hidden="true" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={muted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="hidden sm:block cursor-pointer flex-shrink-0"
              style={{ width: '80px' }}
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </>
  )
}
