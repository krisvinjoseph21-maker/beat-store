import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase'
import { PLACEHOLDER_BEATS } from '@/lib/placeholder-data'
import type { Beat } from '@/lib/store'
import HomeFeaturedBeats from '@/components/HomeFeaturedBeats'
import FeaturedTrack from '@/components/FeaturedTrack'
import HomeSearch from '@/components/HomeSearch'

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

export default async function HomePage() {
  const { featured, latest } = await getPageData()

  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="relative w-full overflow-hidden border-b border-[#191919]">
        {/* Background texture + glow */}
        <div className="pointer-events-none absolute inset-0">
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          {/* Fade dot grid toward edges */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-[#0a0a0a]/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/70 via-transparent to-[#0a0a0a]/70" />
          {/* Glow blobs */}
          <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-white/[0.03] blur-[120px]" />
          <div className="absolute left-1/4 top-1/3 h-[200px] w-[300px] rounded-full bg-purple-500/[0.04] blur-[80px]" />
          <div className="absolute right-1/4 top-1/4 h-[200px] w-[300px] rounded-full bg-blue-500/[0.04] blur-[80px]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 pt-20 pb-14 sm:pt-28 sm:pb-18 flex flex-col items-center gap-6">
          {/* Headline */}
          <div className="text-center max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              New Beats Dropping
            </div>
            <h1 className="text-4xl font-black text-white sm:text-6xl leading-none tracking-tight">
              Beats That Hit<br />
              <span className="text-zinc-500">Different.</span>
            </h1>
            <p className="mt-4 text-sm text-zinc-500 sm:text-base">
              Trap · Drill · R&amp;B · Afrobeats — instant download, cleared for release.
            </p>
          </div>

          <HomeSearch />

          {featured && (
            <div className="w-full">
              <FeaturedTrack beat={featured} />
            </div>
          )}
        </div>
      </section>

      {/* Latest Beats */}
      <section className="w-full mx-auto max-w-6xl px-4 py-10">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-white tracking-tight uppercase">
              New Drops
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">Fresh off the DAW</p>
          </div>
          <Link
            href="/store"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] px-4 py-2 text-xs font-bold text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
          >
            All Beats <ArrowRight size={12} />
          </Link>
        </div>
        <HomeFeaturedBeats beats={latest} />
      </section>

      {/* CTA */}
      <section className="w-full border-t border-[#191919] py-16 flex flex-col items-center text-center px-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-600">Don&apos;t sleep</p>
        <h2 className="mb-3 text-3xl font-black text-white sm:text-4xl leading-tight">
          Your next hit starts here.
        </h2>
        <p className="mb-8 text-sm text-zinc-500 max-w-xs leading-relaxed">
          Every beat is mixed, mastered, and ready to record over. Instant delivery after checkout.
        </p>
        <Link
          href="/store"
          className="inline-flex items-center gap-2 rounded-sm bg-white px-10 py-4 text-sm font-black text-black hover:bg-zinc-100 transition-colors"
        >
          Shop Beats <ArrowRight size={15} />
        </Link>
        <p className="mt-4 text-xs text-zinc-600">From $75 · Instant Download · All Licenses</p>
      </section>
    </div>
  )
}
