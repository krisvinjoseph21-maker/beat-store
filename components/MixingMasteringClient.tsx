'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, Star, X } from 'lucide-react'

interface Package {
  id: string
  name: string
  price: string
  dotColor: string
  features: string[]
}

const PACKAGES: Package[] = [
  {
    id: 'basic-mix',
    name: 'Basic Mix',
    price: '£40',
    dotColor: '#a855f7',
    features: [
      'Mixdown of your stereo beat and vocals',
      'Balance, EQ, light reverb/delay, basic automation',
      'MP3 + WAV delivered',
    ],
  },
  {
    id: 'full-mix',
    name: 'Full Mix (Stems)',
    price: '£60',
    dotColor: '#3b82f6',
    features: [
      'Full stem-level mix of your vocals + beat stems',
      'Volume balancing, EQ, compression, reverb, FX, automation',
      'More detail and control for a pro finish',
      'MP3 + WAV delivered',
      '1 free revision',
    ],
  },
  {
    id: 'mix-master',
    name: 'Mix + Master Bundle',
    price: '£80',
    dotColor: '#ef4444',
    features: [
      'Everything from Full Mix',
      'Plus a final master ready for release',
      'Punchier, louder, and optimised for streaming',
      'MP3 + WAV + Master WAV delivered',
      '2 free revisions',
    ],
  },
]

interface Review {
  id: string
  author: string
  rating: number
  body: string
  created_at: string
}

interface FormState {
  artistName: string
  email: string
  serviceType: string
  projectDetails: string
}

interface ReviewFormState {
  author: string
  rating: number
  review: string
}

