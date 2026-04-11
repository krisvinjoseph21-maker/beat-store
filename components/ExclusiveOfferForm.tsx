'use client'

import { useState } from 'react'
import { Crown, ChevronDown, ChevronUp } from 'lucide-react'

export default function ExclusiveOfferForm({ beatId, beatTitle }: { beatId: string; beatTitle: string }) {
  const [open, setOpen] = useState(false)
  const [artistName, setArtistName] = useState('')
  const [email, setEmail] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const price = Number(offerPrice)
    if (!price || price < 1) { setError('Enter a valid offer amount'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/exclusive-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beatId, artistName, email, offerPrice: price, message }),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
      } else {
        setError(data.error ?? 'Something went wrong')
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 rounded-sm border border-line-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="exclusive-offer-panel"
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Crown size={15} className="text-accent flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-white">Make an Exclusive Offer</p>
            <p className="text-xs text-muted">Own the full rights — beat removed from store</p>
          </div>
        </div>
        {open ? (
          <ChevronUp size={15} className="text-muted flex-shrink-0" />
        ) : (
          <ChevronDown size={15} className="text-muted flex-shrink-0" />
        )}
      </button>

      {open && (
        <div id="exclusive-offer-panel" className="border-t border-line-card px-5 py-5 bg-surface-3">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-accent font-semibold text-sm">Offer sent!</p>
              <p className="text-muted text-xs mt-1">
                We&apos;ll review your offer for <span className="text-white">{beatTitle}</span> and get back to you.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="offer-name" className="sr-only">Your name</label>
                  <input
                    id="offer-name"
                    required
                    type="text"
                    placeholder="Your name"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    maxLength={100}
                    className="w-full rounded-sm border border-line-input bg-surface-1 px-3 py-2.5 text-sm text-white placeholder-muted-low outline-none focus:border-muted transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="offer-email" className="sr-only">Your email</label>
                  <input
                    id="offer-email"
                    required
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-sm border border-line-input bg-surface-1 px-3 py-2.5 text-sm text-white placeholder-muted-low outline-none focus:border-muted transition-colors"
                  />
                </div>
              </div>

              <div className="relative">
                <label htmlFor="offer-price" className="sr-only">Your offer amount in dollars</label>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-mid text-sm font-bold" aria-hidden="true">$</span>
                <input
                  id="offer-price"
                  required
                  type="number"
                  min={1}
                  max={100000}
                  placeholder="Your offer (e.g. 500)"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full rounded-sm border border-line-input bg-surface-1 pl-7 pr-3 py-2.5 text-sm text-white placeholder-muted-low outline-none focus:border-muted transition-colors"
                />
              </div>

              <div>
                <label htmlFor="offer-message" className="sr-only">Additional message (optional)</label>
                <textarea
                  id="offer-message"
                  placeholder="Additional message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1000}
                  rows={2}
                  className="w-full resize-none rounded-sm border border-line-input bg-surface-1 px-3 py-2.5 text-sm text-white placeholder-muted-low outline-none focus:border-muted transition-colors"
                />
              </div>

              {error && <p role="alert" className="text-xs text-danger">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-sm bg-accent py-2.5 text-sm font-bold text-black hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send Exclusive Offer'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
