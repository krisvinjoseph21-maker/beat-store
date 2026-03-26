'use client'

import { useState, useEffect } from 'react'
import BeatCard from './BeatCard'
import LicenseModal from './LicenseModal'
import type { Beat } from '@/lib/store'
import { useCartStore, usePlayerStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

export default function HomeFeaturedBeats({ beats }: { beats: Beat[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { licenseType, quantityTier, items } = useCartStore()
  const { setQueue } = usePlayerStore()
  const router = useRouter()

  useEffect(() => {
    if (beats.length > 0) setQueue(beats)
  }, [beats, setQueue])

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beatIds: items.map((i) => i.beat.id),
          licenseType,
          quantityTier,
        }),
      })
      const data = await res.json()
      if (data.url) router.push(data.url)
      else alert('Checkout failed. Please try again.')
    } catch {
      alert('Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="rounded-xl border border-[#1a1a1a] overflow-hidden">
        {beats.map((beat, i) => (
          <BeatCard
            key={beat.id}
            beat={beat}
            index={i + 1}
            onBuyClick={() => setModalOpen(true)}
          />
        ))}
      </div>
      <LicenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCheckout={() => {
          setModalOpen(false)
          handleCheckout()
        }}
      />
    </>
  )
}
