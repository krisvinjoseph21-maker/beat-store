'use client'

/**
 * Audio-reactive ambient canvas behind the beat store list.
 *
 * Performance design:
 *   - Completely idle (no RAF, no CPU) when no audio is playing or canvas is off-screen.
 *   - 200ms poll while idle; wakes to RAF when non-trivial signal detected.
 *   - DPR fixed at 1.0 — soft gradients don't benefit from retina resolution.
 *   - mix-blend-mode: screen so black pixels cost nothing (invisible).
 *   - Genre color smoothly lerps toward the active beat's genre tint.
 */

import { useEffect, useRef } from 'react'
import { getAnalyser } from '@/lib/audio-analyser'
import { usePlayerStore } from '@/lib/store'

// Genre-tuned RGB tints — brighter than GENRE_COLORS dots so they're visible at low opacity
const GENRE_RGB: Record<string, readonly [number, number, number]> = {
  Trap:      [210, 70,  45],
  Drill:     [70,  120, 220],
  'R&B':     [180, 70,  155],
  Afrobeats: [215, 155, 45],
}
const ACCENT_RGB = [200, 168, 106] as const   // --accent fallback

const SLEEP_THRESHOLD = 0.008
const LERP_SPEED      = 0.035   // how fast the tint shifts between genres

export default function StoreAmbient() {
  const genre    = usePlayerStore((s) => s.currentBeat?.genre ?? null)
  const genreRef = useRef<string | null>(null)
  genreRef.current = genre

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctxOrNull = canvas.getContext('2d')
    if (!ctxOrNull) return
    const ctx: CanvasRenderingContext2D = ctxOrNull

    let rafId   = 0
    let timerId = 0
    let visible = true

    // Current interpolated tint (RGB floats)
    let cr = ACCENT_RGB[0], cg = ACCENT_RGB[1], cb = ACCENT_RGB[2]

    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    })
    ro.observe(canvas)

    const io = new IntersectionObserver(
      ([e]) => { visible = e.isIntersecting },
      { threshold: 0 }
    )
    io.observe(canvas)

    const NUM_BINS = 64
    const fftData  = new Uint8Array(NUM_BINS)
    const decay    = new Float32Array(NUM_BINS)
    let   prevBass = 0   // for transient detection

    function drawFrame() {
      if (!canvas || canvas.width === 0 || canvas.height === 0) return false

      // Lerp tint toward genre target
      const tgt = genreRef.current && GENRE_RGB[genreRef.current]
        ? GENRE_RGB[genreRef.current]
        : ACCENT_RGB
      cr += (tgt[0] - cr) * LERP_SPEED
      cg += (tgt[1] - cg) * LERP_SPEED
      cb += (tgt[2] - cb) * LERP_SPEED
      const R = Math.round(cr), G = Math.round(cg), B = Math.round(cb)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const analyser = getAnalyser()
      if (analyser) analyser.getByteFrequencyData(fftData)

      let totalEnergy = 0
      for (let i = 0; i < NUM_BINS; i++) {
        const v = analyser ? fftData[i] / 255 : 0
        decay[i] = v > decay[i] ? v : Math.max(0, decay[i] - 0.014)
        totalEnergy += decay[i]
      }

      if (totalEnergy < SLEEP_THRESHOLD) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        return true   // signal: go to sleep
      }

      const CW = canvas.width
      const CH = canvas.height

      // ── Bass left-to-right wash ───────────────────────────────────────────
      let bassSum = 0
      for (let i = 0; i < 8; i++) bassSum += decay[i]
      const bass = Math.min(bassSum / 8, 1)

      // Transient: sudden spike in bass energy
      const transient = Math.max(0, bass - prevBass)
      prevBass = bass * 0.82

      if (bass > 0.015) {
        const grad = ctx.createLinearGradient(0, 0, CW * (0.55 + bass * 0.3), 0)
        grad.addColorStop(0,    `rgba(${R},${G},${B},${(bass * 0.055).toFixed(3)})`)
        grad.addColorStop(0.35, `rgba(${R},${G},${B},${(bass * 0.018).toFixed(3)})`)
        grad.addColorStop(1,    `rgba(${R},${G},${B},0)`)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, CW, CH)

        // Radial bloom from left edge on strong bass
        if (bass > 0.35) {
          const bloom = ctx.createRadialGradient(0, CH * 0.5, 0, 0, CH * 0.5, CW * 0.45)
          bloom.addColorStop(0, `rgba(${R},${G},${B},${(bass * 0.035).toFixed(3)})`)
          bloom.addColorStop(1, `rgba(${R},${G},${B},0)`)
          ctx.fillStyle = bloom
          ctx.fillRect(0, 0, CW, CH)
        }
      }

      // ── Beat transient flash — brief sweep on drum hits ──────────────────
      if (transient > 0.05) {
        const fw = CW * Math.min(transient * 0.7, 0.5)
        const flash = ctx.createLinearGradient(0, 0, fw, 0)
        flash.addColorStop(0, `rgba(${R},${G},${B},${(transient * 0.11).toFixed(3)})`)
        flash.addColorStop(1, `rgba(${R},${G},${B},0)`)
        ctx.fillStyle = flash
        ctx.fillRect(0, 0, CW, CH)
      }

      // ── Drifting frequency columns ────────────────────────────────────────
      const NUM_COLS = 16
      const colW     = CW / NUM_COLS
      const now      = Date.now() / 1000
      for (let i = 0; i < NUM_COLS; i++) {
        const bin   = Math.floor((i / NUM_COLS) * NUM_BINS * 0.75)
        const drift = Math.sin(i * 0.28 + now * 0.45) * 0.14 + 0.86   // gentle sway
        const v     = decay[bin] * drift
        if (v < 0.05) continue
        ctx.fillStyle = `rgba(${R},${G},${B},${(v * 0.022).toFixed(3)})`
        ctx.fillRect(Math.round(i * colW), 0, Math.ceil(colW), CH)
      }

      // ── Treble shimmer at the top ─────────────────────────────────────────
      let trebleSum = 0
      for (let i = 40; i < NUM_BINS; i++) trebleSum += decay[i]
      const treble = Math.min(trebleSum / 24, 1)
      if (treble > 0.28) {
        const flashH = CH * 0.12
        const shimmer = ctx.createLinearGradient(0, 0, 0, flashH)
        shimmer.addColorStop(0, `rgba(248,234,195,${(treble * 0.04).toFixed(3)})`)
        shimmer.addColorStop(1, 'rgba(248,234,195,0)')
        ctx.fillStyle = shimmer
        ctx.fillRect(0, 0, CW, flashH)
      }

      return false
    }

    function activeLoop() {
      rafId = requestAnimationFrame(() => {
        if (!visible) { activeLoop(); return }
        const shouldSleep = drawFrame()
        if (shouldSleep) { scheduleWake() } else { activeLoop() }
      })
    }

    function scheduleWake() {
      timerId = window.setTimeout(checkForAudio, 200)
    }

    function checkForAudio() {
      const analyser = getAnalyser()
      if (analyser) {
        analyser.getByteFrequencyData(fftData)
        let sum = 0
        for (let i = 0; i < NUM_BINS; i++) sum += fftData[i]
        if (sum / NUM_BINS > 2) { activeLoop(); return }
      }
      scheduleWake()
    }

    scheduleWake()

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(timerId)
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
