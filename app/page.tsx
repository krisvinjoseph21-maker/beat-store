export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import type { Beat } from '@/lib/store'
import SpotifyEmbed from '@/components/SpotifyEmbed'
import FeaturedTrack from '@/components/FeaturedTrack'
import HeroMouseGlow from '@/components/HeroMouseGlow'
import HeadlineParallax from '@/components/HeadlineParallax'
import ScrollReveal from '@/components/ScrollReveal'
import HeroVideo from '@/components/HeroVideo'
import AnimatedStat from '@/components/AnimatedStat'

async function getPageData(): Promise<{ featured: Beat | null }> {
  try {
    const supabase = createAdminClient()
    // Never select file_url, file_path, stems_path, preview_path — they must never reach the client.
    const { data } = await supabase
      .from('beats')
      .select('id, title, bpm, key, genre, subgenre, tags, preview_url, cover_url, is_active, is_featured, created_at, pin_order')
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(1)
      .single()
    const featured = data ? { ...data, file_url: null, stems_path: null } as Beat : null
    return { featured }
  } catch {
    return { featured: null }
  }
}

const RECEIPTS = [
  { role: 'Featured Credit', artist: 'DeeBaby',      song: '"Chicago Baby"', detail: 'Producer · Verified Credit',   spotifyId: '64KlYVNyF3OkdvG13L6m2X' },
  { role: 'Featured Credit', artist: 'Paris Bryant', song: '"A Crush"',      detail: 'Producer · Verified Credit',   spotifyId: '4DVN3vtMENFsClxJTuP6yY' },
  { role: 'Unreleased',      artist: 'GloRilla',     song: 'Placement',      detail: 'CMG / Interscope · Unreleased'   },
  { role: 'Unreleased',      artist: 'Shenseea',     song: 'Placement',      detail: 'Interscope Records · Unreleased' },
  { role: 'Unreleased',      artist: 'Seyi Vibez',   song: 'Placement',      detail: 'Afrobeats · Unreleased'         },
  { role: 'Unreleased',      artist: 'Est Gee',      song: 'Placement',      detail: 'Trap · Unreleased'              },
]

const TICKER_ITEMS = [
  'GloRilla', '"Chicago Baby"', 'DeeBaby', '"A Crush"', 'Paris Bryant',
  'Shenseea', 'Seyi Vibez', '5+ Placements', 'Prod. KJBEATS', 'Verified',
]

