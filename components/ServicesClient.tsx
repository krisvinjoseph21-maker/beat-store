'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, X } from 'lucide-react'

interface ServiceItem {
  id: string
  badge?: string
  title: string
  price: string
  unit: string
  features: string[]
}

const SERVICES: ServiceItem[] = [
  {
    id: 'mix-master',
    title: 'Mix + Master Bundle',
    price: '$250',
    unit: '/ song',
    features: [
      'Full professional mix',
      'Full master (streaming-ready)',
      '3 revision rounds',
      'WAV + MP3 delivery',
      '5–7 business day turnaround',
    ],
  },
  {
    id: 'custom-beat',
    title: 'Custom Exclusive Beat',
    price: '$499',
    unit: '',
    features: [
      'Built to your exact spec',
      'Full stems included',
      'Exclusive rights — 100% yours',
      '2 initial concepts',
      'Unlimited revisions on chosen concept',
    ],
  },
]

interface FormState {
  artistName: string
  email: string
  serviceType: string
  projectDetails: string
}

export default function ServicesClient() {
  const [activeService, setActiveService] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    artistName: '',
    email: '',
    serviceType: '',
    projectDetails: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  function openInquiry(serviceId: string, serviceTitle: string) {
    setActiveService(serviceId)
    setForm((f) => ({ ...f, serviceType: serviceTitle }))
    setSent(false)
    setError('')
  }

  function closeModal() {
    setActiveService(null)
  }

  // Focus trap
  useEffect(() => {
    if (!activeService) return
    const modal = modalRef.current
    if (!modal) return

    const previousFocus = document.activeElement as HTMLElement | null
    const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const first = modal.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

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
  }, [activeService]) // eslint-disable-line react-hooks/exhaustive-deps

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
      if (res.ok) {
        setSent(true)
      } else {
        setError('Failed to send. Please try again.')
      }
    } catch {
      setError('Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Service cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        {SERVICES.map((svc) => (
          <div
            key={svc.id}
            className="card-hover relative border border-line-card bg-surface-1 p-6 flex flex-col"
          >
            {svc.badge && (
              <span className="absolute -top-3 left-6 rounded-full bg-white px-3 py-0.5 text-xs font-bold text-black">
                {svc.badge}
              </span>
            )}
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-low mb-3">
              {svc.unit ? svc.unit.trim().replace('/', '').trim() || 'Per Song' : 'Per Beat'}
            </p>
            <h2 className="text-xl font-black text-white mb-1">{svc.title}</h2>
            <p className="text-3xl font-black text-foreground mb-5">
              {svc.price}
              {svc.unit && <span className="text-base font-normal text-muted-mid ml-1">{svc.unit}</span>}
            </p>
            <ul className="space-y-2 flex-1 mb-6">
              {svc.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <Check size={14} className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => openInquiry(svc.id, svc.title)}
              className="w-full rounded bg-white py-3.5 text-sm font-bold text-black hover:bg-white-hover transition-colors min-h-[48px]"
            >
              Book a Session
            </button>
          </div>
        ))}
      </div>

      {/* Inquiry modal */}
      {activeService && (
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
            aria-labelledby="services-modal-title"
            className="relative w-full sm:max-w-xl border border-line-card bg-surface-2 p-7 animate-fade-in max-h-[90vh] overflow-y-auto"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 id="services-modal-title" className="text-xl font-black text-white">Book a Session</h3>
                <p className="text-xs text-muted mt-0.5">{form.serviceType}</p>
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
                <p className="text-xl font-black text-white">Inquiry Sent!</p>
                <p className="mt-2 text-sm text-muted-mid">
                  I&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={closeModal}
                  className="mt-6 rounded border border-line-input px-8 py-3 text-sm text-foreground hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="services-artist-name" className="block text-sm font-semibold text-foreground mb-2">
                    Artist Name *
                  </label>
                  <input
                    id="services-artist-name"
                    required
                    type="text"
                    value={form.artistName}
                    onChange={(e) => setForm((f) => ({ ...f, artistName: e.target.value }))}
                    className="w-full rounded border border-line-input bg-surface-1 px-4 py-3.5 text-base text-white placeholder-muted-low outline-none focus:border-muted transition-colors"
                    placeholder="Your artist name"
                  />
                </div>
                <div>
                  <label htmlFor="services-email" className="block text-sm font-semibold text-foreground mb-2">
                    Email *
                  </label>
                  <input
                    id="services-email"
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded border border-line-input bg-surface-1 px-4 py-3.5 text-base text-white placeholder-muted-low outline-none focus:border-muted transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="services-service-type" className="block text-sm font-semibold text-foreground mb-2">
                    Service
                  </label>
                  <input
                    id="services-service-type"
                    readOnly
                    value={form.serviceType}
                    className="w-full rounded border border-line-input bg-surface-3 px-4 py-3.5 text-base text-muted outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label htmlFor="services-project-details" className="block text-sm font-semibold text-foreground mb-2">
                    Project Details *
                  </label>
                  <textarea
                    id="services-project-details"
                    required
                    rows={6}
                    value={form.projectDetails}
                    onChange={(e) => setForm((f) => ({ ...f, projectDetails: e.target.value }))}
                    className="w-full rounded border border-line-input bg-surface-1 px-4 py-3.5 text-base text-white placeholder-muted-low outline-none focus:border-muted transition-colors resize-none"
                    placeholder="Tell me about your project, references, timeline…"
                  />
                </div>
                {error && <p role="alert" className="animate-shake text-sm text-danger">{error}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded bg-white py-4 text-base font-bold text-black hover:bg-white-hover transition-colors disabled:opacity-50"
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
