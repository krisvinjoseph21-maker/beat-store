import type { Metadata } from 'next'
import ServicesClient from '@/components/ServicesClient'

export const metadata: Metadata = {
  title: 'Services — PRODKJBEATS',
  description: 'Mix & Master and Custom Exclusive Beat services.',
}

export default function ServicesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-16 py-16">
      <div className="mb-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-low mb-3">
          Work With Me
        </p>
        <h1 className="font-display text-5xl sm:text-6xl text-foreground uppercase leading-none mb-4">Services.</h1>
        <p className="text-[14px] text-muted max-w-sm leading-relaxed">
          Professional production services for serious artists. Limited spots available.
        </p>
      </div>
      <ServicesClient />
    </div>
  )
}