export default function MixingMasteringClient() {
  const [selected, setSelected] = useState<Package>(PACKAGES[0])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>({ artistName: '', email: '', serviceType: PACKAGES[0].name, projectDetails: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState<ReviewFormState>({ author: '', rating: 5, review: '' })
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewSending, setReviewSending] = useState(false)
  const [reviewSent, setReviewSent] = useState(false)
  const [reviewError, setReviewError] = useState('')

  useEffect(() => {
    fetch('/api/reviews')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setReviews(data) })
      .catch(() => {})
      .finally(() => setReviewsLoading(false))
  }, [])

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    setReviewSending(true)
    setReviewError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      })
      if (res.ok) {
        setReviewSent(true)
        const newReview: Review = {
          id: crypto.randomUUID(),
          author: reviewForm.author,
          rating: reviewForm.rating,
          body: reviewForm.review,
          created_at: new Date().toISOString(),
        }
        setReviews((prev) => [newReview, ...prev])
        setReviewForm({ author: '', rating: 5, review: '' })
      } else {
        const json = await res.json().catch(() => ({}))
        setReviewError((json as { error?: string }).error ?? 'Failed to submit. Please try again.')
      }
    } catch {
      setReviewError('Failed to submit. Please try again.')
    } finally {
      setReviewSending(false)
    }
  }

  function selectPackage(pkg: Package) {
    setSelected(pkg)
    setForm((f) => ({ ...f, serviceType: pkg.name }))
  }

  function openModal() {
    setSent(false)
    setError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  useEffect(() => {
    if (!modalOpen) return
    const modal = modalRef.current
    if (!modal) return
    const previousFocus = document.activeElement as HTMLElement | null
    const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    modal.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { closeModal(); return }
      if (e.key !== 'Tab') return
      const focusable = Array.from(modal!.querySelectorAll<HTMLElement>(FOCUSABLE))
      const firstEl = focusable[0]
      const lastEl = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === firstEl) { e.preventDefault(); lastEl?.focus() }
      } else {
        if (document.activeElement === lastEl) { e.preventDefault(); firstEl?.focus() }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [modalOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) setSent(true)
      else setError('Failed to send. Please try again.')
    } catch {
      setError('Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="flex min-h-[calc(100vh-48px)]">

        {/* LEFT — sticky panel (desktop) */}
        <div className="hidden lg:flex w-1/2 sticky top-[48px] h-[calc(100vh-48px)] flex-col items-center justify-center overflow-hidden bg-surface-3 select-none">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(200,168,106,0.08) 0%, transparent 70%)' }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)', backgroundSize: '48px 48px' }}
          />
          <div className="relative z-10 flex flex-col items-center gap-5 px-12 text-center">
            <div className="w-1.5 h-1.5 rounded-full bg-accent mb-2" />
            <p
              className="font-display uppercase leading-none text-foreground"
              style={{ fontSize: 'clamp(42px, 4.5vw, 72px)', letterSpacing: '-0.01em' }}
            >
              Mixing &amp;<br />Mastering
            </p>
            <div className="w-10 h-px bg-white/10" />
            <p
              className="text-[11px] font-semibold uppercase text-muted-low"
              style={{ letterSpacing: '0.28em', fontFamily: 'var(--font-montserrat)' }}
            >
              Your Mix, Dialled In
            </p>
            <p className="mt-6 text-[11px] text-muted-low" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '0.12em' }}>
              @PRODKJBEATS
            </p>
          </div>
        </div>

        {/* Mobile banner */}
        <div
          className="lg:hidden w-full flex flex-col items-center justify-center bg-surface-3 select-none"
          style={{ height: '200px' }}
        >
          <div
            className="pointer-events-none absolute inset-x-0"
            style={{ height: '200px', background: 'radial-gradient(ellipse 80% 100% at 50% 50%, rgba(200,168,106,0.07) 0%, transparent 70%)' }}
          />
          <div className="relative z-10 text-center">
            <p
              className="font-display uppercase text-foreground leading-none"
              style={{ fontSize: 'clamp(32px, 8vw, 52px)' }}
            >
              Mix &amp; Master
            </p>
            <p className="mt-2 text-[10px] font-semibold uppercase text-muted-low" style={{ letterSpacing: '0.28em', fontFamily: 'var(--font-montserrat)' }}>
              Your Mix, Dialled In
            </p>
          </div>
        </div>

        {/* RIGHT — scrollable content */}
        <div className="w-full lg:w-1/2 px-8 lg:px-14 py-14 lg:py-16">

          {/* ── Product header ── */}
          <div className="mb-8">
            <p className="text-[10px] font-semibold uppercase text-muted-low mb-2" style={{ letterSpacing: '0.28em', fontFamily: 'var(--font-montserrat)' }}>
              PRODKJBEATS
            </p>
            <h1 className="font-display text-4xl sm:text-5xl uppercase text-foreground leading-none mb-4">
              Mixing &amp;<br />Mastering
            </h1>
            <p className="text-3xl font-black text-foreground mb-0.5">{selected.price}</p>
            <p className="text-[12px] text-muted-low">Taxes included.</p>
          </div>

          {/* ── Package selector ── */}
          <div className="mb-8">
            <p className="text-[11px] font-semibold text-muted-mid mb-3" style={{ fontFamily: 'var(--font-inter)' }}>
              Mixing &amp; Mastering
            </p>
            <div className="flex flex-wrap gap-2">
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => selectPackage(pkg)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors min-h-[40px] ${
                    selected.id === pkg.id
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-transparent text-foreground border-line-card hover:border-muted'
                  }`}
                >
                  {pkg.name}
                </button>
              ))}
            </div>
          </div>

          {/* ── Selected package features ── */}
          <div className="mb-8 border border-line-card bg-surface-1 p-5">
            <ul className="space-y-2">
              {selected.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <Check size={13} className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* ── CTA ── */}
          <button
            onClick={openModal}
            className="w-full border border-line-card bg-transparent py-4 text-sm font-bold text-foreground hover:bg-white/5 transition-colors min-h-[52px] mb-3"
          >
            Book a Session
          </button>
          <button
            onClick={openModal}
            className="w-full bg-[#5a31f4] py-4 text-sm font-bold text-white hover:bg-[#4b28d4] transition-colors min-h-[52px]"
          >
            Enquire Now
          </button>

          {/* ── Divider ── */}
          <div className="my-12 border-t border-line-card" />

          {/* ── Long description ── */}
          <div className="mb-12">
            <h2 className="font-display text-2xl sm:text-3xl uppercase text-foreground leading-none mb-4">
              🎚 Your Mix, Dialled In.
            </h2>
            <p className="text-[14px] text-muted leading-relaxed mb-6" style={{ fontFamily: 'var(--font-inter)' }}>
              Whether you need a quick polish or a full stem-level mixdown, this service gives your track the clarity, punch, and space it needs to compete.
            </p>
            <p className="text-[14px] text-muted leading-relaxed mb-6" style={{ fontFamily: 'var(--font-inter)' }}>
              Pick the package that fits your needs — and add any extras if you want to take it even further.
            </p>
            <p className="text-[13px] font-semibold text-foreground mb-1" style={{ fontFamily: 'var(--font-inter)' }}>
              Delivery: 48 hours turnaround
            </p>
          </div>

          {/* ── Full packages breakdown ── */}
          <div className="mb-12">
            <p className="text-[13px] font-semibold text-foreground mb-6" style={{ fontFamily: 'var(--font-inter)' }}>
              🧾 What&apos;s Included by Package:
            </p>

            <div className="flex flex-col gap-6">
              {PACKAGES.map((pkg) => (
                <div key={pkg.id} className="border border-line-card bg-surface-1 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: pkg.dotColor }}
                    />
                    <p className="text-base font-black text-foreground">
                      {pkg.name} — {pkg.price}
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted" style={{ fontFamily: 'var(--font-inter)' }}>
                        <Check size={12} className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[13px] text-muted leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
              Let me know if you want it all done for you in a custom bundle, or if you&apos;re working on a project that needs full sound direction — I also offer Executive Production.
            </p>
          </div>

          {/* ── Reviews ── */}
          <div className="border-t border-line-card pt-10">

            {/* Header row */}
            <div className="flex items-center justify-between mb-6">
              <p className="font-display text-3xl uppercase text-foreground leading-none">Customer Reviews</p>
              {!showReviewForm && !reviewSent && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="text-sm font-semibold text-foreground border border-line-card px-4 py-2 hover:border-muted transition-colors"
                >
                  Write a review
                </button>
              )}
            </div>

            {/* Rating summary */}
            {reviews.length > 0 && (() => {
              const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
              return (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={16} className={s <= Math.round(avg) ? 'text-accent fill-accent' : 'text-muted-low'} aria-hidden="true" />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{avg.toFixed(2)} out of 5</span>
                    <span className="text-xs text-muted-low">Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
                  </div>
                  <div className="space-y-1.5 mb-8">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter((r) => r.rating === star).length
                      const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-xs text-muted-low w-2">{star}</span>
                          <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-low w-3">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}

            {/* Write-a-review form */}
            {showReviewForm && !reviewSent && (
              <form onSubmit={submitReview} className="border border-line-card bg-surface-1 p-5 mb-8 space-y-4">
                <p className="text-sm font-semibold text-foreground">Leave a review</p>

                {/* Star picker */}
                <div>
                  <p className="text-xs text-muted-low mb-1.5">Rating *</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}
                        onMouseEnter={() => setReviewHover(s)}
                        onMouseLeave={() => setReviewHover(0)}
                        aria-label={`${s} star`}
                      >
                        <Star
                          size={22}
                          className={s <= (reviewHover || reviewForm.rating) ? 'text-accent fill-accent' : 'text-muted-low'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="rev-author" className="block text-xs text-muted-low mb-1.5">Name *</label>
                  <input
                    id="rev-author"
                    required
                    type="text"
                    maxLength={80}
                    value={reviewForm.author}
                    onChange={(e) => setReviewForm((f) => ({ ...f, author: e.target.value }))}
                    className="w-full border border-line-input bg-surface-1 px-4 py-3 text-sm text-foreground placeholder-muted-low outline-none focus:border-muted transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="rev-body" className="block text-xs text-muted-low mb-1.5">Review *</label>
                  <textarea
                    id="rev-body"
                    required
                    rows={4}
                    maxLength={1000}
                    value={reviewForm.review}
                    onChange={(e) => setReviewForm((f) => ({ ...f, review: e.target.value }))}
                    className="w-full border border-line-input bg-surface-1 px-4 py-3 text-sm text-foreground placeholder-muted-low outline-none focus:border-muted transition-colors resize-none"
                    placeholder="Share your experience…"
                  />
                </div>

                {reviewError && <p role="alert" className="text-sm text-danger">{reviewError}</p>}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={reviewSending}
                    className="flex-1 bg-white py-3 text-sm font-bold text-black hover:bg-white-hover transition-colors disabled:opacity-50"
                  >
                    {reviewSending ? 'Submitting…' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowReviewForm(false); setReviewError('') }}
                    className="px-4 py-3 text-sm text-muted-mid border border-line-card hover:border-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {reviewSent && (
              <div className="border border-line-card bg-surface-1 p-5 mb-8 text-center">
                <Check size={24} className="text-accent mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">Thanks for your review!</p>
              </div>
            )}

            {/* Individual reviews */}
            {reviewsLoading ? (
              <p className="text-sm text-muted-low">Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-muted-low">No reviews yet — be the first!</p>
            ) : (
              <div className="flex flex-col gap-0">
                {reviews.map((rev) => (
                  <div key={rev.id} className="border-t border-line-card pt-5 pb-5">
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} className={s <= rev.rating ? 'text-accent fill-accent' : 'text-muted-low'} aria-hidden="true" />
                      ))}
                    </div>
                    <p className="text-xs text-muted-low mb-2">
                      {new Date(rev.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                    <p className="text-sm font-semibold text-foreground mb-1">{rev.author}</p>
                    <p className="text-sm text-muted leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>{rev.body}</p>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* ── Inquiry modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mm-modal-title"
            className="relative w-full sm:max-w-xl border border-line-card bg-surface-2 p-7 animate-fade-in max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-none"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 id="mm-modal-title" className="font-display text-2xl uppercase text-foreground leading-none">Book a Session</h2>
                <p className="text-xs text-muted mt-0.5">{selected.name}</p>
              </div>
              <button
                onClick={closeModal}
                aria-label="Close inquiry form"
                className="flex h-9 w-9 items-center justify-center rounded hover:bg-white/10 transition-colors text-muted-mid"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {sent ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <Check size={30} className="text-accent" aria-hidden="true" />
                </div>
                <p className="font-display text-3xl uppercase text-foreground leading-none">Inquiry Sent.</p>
                <p className="mt-2 text-sm text-muted-mid">I&apos;ll get back to you within 24 hours.</p>
                <button
                  onClick={closeModal}
                  className="mt-6 border border-line-input px-8 py-3 text-sm text-foreground hover:border-muted transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="mm-artist" className="block text-sm font-semibold text-foreground mb-2">Artist Name *</label>
                  <input
                    id="mm-artist"
                    required
                    type="text"
                    autoComplete="name"
                    value={form.artistName}
                    onChange={(e) => setForm((f) => ({ ...f, artistName: e.target.value }))}
                    className="w-full border border-line-input bg-surface-1 px-4 py-3.5 text-base text-foreground placeholder-muted-low outline-none focus:border-muted transition-colors"
                    placeholder="Your artist name"
                  />
                </div>
                <div>
                  <label htmlFor="mm-email" className="block text-sm font-semibold text-foreground mb-2">Email *</label>
                  <input
                    id="mm-email"
                    required
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full border border-line-input bg-surface-1 px-4 py-3.5 text-base text-foreground placeholder-muted-low outline-none focus:border-muted transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="mm-service" className="block text-sm font-semibold text-foreground mb-2">Package</label>
                  <input
                    id="mm-service"
                    readOnly
                    value={form.serviceType}
                    className="w-full border border-line-input bg-surface-3 px-4 py-3.5 text-base text-muted outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label htmlFor="mm-details" className="block text-sm font-semibold text-foreground mb-2">Project Details *</label>
                  <textarea
                    id="mm-details"
                    required
                    rows={6}
                    value={form.projectDetails}
                    onChange={(e) => setForm((f) => ({ ...f, projectDetails: e.target.value }))}
                    className="w-full border border-line-input bg-surface-1 px-4 py-3.5 text-base text-foreground placeholder-muted-low outline-none focus:border-muted transition-colors resize-none"
                    placeholder="Tell me about your project, references, timeline…"
                  />
                </div>
                {error && <p role="alert" className="animate-shake text-sm text-danger">{error}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-white py-4 text-base font-bold text-black hover:bg-white-hover transition-colors disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send Inquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
