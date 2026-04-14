'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  value: string      // e.g. "5+" or "4"
  className?: string
}

export default function AnimatedStat({ value, className = '' }: Props) {
  const ref        = useRef<HTMLSpanElement>(null)
  const animated   = useRef(false)
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const match = value.match(/^(\d+)(.*)$/)
    if (!match) { setDisplay(value); return }

    const target = parseInt(match[1], 10)
    const suffix = match[2] ?? ''

    setDisplay(`0${suffix}`)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || animated.current) return
        animated.current = true
        observer.disconnect()

        const DURATION = 1400
        const start    = performance.now()

        function tick(now: number) {
          const elapsed  = now - start
          const t        = Math.min(elapsed / DURATION, 1)
          // ease-out expo
          const eased    = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
          setDisplay(`${Math.round(eased * target)}${suffix}`)
          if (t < 1) requestAnimationFrame(tick)
        }

        requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return <span ref={ref} className={className}>{display}</span>
}
