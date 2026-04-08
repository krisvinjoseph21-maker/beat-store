'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

const PROJECT_TYPES = [
  'Custom Exclusive Beat',
  'Mix + Master Bundle',
  'Single (Mix Only)',
  'EP / Album',
  'Hook / Topline Writing',
  'Other',
]

const BUDGET_RANGES = [
  'Under $100',
  '$100 – $250',
  '$250 – $500',
  '$500 – $1,000',
  '$1,000 – $2,500',
  '$2,500+',
]

interface FormState {
  artistName: string
  email: string
  genre: string
  projectType: string
  deadline: string
  budget: string
  referenceTracks: string
}

const EMPTY: FormState = {
  artistName: '',
  email: '',
  genre: '',
  projectType: '',
  deadline: '',
  budget: '',
  referenceTracks: '',
}

export default function BookingForm() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const inputClass =
    'w-full rounded border border-[#2a2a2a] bg-[#111] px-4 py-3.5 text-base text-white placeholder-[#767676] outline-none focus:border-zinc-400 transition-colors'
  const selectClass =
    'w-full rounded border border-[#2a2a2a] bg-[#111] px-4 py-3.5 text-base text-white outline-none focus:border-zinc-400 transition-colors appearance-none'
  const labelClass = 'block text-sm font-semibold text-zinc-300 mb-2'

  if (sent) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <Check size={30} className="text-green-400" />
        </div>
        <p className="text-2xl font-black text-white">Request Received!</p>
        <p className="mt-3 text-sm text-zinc-400 max-w-sm mx-auto">
          A confirmation has been sent to <span className="text-white">{form.email}</span>.
          I&apos;ll be in touch within 24–48 hours.
        </p>
        <button
          onClick={() => { setSent(false); setForm(EMPTY) }}
          className="mt-8 rounded border border-[#2a2a2a] px-8 py-3 text-sm text-zinc-300 hover:text-white transition-colors"
        >
          Submit Another Request
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Row 1 — Artist name + email */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Artist Name *</label>
          <input
            required
            type="text"
            placeholder="Your artist name"
            value={form.artistName}
            onChange={set('artistName')}
            maxLength={100}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input
            required
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={set('email')}
            className={inputClass}
          />
        </div>
      </div>

      {/* Row 2 — Genre + project type */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Genre *</label>
          <input
            required
            type="text"
            placeholder="e.g. Trap, R&B, Drill…"
            value={form.genre}
            onChange={set('genre')}
            maxLength={100}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Project Type *</label>
          <select
            required
            value={form.projectType}
            onChange={set('projectType')}
            className={selectClass}
          >
            <option value="" disabled>Select a type…</option>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3 — Deadline + budget */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Deadline *</label>
          <input
            required
            type="date"
            value={form.deadline}
            onChange={set('deadline')}
            min={new Date().toISOString().split('T')[0]}
            className={inputClass + ' [color-scheme:dark]'}
          />
        </div>
        <div>
          <label className={labelClass}>Budget *</label>
          <select
            required
            value={form.budget}
            onChange={set('budget')}
            className={selectClass}
          >
            <option value="" disabled>Select a range…</option>
            {BUDGET_RANGES.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reference tracks */}
      <div>
        <label className={labelClass}>
          Reference Tracks{' '}
          <span className="text-[#767676] font-normal">(optional)</span>
        </label>
        <textarea
          rows={4}
          placeholder="Paste links or describe the vibe — YouTube, SoundCloud, Spotify, etc."
          value={form.referenceTracks}
          onChange={set('referenceTracks')}
          maxLength={2000}
          className="w-full resize-none rounded border border-[#2a2a2a] bg-[#111] px-4 py-3.5 text-base text-white placeholder-[#767676] outline-none focus:border-zinc-400 transition-colors"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={sending}
        className="w-full rounded bg-white py-4 text-base font-bold text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
      >
        {sending ? 'Sending…' : 'Submit Booking Request'}
      </button>
    </form>
  )
}
