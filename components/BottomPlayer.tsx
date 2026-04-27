'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, AlertCircle, Loader2 } from 'lucide-react'
import { usePlayerStore } from '@/lib/store'
import { connectAudioElement, resumeContext } from '@/lib/audio-analyser'
import { sharedAudioElement } from '@/lib/player-ref'
import { GENRE_COLORS, GENRE_COLOR_FALLBACK } from '@/lib/genre-colors'

const PREVIEW_LIMIT = 30
// Sync progress to Zustand (and BeatCard) every 500ms rather than every audio tick (~10x/sec).
// The visual progress bar is updated directly via DOM refs so it stays perfectly smooth.
const STORE_SYNC_INTERVAL = 500

function formatTime(s: number) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
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

  const audioRef        = useRef<HTMLAudioElement | null>(null)
  const isPlayingRef    = useRef(isPlaying)
  const seekInputRef    = useRef<HTMLInputElement>(null)
  const timeTextRef     = useRef<HTMLSpanElement>(null)
  // Local progress ref — source of truth for DOM updates; Zustand is synced periodically
  const localProgressRef   = useRef(0)
  const lastStoreSyncRef   = useRef(0)
  const durationRef        = useRef(duration)
  const progressBarRef  = useRef<HTMLDivElement>(null)

  const [previewEnded, setPreviewEnded] = useState(false)
  const [hasError, setHasError]         = useState(false)
  const [isBuffering, setIsBuffering]   = useState(false)
  const [volume, setVolume]             = useState(1)
  const [muted, setMuted]               = useState(false)

  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { durationRef.current = duration }, [duration])
  // Expose audio element so BeatCard/BeatPageClient can call play() within the gesture context
  useEffect(() => {
    sharedAudioElement.current = audioRef.current
    return () => { sharedAudioElement.current = null }
  }, [])
  // Clean up audio on unmount to release media resources
  useEffect(() => {
    return () => {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.src = ''
        audio.load()
      }
    }
  }, [])

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

  function handleRetry() {
    const audio = audioRef.current
    const src = currentBeat?.preview_url
    if (!audio || !src) return
    setHasError(false)
    setIsBuffering(true)
    audio.src = src
    audio.load()
    audio.addEventListener('canplay', () => {
      setIsBuffering(false)
      connectAudioElement(audio)
      audio.play().catch((err) => {
        setPlaying(false)
        if (err?.name !== 'NotAllowedError') setHasError(true)
      })
    }, { once: true })
    setPlaying(true)
  }

  // Update seek input, time text, and progress bar directly via DOM — no React re-render.
  function updateProgressDOM(t: number) {
    const cappedT   = Math.min(t, PREVIEW_LIMIT)
    const barMaxLocal = durationRef.current > 0 ? Math.min(durationRef.current, PREVIEW_LIMIT) : PREVIEW_LIMIT
    if (seekInputRef.current)   seekInputRef.current.value      = String(cappedT)
    if (timeTextRef.current)    timeTextRef.current.textContent =
      `${formatTime(cappedT)} / ${formatTime(Math.min(durationRef.current || 0, PREVIEW_LIMIT))}`
    if (progressBarRef.current) progressBarRef.current.style.width =
      `${barMaxLocal > 0 ? Math.min(cappedT / barMaxLocal, 1) * 100 : 0}%`
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentBeat) return
    const src = currentBeat.preview_url ?? ''
    setPreviewEnded(false)
    setHasError(false)
    localProgressRef.current = 0
    updateProgressDOM(0)
    if (!src) { setPlaying(false); return }

    // iOS Safari: BeatCard may have already set audio.src and called audio.play()
    // synchronously from the gesture handler. If audio is already playing the correct
    // source, skip the reload — interrupting it would break gesture-initiated playback.
    if (audio.src === src && !audio.paused) {
      connectAudioElement(audio)
      if (audio.readyState >= 2) setIsBuffering(false)
      return
    }

    setIsBuffering(true)
    audio.pause()
    audio.src = src
    audio.load()
    const handleCanPlay = () => {
      setIsBuffering(false)
      connectAudioElement(audio)
      if (isPlayingRef.current) {
        audio.play().catch((err) => {
          setPlaying(false)
          if (err?.name !== 'NotAllowedError') setHasError(true)
        })
      }
    }
    audio.addEventListener('canplay', handleCanPlay, { once: true })
    return () => audio.removeEventListener('canplay', handleCanPlay)
  }, [currentBeat]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying && audio.readyState < 2) return
    if (isPlaying) {
      connectAudioElement(audio)
      resumeContext()
      audio.play().catch((err) => {
        setPlaying(false)
        if (err?.name !== 'NotAllowedError') setHasError(true)
      })
    } else {
      audio.pause()
    }
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // Derive display values from Zustand state (only recalculated on Zustand changes, not every tick)
  const barMax = duration > 0 ? Math.min(duration, PREVIEW_LIMIT) : PREVIEW_LIMIT

  // Safe to compute with optional chaining — audio element always renders
  const dot = GENRE_COLORS[currentBeat?.genre ?? ''] ?? GENRE_COLOR_FALLBACK
  const genreLabel = !currentBeat ? '' : (currentBeat.genre === 'R&B' ? 'R&B' : currentBeat.genre.slice(0, 3))

  return (
    <>
      {/* Audio element is always mounted so the AudioContext/AnalyserNode connection
          persists across beat changes. crossOrigin="anonymous" is required for
          createMediaElementSource() to work with cross-origin Supabase URLs. */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        aria-hidden="true"
        onTimeUpdate={(e) => {
          const t = (e.target as HTMLAudioElement).currentTime
          localProgressRef.current = t

          // Update DOM directly every tick for smooth visual feedback
          updateProgressDOM(t)

          // Sync to Zustand only every STORE_SYNC_INTERVAL ms to avoid flooding BeatCard re-renders
          const now = Date.now()
          if (now - lastStoreSyncRef.current >= STORE_SYNC_INTERVAL || t >= PREVIEW_LIMIT) {
            lastStoreSyncRef.current = now
            setProgress(t)
          }

          if (t >= PREVIEW_LIMIT) {
            ;(e.target as HTMLAudioElement).pause()
            setPlaying(false)
            setPreviewEnded(true)
          }
        }}
        onDurationChange={(e) => {
          const d = (e.target as HTMLAudioElement).duration
          durationRef.current = d
          setDuration(d)
        }}
        onEnded={() => { setPlaying(false); setProgress(0); updateProgressDOM(0) }}
        onWaiting={() => setIsBuffering(true)}
        onStalled={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onError={() => { setPlaying(false); setIsBuffering(false); setHasError(true) }}
      />

      {currentBeat && <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/[0.06] animate-slide-up" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} role="region" aria-label="Music player">
        {/* Progress track */}
        <div className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none" style={{ background: 'rgba(255,255,255,0.06)', zIndex: 0 }} aria-hidden="true">
          <div ref={progressBarRef} className="h-full" style={{ width: '0%', background: 'var(--accent)', transition: 'none' }} />
        </div>

        {/* Seek scrubber — in its original position, overlaid on the top progress track */}
        {/* [&:has(input:focus-visible)] shows an outline on the progress track when keyboard-focused,
             since the input itself is opacity-0 and its own focus ring is invisible. */}
        <div className="relative h-px w-full [&:has(input:focus-visible)]:outline [&:has(input:focus-visible)]:outline-2 [&:has(input:focus-visible)]:outline-offset-[6px] [&:has(input:focus-visible)]:outline-white/40 [&:has(input:focus-visible)]:rounded-sm">
          <input
            ref={seekInputRef}
            type="range"
            min={0}
            max={barMax}
            defaultValue={0}
            onChange={(e) => {
              const val = Number(e.target.value)
              if (val >= PREVIEW_LIMIT) return
              localProgressRef.current = val
              lastStoreSyncRef.current = Date.now()
              setProgress(val)
              setPreviewEnded(false)
              updateProgressDOM(val)
              if (audioRef.current) audioRef.current.currentTime = val
            }}
            className="absolute inset-x-0 w-full opacity-0 cursor-pointer"
            style={{ height: '20px', top: '-10px', zIndex: 2 }}
            aria-label="Seek"
          />
        </div>

        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 lg:px-8" style={{ height: '63px', zIndex: 1 }}>

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
                <span className="text-[8px] font-bold text-foreground/80 uppercase tracking-wider">
                  {genreLabel}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-foreground leading-tight">
                {currentBeat.title}
              </p>
              {hasError ? (
                <p className="flex items-center gap-1 text-[11px] leading-tight text-danger">
                  <AlertCircle size={10} aria-hidden="true" />
                  Failed to load
                </p>
              ) : (
                <p className="text-[11px] text-muted leading-tight">
                  {currentBeat.bpm} BPM · {currentBeat.key}
                </p>
              )}
            </div>
          </div>

          {/* Center — controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={playPrev}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors text-muted hover:text-foreground"
              aria-label="Previous"
            >
              <SkipBack size={15} aria-hidden="true" />
            </button>

            {hasError ? (
              <button
                onClick={handleRetry}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black hover:bg-white-hover transition-colors"
                aria-label="Retry loading audio"
              >
                <Play size={16} fill="black" aria-hidden="true" />
              </button>
            ) : previewEnded ? (
              <button
                onClick={() => {
                  if (audioRef.current) audioRef.current.currentTime = 0
                  localProgressRef.current = 0
                  setProgress(0)
                  updateProgressDOM(0)
                  setPreviewEnded(false)
                  setPlaying(true)
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black hover:bg-white-hover transition-colors"
                aria-label="Replay preview"
              >
                <Play size={16} fill="black" aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (localProgressRef.current >= PREVIEW_LIMIT && audioRef.current) {
                    audioRef.current.currentTime = 0
                    localProgressRef.current = 0
                    setProgress(0)
                    updateProgressDOM(0)
                    setPlaying(true)
                  } else {
                    togglePlay()
                  }
                }}
                disabled={!currentBeat?.preview_url}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black hover:bg-white-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isBuffering && isPlaying
                  ? <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  : isPlaying
                    ? <Pause size={16} fill="black" aria-hidden="true" />
                    : <Play size={16} fill="black" aria-hidden="true" />
                }
              </button>
            )}

            <button
              onClick={playNext}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors text-muted hover:text-foreground"
              aria-label="Next"
            >
              <SkipForward size={15} aria-hidden="true" />
            </button>
          </div>

          {/* Right — time + volume */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
            {/* Updated via DOM ref — no React re-render on every tick */}
            <span ref={timeTextRef} className="hidden sm:block text-[10px] text-muted-low tabular-nums">
              0:00 / 0:30
            </span>
            <button
              onClick={toggleMute}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors text-muted hover:text-foreground"
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
              style={{ width: '50px' }}
              aria-label="Volume"
            />
          </div>
        </div>
      </div>}
    </>
  )
}
