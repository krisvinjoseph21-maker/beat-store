'use client'

import { useEffect, useRef } from 'react'
import { getAnalyser } from '@/lib/audio-analyser'

interface Props {
  progressPct: number
  isPlaying: boolean
}

// Accent colour as RGB components (matches --accent: #c8a86a)
const ACCENT_R = 200
const ACCENT_G = 168
const ACCENT_B = 106

/**
 * Canvas-rendered frequency visualiser for the active BeatCard row.
 *
 * Sits absolutely at the bottom of the row (position: absolute; bottom: 0).
 * Draws two layers on every animation frame:
 *   1. The progress track + fill (replaces the static 2px div)
 *   2. Frequency bars grown upward from the track baseline
 *
 * Respects prefers-reduced-motion — bars are suppressed, only the progress
 * track is drawn (behaviour matches the static fallback).
 *
 * pointer-events: none — all click/keyboard events pass through to the row.
 */
export default function WaveformVisualizer({ progressPct, isPlaying }: Props) {
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const rafRef        = useRef<number>(0)
  const progressRef   = useRef(progressPct)
  const isPlayingRef  = useRef(isPlaying)
  const dataRef       = useRef<Uint8Array | null>(null)
  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  // Keep refs in sync without re-running the draw loop
  useEffect(() => { progressRef.current = progressPct }, [progressPct])
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const CANVAS_H = 20  // CSS pixels — bars grow into the last 18px of row padding

    function resize() {
      if (!canvas) return
      const w = canvas.offsetWidth
      if (w === 0) return
      canvas.width  = Math.round(w * dpr)
      canvas.height = Math.round(CANVAS_H * dpr)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    function draw() {
      const ctx2d = canvas!.getContext('2d')
      if (!ctx2d) { rafRef.current = requestAnimationFrame(draw); return }

      const W = canvas!.width
      const H = canvas!.height

      ctx2d.clearRect(0, 0, W, H)

      // ── Progress track (2px at the very bottom) ─────────────────────────
      const trackH = Math.round(2 * dpr)
      ctx2d.fillStyle = 'rgba(26,26,26,1)'   // --line
      ctx2d.fillRect(0, H - trackH, W, trackH)

      // ── Progress fill ────────────────────────────────────────────────────
      const fillW = Math.round(W * (Math.min(progressRef.current, 100) / 100))
      ctx2d.fillStyle = `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},0.6)`
      ctx2d.fillRect(0, H - trackH, fillW, trackH)

      // ── Frequency bars ───────────────────────────────────────────────────
      if (!reducedMotion.current && isPlayingRef.current) {
        const analyser = getAnalyser()
        if (analyser) {
          const binCount = analyser.frequencyBinCount

          // Reuse buffer — never allocate inside the hot path
          if (!dataRef.current || dataRef.current.length !== binCount) {
            dataRef.current = new Uint8Array(binCount)
          }
          analyser.getByteFrequencyData(dataRef.current)
          const data = dataRef.current

          const BAR_W  = Math.round(2 * dpr)
          const GAP    = Math.round(1 * dpr)
          const STEP   = BAR_W + GAP
          const numBars = Math.floor(W / STEP)
          const maxBarH = H - trackH - Math.round(2 * dpr)  // 2px breathing room above track

          for (let i = 0; i < numBars; i++) {
            // Concentrate on the lower 72% of spectrum (sub-bass through presence)
            const bin = Math.floor((i / numBars) * binCount * 0.72)
            const v   = data[bin] / 255
            const barH = Math.round(v * maxBarH)
            if (barH < 1) continue

            const x     = i * STEP
            // Subtle opacity ramp — quiet signals barely visible, peaks ~70% opacity
            const alpha = 0.12 + v * 0.58
            ctx2d.fillStyle = `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},${alpha.toFixed(2)})`
            ctx2d.fillRect(x, H - trackH - barH, BAR_W, barH)
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, []) // intentionally empty — refs handle all changing values

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute left-0 bottom-0 w-full pointer-events-none"
      style={{ height: '20px', zIndex: 5 }}
    />
  )
}
