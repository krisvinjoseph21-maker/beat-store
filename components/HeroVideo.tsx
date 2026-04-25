'use client'

import { useEffect, useState } from 'react'

export default function HeroVideo() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(min-width: 640px)').matches) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  return (
    <video
      className="absolute inset-0 w-full h-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
    >
      <source src="/videos/hero.mp4" type="video/mp4" />
    </video>
  )
}
