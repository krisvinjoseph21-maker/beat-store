import Link from 'next/link'
import { ArrowRight, BadgeCheck, Star } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase'
import { PLACEHOLDER_BEATS } from '@/lib/placeholder-data'
import type { Beat } from '@/lib/store'
import HomeFeaturedBeats from '@/components/HomeFeaturedBeats'
import FeaturedTrack from '@/components/FeaturedTrack'
import HomeSearch from '@/components/HomeSearch'
import EmailSignup from '@/components/EmailSignup'
import HeroMouseGlow from '@/components/HeroMouseGlow'

async function getPageData(): Promise<{ featured: Beat | null; latest: Beat[] }> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('beats')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(7)

    const beats = (data ?? []) as Beat[]
    const featured = beats.find((b: Beat & { is_featured?: boolean }) => b.is_featured) ?? null
    const latest = beats.filter((b) => b.id !== featured?.id).slice(0, 6)
    return { featured, latest }
  } catch {
    return { featured: null, latest: PLACEHOLDER_BEATS.slice(0, 6) }
  }
}

const STATS = [
  { value: '5+',   label: 'Verified Placements' },
  { value: '5',    label: 'Major Artists' },
  { value: '10M+', label: 'Combined Streams' },
  { value: '100%', label: 'Cleared for Release' },
]

const RECEIPTS = [
  {
    role: 'Featured Credit',
    artist: 'DeeBaby',
    song: '"Chicago Baby"',
    detail: 'Producer · Verified Credit',
    streams: null,
  },
  {
    role: 'Featured Credit',
    artist: 'Paris Bryant',
    song: '"A Crush"',
    detail: 'Producer · Verified Credit',
    streams: null,
  },
  {
    role: 'Verified Placement',
    artist: 'GloRilla',
    song: 'Placement',
    detail: 'CMG / Interscope · Verified',
    streams: null,
  },
  {
    role: 'Verified Placement',
    artist: 'Shenseea',
    song: 'Placement',
    detail: 'Interscope Records · Verified',
    streams: null,
  },
  {
    role: 'Verified Placement',
    artist: 'Seyi Vibez',
    song: 'Placement',
    detail: 'Afrobeats · Verified Credit',
    streams: null,
  },
]

// Marquee 1 — styled credits (shown twice for seamless loop)
const MARQUEE_1 = [
  'GloRilla', '"Chicago Baby"', 'DeeBaby', '"A Crush"', 'Paris Bryant',
  'Shenseea', 'Seyi Vibez', '5 Placements', 'Verified Producer', 'Trap · Drill · R&B · Afrobeats',
  'GloRilla', '"Chicago Baby"', 'DeeBaby', '"A Crush"', 'Paris Bryant',
  'Shenseea', 'Seyi Vibez', '5 Placements', 'Verified Producer', 'Trap · Drill · R&B · Afrobeats',
]

// Marquee 2 — all caps dense ticker (shown twice)
const MARQUEE_2_BASE = [
  'GLORILLA', 'SHENSEEA', 'SEYI VIBEZ', 'DEEBABY', 'PARIS BRYANT',
  'CHICAGO BABY', 'A CRUSH', 'PROD KJBEATS', 'TRAP', 'DRILL',
  'R&B', 'AFROBEATS', 'DANCEHALL', 'VERIFIED', '5 PLACEMENTS',
]
const MARQUEE_2 = [...MARQUEE_2_BASE, ...MARQUEE_2_BASE]

