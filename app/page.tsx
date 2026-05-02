export const revalidate = 60

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'PRODKJBEATS — Trap, Drill, R&B & Afrobeats Beats',
  description: 'Verified placements with GloRilla, DeeBaby, Shenseea & more. Shop trap, drill, R&B, and Afrobeats beats — instant download.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'PRODKJBEATS — Trap, Drill, R&B & Afrobeats Beats',
    description: 'Verified placements. Shop trap, drill, R&B, and Afrobeats instrumentals.',
    type: 'website',
    images: [{ url: '/android-chrome-512x512.png', width: 512, height: 512, alt: 'PRODKJBEATS' }],
  },
  twitter: {
    card: 'summary',
    title: 'PRODKJBEATS — Trap, Drill, R&B & Afrobeats Beats',
    description: 'Verified placements. Shop trap, drill, R&B, and Afrobeats instrumentals.',
    images: ['/android-chrome-512x512.png'],
  },
}
import { BadgeCheck } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import type { Beat } from '@/lib/store'
import SpotifyEmbed from '@/components/SpotifyEmbed'
import FeaturedTrack from '@/components/FeaturedTrack'
import HeroShader from '@/components/HeroShader'
import HeadlineParallax from '@/components/HeadlineParallax'
import ScrollReveal from '@/components/ScrollReveal'
import HeroVideo from '@/components/HeroVideo'
import LicenseTierGrid from '@/components/LicenseTierGrid'
import ContactForm from '@/components/AboutClient'

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
  { role: 'Featured Credit', artist: 'DeeBaby',      song: '"Chicago Baby"', detail: 'Producer · Verified Credit', streams: '500K+', spotifyId: '64KlYVNyF3OkdvG13L6m2X' },
  { role: 'Credit',          artist: 'Paris Bryant', song: '"A Crush"',      detail: 'Producer · Verified Credit', streams: null,    spotifyId: '4DVN3vtMENFsClxJTuP6yY' },
  { role: 'Unreleased',      artist: 'GloRilla',     song: 'Unreleased Record', detail: 'CMG / Interscope · Unreleased',   streams: null },
  { role: 'Unreleased',      artist: 'Shenseea',     song: 'Unreleased Record', detail: 'Interscope Records · Unreleased', streams: null },
  { role: 'Unreleased',      artist: 'Seyi Vibez',   song: 'Unreleased Record', detail: 'Afrobeats · Unreleased',          streams: null },
  { role: 'Unreleased',      artist: 'Est Gee',      song: 'Unreleased Record', detail: 'Trap · Unreleased',               streams: null },
]

