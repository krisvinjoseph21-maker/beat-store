'use client'

import { useEffect, useRef } from 'react'

export default function HeadlineParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let rafId: number | null = null
    let pendingX = 0
    let pendingY = 0

    function onMove(e: MouseEvent) {
      pendingX = (window.innerWidth  / 2 - e.pageX) / 40
      pendingY = (window.innerHeight / 2 - e.pageY) / 40
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        el!.style.transform = `translate(${pendingX}px, ${pendingY}px)`
      })
    }

    window.addEventListener('mousemove', onMove)
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <div ref={ref} className="hero-headline-wrap" style={{ transition: 'transform 0.15s ease-out' }}>
      {children}
    </div>
  )
}
