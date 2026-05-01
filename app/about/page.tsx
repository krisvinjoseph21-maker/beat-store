import type { Metadata } from 'next'
import ContactForm from '@/components/AboutClient'
import CtaBanner from '@/components/CtaBanner'

export const metadata: Metadata = {
  title: 'Contact PRODKJBEATS — Inquiries, Collabs & Custom Beat Requests',
  description: 'Reach out to PRODKJBEATS for custom beat requests, collaboration inquiries, or licensing questions. Response within 24–48 hours.',
  alternates: { canonical: '/about' },
}

export default function ContactPage() {
  return (
    <>
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 sm:px-10 lg:px-16 py-24">
        <h1
          className="font-display uppercase text-foreground mb-20 text-center leading-none"
          style={{ fontSize: 'clamp(56px, 10vw, 128px)' }}
        >
          Get in Touch.
        </h1>
        <ContactForm />
      </div>
      <CtaBanner
        label="Browse the Store"
        heading="Let's Make Something."
        subtext="While you wait to hear back, browse the catalog and find your next beat."
      />
    </>
  )
}
