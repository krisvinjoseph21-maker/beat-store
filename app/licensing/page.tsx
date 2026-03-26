import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Licensing Info — PRODKJBEATS',
}

const TIERS = [
  {
    name: 'Standard Lease',
    price: 'From $29.99',
    features: [
      'MP3 + WAV files included',
      'Up to 500,000 streams (all platforms)',
      'Up to 5,000 paid downloads',
      'Up to 3 music videos',
      'Non-exclusive — beat remains available to others',
      'Must credit "Prod. PRODKJBEATS" in title and description',
    ],
  },
  {
    name: 'Unlimited Lease',
    price: 'From $74.99',
    features: [
      'MP3, WAV, and track stems included',
      'Unlimited streams and downloads',
      'Unlimited music videos',
      'Non-exclusive — beat remains available to others',
      'Must credit "Prod. PRODKJBEATS" in title and description',
      'Eligible for major-label distribution',
    ],
  },
  {
    name: 'Exclusive Rights',
    price: 'Contact for pricing',
    features: [
      'MP3, WAV, and full track stems',
      'Unlimited streams, downloads, and videos',
      'Beat is removed from store after purchase',
      'Full ownership transfer of the beat',
      'No credit requirement (optional but appreciated)',
      'Includes signed contract',
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
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
          Legal
        </p>
        <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">Licensing Info</h1>
        <p className="mt-3 text-sm text-gray-400 max-w-md mx-auto">
          Understand what you're buying before you check out.
        </p>
      </div>

      {/* Tier cards */}
      <div className="space-y-4 mb-12">
        {TIERS.map((tier) => (
          <div key={tier.name} className="rounded-xl border border-gray-200 bg-gray-50 p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-black text-gray-900 text-base">{tier.name}</h2>
              <span className="text-sm font-semibold text-gray-500">{tier.price}</span>
            </div>
            <ul className="space-y-2">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-500">
                  <span className="mt-0.5 text-gray-400">—</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* General rules */}
      <div>
        <h2 className="mb-4 text-sm font-black uppercase tracking-[0.15em] text-gray-400">
          General Rules
        </h2>
        <div className="space-y-3">
          {RULES.map((rule) => (
            <div key={rule} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500 leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 text-xs text-gray-400 text-center">
        Questions? Contact us through the{' '}
        <a href="/about" className="underline hover:text-gray-500 transition-colors">
          Services page
        </a>
        .
      </p>
    </div>
  )
}
