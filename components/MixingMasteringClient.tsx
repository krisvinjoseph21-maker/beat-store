'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Check, Minus, Plus, Star, X } from 'lucide-react'
import { useLocaleStore, formatPrice } from '@/lib/locale'
import { createBrowserClient } from '@/lib/supabase'
import { useT } from '@/lib/i18n'

interface Package {
  id: string
  name: string
  usdPrice: number
  dotColor: string
  features: string[]
}

const PACKAGES: Package[] = [
  {
    id: 'basic-mix',
    name: 'Basic Mix',
    usdPrice: 50,
    dotColor: 'var(--muted-mid)',
    features: [
      'Mixdown of your stereo beat and vocals',
      'Balance, EQ, light reverb/delay, basic automation',
      'MP3 + WAV delivered',
    ],
  },
  {
    id: 'full-mix',
    name: 'Full Mix (Stems)',
    usdPrice: 75,
    dotColor: 'var(--accent)',
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
    usdPrice: 100,
    dotColor: 'var(--foreground)',
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
  const [qty, setQty] = useState(1)
  const [mounted, setMounted] = useState(false)
  const currency = useLocaleStore((s) => s.currency)
  const t = useT()
  useEffect(() => { setMounted(true) }, [])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>({ artistName: '', email: '', serviceType: PACKAGES[0].name, projectDetails: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  // Auth
  const [user, setUser] = useState<{ id: string } | null | undefined>(undefined)
  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
  }, [])

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
        setReviews((prev) => [
          {
            id: crypto.randomUUID(),
            author: reviewForm.author,
            rating: reviewForm.rating,
            body: reviewForm.review,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
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
      else setError(t.services.error)
    } catch {
      setError('Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* ── Centered product section ── */}
      <div className="w-full flex flex-col items-center px-6 pt-16 pb-12">
        <div className="w-full max-w-[460px] flex flex-col items-center text-center">

          {/* Brand label */}
          <p className="text-[11px] font-normal uppercase text-muted-low mb-3" style={{ letterSpacing: '0.1em', fontFamily: 'var(--font-montserrat)' }}>
            PRODKJBEATS
          </p>

          {/* Title */}
          <h1 className="text-foreground leading-tight mb-5" style={{ fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 300 }}>
            Mixing &amp; Mastering
          </h1>

          {/* Price */}
          <p className="text-[22px] text-foreground mb-1" style={{ fontWeight: 500 }}>
            {mounted ? formatPrice(selected.usdPrice, currency) : `$${selected.usdPrice}`}
          </p>
          <p className="text-[12px] text-muted-low mb-8">{t.services.taxesIncluded}</p>

          {/* Package selector */}
          <div className="w-full mb-8">
            <p className="text-[11px] font-normal uppercase text-muted-low mb-3" style={{ letterSpacing: '0.08em', fontFamily: 'var(--font-inter)' }}>
              Mixing &amp; Mastering
            </p>
            <div className="flex flex-wrap justify-center gap-2">
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

          {/* Quantity stepper */}
          <div role="group" aria-label="Quantity" className="w-full mb-8">
            <p className="text-[13px] text-muted-mid mb-3" style={{ fontFamily: 'var(--font-inter)' }}>
              {t.services.quantity}
            </p>
            <div className="flex items-center justify-center">
              <div className="flex items-center border border-line-card">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="flex items-center justify-center w-12 h-12 text-foreground hover:bg-white/5 transition-colors"
                >
                  <Minus size={14} aria-hidden="true" />
                </button>
                <span className="w-12 text-center text-sm font-semibold text-foreground">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="flex items-center justify-center w-12 h-12 text-foreground hover:bg-white/5 transition-colors"
                >
                  <Plus size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="w-full flex flex-col gap-3 mb-4">
            <button
              onClick={openModal}
              className="w-full border border-line-card bg-transparent py-4 text-sm font-semibold text-foreground hover:bg-white/5 transition-colors min-h-[52px]"
            >
              {t.services.addToCart}
            </button>
            <button
              onClick={openModal}
              className="w-full bg-white py-4 text-sm font-bold text-black hover:bg-white-hover transition-colors min-h-[52px]"
            >
              {t.services.bookWith}
            </button>
          </div>

          <button
            onClick={openModal}
            className="text-sm text-foreground underline underline-offset-2 hover:text-muted transition-colors"
          >
            {t.services.morePayment}
          </button>

        </div>
      </div>

      {/* ── Divider ── */}
      <div className="w-full border-t border-line-card" />

      {/* ── Scroll content — centered, wider ── */}
      <div className="w-full flex flex-col items-center px-6 py-16">
        <div className="w-full max-w-[680px]">

          {/* Long description */}
          <div className="mb-14">
            <h2 className="font-display text-3xl sm:text-4xl text-foreground leading-tight mb-5">
              Your Mix, Dialled In.
            </h2>
            <p className="text-[15px] text-muted leading-relaxed mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
              Whether you need a quick polish or a full stem-level mixdown, this service gives your track the clarity, punch, and space it needs to compete.
            </p>
            <p className="text-[15px] text-muted leading-relaxed mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
              Pick the package that fits your needs — and add any extras if you want to take it even further.
            </p>
            <p className="text-[14px] font-semibold text-foreground" style={{ fontFamily: 'var(--font-inter)' }}>
              Delivery: 48 hours turnaround
            </p>
          </div>

          {/* Packages breakdown */}
          <div className="mb-14">
            <p className="text-[13px] font-medium text-foreground mb-8" style={{ fontFamily: 'var(--font-inter)' }}>
              What&apos;s Included by Package:
            </p>
            <div className="flex flex-col gap-8">
              {PACKAGES.map((pkg) => (
                <div key={pkg.id}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: pkg.dotColor }} />
                    <p className="text-[15px] font-medium text-foreground" style={{ fontFamily: 'var(--font-inter)' }}>
                      {pkg.name} — {mounted ? formatPrice(pkg.usdPrice, currency) : `$${pkg.usdPrice}`}
                    </p>
                  </div>
                  <ul className="ml-[22px] flex flex-col gap-2">
                    {pkg.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-[14px] text-muted leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
                        <span className="mt-[7px] w-1 h-1 rounded-full bg-muted-low flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-8 text-[13px] text-muted leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
              Let me know if you want it all done for you in a custom bundle, or if you&apos;re working on a project that needs full sound direction — I also offer Executive Production.
            </p>
          </div>

          {/* Reviews */}
          <div className="border-t border-line-card pt-10">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-2xl font-medium text-foreground leading-none">Customer Reviews</p>
              {!showReviewForm && !reviewSent && (
                user
                  ? (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="text-sm font-semibold text-foreground border border-line-card px-4 py-2 hover:border-muted transition-colors"
                    >
                      Write a review
                    </button>
                  ) : user === null ? (
                    <Link
                      href="/login"
                      className="text-sm font-semibold text-muted-mid border border-line-card px-4 py-2 hover:border-muted hover:text-foreground transition-colors"
                    >
                      Sign in to review
                    </Link>
                  ) : null
              )}
            </div>

            {/* Rating summary — only if there are reviews */}
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
                      const pct = (count / reviews.length) * 100
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-xs text-muted-low w-2">{star}</span>
                          <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                            <div className="h-full bg-accent transition-[transform] origin-left" style={{ width: '100%', transform: `scaleX(${pct / 100})` }} />
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
            {showReviewForm && !reviewSent && user && (
              <form onSubmit={submitReview} className="border border-line-card bg-surface-1 p-5 mb-8 space-y-4">
                <p className="text-sm font-semibold text-foreground">Leave a review</p>

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
                        <Star size={22} className={s <= (reviewHover || reviewForm.rating) ? 'text-accent fill-accent' : 'text-muted-low'} />
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
              <div>
                {reviews.map((rev) => (
                  <div key={rev.id} className="border-t border-line-card py-5">
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} aria-hidden="true" />
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mm-modal-title"
            className="relative w-full sm:max-w-xl border border-line-card bg-surface-2 p-7 animate-fade-in max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-none"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 id="mm-modal-title" className="text-xl font-medium text-foreground leading-none">Book a Session</h2>
                <p className="text-xs text-muted mt-0.5">{selected.name}</p>
              </div>
              <button onClick={closeModal} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded hover:bg-white/10 transition-colors text-muted-mid">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {sent ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <Check size={30} className="text-accent" aria-hidden="true" />
                </div>
                <p className="text-2xl font-medium text-foreground">{t.services.inquirySent}</p>
                <p className="mt-2 text-sm text-muted-mid">{t.services.replyTime}</p>
                <button onClick={closeModal} className="mt-6 border border-line-input px-8 py-3 text-sm text-foreground hover:border-muted transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="mm-artist" className="block text-[11px] font-normal uppercase tracking-[0.08em] text-muted-low mb-2">{t.services.artistName} *</label>
                  <input id="mm-artist" required type="text" autoComplete="name" value={form.artistName} onChange={(e) => setForm((f) => ({ ...f, artistName: e.target.value }))} className="w-full border border-line-input bg-surface-1 px-4 py-3.5 text-base text-foreground placeholder-muted-low outline-none focus:border-muted transition-colors" placeholder="Your artist name" />
                </div>
                <div>
                  <label htmlFor="mm-email" className="block text-[11px] font-normal uppercase tracking-[0.08em] text-muted-low mb-2">Email *</label>
                  <input id="mm-email" required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full border border-line-input bg-surface-1 px-4 py-3.5 text-base text-foreground placeholder-muted-low outline-none focus:border-muted transition-colors" placeholder="your@email.com" />
                </div>
                <div>
                  <label htmlFor="mm-service" className="block text-[11px] font-normal uppercase tracking-[0.08em] text-muted-low mb-2">Package</label>
                  <input id="mm-service" readOnly value={form.serviceType} className="w-full border border-line-input bg-surface-3 px-4 py-3.5 text-base text-muted outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label htmlFor="mm-details" className="block text-[11px] font-normal uppercase tracking-[0.08em] text-muted-low mb-2">{t.services.projectDetails} *</label>
                  <textarea id="mm-details" required rows={6} value={form.projectDetails} onChange={(e) => setForm((f) => ({ ...f, projectDetails: e.target.value }))} className="w-full border border-line-input bg-surface-1 px-4 py-3.5 text-base text-foreground placeholder-muted-low outline-none focus:border-muted transition-colors resize-none" placeholder="Tell me about your project, references, timeline…" />
                </div>
                {error && <p role="alert" className="animate-shake text-sm text-danger">{error}</p>}
                <button type="submit" disabled={sending} className="w-full bg-white py-4 text-base font-bold text-black hover:bg-white-hover transition-colors disabled:opacity-50">
                  {sending ? t.contact.sending : t.services.sendInquiry}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
