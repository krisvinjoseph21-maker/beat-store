'use client'

import { useEffect, useRef } from 'react'

export default function HeadlineParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onMove(e: MouseEvent) {
      const x = (window.innerWidth  / 2 - e.pageX) / 40
      const y = (window.innerHeight / 2 - e.pageY) / 40
      el!.style.transform = `translate(${x}px, ${y}px)`
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div ref={ref} className="hero-headline-wrap" style={{ transition: 'transform 0.15s ease-out' }}>
      {children}
    </div>
  )
}
