import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { PRICES } from '@/lib/prices'
import CtaBanner from '@/components/CtaBanner'

export const metadata: Metadata = {
  title: 'Beat Licensing — PRODKJBEATS | Compare All License Tiers',
  description: 'Compare Standard, Premium, Unlimited, and Exclusive beat licenses. Transparent pricing, instant download, non-exclusive leases starting at $39.95.',
  alternates: { canonical: '/licensing' },
}

const TIERS = [
  {
    tag: null,
    name: 'Basic Lease',
    colLabel: 'BASIC LEASE',
    price: `From $${PRICES.standard[1]}`,
    cta: 'Shop Beats',
    href: '/store',
    accent: false,
    features: [
      { label: 'File Format',         value: 'MP3 (320kbps)' },
      { label: 'Distribution Limit',  value: '10,000 copies' },
      { label: 'Streaming Limit',     value: '100,000 streams' },
      { label: 'Music Videos',        value: '1 music video' },
      { label: 'Radio Broadcasting',  value: 'Up to 2 stations' },
      { label: 'Monetization',        value: 'YouTube monetization' },
      { label: 'Credit Required',     value: 'Prod. PRODKJBEATS' },
      { label: 'Ownership',           value: 'Non-exclusive' },
      { label: 'Live Performances',   value: 'Unlimited' },
    ],
  },
  {
    tag: null,
    name: 'Premium Lease',
    colLabel: 'PREMIUM LEASE',
    price: `From $${PRICES.premium[1]}`,
    cta: 'Shop Beats',
    href: '/store',
    accent: false,
    features: [
      { label: 'File Format',         value: 'WAV (24-bit)' },
      { label: 'Distribution Limit',  value: '25,000 copies' },
      { label: 'Streaming Limit',     value: '500,000 streams' },
      { label: 'Music Videos',        value: '1 music video' },
      { label: 'Radio Broadcasting',  value: 'Up to 5 stations' },
      { label: 'Monetization',        value: 'YouTube monetization' },
      { label: 'Credit Required',     value: 'Prod. PRODKJBEATS' },
      { label: 'Ownership',           value: 'Non-exclusive' },
      { label: 'Live Performances',   value: 'Unlimited' },
    ],
  },
  {
    tag: 'Most Popular',
    name: 'Unlimited Lease',
    colLabel: 'UNLIMITED LEASE',
    price: `From $${PRICES.unlimited[1]}`,
    cta: 'Shop Beats',
    href: '/store',
    accent: true,
    features: [
      { label: 'File Format',         value: 'WAV Trackout Stems' },
      { label: 'Distribution Limit',  value: '75,000 copies' },
      { label: 'Streaming Limit',     value: '1,500,000 streams' },
      { label: 'Music Videos',        value: 'Unlimited' },
      { label: 'Radio Broadcasting',  value: 'Unlimited' },
      { label: 'Monetization',        value: 'Full monetization' },
      { label: 'Credit Required',     value: 'Prod. PRODKJBEATS' },
      { label: 'Ownership',           value: 'Non-exclusive' },
      { label: 'Live Performances',   value: 'Unlimited' },
    ],
  },
  {
    tag: null,
    name: 'Exclusive',
    colLabel: 'EXCLUSIVE',
    price: '$500+',
    cta: 'Contact Us',
    href: '/about',
    accent: false,
    features: [
      { label: 'File Format',         value: 'WAV + Stems + MP3' },
      { label: 'Distribution Limit',  value: 'Unlimited' },
      { label: 'Streaming Limit',     value: 'Unlimited' },
      { label: 'Music Videos',        value: 'Unlimited' },
      { label: 'Radio Broadcasting',  value: 'Unlimited' },
      { label: 'Monetization',        value: 'Full monetization' },
      { label: 'Credit Required',     value: 'Prod. PRODKJBEATS' },
      { label: 'Ownership',           value: 'Full exclusive rights' },
      { label: 'Live Performances',   value: 'Unlimited' },
    ],
  },
]

const ROW_LABELS = TIERS[0].features.map((f) => f.label)

const RULES = [
  'All leases are non-exclusive unless you purchase exclusive rights.',
  'You may not resell, lease, or sublicense beats to third parties.',
  'Credit is required on all streaming platforms and video descriptions for leased beats.',
  'Leases do not transfer copyright ownership of the underlying composition.',
  'PRODKJBEATS retains the right to continue licensing the beat to others under non-exclusive agreements.',
  'Beats purchased under a lease may not be used in TV/film sync without upgrading to exclusive rights.',
  'Lease terms begin on the date of purchase.',
]

function FeatureValue({ value, accent }: { value: string; accent: boolean }) {
  if (value === '✓') {
    return <Check size={14} className={accent ? 'text-accent mx-auto' : 'text-foreground mx-auto'} aria-label="Yes" />
  }
  return <span className={accent ? 'text-accent font-semibold' : 'text-foreground font-semibold'}>{value}</span>
}