const RECEIPTS_DOUBLED = [...RECEIPTS, ...RECEIPTS]


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
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, var(--glow-soft) 0%, transparent 70%)',
          }}
        />

        {/* WebGL shader — volumetric smoke + mouse-driven amber light */}
        <HeroShader />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center flex-grow pt-28 pb-36 px-6 lg:px-16">

          {/* Headline */}
          <HeadlineParallax>
            <h1
              className="hero-headline font-display leading-[0.88] text-foreground"
              style={{ fontSize: 'clamp(60px, 11vw, 148px)', letterSpacing: '-0.01em' }}
            >
              PLACEMENT-PROVEN BEATS.
            </h1>
          </HeadlineParallax>

          {/* Sub */}
          <p
            className="hero-sub text-[14px] leading-[1.75] max-w-[480px] mb-8 text-muted"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Placed with GloRilla, DeeBaby, Shenseea, and Seyi Vibez.
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
          <div className="flex items-center gap-1.5 px-4 shrink-0 border-r border-white/[0.07]">
            <BadgeCheck size={11} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <span
              className="font-montserrat text-[9px] font-bold uppercase whitespace-nowrap"
              style={{ letterSpacing: '0.18em', color: 'var(--accent)' }}
            >
              Verified Credits
            </span>
          </div>
          <div className="relative flex-1 overflow-hidden" aria-hidden="true">
            <div className="ticker-wrap flex items-center whitespace-nowrap pl-5" style={{ animationDuration: '28s' }}>
              {RECEIPTS_DOUBLED.map(({ artist, detail }, i) => (
                <span key={i} className="inline-flex items-center gap-3 mr-8">
                  <span
                    className="font-montserrat text-[10px] font-semibold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {artist}
                  </span>
                  <span
                    className="text-[9px]"
                    style={{ color: 'var(--muted-low)', fontFamily: 'var(--font-inter)' }}
                  >
                    {detail}
                  </span>
                  <span className="text-[8px] text-white/[0.15]">·</span>
                </span>
              ))}
            </div>
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

      {/* ═══ LICENSING INFO ══════════════════════════════════════ */}
      <section className="w-full flex justify-center border-b border-white/[0.06] bg-black">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-16 py-20">
          <ScrollReveal className="mb-12">
            <p className="text-[11px] font-normal uppercase tracking-[0.1em] text-muted-low mb-4">Licensing Info</p>
            <h2 className="font-display text-foreground leading-none" style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 300 }}>
              Choose Your License.
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <LicenseTierGrid />
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ THE RECEIPTS ════════════════════════════════════════ */}
      <section className="w-full flex justify-center border-b border-white/[0.06] bg-surface-4">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-16 py-20">
          <ScrollReveal className="mb-12">
            <div className="receipts-heading">
              <h2 className="font-display text-foreground leading-none mb-4" style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 300 }}>
                The Receipts.
              </h2>
              <p className="text-[12px] text-muted-low" style={{ fontFamily: 'var(--font-inter)' }}>
                5 placements&ensp;<span className="text-accent/50">·</span>&ensp;4 genres&ensp;<span className="text-accent/50">·</span>&ensp;GloRilla, DeeBaby, Shenseea &amp; more
              </p>
            </div>
          </ScrollReveal>

          {/* Verified credits — full cards with Spotify embeds */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-white/[0.06] mb-[1px]">
            {RECEIPTS.filter(r => r.role !== 'Unreleased').map(({ role, artist, song, detail, spotifyId, streams }, idx) => {
              const isFeatured = role === 'Featured Credit'
              return (
              <ScrollReveal key={artist + song} delay={idx * 80}>
              <div
                className={`group flex flex-col gap-4 bg-surface-4 p-7 hover:bg-surface-3 transition-colors duration-200 h-full ring-1 ring-inset ${isFeatured ? 'ring-white/25' : 'ring-white/[0.07]'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${isFeatured ? 'text-foreground' : 'text-muted-low'}`}>
                    {isFeatured && <span className="mr-1 text-accent">★</span>}{role}
                  </span>
                  {streams && (
                    <span
                      className="text-[14px] font-display leading-none text-accent shrink-0"
                      style={{ fontFamily: 'var(--font-bebas)', letterSpacing: '0.04em' }}
                    >
                      {streams} STREAMS
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[17px] font-semibold text-foreground leading-tight">{artist}</p>
                  <p className="text-[13px] mt-1 text-muted">{song} · Producer</p>
                </div>
                {spotifyId && <SpotifyEmbed trackId={spotifyId} />}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.06]">
                  <span className="text-[11px] text-muted-low">{detail}</span>
                  <div className="flex items-center gap-1">
                    <BadgeCheck size={11} className="text-accent" />
                    <span className="text-[9px] text-accent">Verified</span>
                  </div>
                </div>
              </div>
              </ScrollReveal>
              )
            })}
          </div>

          {/* Unreleased — compact 2×2 grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-white/[0.06]">
            {RECEIPTS.filter(r => r.role === 'Unreleased').map(({ artist, detail }, idx) => (
              <ScrollReveal key={artist} delay={(idx + 2) * 80}>
              <div className="group flex flex-col justify-between bg-surface-4 p-5 hover:bg-surface-3 transition-colors duration-200 h-full ring-1 ring-inset ring-white/[0.04]">
                <div>
                  <p className="text-[15px] font-semibold text-foreground leading-tight mb-1">{artist}</p>
                  <p className="text-[11px] text-muted-low leading-snug">{detail}</p>
                </div>
                <div className="flex items-center gap-1 mt-4">
                  <span className="text-[8px] text-muted-low uppercase tracking-[0.1em]">Unreleased</span>
                </div>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CONTACT ══════════════════════════════════════════════ */}
      <section className="w-full flex justify-center border-b border-white/[0.06] bg-black">
        <div className="mx-auto w-full max-w-2xl px-6 sm:px-10 py-20">
          <ScrollReveal className="mb-14">
            <h2
              className="font-display text-foreground leading-none mb-3"
              style={{ fontSize: 'clamp(40px, 6vw, 72px)' }}
            >
              Get in Touch.
            </h2>
            <p className="text-[12px] text-muted-low" style={{ fontFamily: 'var(--font-inter)' }}>
              Custom beats, collabs, licensing questions — reach out direct.
            </p>
          </ScrollReveal>
          <ScrollReveal>
            <ContactForm />
          </ScrollReveal>
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
          <p className="relative text-[11px] font-normal uppercase tracking-[0.1em] text-muted-low mb-5">
            Available Now
          </p>
          <h2
            className="relative font-display leading-none mb-6 text-foreground"
            style={{ fontSize: 'clamp(52px, 8vw, 96px)', fontWeight: 300 }}
          >
            Find Your Next Hit.
          </h2>

          <Link
            href="/store"
            className="cta-primary relative inline-flex items-center justify-center rounded-full bg-white text-black text-[13px] font-semibold transition-[background-color,transform,box-shadow] hover:bg-white-hover hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(255,255,255,0.15)] active:scale-95"
            style={{ padding: '14px 36px', fontFamily: 'var(--font-inter)' }}
          >
            Shop Beats
          </Link>
          <p className="relative mt-5 text-[11px] text-muted-low">
            From $39.95 · Instant Download · All Licenses Available
          </p>
        </ScrollReveal>
      </section>

    </div>
    </div>
  )
}
