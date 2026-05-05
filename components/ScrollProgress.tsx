'use client'

import { useEffect, useRef } from 'react'

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return

    function update() {
      const doc = document.documentElement
      const pct = doc.scrollHeight > doc.clientHeight
        ? doc.scrollTop / (doc.scrollHeight - doc.clientHeight)
        : 0
      bar!.style.transform = `scaleX(${pct})`
    }

    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[200] pointer-events-none"
      style={{ background: 'var(--accent)', transform: 'scaleX(0)' }}
    />
  )
}
