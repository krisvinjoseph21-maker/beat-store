'use client'

import { useEffect, useRef } from 'react'

export default function HeroMouseGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Attach to the parent section directly — no getElementById needed
    const section = el.parentElement
    if (!section) return

    function onMove(e: MouseEvent) {
      const rect = section!.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      el!.style.opacity = '1'
      el!.style.background = `radial-gradient(650px circle at ${x}px ${y}px, rgba(255,255,255,0.055), transparent 70%)`
    }

    function onLeave() {
      if (el) el.style.opacity = '0'
    }

    section.addEventListener('mousemove', onMove)
    section.addEventListener('mouseleave', onLeave)
    return () => {
      section.removeEventListener('mousemove', onMove)
      section.removeEventListener('mouseleave', onLeave)
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
