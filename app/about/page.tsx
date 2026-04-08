import type { Metadata } from 'next'
import AboutClient from '@/components/AboutClient'

export const metadata: Metadata = {
  title: 'About — PRODKJBEATS',
  description: 'Learn about PRODKJBEATS and get in touch.',
}

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 lg:px-8 py-16">
      <div className="mb-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#767676] mb-3">
          The Producer
        </p>
        <h1 className="font-display text-5xl sm:text-6xl text-[#f5f5f7] uppercase leading-none">About.</h1>
      </div>

      {/* Bio */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-8 sm:p-10 mb-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-2xl">
            🎹
          </div>
          <div>
            <h2 className="text-[17px] font-semibold text-[#f5f5f7] mb-0.5">PRODKJBEATS</h2>
            <p className="text-[12px] text-[#767676] mb-5">Producer · Mixer · Sound Designer</p>
            <div className="space-y-3 text-[14px] text-[#6e6e73] leading-[1.7]">
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
        </div>
      </div>

      <AboutClient />
    </div>
  )
}
