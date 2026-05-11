'use client'

import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { TIERS } from '@/lib/license-tiers'
import ScrollReveal from './ScrollReveal'

export default function LicenseTierGrid() {
  return (
    <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4 pb-3 sm:pb-0">
      {TIERS.map((tier, idx) => (
        <ScrollReveal key={tier.name} delay={idx * 90} className="min-w-[280px] sm:min-w-0 flex-shrink-0 snap-start flex flex-col">
        <div
          className={`relative flex flex-col rounded-xl border bg-surface-3 transition-colors hover:bg-surface-1 h-full ${
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
        </ScrollReveal>
      ))}
    </div>
  )
}
