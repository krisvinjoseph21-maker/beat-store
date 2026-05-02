import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { PRICES } from '@/lib/prices'

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
      { label: 'File Format',        value: 'MP3 (320kbps)' },
      { label: 'Distribution Limit', value: '10,000 copies' },
      { label: 'Streaming Limit',    value: '100,000 streams' },
      { label: 'Music Videos',       value: '1 music video' },
      { label: 'Radio Broadcasting', value: 'Up to 2 stations' },
      { label: 'Monetization',       value: 'YouTube monetization' },
      { label: 'Credit Required',    value: 'Prod. PRODKJBEATS' },
      { label: 'Ownership',          value: 'Non-exclusive' },
      { label: 'Live Performances',  value: 'Unlimited' },
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
      { label: 'File Format',        value: 'WAV (24-bit)' },
      { label: 'Distribution Limit', value: '25,000 copies' },
      { label: 'Streaming Limit',    value: '500,000 streams' },
      { label: 'Music Videos',       value: '1 music video' },
      { label: 'Radio Broadcasting', value: 'Up to 5 stations' },
      { label: 'Monetization',       value: 'YouTube monetization' },
      { label: 'Credit Required',    value: 'Prod. PRODKJBEATS' },
      { label: 'Ownership',          value: 'Non-exclusive' },
      { label: 'Live Performances',  value: 'Unlimited' },
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
      { label: 'File Format',        value: 'WAV Trackout Stems' },
      { label: 'Distribution Limit', value: '75,000 copies' },
      { label: 'Streaming Limit',    value: '1,500,000 streams' },
      { label: 'Music Videos',       value: 'Unlimited' },
      { label: 'Radio Broadcasting', value: 'Unlimited' },
      { label: 'Monetization',       value: 'Full monetization' },
      { label: 'Credit Required',    value: 'Prod. PRODKJBEATS' },
      { label: 'Ownership',          value: 'Non-exclusive' },
      { label: 'Live Performances',  value: 'Unlimited' },
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
      { label: 'File Format',        value: 'WAV + Stems + MP3' },
      { label: 'Distribution Limit', value: 'Unlimited' },
      { label: 'Streaming Limit',    value: 'Unlimited' },
      { label: 'Music Videos',       value: 'Unlimited' },
      { label: 'Radio Broadcasting', value: 'Unlimited' },
      { label: 'Monetization',       value: 'Full monetization' },
      { label: 'Credit Required',    value: 'Prod. PRODKJBEATS' },
      { label: 'Ownership',          value: 'Full exclusive rights' },
      { label: 'Live Performances',  value: 'Unlimited' },
    ],
  },
]

export { TIERS }

export default function LicenseTierGrid() {
  return (
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
            <div>
              <p className="text-[11px] font-normal uppercase tracking-[0.08em] text-muted-low mb-2">{tier.name}</p>
              <p className="text-foreground leading-none" style={{ fontSize: '2rem', fontWeight: 400 }}>{tier.price}</p>
            </div>

            <Link
              href={tier.href}
              className={`inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-[12px] font-semibold transition-[background-color,border-color,color,transform] active:scale-95 ${
                tier.accent
                  ? 'bg-white text-black hover:bg-white-hover'
                  : 'border border-white/[0.1] text-muted hover:border-white/25 hover:text-foreground'
              }`}
            >
              {tier.cta} <ArrowRight size={12} />
            </Link>

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
                    className={`text-[12px] font-semibold text-right ${value === '✓' ? 'text-accent' : 'text-foreground'}`}
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
  )
}
