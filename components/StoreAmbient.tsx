'use client'

/**
 * Audio-reactive ambient canvas behind the beat store list.
 *
 * Performance design:
 *   - Sleeps completely (no RAF, no CPU) when no audio is playing.
 *   - Polls with setTimeout(200ms) while idle, wakes to RAF when energy detected.
 *   - DPR fixed at 1.0 — the effect is large soft gradients, sub-pixel rendering
 *     adds nothing visible but doubles GPU work on retina screens.
 *   - mix-blend-mode: screen so black pixels are free (invisible).
 */

import { useEffect, useRef } from 'react'
import { getAnalyser } from '@/lib/audio-analyser'

const AR = 200, AG = 168, AB = 106   /* --accent rgb components */
const SLEEP_THRESHOLD = 0.008        /* total energy below this → sleep */

export default function StoreAmbient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    /* Fixed DPR of 1 — soft gradients don't need retina resolution */
    let rafId    = 0
    let timerId  = 0
    let visible  = true
    let sleeping = true   /* start sleeping; audio will wake us */

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

    const NUM_BINS  = 64
    const fftData   = new Uint8Array(NUM_BINS)
    const decayBins = new Float32Array(NUM_BINS)
    const cvs = canvas
    const ctx2 = ctx

    function drawFrame() {
      if (cvs.width === 0 || cvs.height === 0) return

      ctx2.clearRect(0, 0, cvs.width, cvs.height)

      const analyser = getAnalyser()
      if (analyser) analyser.getByteFrequencyData(fftData)

      /* Decay */
      let totalEnergy = 0
      for (let i = 0; i < NUM_BINS; i++) {
        const v = analyser ? fftData[i] / 255 : 0
        decayBins[i] = v > decayBins[i] ? v : Math.max(0, decayBins[i] - 0.014)
        totalEnergy += decayBins[i]
      }

      /* If all energy has decayed to nothing, clear and go to sleep */
      if (totalEnergy < SLEEP_THRESHOLD) {
        ctx2.clearRect(0, 0, cvs.width, cvs.height)
        return true  /* signal: sleep */
      }

      const CW = cvs.width
      const CH = cvs.height

      /* Bass wash (bins 0–7) */
      let bassSum = 0
      for (let i = 0; i < 8; i++) bassSum += decayBins[i]
      const bass = Math.min(bassSum / 8, 1)

      if (bass > 0.015) {
        const grad = ctx2.createLinearGradient(0, 0, CW * (0.55 + bass * 0.3), 0)
        grad.addColorStop(0,    `rgba(${AR},${AG},${AB},${(bass * 0.055).toFixed(3)})`)
        grad.addColorStop(0.35, `rgba(${AR},${AG},${AB},${(bass * 0.018).toFixed(3)})`)
        grad.addColorStop(1,    `rgba(${AR},${AG},${AB},0)`)
        ctx2.fillStyle = grad
        ctx2.fillRect(0, 0, CW, CH)

        if (bass > 0.35) {
          const bloom = ctx2.createRadialGradient(0, CH * 0.5, 0, 0, CH * 0.5, CW * 0.45)
          bloom.addColorStop(0, `rgba(${AR},${AG},${AB},${(bass * 0.035).toFixed(3)})`)
          bloom.addColorStop(1, `rgba(${AR},${AG},${AB},0)`)
          ctx2.fillStyle = bloom
          ctx2.fillRect(0, 0, CW, CH)
        }
      }

      /* Frequency columns — 16 (was 32, half saves fillRect calls) */
      const NUM_COLS = 16
      const colW = CW / NUM_COLS
      for (let i = 0; i < NUM_COLS; i++) {
        const bin = Math.floor((i / NUM_COLS) * NUM_BINS * 0.75)
        const v   = decayBins[bin]
        if (v < 0.06) continue
        ctx2.fillStyle = `rgba(${AR},${AG},${AB},${(v * 0.02).toFixed(3)})`
        ctx2.fillRect(Math.round(i * colW), 0, Math.ceil(colW), CH)
      }

      /* Treble flash (bins 40–63) */
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

      return false  /* not sleeping */
    }

    /* Active render loop (RAF) */
    function activeLoop() {
      rafId = requestAnimationFrame(() => {
        if (!visible) { activeLoop(); return }
        const shouldSleep = drawFrame()
        if (shouldSleep) {
          sleeping = true
          scheduleWake()
        } else {
          activeLoop()
        }
      })
    }

    /* Idle polling — check every 200ms if audio has started, cheap */
    function scheduleWake() {
      timerId = window.setTimeout(checkForAudio, 200)
    }

    function checkForAudio() {
      const analyser = getAnalyser()
      if (analyser) {
        analyser.getByteFrequencyData(fftData)
        let sum = 0
        for (let i = 0; i < NUM_BINS; i++) sum += fftData[i]
        if (sum / NUM_BINS > 2) {   /* non-trivial signal detected */
          sleeping = false
          activeLoop()
          return
        }
      }
      scheduleWake()   /* still silent, check again later */
    }

    /* Boot — start in idle mode */
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
