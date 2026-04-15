'use client'

import { useEffect, useRef, useState } from 'react'

export default function SpotifyEmbed({ trackId }: { trackId: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ height: '80px' }}>
      {active && (
        <iframe
          src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`}
          width="100%"
          height="80"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify track preview"
          className="rounded"
        />
      )}
    </div>
  )
}
