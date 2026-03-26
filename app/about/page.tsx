import type { Metadata } from 'next'
import AboutClient from '@/components/AboutClient'

export const metadata: Metadata = {
  title: 'About — PRODKJBEATS',
  description: 'Learn about PRODKJBEATS and get in touch.',
}

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mx-auto max-w-3xl text-center">
      <div className="mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
          The Producer
        </p>
        <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">About</h1>
      </div>

      {/* Bio */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-8">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
            🎹
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-gray-900">PRODKJBEATS</h2>
            <p className="text-sm text-gray-500">Producer · Mixer · Sound Designer</p>
          </div>
        </div>
        <div className="space-y-4 text-gray-500 leading-relaxed text-center text-sm">
          <p>
            PRODKJBEATS is an independent producer specializing in trap, drill, R&amp;B, and Afrobeats.
            With years of experience crafting high-quality instrumentals, every beat is designed to
            give artists the foundation they need to create their best work.
          </p>
          <p>
            From dark, hard-hitting 808 trap to smooth neo-soul R&amp;B and infectious Afrobeats grooves —
            the catalog has something for every artist and every moment.
          </p>
          <p>
            Available for custom beat production, mixing, and mastering. Reach out below to discuss
            your project.
          </p>
        </div>
      </div>

      <AboutClient />
      </div>
    </div>
  )
}
