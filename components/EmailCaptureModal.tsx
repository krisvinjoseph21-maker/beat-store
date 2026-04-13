'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Check } from 'lucide-react'

export default function EmailCaptureModal() {
  const [visible, setVisible] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; consent?: string }>({})
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('email_popup_seen')) return

    // Exit-intent: show on mouse leaving viewport top
    function onMouseOut(e: MouseEvent) {
      if (e.clientY <= 0) show()
    }

    // Fallback timer: show after 4 seconds if no exit intent
    const timer = setTimeout(show, 4000)
    document.addEventListener('mouseleave', onMouseOut)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', onMouseOut)
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

    // ── Wire up your email service here ──────────────────────────────────────
    // Example: Mailchimp, ConvertKit, Resend, etc.
    // await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ name, email }) })
    // ─────────────────────────────────────────────────────────────────────────

    sessionStorage.setItem('email_popup_seen', '1')
    setSubmitted(true)
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
        className="relative w-full max-w-md rounded-sm bg-white p-7 animate-fade-in shadow-2xl"
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-black/40 hover:bg-black/8 hover:text-black transition-colors"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black">
              <Check size={20} className="text-white" aria-hidden="true" />
            </div>
            <p className="text-lg font-bold text-black">You&apos;re on the list.</p>
            <p className="text-sm text-black/50">Check your inbox — we&apos;ll be in touch.</p>
            <button
              onClick={dismiss}
              className="mt-2 rounded-sm bg-black px-6 py-3 text-sm font-bold text-white hover:bg-black/80 transition-colors"
            >
              Continue
            </button>
          </div>
        ) : (
          <>
            {/* Eyebrow */}
            <p className="mb-1 text-[11px] font-semibold uppercase text-black/40">
              Exclusive Access
            </p>

            <h2 id="email-modal-title" className="mb-1 font-[family-name:var(--font-bebas)] text-3xl text-black">
              Get Free Beats &amp; Exclusive Deals
            </h2>

            <p className="mb-6 text-sm text-black/50">
              Join the list and be first to hear new drops, get free samples, and unlock subscriber-only discounts.
            </p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="popup-name" className="text-xs font-semibold text-black/60">
                  Full Name
                </label>
                <input
                  id="popup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-sm border border-black/15 bg-black/4 px-4 py-3 text-sm text-black placeholder-black/30 outline-none focus:border-black/40 transition-colors"
                />
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="popup-email" className="text-xs font-semibold text-black/60">
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
                  className={`rounded-sm border px-4 py-3 text-sm text-black placeholder-black/30 outline-none transition-colors ${
                    errors.email ? 'border-red-500 bg-red-50' : 'border-black/15 bg-black/4 focus:border-black/40'
                  }`}
                />
                {errors.email && (
                  <p id="popup-email-error" role="alert" className="text-xs text-red-600">
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
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-black"
                  />
                  <span className="text-xs text-black/50 leading-relaxed">
                    I agree to receive email updates, free beats, and promotional offers from PRODKJBEATS. I can unsubscribe at any time.
                  </span>
                </label>
                {errors.consent && (
                  <p id="popup-consent-error" role="alert" className="text-xs text-red-600">
                    {errors.consent}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="rounded-sm bg-black py-4 text-sm font-bold text-white hover:bg-black/80 transition-colors"
              >
                Subscribe Now
              </button>

              <p className="text-center text-[10px] text-black/35">
                No spam. Unsubscribe any time.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
