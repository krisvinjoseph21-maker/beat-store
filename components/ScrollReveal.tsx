'use client'

import { useEffect, useRef } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right'
  variant?: 'up' | 'fade' | 'scale'
}

export default function ScrollReveal({ children, className = '', delay = 0, direction = 'up', variant = 'up' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            el.style.animationDelay = `${delay}ms`
          }
          el.classList.add('is-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.08 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  const dirClass =
    direction === 'left'  ? 'reveal-left'  :
    direction === 'right' ? 'reveal-right' : ''

  const variantClass =
    variant === 'fade'  ? 'reveal-fade'  :
    variant === 'scale' ? 'reveal-scale' : ''

  return (
    <div
      ref={ref}
      data-dir={direction !== 'up' ? direction : undefined}
      className={`scroll-reveal ${dirClass} ${variantClass} ${className}`.trim()}
    >
      {children}
    </div>
  )
}