export default async function HomePage() {
  const { featured } = await getPageData()

  return (
    <div className="flex flex-col items-center w-full">
    <div className="flex flex-col w-full">

      {/* ═══ HERO ═══════════════════════════════════════════════ */}
      <section
        id="hero-section"
        className="relative bg-black overflow-hidden flex flex-col w-full min-h-screen"
      >
        {/* Video background — client component prevents download on mobile */}
        <HeroVideo />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 z-[1]" aria-hidden="true" />

        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%)',
          }}
        />

        {/* Top edge line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />

        {/* Mouse glow */}
        <HeroMouseGlow />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center flex-grow pt-28 pb-36 px-6 lg:px-16">

          {/* Eyebrow */}
          <div className="hero-eyebrow flex items-center gap-3 mb-8">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-white/20" />
            <span
              className="text-[10px] font-medium tracking-[0.28em] uppercase text-muted"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              GloRilla · DeeBaby · Shenseea · Seyi Vibez
            </span>
            <div
              className="w-1.5 h-1.5 rounded-full bg-white/40"
              style={{ animation: 'dotPulse 2.5s ease infinite' }}
            />
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-white/20" />
          </div>

          {/* Headline */}
          <HeadlineParallax>
            <h1
              className="hero-headline font-display leading-[0.88] text-foreground"
              style={{ fontSize: 'clamp(60px, 11vw, 148px)', letterSpacing: '-0.01em' }}
            >
              BEATS THAT HIT DIFFERENT.
            </h1>
          </HeadlineParallax>

          {/* Divider */}
          <div className="hero-divider w-12 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent my-7" />

          {/* Sub */}
          <p
            className="hero-sub text-[14px] leading-[1.75] max-w-[480px] mb-8 text-muted"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Verified placements with{' '}
            <span className="text-muted-mid font-medium">GloRilla, Shenseea & more.</span>
          </p>

          {/* CTAs */}
          <div className="hero-ctas flex items-center justify-center">
            <Link
              href="/store"
              className="cta-primary inline-flex items-center justify-center rounded-full bg-white text-black text-[13px] font-semibold transition-[background-color,transform,box-shadow] hover:bg-white-hover hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(255,255,255,0.15)] active:scale-95"
              style={{ padding: '14px 28px', fontFamily: 'var(--font-inter)' }}
            >
              Shop Beats
            </Link>
          </div>

        </div>

        {/* Ticker */}
        <div className="absolute bottom-0 inset-x-0 h-8 z-20 border-t border-white/[0.05] bg-black/80 backdrop-blur-sm overflow-hidden flex items-center">
          <div className="ticker-wrap flex whitespace-nowrap" aria-hidden="true">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center">
                <span
                  className="text-[8px] font-medium tracking-[0.22em] uppercase pr-5 text-muted-low"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {item}
                </span>
                <span className="text-[8px] pr-5 text-[#2d2d30]" aria-hidden="true">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURED TRACK ══════════════════════════════════════ */}
      {featured && (
        <section className="w-full flex justify-center border-b border-white/[0.06] bg-black">
          <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-16 py-10">
            <ScrollReveal>
              <FeaturedTrack beat={featured} />
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ═══ THE RECEIPTS ════════════════════════════════════════ */}
      <section className="w-full flex justify-center border-b border-white/[0.06] bg-surface-4">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-16 py-20">
          <ScrollReveal className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="receipts-heading">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-low mb-3">
                Verified Credits
              </p>
              <h2 className="font-display text-5xl sm:text-6xl text-foreground uppercase leading-none">
                The Receipts.
              </h2>
            </div>
            <div className="flex gap-10">
              {[{ v: '5+', l: 'Placements' }, { v: '4', l: 'Genres' }].map(({ v, l }) => (
                <div key={l} className="flex flex-col">
                  <AnimatedStat value={v} className="font-display text-4xl text-accent leading-none" />
                  <span className="text-[9px] font-medium uppercase tracking-[0.2em] mt-1.5 text-muted-low">{l}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-white/[0.06] rounded-2xl overflow-hidden">
            {RECEIPTS.map(({ role, artist, song, detail, spotifyId }, idx) => (
              <ScrollReveal key={artist + song} delay={idx * 80} direction={idx % 2 === 0 ? 'left' : 'right'}>
              <div
                className="group flex flex-col gap-4 bg-surface-4 p-7 hover:bg-surface-3 transition-colors duration-200 h-full"
              >
                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-low">
                  {role}
                </span>
                <div>
                  <p className="text-[17px] font-semibold text-foreground leading-tight">{artist}</p>
                  <p className="text-[13px] mt-1 text-muted">{song} · Producer</p>
                </div>
                {spotifyId && <SpotifyEmbed trackId={spotifyId} />}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.06]">
                  <span className="text-[11px] text-muted-low">{detail}</span>
                  <div className="flex items-center gap-1">
                    {role !== 'Unreleased' && <BadgeCheck size={11} className="text-accent" />}
                    <span className="text-[9px] text-accent">
                      {role === 'Unreleased' ? 'Unreleased' : 'Verified'}
                    </span>
                  </div>
                </div>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══════════════════════════════════════════ */}
      <section className="relative w-full py-36 flex flex-col items-center text-center px-6 overflow-hidden bg-black">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)',
          }}
        />
        <ScrollReveal>
          <p className="relative text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-low mb-5">
            Don&apos;t Sleep
          </p>
          <h2
            className="relative font-display uppercase leading-none mb-6 text-foreground"
            style={{ fontSize: 'clamp(52px, 8vw, 96px)' }}
          >
            Your Next Hit<br />Starts Here.
          </h2>

          <Link
            href="/store"
            className="cta-primary relative inline-flex items-center justify-center rounded-full bg-white text-black text-[13px] font-semibold transition-[background-color,transform,box-shadow] hover:bg-white-hover hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(255,255,255,0.15)] active:scale-95"
            style={{ padding: '14px 36px', fontFamily: 'var(--font-inter)' }}
          >
            Shop Beats
          </Link>
          <p className="relative mt-5 text-[11px] text-muted-low">
            From $29.99 · Instant Download · All Licenses Available
          </p>
        </ScrollReveal>
      </section>

    </div>
    </div>
  )
}
