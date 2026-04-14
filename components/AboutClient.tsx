'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
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

  const inputClass =
    'w-full bg-transparent border-0 border-b border-white/20 pb-3 text-[15px] text-foreground placeholder:text-muted-low outline-none focus:border-white/60 transition-colors duration-200'

  const labelClass =
    'block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-low mb-3'

  if (sent) {
    return (
      <div className="w-full max-w-2xl text-center py-16">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06]">
          <Check size={24} className="text-accent" />
        </div>
        <p className="font-display text-4xl text-foreground uppercase">Message Sent.</p>
        <p className="mt-3 text-[13px] text-muted">I&apos;ll get back to you soon.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">

      {/* Name + Email row */}
      <div className="flex flex-col sm:flex-row gap-8 sm:gap-10 mb-12">
        <div className="flex-1">
          <label htmlFor="c-name" className={labelClass}>Your Name</label>
          <input
            id="c-name"
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
            style={{ fontFamily: 'var(--font-inter)' }}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="c-email" className={labelClass}>Email Address</label>
          <input
            id="c-email"
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
            style={{ fontFamily: 'var(--font-inter)' }}
          />
        </div>
      </div>

      {/* Subject */}
      <div className="mb-12">
        <label htmlFor="c-subject" className={labelClass}>Subject</label>
        <input
          id="c-subject"
          required
          type="text"
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          className={inputClass}
          style={{ fontFamily: 'var(--font-inter)' }}
        />
      </div>

      {/* Message */}
      <div className="mb-14">
        <label htmlFor="c-message" className={labelClass}>Message</label>
        <textarea
          id="c-message"
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className={`${inputClass} resize-none`}
          style={{ fontFamily: 'var(--font-inter)' }}
        />
      </div>

      {error && <p role="alert" className="animate-shake text-[12px] text-danger mb-4">{error}</p>}

      {/* Submit — right-aligned */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={sending}
          className="bg-white text-black text-[12px] font-bold uppercase px-8 py-3.5 hover:bg-white-hover transition-colors disabled:opacity-50"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          {sending ? 'Sending…' : 'Send Message'}
        </button>
      </div>

    </form>
  )
}
