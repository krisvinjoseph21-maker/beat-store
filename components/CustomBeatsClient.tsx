'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, X, ChevronDown } from 'lucide-react'
import { useLocaleStore, formatPrice } from '@/lib/locale'
import { useT } from '@/lib/i18n'

const FAQS = [
  {
    q: 'Can I pay in instalments?',
    a: 'Yes. Klarna, Shop Pay, and custom split payment options are available to make it flexible for you.',
  },
  {
    q: 'How long is delivery?',
    a: 'Typical delivery is 5–10 days depending on the package tier and project scope.',
  },
  {
    q: 'How do I know which package I need?',
    a: 'If you already have vocals recorded and you want the song finished properly, go Bundle or above. If you just need a high-quality beat to write to, Full Custom is the sweet spot. If you\'re building a sound and want guidance, Executive Producer.',
  },
  {
    q: 'What do you need from me to start?',
    a: 'A reference track (1–3), a quick note on the vibe (tempo/mood), and any vocals or demo you already have. Once I\'ve got that, I\'ll confirm the direction and start building.',
  },
  {
    q: 'Do you offer exclusivity? What usage rights do I get?',
    a: 'Custom work is exclusive to you once the balance is paid, and I don\'t resell custom productions. You can release the song commercially on all platforms. If you need full buyout terms, publishing splits confirmed in writing, or label-specific paperwork, tell me upfront and I\'ll structure it properly.',
  },
  {
    q: 'Do you offer calls before I buy?',
    a: 'Yes. If you\'re deciding between tiers or you want to map the project properly, book a quick call or DM me and we\'ll choose the smartest option.',
  },
  {
    q: 'Can you help with songwriting, vocal production, and direction?',
    a: 'Yes, especially on Executive Producer and Project Launch. That can include structure guidance, vocal layering ideas, harmonies, ad-libs, and performance coaching (remote).',
  },
  {
    q: 'Can you add live instruments?',
    a: 'Yes. Guitar/keys are easy depending on the vibe. If you want specialist live players (strings, horns, etc.), we can do it as an add-on and I\'ll quote it.',
  },
  {
    q: 'How do we communicate during the project?',
    a: 'Mainly Instagram DM or WhatsApp for quick notes. If you\'re on Exec Producer / Project Launch, we\'ll also do at least one call/session.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'No. Custom production and mixing are digital services and are non-refundable once delivered (in part or in full). You\'re paying for time, creative labor, and deliverables.',
  },
  {
    q: 'Can we work long-term?',
    a: 'That\'s what The Artist Partnership is for — a year-long collaboration with a few artists I really believe in. DM me or book a call to see if it\'s a good fit.',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-line-card last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-[14px] font-semibold text-foreground" style={{ fontFamily: 'var(--font-inter)' }}>{q}</span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <p className="pb-5 text-[13px] text-muted leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
          {a}
        </p>
      )}
    </div>
  )
}

interface Package {
  emoji: string
  name: string
  usdPrice: number
  description: string
  deliverables: string[]
}

const PACKAGES: Package[] = [
  {
    emoji: '💡',
    name: 'Basic Custom Beat',
    usdPrice: 200,
    description: 'A single beat built around your reference track. Delivered mixed and ready to record over.',
    deliverables: ['1 beat from your reference', 'Mixed stereo WAV + MP3', '1 revision'],
  },
  {
    emoji: '🚀',
    name: 'Full Custom Beat',
    usdPrice: 500,
    description: 'Fully arranged production with all elements separated for your session.',
    deliverables: ['Arranged beat + full transitions', 'Mixed stereo + stem pack', 'WAV + MP3', 'Up to 3 revisions', 'Priority turnaround'],
  },
  {
    emoji: '🔥',
    name: 'Custom Beat + Mix Bundle',
    usdPrice: 750,
    description: 'Custom beat plus a full vocal mix and master — everything delivered in one package.',
    deliverables: ['Custom beat to your sound', 'Full vocal mix + master', 'All stems provided', 'Master WAV + MP3', 'Up to 5 revisions'],
  },
  {
    emoji: '🧠',
    name: 'Executive Producer Package',
    usdPrice: 1000,
    description: 'A full creative session. I build around your vision from scratch, shape the sound, and guide the record.',
    deliverables: ['Beat built from scratch', 'Arrangement + sound design', 'Mix & master polish', 'Private feedback session', 'Optional promo placement', 'Priority treatment'],
  },
  {
    emoji: '🎙️',
    name: 'Project Launch Package',
    usdPrice: 1500,
    description: 'Three custom beats, mixed and mastered, with creative direction across the whole project.',
    deliverables: ['3 custom beats', 'Full mix & master on all 3', 'Creative direction + vocal production support', 'Release planning guidance', 'Priority service throughout', 'Exec producer credit across everything'],
  },
]

