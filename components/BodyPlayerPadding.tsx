'use client'

import { useEffect } from 'react'
import { usePlayerStore } from '@/lib/store'

export default function BodyPlayerPadding() {
  const currentBeat = usePlayerStore((s) => s.currentBeat)

  useEffect(() => {
    document.body.style.paddingBottom = currentBeat
      ? 'calc(64px + env(safe-area-inset-bottom, 0px))'
      : 'env(safe-area-inset-bottom, 0px)'
  }, [currentBeat])

  return null
}
