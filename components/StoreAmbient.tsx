'use client'

/**
 * Audio-reactive ambient canvas behind the beat store list.
 *
 * Reads from the singleton AnalyserNode (lib/audio-analyser.ts) every frame.
 * When a beat plays, bass energy drives a warm amber wash from the left edge;
 * mid/treble energy adds vertical column texture across the list;
 * a treble flash pulses briefly at the top on hi-hat hits.
 *
 * Uses mix-blend-mode: screen — all-black canvas pixels are invisible,
 * so the ambient layer adds light rather than replacing colour.
 *
 * Respects prefers-reduced-motion: mounts the canvas but never draws.
 * Pauses via IntersectionObserver when off-screen.
 */

import { useEffect, useRef } from 'react'
import { getAnalyser } from '@/lib/audio-analyser'

const ACCENT_R = 200
const ACCENT_G = 168
const ACCENT_B = 106

export default function StoreAmbient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    let rafId   = 0
    let visible = true

    /* Resize */
    const ro = new ResizeObserver(() => {
      canvas.width  = Math.round(canvas.offsetWidth  * DPR)
      canvas.height = Math.round(canvas.offsetHeight * DPR)
    })
    ro.observe(canvas)

    /* Pause off-screen */
    const io = new IntersectionObserver(
      ([e]) => { visible = e.isIntersecting },
      { threshold: 0 }
    )
    io.observe(canvas)

    /* Persistent FFT buffer + per-bin decay */
    const NUM_BINS = 64
    const fftData    = new Uint8Array(NUM_BINS)
    const decayBins  = new Float32Array(NUM_BINS)

    /* Non-null aliases for use inside the closure */
    const cvs = canvas
    const ctx2 = ctx

    function draw() {
      rafId = requestAnimationFrame(draw)
      if (!visible) return
      if (cvs.width === 0 || cvs.height === 0) return

      ctx2.clearRect(0, 0, cvs.width, cvs.height)

      /* Pull latest frequency data */
      const analyser = getAnalyser()
      if (analyser) {
        analyser.getByteFrequencyData(fftData)
      }

      /* Smooth per-bin decay — attack fast, release slow */
      for (let i = 0; i < NUM_BINS; i++) {
        const v = analyser ? fftData[i] / 255 : 0
        if (v > decayBins[i]) {
          decayBins[i] = v                                   /* instant attack */
        } else {
          decayBins[i] = Math.max(0, decayBins[i] - 0.014)  /* ~70 frames to zero */
        }
      }

      const CW = cvs.width
      const CH = cvs.height

      /* ── Bass energy (bins 0–7: sub-bass + bass) ──────────────────────── */
      let bassSum = 0
      for (let i = 0; i < 8; i++) bassSum += decayBins[i]
      const bass = Math.min(bassSum / 8, 1)

      if (bass > 0.015) {
        /* Horizontal wash — wider spread on strong hits */
        const spread = 0.55 + bass * 0.3
        const grad = ctx2.createLinearGradient(0, 0, CW * spread, 0)
        grad.addColorStop(0,    `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},${(bass * 0.055).toFixed(3)})`)
        grad.addColorStop(0.35, `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},${(bass * 0.018).toFixed(3)})`)
        grad.addColorStop(1,    `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},0)`)
        ctx2.fillStyle = grad
        ctx2.fillRect(0, 0, CW, CH)

        /* Vertical radial bloom at left edge on strong beats */
        if (bass > 0.35) {
          const bloom = ctx2.createRadialGradient(0, CH * 0.5, 0, 0, CH * 0.5, CW * 0.45)
          bloom.addColorStop(0, `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},${(bass * 0.035).toFixed(3)})`)
          bloom.addColorStop(1, `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},0)`)
          ctx2.fillStyle = bloom
          ctx2.fillRect(0, 0, CW, CH)
        }
      }

      /* ── Vertical frequency columns — mid presence ────────────────────── */
      const NUM_COLS = 32
      const colW = CW / NUM_COLS
      for (let i = 0; i < NUM_COLS; i++) {
        /* Map columns evenly across the lower 75% of the spectrum */
        const bin = Math.floor((i / NUM_COLS) * NUM_BINS * 0.75)
        const v   = decayBins[bin]
        if (v < 0.05) continue

        const alpha = v * 0.022
        ctx2.fillStyle = `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},${alpha.toFixed(3)})`
        ctx2.fillRect(Math.round(i * colW), 0, Math.ceil(colW), CH)
      }

      /* ── Treble flash (bins 40–63: presence + air) ───────────────────── */
      let trebleSum = 0
      for (let i = 40; i < NUM_BINS; i++) trebleSum += decayBins[i]
      const treble = Math.min(trebleSum / 24, 1)

      if (treble > 0.28) {
        const flashH = CH * 0.12
        const flash  = ctx2.createLinearGradient(0, 0, 0, flashH)
        flash.addColorStop(0, `rgba(248,234,195,${(treble * 0.04).toFixed(3)})`)
        flash.addColorStop(1, 'rgba(248,234,195,0)')
        ctx2.fillStyle = flash
        ctx2.fillRect(0, 0, CW, flashH)
      }
    }

    draw()

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
      style={{ zIndex: 0, mixBlendMode: 'screen' }}
    />
  )
}
