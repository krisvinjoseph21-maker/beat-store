'use client'

import { useEffect, useRef } from 'react'

export default function HeroMouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const glow = glowRef.current
    if (!glow) return

    function onMouseMove(e: MouseEvent) {
      const hero = document.getElementById('hero-section')
      if (!hero || !glow) return
      const rect = hero.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Hide glow when cursor leaves the hero
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        glow.style.opacity = '0'
        return
      }

      glow.style.opacity = '1'
      glow.style.background = `radial-gradient(700px circle at ${x}px ${y}px, rgba(255,255,255,0.05), transparent 55%)`
    }

    function onMouseLeave() {
      if (glow) glow.style.opacity = '0'
    }

    window.addEventListener('mousemove', onMouseMove)
    document.getElementById('hero-section')?.addEventListener('mouseleave', onMouseLeave)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.getElementById('hero-section')?.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <div
      ref={glowRef}
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
      style={{ zIndex: 2 }}
    />
  )
}
