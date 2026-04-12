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
  const [checkoutError, setCheckoutError] = useState('')
  const { licenseType, quantityTier, items } = useCartStore()
  const { setQueue } = usePlayerStore()
  const router = useRouter()

  useEffect(() => {
    if (beats.length > 0) setQueue(beats)
  }, [beats, setQueue])

  async function handleCheckout() {
    setLoading(true)
    setCheckoutError('')
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
      else setCheckoutError('Checkout failed. Please try again.')
    } catch {
      setCheckoutError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="border border-line">
        {beats.map((beat, i) => (
          <BeatCard
            key={beat.id}
            beat={beat}
            index={i + 1}
            onBuyClick={() => setModalOpen(true)}
          />
        ))}
      </div>
      {checkoutError && (
        <p role="alert" className="mt-3 text-[12px] text-danger text-center">
          {checkoutError}
        </p>
      )}
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
