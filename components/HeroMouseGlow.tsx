'use client'

import { useEffect, useRef } from 'react'

export default function HeroMouseGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const section = el.parentElement
    if (!section) return

    // Cache rect — reading getBoundingClientRect on every mousemove forces layout flush
    let rect = section.getBoundingClientRect()
    let rafId: number | null = null
    let pendingX = 0
    let pendingY = 0

    const resizeObserver = new ResizeObserver(() => {
      rect = section.getBoundingClientRect()
    })
    resizeObserver.observe(section)

    function onMove(e: MouseEvent) {
      pendingX = e.clientX - rect.left
      pendingY = e.clientY - rect.top
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        el!.style.opacity = '1'
        el!.style.background = `radial-gradient(650px circle at ${pendingX}px ${pendingY}px, rgba(255,255,255,0.055), transparent 70%)`
      })
    }

    function onLeave() {
      if (el) el.style.opacity = '0'
    }

    section.addEventListener('mousemove', onMove)
    section.addEventListener('mouseleave', onLeave)
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      section.removeEventListener('mousemove', onMove)
      section.removeEventListener('mouseleave', onLeave)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 opacity-0"
      style={{ zIndex: 3, transition: 'opacity 0.4s ease' }}
    />
  )
}
