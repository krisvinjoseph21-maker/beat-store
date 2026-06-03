import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'
import CtaBanner from '@/components/CtaBanner'
import LicenseTierGrid from '@/components/LicenseTierGrid'
import { TIERS } from '@/lib/license-tiers'

export const metadata: Metadata = {
  title: 'Beat Licensing — KJYOUCRAZY | Compare All License Tiers',
  description: 'Compare Standard, Premium, Unlimited, and Exclusive beat licenses. Transparent pricing, instant download, non-exclusive leases starting at $39.95.',
  alternates: { canonical: '/licensing' },
}

const ROW_LABELS = TIERS[0].features.map((f) => f.label)

const RULES = [
  'All leases are non-exclusive unless you purchase exclusive rights.',
  'You may not resell, lease, or sublicense beats to third parties.',
  'Credit is required on all streaming platforms and video descriptions for leased beats.',
  'Leases do not transfer copyright ownership of the underlying composition.',
  'KJYOUCRAZY retains the right to continue licensing the beat to others under non-exclusive agreements.',
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
          <LicenseTierGrid />
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
