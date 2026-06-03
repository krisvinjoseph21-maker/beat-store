'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Check } from 'lucide-react'

export default function EmailCaptureModal() {
  const [visible, setVisible] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; consent?: string; submit?: string }>({})
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('email_popup_seen')) return

    const isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches

    if (isMobile) {
      // Mobile: trigger at 60% scroll depth — user has shown real intent
      function onScroll() {
        const scrolled = window.scrollY + window.innerHeight
        const total = document.documentElement.scrollHeight
        if (total > 0 && scrolled / total >= 0.6) {
          show()
          window.removeEventListener('scroll', onScroll)
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => window.removeEventListener('scroll', onScroll)
    } else {
      // Desktop: exit-intent (mouse leaving viewport top) + 8s fallback
      function onMouseOut(e: MouseEvent) {
        if (e.clientY <= 0) show()
      }
      const timer = setTimeout(show, 20000)
      document.addEventListener('mouseleave', onMouseOut)
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mouseleave', onMouseOut)
      }
    }
  }, [])

  function show() {
    if (sessionStorage.getItem('email_popup_seen')) return
    setVisible(true)
  }

  function dismiss() {
    sessionStorage.setItem('email_popup_seen', '1')
    setVisible(false)
  }

  // Focus trap
  useEffect(() => {
    if (!visible) return
    const modal = modalRef.current
    if (!modal) return

    const previousFocus = document.activeElement as HTMLElement | null
    const FOCUSABLE =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const first = modal.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        dismiss()
        return
      }
      if (e.key !== 'Tab') return
      const focusable = Array.from(modal!.querySelectorAll<HTMLElement>(FOCUSABLE))
      const firstEl = focusable[0]
      const lastEl = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault()
          lastEl?.focus()
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault()
          firstEl?.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [visible])

  if (!visible) return null

  function validate() {
    const next: typeof errors = {}
    if (!email.includes('@')) next.email = 'Enter a valid email address.'
    if (!consent) next.consent = 'Please confirm you agree to receive emails.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors((p) => ({ ...p, submit: undefined }))
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors((p) => ({ ...p, submit: data.error ?? 'Something went wrong. Please try again.' }))
        return
      }
      sessionStorage.setItem('email_popup_seen', '1')
      setSubmitted(true)
    } catch {
      setErrors((p) => ({ ...p, submit: 'Network error. Please check your connection.' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-modal-title"
        className="relative w-full max-w-md rounded-sm border border-white/[0.08] bg-surface-1 p-7 animate-fade-in"
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-low hover:bg-white/[0.08] hover:text-foreground transition-colors"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="animate-success-pop flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
              <Check size={20} className="text-accent" aria-hidden="true" />
            </div>
            <p className="text-lg font-bold text-foreground">You&apos;re on the list.</p>
            <p className="text-sm text-muted">Check your inbox — we&apos;ll be in touch.</p>
            <button
              onClick={dismiss}
              className="mt-2 rounded-sm bg-white px-6 py-3 text-sm font-bold text-black hover:bg-white-hover transition-colors"
            >
              Continue
            </button>
          </div>
        ) : (
          <>
            {/* Eyebrow */}
            <p className="mb-1 text-[11px] font-semibold uppercase text-muted-low">
              Exclusive Access
            </p>

            <h2 id="email-modal-title" className="mb-1 font-[family-name:var(--font-bebas)] text-3xl text-foreground">
              Get Free Beats &amp; Exclusive Deals
            </h2>

            <p className="mb-6 text-sm text-muted">
              Join the list and be first to hear new drops, get free samples, and unlock subscriber-only discounts.
            </p>

            <p className="mb-2 text-[10px] text-muted-low">Fields marked * are required.</p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="popup-name" className="text-xs font-semibold text-muted-low">
                  Full Name
                </label>
                <input
                  id="popup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-sm border border-line-input bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted-low outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="popup-email" className="text-xs font-semibold text-muted-low">
                  Email Address <span aria-hidden="true">*</span>
                </label>
                <input
                  id="popup-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })) }}
                  placeholder="your@email.com"
                  required
                  aria-required="true"
                  aria-describedby={errors.email ? 'popup-email-error' : undefined}
                  aria-invalid={!!errors.email}
                  className={`rounded-sm border px-4 py-3 text-sm text-foreground placeholder:text-muted-low outline-none transition-colors ${
                    errors.email ? 'border-danger bg-danger/[0.08]' : 'border-line-input bg-surface-2 focus:border-white/30'
                  }`}
                />
                {errors.email && (
                  <p id="popup-email-error" role="alert" className="text-xs text-danger">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Consent checkbox */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => { setConsent(e.target.checked); setErrors((p) => ({ ...p, consent: undefined })) }}
                    aria-describedby={errors.consent ? 'popup-consent-error' : undefined}
                    aria-invalid={!!errors.consent}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--accent)]"
                  />
                  <span className="text-xs text-muted leading-relaxed">
                    I agree to receive email updates, free beats, and promotional offers from KJYOUCRAZY. I can unsubscribe at any time.
                  </span>
                </label>
                {errors.consent && (
                  <p id="popup-consent-error" role="alert" className="text-xs text-danger">
                    {errors.consent}
                  </p>
                )}
              </div>

              {errors.submit && (
                <p role="alert" className="text-xs text-danger text-center">
                  {errors.submit}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="rounded-sm bg-white py-4 text-sm font-bold text-black hover:bg-white-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Subscribing…
                  </>
                ) : 'Subscribe Now'}
              </button>

              <p className="text-center text-[10px] text-muted-low">
                No spam. Unsubscribe any time.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
