'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'

const SERVICES = [
  {
    id: 'mix-master',
    title: 'Mix + Master Bundle',
    price: '$250',
    unit: '/ song',
    emoji: '🎚️',
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
    emoji: '🎹',
    badge: 'Most Popular',
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

  function openInquiry(serviceId: string, serviceTitle: string) {
    setActiveService(serviceId)
    setForm((f) => ({ ...f, serviceType: serviceTitle }))
    setSent(false)
    setError('')
  }

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
            className="relative rounded-2xl border border-line-card bg-surface-1 p-6 flex flex-col"
          >
            {svc.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-0.5 text-xs font-bold text-black">
                {svc.badge}
              </span>
            )}
            <div className="mb-4 text-3xl text-center">{svc.emoji}</div>
            <h2 className="text-xl font-black text-white text-center">{svc.title}</h2>
            <p className="mt-1 text-3xl font-black text-white text-center">
              {svc.price}
              {svc.unit && <span className="text-base font-normal text-muted-mid">{svc.unit}</span>}
            </p>
            <ul className="mt-5 space-y-2 flex-1">
              {svc.features.map((f) => (
                <li key={f} className="flex items-center justify-center gap-2 text-sm text-foreground">
                  <Check size={14} className="text-green-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => openInquiry(svc.id, svc.title)}
              className="mt-6 w-full rounded-xl bg-white py-3.5 text-sm font-bold text-black hover:bg-white-hover transition-colors min-h-[48px]"
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
            onClick={() => setActiveService(null)}
          />
          <div className="relative w-full sm:max-w-xl rounded-t-xl sm:rounded-xl border border-line-card bg-surface-2 p-7 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">Book a Session</h3>
                <p className="text-xs text-muted mt-0.5">{form.serviceType}</p>
              </div>
              <button
                onClick={() => setActiveService(null)}
                className="flex h-9 w-9 items-center justify-center rounded hover:bg-white/10 transition-colors text-muted-mid"
              >
                <X size={18} />
              </button>
            </div>

            {sent ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                  <Check size={30} className="text-green-400" />
                </div>
                <p className="text-xl font-black text-white">Inquiry Sent!</p>
                <p className="mt-2 text-sm text-muted-mid">
                  I&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setActiveService(null)}
                  className="mt-6 rounded border border-line-input px-8 py-3 text-sm text-foreground hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Artist Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.artistName}
                    onChange={(e) => setForm((f) => ({ ...f, artistName: e.target.value }))}
                    className="w-full rounded border border-line-input bg-surface-1 px-4 py-3.5 text-base text-white placeholder-muted-low outline-none focus:border-muted transition-colors"
                    placeholder="Your artist name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded border border-line-input bg-surface-1 px-4 py-3.5 text-base text-white placeholder-muted-low outline-none focus:border-muted transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Service
                  </label>
                  <input
                    readOnly
                    value={form.serviceType}
                    className="w-full rounded border border-line-input bg-surface-3 px-4 py-3.5 text-base text-muted outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Project Details *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={form.projectDetails}
                    onChange={(e) => setForm((f) => ({ ...f, projectDetails: e.target.value }))}
                    className="w-full rounded border border-line-input bg-surface-1 px-4 py-3.5 text-base text-white placeholder-muted-low outline-none focus:border-muted transition-colors resize-none"
                    placeholder="Tell me about your project, references, timeline…"
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
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
