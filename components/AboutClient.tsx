'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

export default function AboutClient() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
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

  return (
    <div className="rounded-2xl border border-[#1f1f1f] bg-[#111] p-6 sm:p-8">
      <h2 className="mb-5 text-lg font-black text-white">Get in Touch</h2>
      {sent ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
            <Check size={28} className="text-green-400" />
          </div>
          <p className="text-lg font-bold text-white">Message Sent!</p>
          <p className="mt-1 text-sm text-muted-mid">I&apos;ll get back to you soon.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="contact-name" className="block text-xs font-medium text-muted-mid mb-1.5 cursor-pointer">Name *</label>
            <input
              id="contact-name"
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder-muted-low outline-none focus:border-muted transition-colors"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-xs font-medium text-muted-mid mb-1.5 cursor-pointer">Email *</label>
            <input
              id="contact-email"
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder-muted-low outline-none focus:border-muted transition-colors"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label htmlFor="contact-message" className="block text-xs font-medium text-muted-mid mb-1.5 cursor-pointer">Message *</label>
            <textarea
              id="contact-message"
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="w-full rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder-muted-low outline-none focus:border-muted transition-colors resize-none"
              placeholder="What's on your mind?"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-xl bg-white py-4 text-sm font-bold text-black hover:bg-[#e8e8ed] transition-colors disabled:opacity-50 min-h-[52px]"
          >
            {sending ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      )}
    </div>
  )
}
