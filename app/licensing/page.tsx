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
      <div className="w-full border-b border-[#191919] bg-[#0d0d0d]">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-600">Beat Licensing</p>
          <h1 className="font-display text-6xl sm:text-8xl text-white uppercase leading-none mb-4">
            Choose Your License.
          </h1>
          <p className="text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed">
            Every license includes instant delivery to your inbox. All beats are non-exclusive unless purchased as Exclusive.
          </p>
        </div>
      </div>

      {/* Tier grid */}
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-sm border bg-[#0f0f0f] overflow-hidden ${
                tier.tag ? 'border-white/20' : 'border-[#1e1e1e]'
              }`}
            >
              {tier.tag && (
                <div className="bg-white px-4 py-1.5 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black">{tier.tag}</span>
                </div>
              )}

              <div className="flex flex-col gap-5 p-5 flex-1">
                {/* Name + Price */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-1">{tier.name}</p>
                  <p className="font-display text-4xl text-white leading-none">{tier.price}</p>
                </div>

                {/* CTA */}
                <Link
                  href={tier.href}
                  className={`inline-flex items-center justify-center gap-2 rounded-sm py-3 text-sm font-black transition-colors ${
                    tier.tag
                      ? 'bg-white text-black hover:bg-zinc-100'
                      : 'border border-[#2a2a2a] text-zinc-300 hover:border-zinc-500 hover:text-white'
                  }`}
                >
                  {tier.cta} <ArrowRight size={13} />
                </Link>

                {/* Feature table */}
                <div className="flex flex-col gap-3 pt-2 border-t border-[#1a1a1a]">
                  {tier.features.map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700">{label}</span>
                      <span className={`text-xs font-semibold ${value === '✓' ? 'text-green-400' : 'text-zinc-300'}`}>
                        {value === '✓' ? <Check size={14} className="text-green-400" /> : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* General rules */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-5 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600">General Rules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RULES.map((rule) => (
            <div key={rule} className="flex items-start gap-3 rounded-sm border border-[#1a1a1a] bg-[#0d0d0d] p-4">
              <span className="mt-0.5 text-zinc-700 text-sm flex-shrink-0">—</span>
              <p className="text-sm text-zinc-500 leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-xs text-zinc-600 text-center">
          Questions?{' '}
          <Link href="/about" className="underline hover:text-zinc-400 transition-colors">
            Contact us here.
          </Link>
        </p>
      </div>

    </div>
  )
}
