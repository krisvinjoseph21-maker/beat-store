import type { Metadata } from 'next'
import BookingForm from '@/components/BookingForm'
import CtaBanner from '@/components/CtaBanner'

export const metadata: Metadata = {
  title: 'Book a Session — KJYOUCRAZY',
  description: 'Submit a booking request for custom beats, mixing, mastering, and more.',
}

export default function BookingPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <div className="mb-10 text-center">
          <p className="mb-2 text-[11px] font-normal uppercase tracking-[0.1em] text-muted-low">
            Let&apos;s Work
          </p>
          <h1 className="font-display leading-none text-foreground" style={{ fontSize: 'clamp(44px, 8vw, 80px)', fontWeight: 300 }}>Book a Session</h1>
          <p className="mt-3 text-muted-mid max-w-md mx-auto">
            Fill out the form below and I&apos;ll get back to you within 24–48 hours.
          </p>
        </div>

        <div className="rounded-2xl border border-line-card bg-surface-1 p-6 sm:p-8">
          <BookingForm />
        </div>
      </div>
      <CtaBanner
        label="Don't Wait"
        heading="Ready to Create?"
        subtext="While you wait to hear back, pick a beat and start working on your next record."
      />
    </>
  )
}
