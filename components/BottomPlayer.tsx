'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { usePlayerStore } from '@/lib/store'
import { connectAudioElement, resumeContext, getAnalyser } from '@/lib/audio-analyser'
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
  // Canvas visualizer refs
  const playerCanvasRef = useRef<HTMLCanvasElement>(null)
  const playerRafRef    = useRef<number>(0)
  const barDecayRef     = useRef<Float32Array>(new Float32Array(0))
  // Stable ref to the draw function so it can be restarted from outside the visualizer effect
  const drawRef         = useRef<(() => void) | null>(null)

  const [previewEnded, setPreviewEnded] = useState(false)
  const [volume, setVolume]             = useState(1)
  const [muted, setMuted]               = useState(false)

  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { durationRef.current = duration }, [duration])
  // Restart the RAF draw loop whenever a beat loads and the loop has gone idle
  useEffect(() => {
    if (currentBeat && playerRafRef.current === 0 && drawRef.current) {
      playerRafRef.current = requestAnimationFrame(drawRef.current)
    }
  }, [currentBeat])

  // ── Canvas spectrum visualizer ──────────────────────────────────────────
  useEffect(() => {
    const dpr = window.devicePixelRatio || 1
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Accent color — mirrors --accent (#c8a86a). Single source so a token change only requires updating here.
    const ACCENT = '200,168,106'

    // Reusable FFT data buffer — never allocate inside the hot path
    let fftData: Uint8Array<ArrayBuffer> | null = null
    // ResizeObserver attached lazily once the canvas mounts
    let ro: ResizeObserver | null = null
    let observedCanvas: HTMLCanvasElement | null = null

    function draw() {
      const canvas = playerCanvasRef.current

      if (!canvas) {
        // No canvas means no beat is loaded — stop the loop entirely.
        // Restarted by the currentBeat effect once a beat mounts the canvas.
        playerRafRef.current = 0
        return
      }

      // Attach ResizeObserver the first time the canvas appears in the DOM
      if (observedCanvas !== canvas) {
        ro?.disconnect()
        observedCanvas = canvas
        ro = new ResizeObserver(() => {
          const w = canvas.offsetWidth
          const h = canvas.offsetHeight
          if (w > 0 && h > 0) {
            canvas.width  = Math.round(w * dpr)
            canvas.height = Math.round(h * dpr)
          }
        })
        ro.observe(canvas)
        const w = canvas.offsetWidth
        const h = canvas.offsetHeight
        if (w > 0 && h > 0) {
          canvas.width  = Math.round(w * dpr)
          canvas.height = Math.round(h * dpr)
        }
      }

      const ctx = canvas.getContext('2d')
      if (!ctx || canvas.width === 0) {
        playerRafRef.current = requestAnimationFrame(draw)
        return
      }

      const W = canvas.width
      const H = canvas.height

      ctx.clearRect(0, 0, W, H)

      const trackH      = Math.round(2 * dpr)
      const barMaxLocal = durationRef.current > 0
        ? Math.min(durationRef.current, PREVIEW_LIMIT)
        : PREVIEW_LIMIT
      const progressFrac = barMaxLocal > 0
        ? Math.min(localProgressRef.current / barMaxLocal, 1)
        : 0
      const cursorX = Math.round(W * progressFrac)

      // ── Progress track at the TOP (matches seek input position) ──────────
      // Dark base
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.fillRect(0, 0, W, trackH)
      // Amber fill
      if (cursorX > 0) {
        ctx.fillStyle = `rgba(${ACCENT},0.9)`
        ctx.fillRect(0, 0, cursorX, trackH)
      }
      // Cursor tick — extends below the track into the bar zone
      if (progressFrac > 0.005 && progressFrac < 0.995) {
        const tickH = Math.round(10 * dpr)
        ctx.fillStyle = `rgba(${ACCENT},0.85)`
        ctx.fillRect(cursorX - Math.round(0.5 * dpr), trackH, Math.round(1.5 * dpr), tickH)
      }

      if (!reducedMotion) {
        const BAR_W   = Math.round(3 * dpr)
        const GAP     = Math.round(2 * dpr)
        const STEP    = BAR_W + GAP
        const numBars = Math.floor(W / STEP)
        const maxBarH = H - trackH - Math.round(4 * dpr)

        if (barDecayRef.current.length !== numBars) {
          barDecayRef.current = new Float32Array(numBars)
        }

        const analyser = getAnalyser()
        let hasData = false
        if (analyser && isPlayingRef.current) {
          const binCount = analyser.frequencyBinCount
          if (!fftData || fftData.length !== binCount) fftData = new Uint8Array(binCount) as Uint8Array<ArrayBuffer>
          analyser.getByteFrequencyData(fftData)
          hasData = true
        }

        // Subtle glow behind the played region
        if (cursorX > 4) {
          const grad = ctx.createLinearGradient(0, 0, cursorX, 0)
          grad.addColorStop(0, `rgba(${ACCENT},0)`)
          grad.addColorStop(1, `rgba(${ACCENT},0.04)`)
          ctx.fillStyle = grad
          ctx.fillRect(0, trackH, cursorX, H - trackH)
        }

        // Frequency bars — grow downward from the track
        for (let i = 0; i < numBars; i++) {
          let v = 0
          if (hasData && fftData && analyser) {
            const bin = Math.floor((i / numBars) * analyser.frequencyBinCount * 0.72)
            v = fftData[bin] / 255
            if (v > barDecayRef.current[i]) {
              barDecayRef.current[i] = v
            } else {
              barDecayRef.current[i] = Math.max(0, barDecayRef.current[i] - 0.022)
              v = barDecayRef.current[i]
            }
          } else {
            // Graceful decay when paused or no analyser
            barDecayRef.current[i] = Math.max(0, barDecayRef.current[i] - 0.012)
            v = barDecayRef.current[i]
          }

          const barH = Math.round(v * maxBarH)
          if (barH < 1) continue

          const x        = i * STEP
          const isPlayed = x < cursorX
          const alpha    = isPlayed ? 0.2 + v * 0.65 : 0.06 + v * 0.32
          ctx.fillStyle  = `rgba(${ACCENT},${alpha.toFixed(2)})`
          // Bars cascade downward from the progress track
          ctx.fillRect(x, trackH, BAR_W, barH)
        }
      }

      playerRafRef.current = requestAnimationFrame(draw)
    }

    // Expose draw so the currentBeat effect can restart the loop after it idles
    drawRef.current = draw

    // Only start immediately if a beat is already loaded (e.g. on hot-reload)
    if (playerCanvasRef.current) {
      playerRafRef.current = requestAnimationFrame(draw)
    }

    return () => {
      drawRef.current = null
      cancelAnimationFrame(playerRafRef.current)
      playerRafRef.current = 0
      ro?.disconnect()
    }
  }, []) // intentionally empty — all state accessed via refs

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

  // Update seek input value and time text directly via DOM — no React re-render.
  // Progress visualisation is handled by the canvas draw loop (reads localProgressRef directly).
  function updateProgressDOM(t: number) {
    const cappedT = Math.min(t, PREVIEW_LIMIT)
    if (seekInputRef.current)  seekInputRef.current.value       = String(cappedT)
    if (timeTextRef.current)   timeTextRef.current.textContent  =
      `${formatTime(cappedT)} / ${formatTime(Math.min(durationRef.current || 0, PREVIEW_LIMIT))}`
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentBeat) return
    const src = currentBeat.preview_url ?? ''
    setPreviewEnded(false)
    localProgressRef.current = 0
    updateProgressDOM(0)
    audio.pause()
    if (!src) { setPlaying(false); return }
    audio.src = src
    audio.load()
    const handleCanPlay = () => {
      connectAudioElement(audio)
      if (isPlayingRef.current) audio.play().catch(() => setPlaying(false))
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
      audio.play().catch(() => setPlaying(false))
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
        onError={() => setPlaying(false)}
      />

      {currentBeat && <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/[0.06] animate-slide-up" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} role="region" aria-label="Music player">
        {/* Canvas fills the entire player — progress track at top, bars cascade down */}
        <canvas
          ref={playerCanvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        />

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
              <p className="text-[11px] text-muted leading-tight">
                {currentBeat.bpm} BPM · {currentBeat.key}
              </p>
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

            {previewEnded ? (
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
                {isPlaying ? <Pause size={16} fill="black" aria-hidden="true" /> : <Play size={16} fill="black" aria-hidden="true" />}
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
              style={{ width: '60px' }}
              aria-label="Volume"
            />
          </div>
        </div>
      </div>}
    </>
  )
}
