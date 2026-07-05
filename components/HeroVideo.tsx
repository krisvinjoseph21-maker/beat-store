'use client'

import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  const mql = window.matchMedia('(min-width: 640px)')
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot() {
  return window.matchMedia('(min-width: 640px)').matches
}

function getServerSnapshot() {
  return false
}

export default function HeroVideo() {
  const show = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

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
