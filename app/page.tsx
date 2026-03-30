import Link from 'next/link'
import { BadgeCheck, Star } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase'
import { PLACEHOLDER_BEATS } from '@/lib/placeholder-data'
import type { Beat } from '@/lib/store'
import HomeFeaturedBeats from '@/components/HomeFeaturedBeats'
import FeaturedTrack from '@/components/FeaturedTrack'
import EmailSignup from '@/components/EmailSignup'
import HeroMouseGlow from '@/components/HeroMouseGlow'
import HeadlineParallax from '@/components/HeadlineParallax'

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

// Floating particles (adapted from bnoise — white/gray palette)
const PARTICLES = [
  { top:231, left:'55%', w:3.1, op:0.25, dur:'18s', delay:'-18s', dx:'44px',  dy:'8px',   shadow:'rgba(255,255,255,0.3)' },
  { top:109, left:'36%', w:1.2, op:0.8,  dur:'34s', delay:'-8s',  dx:'8px',   dy:'-10px', shadow:'rgba(255,255,255,0.5)' },
  { top:365, left:'47%', w:2.1, op:0.35, dur:'22s', delay:'-9s',  dx:'-53px', dy:'40px',  shadow:'rgba(255,255,255,0.2)' },
  { top: 96, left:'17%', w:1.8, op:0.18, dur:'30s', delay:'-21s', dx:'-6px',  dy:'-38px', shadow:'rgba(255,255,255,0.15)'},
  { top:319, left: '6%', w:3.4, op:0.55, dur:'19s', delay:'-8s',  dx:'36px',  dy:'-40px', shadow:'rgba(255,255,255,0.35)'},
  { top: 52, left:'38%', w:2.1, op:0.4,  dur:'19s', delay:'0s',   dx:'-11px', dy:'-23px', shadow:'rgba(255,255,255,0.25)'},
  { top:180, left:'75%', w:2.5, op:0.35, dur:'44s', delay:'-6s',  dx:'54px',  dy:'0px',   shadow:'rgba(255,255,255,0.2)' },
  { top:420, left:'85%', w:1.5, op:0.3,  dur:'28s', delay:'-14s', dx:'-30px', dy:'20px',  shadow:'rgba(255,255,255,0.2)' },
]

const HERO_STATS = [
  { value: '5+',  label: 'Placements' },
  { value: '5',   label: 'Artists'    },
  { value: '10M+',label: 'Streams'    },
  { value: '4',   label: 'Genres'     },
]

// Ticker items (shown twice for seamless loop)
const TICKER_ITEMS = [
  'GloRilla', '"Chicago Baby"', 'DeeBaby', '"A Crush"', 'Paris Bryant',
  'Shenseea', 'Seyi Vibez', '5+ Placements', 'Prod. KJBEATS', 'Verified',
]

const RECEIPTS = [
  { role: 'Featured Credit',    artist: 'DeeBaby',      song: '"Chicago Baby"', detail: 'Producer · Verified Credit'     },
  { role: 'Featured Credit',    artist: 'Paris Bryant', song: '"A Crush"',      detail: 'Producer · Verified Credit'     },
  { role: 'Verified Placement', artist: 'GloRilla',     song: 'Placement',      detail: 'CMG / Interscope · Verified'    },
  { role: 'Verified Placement', artist: 'Shenseea',     song: 'Placement',      detail: 'Interscope Records · Verified'  },
  { role: 'Verified Placement', artist: 'Seyi Vibez',   song: 'Placement',      detail: 'Afrobeats · Verified Credit'    },
]

