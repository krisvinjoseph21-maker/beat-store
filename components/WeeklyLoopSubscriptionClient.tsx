'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, ChevronRight } from 'lucide-react'
import { useLocaleStore, formatPrice } from '@/lib/locale'

interface Plan {
  id: string
  label: string
  usdPrice: number
  perMonth?: number
  badge?: string
}

const PLANS: Plan[] = [
  { id: '1-month',  label: '1 Month Subscription',          usdPrice: 7,  perMonth: 7 },
  { id: '3-month',  label: '3 Month Subscription',          usdPrice: 18, perMonth: 6 },
  { id: '6-month',  label: '6 Month Subscription',          usdPrice: 30, perMonth: 5 },
  { id: '12-month', label: '12 Month Subscription',         usdPrice: 50, perMonth: 4, badge: 'Best Value' },
  { id: 'lifetime', label: 'Lifetime Access',               usdPrice: 99 },
]

const ORIGINAL_USD_VALUE = 207

const FEATURES = [
  '50+ fresh loops dropped every week',
  'Melody loops, chord stabs, drum patterns & bass lines',
  'WAV + MIDI files included in every pack',
  'Instant download — no waiting',
  'Commercial use license on all loops',
]

export default function WeeklyLoopSubscriptionClient() {
  const [selected, setSelected] = useState<Plan>(PLANS[0])
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const currency = useLocaleStore((s) => s.currency)

  useEffect(() => { setMounted(true) }, [])

  async function handleCheckout() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/loop-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selected.id }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Checkout failed. Please try again.')
      }
    } catch {
      setError('Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-muted mb-12 uppercase tracking-[0.08em]">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight size={11} className="text-muted-mid" />
          <span className="text-muted-mid">Sample Packs</span>
          <ChevronRight size={11} className="text-muted-mid" />
          <span className="text-foreground">Loop Subscription</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-start">

          {/* ── Left: Product Visual ─────────────────────────────── */}
          <div className="relative aspect-square bg-surface-3 rounded-xl overflow-hidden border border-line-card flex items-end justify-start p-8 sm:p-10">
            {/* Waveform line strip backdrop */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
              {[14, 22, 30, 46, 54, 62, 70, 78].map((top) => (
                <div
                  key={top}
                  className="absolute left-0 right-0 h-px"
                  style={{ top: `${top}%`, background: `rgba(200,168,106,${top % 16 === 14 ? 0.18 : 0.06})` }}
                />
              ))}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-accent/20" />
            </div>

            {/* Large display text */}
            <div className="relative z-10 w-full">
              <p className="text-[11px] font-normal uppercase tracking-[0.25em] text-muted-low mb-4">PRODBATTS</p>
              <h2
                className="font-['Bebas_Neue'] leading-[0.88] text-foreground mb-6 select-none"
                style={{ fontSize: 'clamp(72px, 13vw, 118px)' }}
                aria-hidden="true"
              >
                WEEKLY<br />LOOPS
              </h2>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-accent/40 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span className="text-[11px] font-medium tracking-[0.1em] text-accent uppercase">50+ drops / week</span>
                </span>
              </div>
            </div>
          </div>

          {/* ── Right: Product Details ────────────────────────────── */}
          <div>
            {/* Brand eyebrow */}
            <p className="text-[11px] font-normal uppercase tracking-[0.25em] text-muted-low mb-3">PRODBATTS</p>

            {/* Title */}
            <h1 className="font-['Bebas_Neue'] leading-[0.93] text-foreground mb-6" style={{ fontSize: 'clamp(48px, 8vw, 68px)' }}>
              LOOP SUBSCRIPTION
            </h1>

            {/* Pricing */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1.5">
              {mounted ? (
                <>
                  <span className="text-[15px] text-muted line-through">
                    {formatPrice(ORIGINAL_USD_VALUE, currency)} value
                  </span>
                  <span className="text-[30px] font-bold text-foreground tracking-tight">
                    From {formatPrice(PLANS[0].usdPrice, currency)}
                  </span>
                </>
              ) : (
                <span className="text-[30px] font-bold text-foreground tracking-tight">From $7</span>
              )}
              <span className="self-center px-2.5 py-0.5 bg-accent/10 border border-accent/30 rounded text-[10px] font-semibold tracking-[0.08em] uppercase text-accent">
                Sale
              </span>
            </div>
            <p className="text-[12px] text-muted-low mb-8">Taxes included.</p>

            {/* Subscription Options */}
            <div className="mb-6" role="group" aria-label="Subscription options">
              <p className="text-[11px] font-normal uppercase tracking-[0.1em] text-muted-low mb-3">
                Subscription Options
              </p>
              <div className="flex flex-wrap gap-2.5">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelected(plan)}
                    aria-pressed={selected.id === plan.id}
                    className={`relative px-4 py-2.5 rounded-full text-[13px] font-medium transition-all min-h-[44px] border ${
                      selected.id === plan.id
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-transparent text-foreground border-line-hover hover:border-muted-mid'
                    }`}
                  >
                    {plan.label}
                    {plan.badge && (
                      <span className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-accent text-background text-[9px] font-bold uppercase rounded-full leading-none">
                        {plan.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Per-month callout */}
            {selected.perMonth !== undefined && (
              <p className="text-[13px] text-muted-low mb-8">
                {mounted
                  ? `${formatPrice(selected.usdPrice, currency)} total · ${formatPrice(selected.perMonth, currency)}/mo`
                  : `$${selected.usdPrice} total · $${selected.perMonth}/mo`}
              </p>
            )}
            {selected.id === 'lifetime' && (
              <p className="text-[13px] text-muted-low mb-8">
                {mounted ? formatPrice(selected.usdPrice, currency) : `$${selected.usdPrice}`} one-time · unlimited access
              </p>
            )}

            {/* Features */}
            <ul className="space-y-3 mb-10" aria-label="What's included">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-[14px] text-muted">
                  <Check size={13} className="text-accent mt-0.5 shrink-0" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-4 text-[14px] font-bold text-black bg-white hover:bg-white-hover transition-colors min-h-[52px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Redirecting…'
                : `Get Access — ${mounted ? formatPrice(selected.usdPrice, currency) : `$${selected.usdPrice}`}`}
            </button>

            {error && (
              <p className="mt-3 text-[13px] text-danger" role="alert">{error}</p>
            )}
          </div>
        </div>

        {/* ── Description ─────────────────────────────────────────── */}
        <div className="mt-24 pt-16 border-t border-line max-w-2xl">
          <p className="text-[11px] font-normal uppercase tracking-[0.1em] text-muted-low mb-4">About the Pack</p>
          <h2 className="font-['Bebas_Neue'] text-[38px] sm:text-[44px] leading-[0.95] text-foreground mb-6">
            BUILT FOR PRODUCERS
          </h2>
          <p className="text-[15px] text-muted leading-relaxed mb-4">
            Every week a fresh batch of loops lands in your dashboard. No filler — these are the same sounds I use in my own sessions. Melody lines, drum grooves, chord stabs, bass patterns. Production-ready from the jump.
          </p>
          <p className="text-[15px] text-muted leading-relaxed">
            The subscription runs on a simple idea: stay subscribed, stay ahead. Each pack is exclusive to members and never released for individual sale. WAV and MIDI included so you can rearrange, repitch, and make it yours.
          </p>
        </div>

      </div>
    </main>
  )
}