interface FormState {
  artistName: string
  email: string
  serviceType: string
  projectDetails: string
}

export default function CustomBeatsClient() {
  const [selected, setSelected] = useState<Package>(PACKAGES[0])
  const [qty, setQty] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const currency = useLocaleStore((s) => s.currency)
  const t = useT()
  const [form, setForm] = useState<FormState>({ artistName: '', email: '', serviceType: PACKAGES[0].name, projectDetails: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

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
      setError(t.services.error)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* ── Product layout ── */}
      {/* align-items: flex-start is CRITICAL — prevents left col from stretching to match right col height, which would kill sticky */}
      <div className="flex flex-col lg:flex-row" style={{ alignItems: 'flex-start' }}>

        {/* ── LEFT COLUMN (45%) — plain div, no sticky here ── */}
        <div className="hidden lg:block" style={{ width: '45%', flexShrink: 0 }}>
          {/* Image wrapper IS the sticky element — inside the column, not the column itself */}
          <div
            className="flex flex-col items-center justify-center overflow-hidden bg-surface-3 select-none"
            style={{ position: 'sticky', top: '48px', height: 'calc(100vh - 48px)' }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(200,168,106,0.08) 0%, transparent 70%)' }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)', backgroundSize: '48px 48px' }}
            />
            <div className="relative z-10 flex flex-col items-center gap-4 px-12 text-center">
              <p
                className="font-display leading-none text-foreground"
                style={{ fontSize: 'clamp(42px, 4.5vw, 72px)', fontWeight: 300, letterSpacing: '-0.02em' }}
              >
                Custom Beat<br />Packages
              </p>
              <div className="w-10 h-px bg-white/10 mt-1" />
              <p
                className="text-[11px] font-normal uppercase text-muted-low"
                style={{ letterSpacing: '0.1em', fontFamily: 'var(--font-montserrat)' }}
              >
                Built for Serious Artists
              </p>
              <p className="mt-4 text-[11px] text-muted-low" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '0.1em' }}>
                @PRODKJBEATS
              </p>
            </div>
          </div>
        </div>

        {/* Mobile banner */}
        <div className="lg:hidden w-full relative flex flex-col items-center justify-center bg-surface-3 select-none" style={{ height: '200px' }}>
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 80% 100% at 50% 50%, rgba(200,168,106,0.07) 0%, transparent 70%)' }}
          />
          <div className="relative z-10 text-center">
            <p className="font-display text-foreground leading-none" style={{ fontSize: 'clamp(32px, 8vw, 52px)', fontWeight: 300 }}>
              Custom Beats
            </p>
            <p className="mt-2 text-[10px] font-normal uppercase text-muted-low" style={{ letterSpacing: '0.1em', fontFamily: 'var(--font-montserrat)' }}>
              Built for Serious Artists
            </p>
          </div>
        </div>

        {/* ── RIGHT COLUMN (55%) — scrolls naturally with the page ── */}
        <div className="w-full px-8 lg:px-14 py-14 lg:py-16" style={{ flex: 1 }}>

          {/* Brand */}
          <p className="text-[11px] font-normal uppercase text-muted-low mb-3" style={{ letterSpacing: '0.1em', fontFamily: 'var(--font-montserrat)' }}>
            PRODKJBEATS
          </p>

          {/* Title */}
          <h1 className="text-foreground leading-tight mb-3" style={{ fontFamily: 'var(--font-inter)', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 300 }}>
            Custom Production Services
          </h1>

          {/* Price */}
          <p className="text-[24px] text-foreground mb-0.5" style={{ fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
            {mounted ? formatPrice(selected.usdPrice, currency) : `$${selected.usdPrice}`}
          </p>
          <p className="text-[12px] text-muted-low mb-8" style={{ fontFamily: 'var(--font-inter)' }}>
            {t.services.taxesIncluded}
          </p>

          {/* Package variant selector */}
          <div className="mb-8">
            <p className="text-[11px] font-normal uppercase text-muted-low mb-3" style={{ letterSpacing: '0.08em', fontFamily: 'var(--font-inter)' }}>
              Custom Beat
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {PACKAGES.slice(0, 3).map((pkg) => (
                <button
                  key={pkg.name}
                  onClick={() => selectPackage(pkg)}
                  className={`rounded-full px-4 py-2 text-[13px] font-normal border transition-colors min-h-[40px] ${
                    selected.name === pkg.name
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-foreground border-line-card hover:border-muted'
                  }`}
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {pkg.name}
                </button>
              ))}
            </div>
            <p className="text-[11px] font-normal uppercase text-muted-low mb-2 mt-4" style={{ letterSpacing: '0.08em', fontFamily: 'var(--font-inter)' }}>
              Full Direction
            </p>
            <div className="flex flex-wrap gap-2">
              {PACKAGES.slice(3).map((pkg) => (
                <button
                  key={pkg.name}
                  onClick={() => selectPackage(pkg)}
                  className={`rounded-full px-4 py-2 text-[13px] font-normal border transition-colors min-h-[40px] ${
                    selected.name === pkg.name
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-foreground border-line-card hover:border-muted'
                  }`}
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {pkg.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity selector */}
          <div className="mb-8">
            <p className="text-[11px] font-normal uppercase text-muted-low mb-3" style={{ letterSpacing: '0.08em', fontFamily: 'var(--font-inter)' }}>
              {t.services.quantity}
            </p>
            <div className="inline-flex items-center border border-line-card" style={{ height: '44px' }}>
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex items-center justify-center text-foreground hover:bg-white/5 transition-colors"
                style={{ width: '44px', height: '44px', fontSize: '18px' }}
              >
                −
              </button>
              <span
                className="text-[14px] font-semibold text-foreground text-center"
                style={{ width: '44px', fontFamily: 'var(--font-inter)' }}
              >
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
                className="flex items-center justify-center text-foreground hover:bg-white/5 transition-colors"
                style={{ width: '44px', height: '44px', fontSize: '18px' }}
              >
                +
              </button>
            </div>
          </div>

          {/* Selected package details */}
          <div className="mb-8 border-t border-line-card pt-6">
            <p className="text-[14px] text-muted leading-relaxed mb-3" style={{ fontFamily: 'var(--font-inter)' }}>
              {selected.description}
            </p>
            <p className="text-[12px] text-muted-low" style={{ fontFamily: 'var(--font-inter)' }}>
              {selected.deliverables.join(' · ')}
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3 mb-10">
            <button
              onClick={openModal}
              className="w-full border border-foreground bg-transparent py-3.5 text-[14px] font-bold text-foreground hover:bg-white/5 transition-colors min-h-[52px]"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {t.services.bookPackage}
            </button>
            <button
              onClick={openModal}
              className="w-full py-3.5 text-[14px] font-bold text-black transition-colors min-h-[52px] bg-white hover:bg-white-hover"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {t.services.enquireNow}
            </button>
          </div>

          {/* Description */}
          <div className="border-t border-line-card pt-8 mb-14">
            <p className="text-[14px] text-muted leading-relaxed mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
              Industry-level production for artists who want intention behind their music. Whether you need one record, a full mix, or someone to help shape your entire sound — I&apos;ve got you covered.
            </p>
            <p className="text-[13px] font-semibold text-foreground" style={{ fontFamily: 'var(--font-inter)' }}>
              Turnaround: 48–72 hours depending on package.
            </p>
          </div>

          {/* FAQ */}
          <div className="border-t border-line-card pt-10">
            <h2 className="text-[11px] font-semibold uppercase text-muted-low mb-6" style={{ letterSpacing: '0.22em', fontFamily: 'var(--font-montserrat)' }}>
              Frequently Asked Questions
            </h2>
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
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
            aria-labelledby="cb-modal-title"
            className="relative w-full sm:max-w-xl border border-line-card bg-surface-2 p-7 animate-fade-in max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-none"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 id="cb-modal-title" className="text-xl font-medium text-foreground leading-none">Book a Session</h2>
                <p className="text-xs text-muted mt-1">{selected.name}</p>
              </div>
              <button
                onClick={closeModal}
                aria-label="Close inquiry form"
                className="flex h-11 w-11 items-center justify-center rounded hover:bg-white/10 transition-colors text-muted-mid"
              >
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
                  <label htmlFor="cb-artist-name" className="block text-[11px] font-normal uppercase tracking-[0.08em] text-muted-low mb-2">{t.services.artistName} *</label>
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
                  <label htmlFor="cb-email" className="block text-[11px] font-normal uppercase tracking-[0.08em] text-muted-low mb-2">Email *</label>
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
                  <label htmlFor="cb-service" className="block text-[11px] font-normal uppercase tracking-[0.08em] text-muted-low mb-2">Package</label>
                  <input
                    id="cb-service"
                    readOnly
                    value={form.serviceType}
                    className="w-full border border-line-input bg-surface-3 px-4 py-3.5 text-base text-muted outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label htmlFor="cb-details" className="block text-[11px] font-normal uppercase tracking-[0.08em] text-muted-low mb-2">{t.services.projectDetails} *</label>
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