export default async function HomePage() {
  const { featured, latest } = await getPageData()

  return (
    <div className="flex flex-col w-full">

      {/* ─── HERO ──────────────────────────────────────────────────── */}
      <section id="hero-section" className="relative w-full overflow-hidden border-b border-[#191919]">
        {/* Static background layers */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/80" />
          <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-white/[0.02] blur-[140px]" />
        </div>

        {/* Mouse glow overlay */}
        <HeroMouseGlow />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-24 pb-16 sm:pt-32 sm:pb-20 flex flex-col items-center gap-8">
          {/* Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Verified Placements · GloRilla · DeeBaby · More
          </div>

          {/* Headline */}
          <div className="text-center max-w-3xl">
            <h1 className="font-display text-[72px] sm:text-[110px] leading-none text-white uppercase">
              Beats That<br />
              Hit Different.
            </h1>
            <p className="mt-5 text-sm text-zinc-500 sm:text-base max-w-md mx-auto leading-relaxed">
              Trap · Drill · R&amp;B · Afrobeats · Dancehall — mixed, mastered, cleared for release.
            </p>
          </div>

          <HomeSearch />

          {featured && (
            <div className="w-full mt-2">
              <FeaturedTrack beat={featured} />
            </div>
          )}

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link
              href="/store"
              className="inline-flex items-center gap-2 rounded-sm bg-white px-8 py-3.5 text-sm font-black text-black hover:bg-zinc-100 transition-colors"
            >
              Shop Beats <ArrowRight size={14} />
            </Link>
            <Link
              href="/licensing"
              className="inline-flex items-center gap-2 rounded-sm border border-[#2a2a2a] px-8 py-3.5 text-sm font-bold text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
            >
              View Licensing
            </Link>
          </div>
        </div>
      </section>

      {/* ─── MARQUEE 1 — credits ticker ────────────────────────────── */}
      <div className="w-full overflow-hidden border-b border-[#191919] bg-[#0d0d0d] py-3.5 select-none">
        <div className="flex animate-marquee whitespace-nowrap">
          {MARQUEE_1.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-3 px-4">
              <span className="text-zinc-700">✦</span>
              <span className="text-xs font-semibold text-zinc-500 tracking-wide">{item}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── MARQUEE 2 — dense all-caps reverse ────────────────────── */}
      <div className="w-full overflow-hidden border-b border-[#191919] bg-[#0a0a0a] py-3 select-none">
        <div className="flex animate-marquee-reverse whitespace-nowrap">
          {MARQUEE_2.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-3">
              <span className="text-zinc-800">✦</span>
              <span className="text-[11px] font-black text-zinc-600 tracking-[0.15em] uppercase">{item}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── STATS ─────────────────────────────────────────────────── */}
      <section className="w-full border-b border-[#191919] bg-[#0d0d0d]">
        <div className="mx-auto max-w-6xl px-4 py-14 grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#191919]">
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-[#0d0d0d] px-6 py-10 flex flex-col items-center text-center gap-1">
              <span className="font-display text-5xl sm:text-6xl text-white leading-none">{value}</span>
              <span className="text-xs text-zinc-600 uppercase tracking-widest font-semibold mt-2">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── LATEST BEATS ──────────────────────────────────────────── */}
      <section className="w-full border-b border-[#191919]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-600 mb-2">Fresh Off the DAW</p>
              <h2 className="font-display text-5xl sm:text-6xl text-white uppercase leading-none">
                Featured Beats.
              </h2>
            </div>
            <Link
              href="/store"
              className="inline-flex items-center gap-1.5 rounded-sm border border-[#2a2a2a] px-4 py-2.5 text-xs font-bold text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
            >
              View All Beats <ArrowRight size={12} />
            </Link>
          </div>
          <HomeFeaturedBeats beats={latest} />
        </div>
      </section>

      {/* ─── RECEIPTS (VERIFIED PLACEMENTS) ────────────────────────── */}
      <section className="w-full border-b border-[#191919] bg-[#0d0d0d]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          {/* Header */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-600 mb-2">Verified Credits</p>
              <h2 className="font-display text-5xl sm:text-6xl text-white uppercase leading-none">
                The Receipts.
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:text-center">
              {[
                { v: '5+', l: 'Placements' },
                { v: '5', l: 'Artists' },
                { v: '10M+', l: 'Streams' },
                { v: '4', l: 'Genres' },
              ].map(({ v, l }) => (
                <div key={l} className="flex flex-col">
                  <span className="font-display text-2xl text-white leading-none">{v}</span>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Credit cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {RECEIPTS.map(({ role, artist, song, detail }) => (
              <div
                key={artist + song}
                className="group flex flex-col gap-3 rounded-sm border border-[#1e1e1e] bg-[#0f0f0f] p-5 hover:border-[#2a2a2a] hover:bg-[#111] transition-all"
              >
                <div className="flex items-center gap-2">
                  <Star size={12} className="text-zinc-500 flex-shrink-0" fill="currentColor" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{role}</span>
                </div>
                <div>
                  <p className="text-lg font-black text-white leading-tight">{artist}</p>
                  <p className="text-sm text-zinc-400 mt-0.5">{song} · Producer</p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#1a1a1a]">
                  <span className="text-xs text-zinc-600">{detail}</span>
                  <div className="flex items-center gap-1">
                    <BadgeCheck size={12} className="text-zinc-500" />
                    <span className="text-[10px] text-zinc-600">Verified</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EMAIL SIGNUP ──────────────────────────────────────────── */}
      <section className="w-full border-b border-[#191919]">
        <div className="mx-auto max-w-6xl px-4 py-20 flex flex-col items-center text-center gap-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-600">Stay Connected</p>
          <h2 className="font-display text-5xl sm:text-7xl text-white uppercase leading-none max-w-2xl">
            Get a Free Beat<br />
            <span className="text-zinc-600">When You Sign Up</span>
          </h2>
          <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
            Drop your email and get an exclusive free beat straight to your inbox. No spam — just heat.
          </p>
          <EmailSignup />
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="relative w-full py-28 flex flex-col items-center text-center px-4 overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[700px] rounded-full bg-white/[0.02] blur-[120px]" />
        <p className="relative mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-600">Don&apos;t Sleep</p>
        <h2 className="relative font-display text-6xl sm:text-[96px] text-white uppercase leading-none mb-6">
          Your Next Hit<br />Starts Here.
        </h2>
        <p className="relative mb-10 text-sm text-zinc-500 max-w-xs leading-relaxed">
          Every beat is mixed, mastered, and ready to record. Instant delivery after checkout.
        </p>
        <Link
          href="/store"
          className="relative inline-flex items-center gap-2 rounded-sm bg-white px-12 py-4 text-sm font-black text-black hover:bg-zinc-100 transition-colors"
        >
          Shop Beats <ArrowRight size={15} />
        </Link>
        <p className="relative mt-5 text-xs text-zinc-700">From $29.99 · Instant Download · All Licenses Available</p>
      </section>

    </div>
  )
}
