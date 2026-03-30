import Link from 'next/link'
import { ArrowRight, BadgeCheck, Music2 } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase'
import { PLACEHOLDER_BEATS } from '@/lib/placeholder-data'
import type { Beat } from '@/lib/store'
import HomeFeaturedBeats from '@/components/HomeFeaturedBeats'
import FeaturedTrack from '@/components/FeaturedTrack'
import HomeSearch from '@/components/HomeSearch'
import EmailSignup from '@/components/EmailSignup'

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

const PLACEMENTS = [
  { name: 'GloRilla',     genre: 'Rap',       detail: 'CMG / Interscope' },
  { name: 'Shenseea',     genre: 'Dancehall', detail: 'Interscope Records' },
  { name: 'Seyi Vibez',   genre: 'Afrobeats', detail: 'Verified Placement' },
  { name: 'DeeBaby',      genre: 'Drill',     detail: 'Verified Placement' },
  { name: 'Paris Bryant', genre: 'R&B',       detail: 'Verified Placement' },
]

const STATS = [
  { value: '5',    label: 'Verified Placements' },
  { value: '5+',   label: 'Major Artists' },
  { value: '4',    label: 'Genres' },
  { value: '100%', label: 'Cleared for Release' },
]

const MARQUEE_ITEMS = [
  'GloRilla', 'Shenseea', 'Seyi Vibez', 'DeeBaby', 'Paris Bryant',
  'GloRilla', 'Shenseea', 'Seyi Vibez', 'DeeBaby', 'Paris Bryant',
  'GloRilla', 'Shenseea', 'Seyi Vibez', 'DeeBaby', 'Paris Bryant',
  'GloRilla', 'Shenseea', 'Seyi Vibez', 'DeeBaby', 'Paris Bryant',
]

const GENRE_TAG: Record<string, string> = {
  Rap:       'bg-zinc-800 text-zinc-300',
  Dancehall: 'bg-zinc-800 text-zinc-300',
  Afrobeats: 'bg-zinc-800 text-zinc-300',
  Drill:     'bg-zinc-800 text-zinc-300',
  'R&B':     'bg-zinc-800 text-zinc-300',
}

