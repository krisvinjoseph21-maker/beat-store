import type { Metadata } from 'next'
import BookingForm from '@/components/BookingForm'

export const metadata: Metadata = {
  title: 'Book a Session — PRODKJBEATS',
  description: 'Submit a booking request for custom beats, mixing, mastering, and more.',
}

export default function BookingPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Let&apos;s Work
        </p>
        <h1 className="text-3xl font-black text-white sm:text-4xl">Book a Session</h1>
        <p className="mt-3 text-zinc-400 max-w-md mx-auto">
          Fill out the form below and I&apos;ll get back to you within 24–48 hours.
        </p>
      </div>

      <div className="rounded-2xl border border-[#1f1f1f] bg-[#111] p-6 sm:p-8">
        <BookingForm />
      </div>
    </div>
  )
}
