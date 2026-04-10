import type { Metadata } from 'next'
import ContactForm from '@/components/AboutClient'

export const metadata: Metadata = {
  title: 'Contact — PRODKJBEATS',
  description: 'Get in touch with PRODKJBEATS.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 sm:px-10 lg:px-16 py-24">
      <h1
        className="font-display uppercase text-foreground mb-20 text-center leading-none"
        style={{ fontSize: 'clamp(56px, 10vw, 128px)' }}
      >
        Get in Touch.
      </h1>
      <ContactForm />
    </div>
  )
}
