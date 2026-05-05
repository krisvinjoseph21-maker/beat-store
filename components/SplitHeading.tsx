'use client'

import { useEffect, useRef } from 'react'

interface Props {
  children: string
  className?: string
  style?: React.CSSProperties
  id?: string
  as?: 'h1' | 'h2' | 'h3'
  delay?: number
}

export default function SplitHeading({ children, className = '', style, id, as = 'h2', delay = 0 }: Props) {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ref.current
    if (!el) return

    const wordEls = el.querySelectorAll<HTMLElement>('.word-inner')

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          wordEls.forEach((w, i) => {
            w.style.transitionDelay = `${delay + i * 68}ms`
            w.classList.add('word-in')
          })
        } else {
          wordEls.forEach(w => {
            w.style.transitionDelay = '0ms'
            w.classList.remove('word-in')
          })
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  const Tag: React.ElementType = as
  const words = children.split(' ')

  return (
    <Tag ref={ref} id={id} className={className} style={style}>
      {words.map((word, i) => (
        <span key={i} className="word-wrap">
          <span className="word-inner">{word}</span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </Tag>
  )
}
