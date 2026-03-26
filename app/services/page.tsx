import type { Metadata } from 'next'
import ServicesClient from '@/components/ServicesClient'

export const metadata: Metadata = {
  title: 'Services — PRODKJBEATS',
  description: 'Mix & Master and Custom Exclusive Beat services.',
}

export default function ServicesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
          Work With Me
        </p>
        <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">Services</h1>
        <p className="mt-3 text-gray-500 max-w-md mx-auto">
          Professional production services for serious artists. Limited spots available.
        </p>
      </div>
      <ServicesClient />
    </div>
  )
}