export default async function HomePage() {
  const { featured, latest } = await getPageData()

  return (
    <div className="flex flex-col w-full">

      {/* ═══════════════════════════════════════════════════════
          HERO  (matches bnoise structure exactly)
      ═══════════════════════════════════════════════════════ */}
      <section
        id="hero-section"
        className="relative bg-[#080808] overflow-hidden flex flex-col w-full"
        style={{ minHeight: '560px', height: 'auto' }}
      >
        {/* Gold top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 z-10" />

        {/* Floating particles */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              className="particle"
              style={{
                top: p.top,
                left: p.left,
                width: p.w,
                height: p.w,
                background: 'white',
                boxShadow: `0 0 6px ${p.shadow}`,
                '--op': String(p.op),
                '--dur': p.dur,
                '--delay': p.delay,
                '--dx': p.dx,
                '--dy': p.dy,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Mouse glow */}
        <HeroMouseGlow />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center flex-grow pt-[100px] pb-[140px] px-6 sm:px-12">

          {/* Eyebrow */}
          <div className="hero-eyebrow flex items-center gap-3 mb-7">
            <div className="w-6 h-px bg-gradient-to-r from-transparent to-white/30" />
            <span
              className="text-[9px] font-bold tracking-[0.32em] uppercase"
              style={{ color: '#777', fontFamily: 'var(--font-inter)' }}
            >
              GloRilla · DeeBaby · Paris Bryant · Shenseea · Seyi Vibez
            </span>
            <div
              className="w-1 h-1 rounded-full bg-white/60 shadow-[0_0_6px_rgba(255,255,255,0.6)]"
              style={{ animation: 'dotPulse 2.5s ease infinite' }}
            />
            <div className="w-6 h-px bg-gradient-to-l from-transparent to-white/30" />
          </div>

          {/* Headline — parallax wrapper + glitch */}
          <HeadlineParallax>
            <h1
              className="hero-headline font-display leading-[0.87] tracking-[-0.01em] text-[#f0ede8] drop-shadow-[0_2px_40px_rgba(0,0,0,0.9)]"
              style={{ fontSize: 'clamp(64px, 12vw, 154px)' }}
            >
              BEATS THAT HIT DIFFERENT.
            </h1>
          </HeadlineParallax>

          {/* Divider */}
          <div className="hero-divider w-[60px] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent my-6" />

          {/* Sub */}
          <p
            className="hero-sub text-[13px] leading-[1.9] max-w-[500px] mb-5 tracking-wider"
            style={{ color: '#999', fontFamily: 'var(--font-inter)' }}
          >
            Verified placements with <em className="text-[#bbb] not-italic font-semibold">GloRilla, Shenseea & more.</em>{' '}
            <span style={{ color: '#666' }}>Trap · Drill · R&amp;B · Afrobeats · Dancehall.</span>
          </p>

          {/* CTAs */}
          <div className="hero-ctas flex flex-wrap items-center justify-center gap-6 w-full max-w-[420px]">
            <Link
              href="/store"
              className="cta-primary bg-white text-black text-[10px] font-bold tracking-[0.22em] uppercase px-12 py-3.5 transition-all hover:-translate-y-[3px] hover:shadow-[0_14px_44px_rgba(255,255,255,0.18)]"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Shop Beats
            </Link>
            <Link
              href="/store"
              className="text-[10px] font-semibold tracking-[0.14em] uppercase py-3.5 border-b border-[#333] transition-all hover:text-white hover:border-[#666] hover:tracking-[0.18em]"
              style={{ color: '#888', fontFamily: 'var(--font-inter)' }}
            >
              ▶ Preview Beats
            </Link>
          </div>

          {/* Stats row */}
          <div className="hero-stats flex items-center justify-center mt-12">
            {HERO_STATS.map(({ value, label }, i) => (
              <div
                key={label}
                className={`px-6 text-center group cursor-default transition-transform hover:-translate-y-1 ${i > 0 ? 'border-l border-[#1a1a1a]' : ''}`}
              >
                <div className="font-display text-[28px] tracking-wider leading-none transition-colors group-hover:text-white" style={{ color: '#707070' }}>
                  {value}
                </div>
                <div
                  className="text-[7px] tracking-widest uppercase mt-1"
                  style={{ color: '#444', fontFamily: 'var(--font-inter)' }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticker — absolute at bottom (bnoise exact) */}
        <div className="absolute bottom-0 inset-x-0 h-8 z-20 border-t border-[#0d0d0d] bg-[#040404]/97 backdrop-blur-md overflow-hidden flex items-center">
          <div className="ticker-wrap flex whitespace-nowrap">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center">
                <span
                  className="text-[7.5px] font-bold tracking-[0.22em] uppercase pr-4"
                  style={{ color: '#505050', fontFamily: 'var(--font-inter)' }}
                >
                  {item}
                </span>
                <span className="text-[7.5px] pr-4" style={{ color: '#333' }}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURED TRACK (below hero)
      ═══════════════════════════════════════════════════════ */}
      {featured && (
        <section className="w-full border-b border-[#191919] bg-[#080808]">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <FeaturedTrack beat={featured} />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          FEATURED BEATS
      ═══════════════════════════════════════════════════════ */}
      <section className="w-full border-b border-[#191919]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#444] mb-2">Fresh Off the DAW</p>
              <h2 className="font-display text-5xl sm:text-6xl text-[#f0ede8] uppercase leading-none">Featured Beats.</h2>
            </div>
            <Link
              href="/store"
              className="text-[11px] font-semibold tracking-[0.1em] uppercase border-b border-[#333] pb-0.5 transition-colors hover:text-white hover:border-[#666]"
              style={{ color: '#666' }}
            >
              View All Beats →
            </Link>
          </div>
          <HomeFeaturedBeats beats={latest} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          THE RECEIPTS
      ═══════════════════════════════════════════════════════ */}
      <section className="w-full border-b border-[#191919] bg-[#040404]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#444] mb-2">Verified Credits</p>
              <h2 className="font-display text-5xl sm:text-6xl text-[#f0ede8] uppercase leading-none">The Receipts.</h2>
            </div>
            <div className="flex gap-8">
              {[{ v: '5+', l: 'Placements' }, { v: '4', l: 'Genres' }].map(({ v, l }) => (
                <div key={l} className="flex flex-col">
                  <span className="font-display text-3xl text-[#707070] leading-none">{v}</span>
                  <span className="text-[9px] uppercase tracking-widest mt-1" style={{ color: '#444' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {RECEIPTS.map(({ role, artist, song, detail }) => (
              <div
                key={artist + song}
                className="group flex flex-col gap-3 border border-[#1a1a1a] bg-[#080808] p-5 hover:border-[#2a2a2a] hover:bg-[#0d0d0d] transition-all"
              >
                <div className="flex items-center gap-2">
                  <Star size={11} className="text-[#444] flex-shrink-0" fill="currentColor" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: '#444' }}>{role}</span>
                </div>
                <div>
                  <p className="text-lg font-black leading-tight" style={{ color: '#f0ede8' }}>{artist}</p>
                  <p className="text-sm mt-0.5" style={{ color: '#777' }}>{song} · Producer</p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#151515]">
                  <span className="text-xs" style={{ color: '#444' }}>{detail}</span>
                  <div className="flex items-center gap-1">
                    <BadgeCheck size={11} className="text-[#444]" />
                    <span className="text-[9px]" style={{ color: '#444' }}>Verified</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          EMAIL SIGNUP
      ═══════════════════════════════════════════════════════ */}
      <section className="w-full border-b border-[#191919]">
        <div className="mx-auto max-w-6xl px-4 py-20 flex flex-col items-center text-center gap-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: '#444' }}>Stay Connected</p>
          <h2 className="font-display text-5xl sm:text-7xl uppercase leading-none max-w-2xl" style={{ color: '#f0ede8' }}>
            Get a Free Beat<br />
            <span style={{ color: '#333' }}>When You Sign Up</span>
          </h2>
          <p className="text-[13px] max-w-sm leading-relaxed" style={{ color: '#777' }}>
            Drop your email and get an exclusive free beat straight to your inbox. No spam — just heat.
          </p>
          <EmailSignup />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════ */}
      <section className="relative w-full py-28 flex flex-col items-center text-center px-4 overflow-hidden bg-[#080808]">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[700px] rounded-full bg-white/[0.015] blur-[120px]" />
        <p className="relative text-[9px] font-bold uppercase tracking-[0.32em] mb-4" style={{ color: '#444' }}>Don&apos;t Sleep</p>
        <h2 className="relative font-display uppercase leading-none mb-6" style={{ fontSize: 'clamp(56px,9vw,96px)', color: '#f0ede8' }}>
          Your Next Hit<br />Starts Here.
        </h2>
        <p className="relative text-[13px] max-w-xs leading-relaxed mb-10" style={{ color: '#777' }}>
          Every beat is mixed, mastered, and ready to record. Instant delivery after checkout.
        </p>
        <Link
          href="/store"
          className="cta-primary bg-white text-black text-[10px] font-bold tracking-[0.22em] uppercase px-14 py-4 transition-all hover:-translate-y-[3px] hover:shadow-[0_14px_44px_rgba(255,255,255,0.18)]"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Shop Beats
        </Link>
        <p className="relative mt-5 text-[11px]" style={{ color: '#333' }}>From $29.99 · Instant Download · All Licenses Available</p>
      </section>

    </div>
  )
}
