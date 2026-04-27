'use client'

import { type RefObject, useEffect } from 'react'

const TILT_RANGE   = 380   // px from row center — rows beyond this are ignored
const MAX_TILT     = 1.2   // max degrees of rotation
const MAGNET_RANGE = 62    // px from play-button center for magnetic pull
const MAGNET_SCALE = 0.38  // fraction of (offset × strength) applied as translate

/**
 * Attaches a pointer-driven spring tilt + magnetic play-button effect to every
 * [data-row] element inside containerRef. All motion happens via direct DOM
 * style updates — zero React re-renders, zero layout thrash.
 *
 * Skipped entirely on touch-primary (pointer: coarse) devices.
 * The RAF loop only runs when the pointer is inside the container AND has moved.
 */
export function useRowSpring(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const containerOrNull = containerRef.current
    if (!containerOrNull) return
    const container: HTMLElement = containerOrNull
    if (window.matchMedia('(pointer: coarse)').matches) return

    let px = -9999, py = -9999
    let alive    = false   // pointer inside container
    let hasMoved = false   // pointer moved since last frame
    let rafId    = 0
    const active = new Set<HTMLElement>()

    function resetRow(row: HTMLElement) {
      row.style.setProperty('--rx', '0deg')
      row.style.setProperty('--ry', '0deg')
      row.dataset.resting = '1'              // triggers slow-return CSS transition
      row.style.willChange = 'auto'
      const btn = row.querySelector<HTMLElement>('[data-play-btn]')
      if (btn) {
        btn.style.setProperty('--mx', '0px')
        btn.style.setProperty('--my', '0px')
      }
    }

    function onMove(e: PointerEvent) {
      px = e.clientX; py = e.clientY
      alive = true; hasMoved = true
    }

    function onLeave() {
      alive = false
      active.forEach(resetRow)
      active.clear()
    }

    function tick() {
      rafId = requestAnimationFrame(tick)
      if (!alive || !hasMoved) return   // idle — CSS handles ongoing transitions
      hasMoved = false

      const rows = container.querySelectorAll<HTMLElement>('[data-row]')
      const next = new Set<HTMLElement>()

      for (const row of rows) {
        const r   = row.getBoundingClientRect()
        const cx  = r.left + r.width  * 0.5
        const cy  = r.top  + r.height * 0.5
        const dx  = px - cx
        const dy  = py - cy
        const dist = Math.hypot(dx, dy)

        if (dist < TILT_RANGE) {
          const t  = 1 - dist / TILT_RANGE
          // rotateX: positive = tilt top toward viewer (cursor below center)
          // rotateY: positive = tilt right toward viewer (cursor right of center)
          const rx = (-(dy / Math.max(r.height * 0.5, 1)) * MAX_TILT * t).toFixed(2)
          const ry = ( (dx / Math.max(r.width  * 0.5, 1)) * MAX_TILT * t).toFixed(2)

          row.style.setProperty('--rx', `${rx}deg`)
          row.style.setProperty('--ry', `${ry}deg`)
          delete row.dataset.resting          // fast-response CSS transition
          row.style.willChange = 'transform'
          next.add(row)

          // Magnetic play button
          const btn = row.querySelector<HTMLElement>('[data-play-btn]')
          if (btn) {
            const br  = btn.getBoundingClientRect()
            const bcx = br.left + br.width  * 0.5
            const bcy = br.top  + br.height * 0.5
            const bdx = px - bcx
            const bdy = py - bcy
            const bd  = Math.hypot(bdx, bdy)

            if (bd < MAGNET_RANGE) {
              const mt  = (1 - bd / MAGNET_RANGE) ** 1.5  // ease the pull
              const clamp = (v: number) => Math.max(-6, Math.min(6, v))
              btn.style.setProperty('--mx', `${clamp(bdx * mt * MAGNET_SCALE).toFixed(1)}px`)
              btn.style.setProperty('--my', `${clamp(bdy * mt * MAGNET_SCALE).toFixed(1)}px`)
            } else {
              btn.style.setProperty('--mx', '0px')
              btn.style.setProperty('--my', '0px')
            }
          }
        } else if (active.has(row)) {
          resetRow(row)
        }
      }

      // Rows that exited the active set this frame
      for (const row of active) {
        if (!next.has(row)) resetRow(row)
      }
      active.clear()
      for (const row of next) active.add(row)
    }

    container.addEventListener('pointermove', onMove, { passive: true })
    container.addEventListener('pointerleave', onLeave)
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerleave', onLeave)
      active.forEach(resetRow)
    }
  }, [containerRef])
}
