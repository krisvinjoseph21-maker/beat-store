import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Beat Licensing — PRODKJBEATS',
}

const TIERS = [
  {
    tag: null,
    name: 'MP3 Lease',
    price: '$29.99',
    cta: 'Shop Beats',
    href: '/store',
    features: [
      { label: 'File Format',         value: 'MP3 (320kbps)' },
      { label: 'Distribution Limit',  value: '10,000 copies' },
      { label: 'Streaming Limit',     value: '100,000 streams' },
      { label: 'Music Videos',        value: '1 music video' },
      { label: 'Radio Broadcasting',  value: 'Up to 2 stations' },
      { label: 'Monetization',        value: 'YouTube monetization' },
      { label: 'Credit Required',     value: 'Prod. PRODKJBEATS' },
      { label: 'Ownership',           value: 'Non-exclusive' },
      { label: 'For Sale',            value: '✓' },
      { label: 'Live Performances',   value: 'Unlimited' },
    ],
  },
  {
    tag: null,
    name: 'WAV Lease',
    price: '$74.99',
    cta: 'Shop Beats',
    href: '/store',
    features: [
      { label: 'File Format',         value: 'WAV (24-bit)' },
      { label: 'Distribution Limit',  value: '25,000 copies' },
      { label: 'Streaming Limit',     value: '500,000 streams' },
      { label: 'Music Videos',        value: '1 music video' },
      { label: 'Radio Broadcasting',  value: 'Up to 5 stations' },
      { label: 'Monetization',        value: 'YouTube monetization' },
      { label: 'Credit Required',     value: 'Prod. PRODKJBEATS' },
      { label: 'Ownership',           value: 'Non-exclusive' },
      { label: 'For Sale',            value: '✓' },
      { label: 'Live Performances',   value: 'Unlimited' },
    ],
  },
  {
    tag: 'Most Popular',
    name: 'Stems License',
    price: '$149.99',
    cta: 'Shop Beats',
    href: '/store',
    features: [
      { label: 'File Format',         value: 'WAV Trackout Stems' },
      { label: 'Distribution Limit',  value: '75,000 copies' },
      { label: 'Streaming Limit',     value: '1,500,000 streams' },
      { label: 'Music Videos',        value: 'Unlimited' },
      { label: 'Radio Broadcasting',  value: 'Unlimited' },
      { label: 'Monetization',        value: 'Full monetization' },
      { label: 'Credit Required',     value: 'Prod. PRODKJBEATS' },
      { label: 'Ownership',           value: 'Non-exclusive' },
      { label: 'For Sale',            value: '✓' },
      { label: 'Live Performances',   value: 'Unlimited' },
    ],
  },
  {
    tag: null,
    name: 'Exclusive',
    price: '$500+',
    cta: 'Contact Us',
    href: '/about',
    features: [
      { label: 'File Format',         value: 'WAV + Stems + MP3' },
      { label: 'Distribution Limit',  value: 'Unlimited' },
      { label: 'Streaming Limit',     value: 'Unlimited' },
      { label: 'Music Videos',        value: 'Unlimited' },
      { label: 'Radio Broadcasting',  value: 'Unlimited' },
      { label: 'Monetization',        value: 'Full monetization' },
      { label: 'Credit Required',     value: 'Prod. PRODKJBEATS' },
      { label: 'Ownership',           value: 'Full exclusive rights' },
      { label: 'For Sale',            value: '✓' },
      { label: 'Live Performances',   value: 'Unlimited' },
    ],
  },
]

const RULES = [
  'All leases are non-exclusive unless you purchase exclusive rights.',
  'You may not resell, lease, or sublicense beats to third parties.',
  'Credit is required on all streaming platforms and video descriptions for leased beats.',
  'Leases do not transfer copyright ownership of the underlying composition.',
  'PRODKJBEATS retains the right to continue licensing the beat to others under non-exclusive agreements.',
  'Beats purchased under a lease may not be used in TV/film sync without upgrading to exclusive rights.',
  'Lease terms begin on the date of purchase.',
]

export default function LicensingPage() {
  return (
    <div className="w-full">

      {/* Header */}
      <div className="w-full flex justify-center border-b border-white/[0.06] bg-black">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 py-20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-low mb-4">Beat Licensing</p>
          <h1 className="font-display text-6xl sm:text-8xl text-foreground uppercase leading-none mb-5">
            Choose Your License.
          </h1>
          <p className="text-[14px] text-muted max-w-lg leading-[1.7]">
            Every license includes instant delivery to your inbox. All beats are non-exclusive unless purchased as Exclusive.
          </p>
        </div>
      </div>

      {/* Tier grid */}
      <div className="flex justify-center w-full">
      <div className="w-full max-w-6xl px-6 sm:px-10 lg:px-16 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border bg-surface-3 overflow-hidden transition-colors hover:bg-surface-1 ${
                tier.tag ? 'border-white/20' : 'border-white/[0.08]'
              }`}
            >
              {tier.tag && (
                <div className="bg-white px-4 py-1.5 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-black">{tier.tag}</span>
                </div>
              )}

              <div className="flex flex-col gap-5 p-5 flex-1">
                {/* Name + Price */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-low mb-2">{tier.name}</p>
                  <p className="font-display text-4xl text-foreground leading-none">{tier.price}</p>
                </div>

                {/* CTA */}
                <Link
                  href={tier.href}
                  className={`inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-[12px] font-semibold transition-all active:scale-95 ${
                    tier.tag
                      ? 'bg-white text-black hover:bg-white-hover'
                      : 'border border-white/[0.1] text-muted hover:border-white/25 hover:text-foreground'
                  }`}
                >
                  {tier.cta} <ArrowRight size={12} />
                </Link>

                {/* Feature table */}
                <div className="flex flex-col gap-3 pt-3 border-t border-white/[0.06]">
                  {tier.features.map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-low">{label}</span>
                      <span className={`text-[12px] font-medium ${value === '✓' ? 'text-accent' : 'text-muted-mid'}`}>
                        {value === '✓' ? <Check size={13} className="text-accent" /> : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* General rules */}
      <div className="flex justify-center w-full">
      <div className="w-full max-w-6xl px-6 sm:px-10 lg:px-16 pb-20">
        <h2 className="mb-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-low">General Rules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RULES.map((rule) => (
            <div key={rule} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-surface-4 p-4">
              <span className="mt-0.5 text-muted-low text-[12px] flex-shrink-0">—</span>
              <p className="text-[13px] text-muted leading-[1.6]">{rule}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-[12px] text-muted-low text-center">
          Questions?{' '}
          <Link href="/about" className="underline decoration-white/20 hover:text-muted transition-colors">
            Contact us here.
          </Link>
        </p>
      </div>
      </div>

    </div>
  )
}
