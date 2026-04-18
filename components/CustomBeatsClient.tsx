'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, X } from 'lucide-react'

interface Package {
  emoji: string
  name: string
  price: string
  features: string[]
}

const PACKAGES: Package[] = [
  {
    emoji: '💡',
    name: 'Basic Custom Beat',
    price: '$200',
    features: [
      '1 beat built from your reference',
      'Mixed stereo beat (no stems)',
      'WAV + MP3',
      '1 revision',
    ],
  },
  {
    emoji: '🚀',
    name: 'Full Custom Beat',
    price: '$500',
    features: [
      'Fully arranged beat + transitions',
      'Mixed stereo beat (including stems)',
      'WAV + MP3',
      'Up to 3 revisions',
      'Priority turnaround',
    ],
  },
  {
    emoji: '🔥',
    name: 'Custom Beat + Mix Bundle',
    price: '$750',
    features: [
      'Custom beat tailored to your sound',
      'Full vocal mix + master',
      'All stems provided',
      'Master WAV + MP3',
      'Up to 5 revisions',
    ],
  },
  {
    emoji: '🧠',
    name: 'Executive Producer Package',
    price: '$1,000',
    features: [
      'Beat built from scratch around your vision',
      'Arrangement, sound design, intro/outro support',
      'Mix & Master polish',
      'Private Zoom/DM session for feedback',
      'Optional promo placement',
      'Priority treatment',
    ],
  },
  {
    emoji: '🎙️',
    name: 'Project Launch Package',
    price: '$1,500',
    features: [
      '3 custom beats built to your sound',
      'Full mix & master on all 3 tracks',
      'Creative direction & vocal production support',
      'Release planning guidance',
      'Priority service for the entire project',
      'Locked in as exec producer across everything',
    ],
  },
]

interface FormState {
  artistName: string
  email: string
  serviceType: string
  projectDetails: string
}

export default function CustomBeatsClient() {
  const [activePackage, setActivePackage] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({ artistName: '', email: '', serviceType: '', projectDetails: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  function openModal(pkg: Package) {
    setActivePackage(pkg.name)
    setForm((f) => ({ ...f, serviceType: pkg.name }))
    setSent(false)
    setError('')
  }

  function closeModal() {
    setActivePackage(null)
  }

  // Focus trap
  useEffect(() => {
    if (!activePackage) return
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
      const lastEl  = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === firstEl) { e.preventDefault(); lastEl?.focus() }
      } else {
        if (document.activeElement === lastEl)  { e.preventDefault(); firstEl?.focus() }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [activePackage]) // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* ── Two-column layout ───────────────────────────────────────── */}
      <div className="flex items-start min-h-[calc(100vh-48px)]">

        {/* LEFT — sticky artwork panel (desktop only) */}
        <div className="hidden lg:flex w-1/2 sticky top-[48px] h-[calc(100vh-48px)] flex-col items-center justify-center overflow-hidden bg-surface-3 select-none">
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(200,168,106,0.08) 0%, transparent 70%)' }}
          />
          {/* Subtle grid texture */}
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
              Custom Beat<br />Package
            </p>
            <div className="w-10 h-px bg-white/10" />
            <p
              className="text-[11px] font-semibold uppercase text-muted-low"
              style={{ letterSpacing: '0.28em', fontFamily: 'var(--font-montserrat)' }}
            >
              Built for Serious Artists
            </p>
            <p className="mt-6 text-[11px] text-muted-low" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '0.12em' }}>
              @PRODKJBEATS
            </p>
          </div>
        </div>

        {/* Mobile banner (replaces sticky panel) */}
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
              Custom Beats
            </p>
            <p className="mt-2 text-[10px] font-semibold uppercase text-muted-low" style={{ letterSpacing: '0.28em', fontFamily: 'var(--font-montserrat)' }}>
              Built for Serious Artists
            </p>
          </div>
        </div>

        {/* RIGHT — scrollable content */}
        <div className="w-full lg:w-1/2 px-8 lg:px-14 py-14 lg:py-16">

          {/* Hero copy */}
          <div className="mb-12">
            <p className="text-[10px] font-semibold uppercase text-muted-low mb-3" style={{ letterSpacing: '0.28em', fontFamily: 'var(--font-montserrat)' }}>
              Work With Me
            </p>
            <h1 className="font-display text-4xl sm:text-5xl uppercase text-foreground leading-none mb-5">
              Your Sound,<br />Custom Built.
            </h1>
            <p className="text-[14px] text-muted leading-relaxed max-w-md" style={{ fontFamily: 'var(--font-inter)' }}>
              Industry-level production for artists who want intention behind their music. Whether you need one record, a full mix, or someone to help shape your entire sound, I&apos;ve got you covered.
            </p>
            <p className="mt-6 text-[13px] font-semibold text-foreground" style={{ fontFamily: 'var(--font-inter)' }}>
              🎧 What&apos;s Included by Package:
            </p>
          </div>

          {/* Package cards */}
          <div className="flex flex-col gap-5">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.name}
                className="border border-line-card bg-surface-1 p-6 flex flex-col hover:border-line-hover transition-[border-color] duration-200"
              >
                {/* Name + price row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-[22px] font-black text-foreground leading-tight">
                      {pkg.emoji} {pkg.name}
                    </p>
                  </div>
                  <p
                    className="text-2xl font-black shrink-0"
                    style={{ color: 'var(--accent)' }}
                  >
                    {pkg.price}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check size={13} className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => openModal(pkg)}
                  className="w-full bg-white py-3.5 text-sm font-bold text-black hover:bg-white-hover transition-colors min-h-[48px]"
                >
                  Book This Package →
                </button>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <p className="mt-8 text-[12px] text-muted-low text-center" style={{ fontFamily: 'var(--font-inter)' }}>
            Not sure which package fits? Reach out — I&apos;ll help you figure it out.
          </p>
        </div>
      </div>

      {/* ── Inquiry modal ───────────────────────────────────────────── */}
      {activePackage && (
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
            aria-labelledby="cb-modal-title"
            className="relative w-full sm:max-w-xl border border-line-card bg-surface-2 p-7 animate-fade-in max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-none"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 id="cb-modal-title" className="font-display text-2xl uppercase text-foreground leading-none">Book a Session</h2>
                <p className="text-xs text-muted mt-0.5">{activePackage}</p>
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
                  className="mt-6 rounded border border-line-input px-8 py-3 text-sm text-foreground hover:border-muted transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="cb-artist-name" className="block text-sm font-semibold text-foreground mb-2">Artist Name *</label>
                  <input
                    id="cb-artist-name"
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
                  <label htmlFor="cb-email" className="block text-sm font-semibold text-foreground mb-2">Email *</label>
                  <input
                    id="cb-email"
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
                  <label htmlFor="cb-service" className="block text-sm font-semibold text-foreground mb-2">Package</label>
                  <input
                    id="cb-service"
                    readOnly
                    value={form.serviceType}
                    className="w-full border border-line-input bg-surface-3 px-4 py-3.5 text-base text-muted outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label htmlFor="cb-details" className="block text-sm font-semibold text-foreground mb-2">Project Details *</label>
                  <textarea
                    id="cb-details"
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
