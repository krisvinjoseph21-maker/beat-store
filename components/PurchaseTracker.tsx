'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackPurchase } from '@/lib/analytics'

export default function PurchaseTracker() {
  const params = useSearchParams()
  const firedRef = useRef(false)

  useEffect(() => {
    const sessionId = params.get('session_id')
    if (!sessionId || firedRef.current) return
    firedRef.current = true

    fetch(`/api/order-details?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.items?.length) return
        trackPurchase(data.transactionId, data.items, data.value)
      })
      .catch(() => {})
  }, [params])

  return null
}