export default async function HomePage() {
  const { featured, latest } = await getPageData()

  return (
    <div className="flex flex-col w-full">

      {/* ─── HERO ──────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden border-b border-[#191919]">
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0">
          {/* Fine dot grid */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          {/* Edge fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/80" />
          {/* Glow blobs */}
          <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-white/[0.025] blur-[140px]" />
          <div className="absolute left-1/3 top-1/2 h-[300px] w-[400px] -translate-y-1/2 rounded-full bg-purple-600/[0.04] blur-[100px]" />
          <div className="absolute right-1/3 top-1/3 h-[200px] w-[300px] rounded-full bg-blue-600/[0.04] blur-[80px]" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 pt-24 pb-16 sm:pt-32 sm:pb-20 flex flex-col items-center gap-8">
          {/* Label pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Producer · PRODKJBEATS
          </div>

          {/* Headline */}
          <div className="text-center max-w-3xl">
            <h1 className="text-5xl font-black text-white sm:text-7xl leading-[0.95] tracking-tight uppercase">
              Beats That<br />
              <span className="animate-shimmer">Build Careers.</span>
            </h1>
            <p className="mt-5 text-sm text-zinc-500 sm:text-base max-w-md mx-auto leading-relaxed">
              Trap · Drill · R&amp;B · Afrobeats · Dancehall — mixed, mastered, cleared for release.
            </p>
          </div>

          {/* Search */}
          <HomeSearch />

          {/* Featured track */}
          {featured && (
            <div className="w-full mt-2">
              <FeaturedTrack beat={featured} />
            </div>
          )}

          {/* Action links */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link
              href="/store"
              className="inline-flex items-center gap-2 rounded-sm bg-white px-8 py-3.5 text-sm font-black text-black hover:bg-zinc-100 transition-colors"
            >
              Browse All Beats <ArrowRight size={14} />
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

      {/* ─── MARQUEE ───────────────────────────────────────────────── */}
      <div className="w-full overflow-hidden border-y border-[#191919] bg-[#0d0d0d] py-4 select-none">
        <div className="flex animate-marquee whitespace-nowrap">
          {MARQUEE_ITEMS.map((name, i) => (
            <span key={i} className="inline-flex items-center gap-4 px-6">
              <BadgeCheck size={13} className="text-zinc-600 flex-shrink-0" />
              <span className="text-sm font-bold text-zinc-400 uppercase tracking-[0.15em]">{name}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── STATS ─────────────────────────────────────────────────── */}
      <section className="w-full border-b border-[#191919] bg-[#0d0d0d]">
        <div className="mx-auto max-w-6xl px-4 py-12 grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#191919]">
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-[#0d0d0d] px-8 py-8 flex flex-col items-center text-center gap-1">
              <span className="text-4xl font-black text-white sm:text-5xl tracking-tight">{value}</span>
              <span className="text-xs text-zinc-600 uppercase tracking-widest font-semibold mt-1">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── VERIFIED PLACEMENTS ───────────────────────────────────── */}
      <section className="w-full border-b border-[#191919]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          {/* Section header */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-600 mb-2">Verified Credits</p>
              <h2 className="text-3xl font-black text-white sm:text-4xl uppercase tracking-tight leading-none">
                Artist Placements
              </h2>
            </div>
            <p className="text-xs text-zinc-600 max-w-xs leading-relaxed">
              Beats produced by PRODKJBEATS placed with major and independent recording artists.
            </p>
          </div>

          {/* Placement cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PLACEMENTS.map(({ name, genre, detail }) => (
              <div
                key={name}
                className="group flex items-center gap-4 rounded-sm border border-[#1e1e1e] bg-[#0f0f0f] px-5 py-5 hover:border-[#2a2a2a] hover:bg-[#111] transition-all"
              >
                {/* Icon */}
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#1a1a1a] border border-[#252525] flex items-center justify-center group-hover:border-[#333] transition-colors">
                  <Music2 size={16} className="text-zinc-500" />
                </div>

                {/* Info */}
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white tracking-tight">{name}</span>
                    <BadgeCheck size={13} className="text-zinc-500 flex-shrink-0" />
                  </div>
                  <span className="text-xs text-zinc-600 truncate">{detail}</span>
                </div>

                {/* Genre tag */}
                <span className={`ml-auto flex-shrink-0 rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${GENRE_TAG[genre] ?? 'bg-zinc-800 text-zinc-300'}`}>
                  {genre}
                </span>
              </div>
            ))}

            {/* Filler card hinting at more */}
            <div className="flex items-center justify-center gap-2 rounded-sm border border-dashed border-[#1e1e1e] px-5 py-5 text-xs font-semibold text-zinc-700 uppercase tracking-widest">
              More Coming Soon
            </div>
          </div>
        </div>
      </section>

      {/* ─── LATEST BEATS ──────────────────────────────────────────── */}
      <section className="w-full border-b border-[#191919]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-600 mb-2">Fresh Off the DAW</p>
              <h2 className="text-3xl font-black text-white sm:text-4xl uppercase tracking-tight leading-none">
                New Drops
              </h2>
            </div>
            <Link
              href="/store"
              className="inline-flex items-center gap-1.5 rounded-sm border border-[#2a2a2a] px-4 py-2.5 text-xs font-bold text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
            >
              All Beats <ArrowRight size={12} />
            </Link>
          </div>
          <HomeFeaturedBeats beats={latest} />
        </div>
      </section>

      {/* ─── EMAIL SIGNUP ──────────────────────────────────────────── */}
      <section className="w-full border-b border-[#191919] bg-[#0d0d0d]">
        <div className="mx-auto max-w-6xl px-4 py-20 flex flex-col items-center text-center gap-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-600">Stay Connected</p>
          <h2 className="text-3xl font-black text-white sm:text-5xl uppercase tracking-tight leading-none max-w-xl">
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
      <section className="w-full py-24 flex flex-col items-center text-center px-4">
        {/* Glow */}
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-white/[0.02] blur-[100px]" />
        <p className="relative mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-600">
          Don&apos;t Sleep
        </p>
        <h2 className="relative mb-4 text-4xl font-black text-white sm:text-6xl uppercase tracking-tight leading-none">
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
        <p className="relative mt-5 text-xs text-zinc-700">From $75 · Instant Download · All Licenses Available</p>
      </section>

    </div>
  )
}
