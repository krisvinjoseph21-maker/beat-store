'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface MelodyPack {
  id: string
  title: string
  vendor: string
  description: string
  price: number
  compare_at_price: number | null
  cover_url: string | null
  is_featured: boolean
  created_at: string
}

export default function MelodyPackCard({ pack }: { pack: MelodyPack }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const isSale = pack.compare_at_price !== null && pack.compare_at_price > pack.price
  const isFree = pack.price === 0

  async function handleBuy() {
    if (isFree) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout/melody-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: pack.id }),
      })
      const data = await res.json()
      if (data.url) {
        router.push(data.url)
      } else {
        setError('Checkout failed. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col border border-[var(--line-card)] bg-[var(--surface-2)] overflow-hidden group">
      {/* Cover image */}
      <div className="relative aspect-square overflow-hidden bg-[var(--surface-3)]">
        {pack.cover_url ? (
          <Image
            src={pack.cover_url}
            alt={pack.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[var(--muted-low)] text-xs uppercase font-semibold">No Image</span>
          </div>
        )}
        {isSale && (
          <span
            className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10"
            aria-label="Sale"
          >
            Sale
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase text-[var(--muted-low)]" style={{ letterSpacing: '0.1em' }}>
            {pack.vendor}
          </p>
          <h3 className="mt-0.5 text-[14px] font-semibold text-foreground leading-snug">{pack.title}</h3>
        </div>

        <div className="flex items-baseline gap-2">
          {isSale ? (
            <>
              <span className="text-[12px] text-muted line-through">
                ${pack.compare_at_price!.toFixed(2)} USD
              </span>
              <span className="text-[14px] font-semibold text-foreground">
                {isFree ? 'From $0.00 USD' : `$${pack.price.toFixed(2)} USD`}
              </span>
            </>
          ) : (
            <span className="text-[14px] font-semibold text-foreground">
              {isFree ? 'Free' : `$${pack.price.toFixed(2)} USD`}
            </span>
          )}
        </div>

        {error && (
          <p className="text-[11px] text-danger">{error}</p>
        )}

        <button
          onClick={handleBuy}
          disabled={loading || isFree}
          className="mt-auto w-full border border-[var(--line-card)] py-3 text-[12px] font-semibold text-foreground transition-colors hover:bg-white hover:text-black hover:border-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Redirecting…
            </span>
          ) : isFree ? 'Coming Soon' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