export default function LicensingPage() {
  return (
    <>
    <div className="w-full">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="w-full flex justify-center border-b border-white/[0.06] bg-black">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 py-20">
          <p className="text-[11px] font-normal uppercase tracking-[0.1em] text-muted-low mb-4">Beat Licensing</p>
          <h1 className="font-display text-foreground leading-none mb-5" style={{ fontSize: 'clamp(44px, 7vw, 88px)', fontWeight: 300 }}>
            Choose Your License.
          </h1>
        </div>
      </div>

      {/* ── Tier grid ──────────────────────────────────────────── */}
      <div className="flex justify-center w-full">
        <div className="w-full max-w-6xl px-6 sm:px-10 lg:px-16 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`card-hover relative flex flex-col rounded-xl border bg-surface-3 transition-colors hover:bg-surface-1 ${
                  tier.tag ? 'border-white/20' : 'border-white/[0.08]'
                }`}
              >
                {tier.tag && (
                  <div className="bg-white px-4 py-1.5 text-center rounded-t-xl">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-black">{tier.tag}</span>
                  </div>
                )}

                <div className="flex flex-col gap-5 p-5 flex-1">
                  {/* Name + Price */}
                  <div>
                    <p className="text-[11px] font-normal uppercase tracking-[0.08em] text-muted-low mb-2">{tier.name}</p>
                    <p className="text-foreground leading-none" style={{ fontSize: '2rem', fontWeight: 400 }}>{tier.price}</p>
                  </div>

                  {/* CTA */}
                  <Link
                    href={tier.href}
                    className={`inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-[12px] font-semibold transition-[background-color,border-color,color,transform] active:scale-95 ${
                      tier.tag
                        ? 'bg-white text-black hover:bg-white-hover'
                        : 'border border-white/[0.1] text-muted hover:border-white/25 hover:text-foreground'
                    }`}
                  >
                    {tier.cta} <ArrowRight size={12} />
                  </Link>

                  {/* Feature rows — label left, value right */}
                  <div className="flex flex-col border-t border-white/[0.06]">
                    {tier.features.map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
                      >
                        <span className="text-[10px] font-normal uppercase tracking-[0.06em] text-muted-low shrink-0">
                          {label}
                        </span>
                        <span
                          className={`text-[12px] font-semibold text-right ${
                            value === '✓' ? 'text-accent' : 'text-foreground'
                          }`}
                          aria-label={value === '✓' ? 'Yes' : undefined}
                        >
                          {value === '✓'
                            ? <Check size={13} className="text-accent" aria-hidden="true" />
                            : value}
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

      {/* ── Full Comparison ────────────────────────────────────── */}
      <div className="flex justify-center w-full border-t border-white/[0.06]">
        <div className="w-full max-w-6xl px-6 sm:px-10 lg:px-16 py-16">

          <h2 className="font-display text-foreground leading-none mb-14" style={{ fontSize: 'clamp(40px, 6vw, 80px)' }}>
            FULL COMPARISON.
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[640px]">
              {/* Column headers */}
              <thead>
                <tr className="border-b border-white/[0.12]">
                  <th className="text-left pb-4 text-[10px] font-normal uppercase tracking-[0.18em] text-muted-low w-[22%]">
                    Feature
                  </th>
                  {TIERS.map((tier) => (
                    <th
                      key={tier.name}
                      className="pb-4 text-center text-[10px] font-semibold uppercase tracking-[0.14em] w-[19.5%]"
                      style={{ color: tier.accent ? 'var(--accent)' : 'var(--muted-low)' }}
                    >
                      {tier.colLabel}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Feature rows */}
              <tbody>
                {ROW_LABELS.map((label, rowIdx) => (
                  <tr
                    key={label}
                    className="border-b border-white/[0.04]"
                    style={{ background: rowIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
                  >
                    <td className="py-3.5 text-[12px] text-muted-low">{label}</td>
                    {TIERS.map((tier) => {
                      const val = tier.features.find((f) => f.label === label)?.value ?? '—'
                      return (
                        <td key={tier.name} className="py-3.5 text-center">
                          <FeatureValue value={val} accent={tier.accent} />
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* Price row */}
                <tr>
                  <td className="pt-6 text-[10px] font-normal uppercase tracking-[0.1em] text-muted-low">Price</td>
                  {TIERS.map((tier) => (
                    <td key={tier.name} className="pt-6 text-center">
                      <span
                        className="inline-block px-3 py-1.5 text-[13px] font-bold rounded"
                        style={{
                          background: tier.accent ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                          color: tier.accent ? '#000' : 'var(--foreground)',
                        }}
                      >
                        {tier.price}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── General Rules ──────────────────────────────────────── */}
      <div className="flex justify-center w-full border-t border-white/[0.06]">
        <div className="w-full max-w-6xl px-6 sm:px-10 lg:px-16 py-16">
          <h2 className="mb-6 text-[11px] font-normal uppercase tracking-[0.1em] text-muted-low">General Rules</h2>
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
      <CtaBanner
        label="Instant Download"
        heading="Find the Beat."
        subtext="Pick a beat, pick your license, and download instantly — no waiting, no back-and-forth."
      />
    </>
  )
}
