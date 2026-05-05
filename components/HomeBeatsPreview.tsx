'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/lib/store'
import BeatCard from './BeatCard'
import type { Beat } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { useRowSpring } from '@/lib/use-row-spring'

export default function HomeBeatsPreview({ beats }: { beats: Beat[] }) {
  const t = useT()
  const { setQueue } = usePlayerStore()
  const listContainerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  useRowSpring(listContainerRef)

  useEffect(() => {
    if (beats.length > 0) setQueue(beats)
  }, [beats, setQueue])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('beats-preview-visible')
        } else {
          el.classList.remove('beats-preview-visible')
        }
      },
      { threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={listContainerRef} className="relative overflow-hidden" style={{ perspective: '1200px' }}>
      <div className="hidden sm:flex items-center gap-3 px-4 sm:px-10 py-3 border-b border-line bg-background">
        <span className="w-6 flex-shrink-0" />
        <span className="w-11 flex-shrink-0" />
        <span
          className="font-montserrat flex-1 text-[10px] font-bold uppercase"
          style={{ letterSpacing: '0.18em', color: 'var(--muted-low)' }}
        >
          {t.store.tableTitle}
        </span>
        <span
          className="font-montserrat hidden md:block text-[10px] font-bold uppercase text-center"
          style={{ letterSpacing: '0.18em', color: 'var(--muted-low)', width: '200px' }}
        >
          {t.store.tableGenre}
        </span>
        <span style={{ width: '160px' }} />
      </div>
      <div ref={listRef} role="list" aria-label="Beat tracks">
        {beats.map((beat, i) => (
          <div key={beat.id} className="beat-reveal-row">
            <BeatCard
              beat={beat}
              index={i + 1}
              onBuyClick={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
