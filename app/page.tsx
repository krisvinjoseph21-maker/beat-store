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
      <section className="relative w-full overflow-hidden border-b border-gray-200">
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-20 pb-14 sm:pt-28 sm:pb-18 flex flex-col items-center gap-6">
          {/* Headline */}
          <div className="text-center max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              New Beats Dropping
            </div>
            <h1 className="text-4xl font-black text-gray-900 sm:text-6xl leading-none tracking-tight">
              Beats That Hit<br />
              <span className="text-gray-400">Different.</span>
            </h1>
            <p className="mt-4 text-sm text-gray-500 sm:text-base">
              Trap · Drill · R&amp;B · Afrobeats — instant download, cleared for release.
            </p>
          </div>

          <HomeSearch />

          {featured ? (
            <div className="w-full">
              <FeaturedTrack beat={featured} />
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              No featured track set — go to Admin and click Feature on a beat.
            </p>
          )}
        </div>
      </section>

      {/* Latest Beats */}
      <section className="w-full mx-auto max-w-6xl px-4 py-10">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-gray-900 tracking-tight uppercase">
              New Drops
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Fresh off the DAW</p>
          </div>
          <Link
            href="/store"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-500 hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            All Beats <ArrowRight size={12} />
          </Link>
        </div>
        <HomeFeaturedBeats beats={latest} />
      </section>

      {/* CTA */}
      <section className="w-full border-t border-gray-200 py-16 flex flex-col items-center text-center px-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Don&apos;t sleep</p>
        <h2 className="mb-3 text-3xl font-black text-gray-900 sm:text-4xl leading-tight">
          Your next hit starts here.
        </h2>
        <p className="mb-8 text-sm text-gray-500 max-w-xs leading-relaxed">
          Every beat is mixed, mastered, and ready to record over. Instant delivery after checkout.
        </p>
        <Link
          href="/store"
          className="inline-flex items-center gap-2 rounded-sm bg-gray-900 px-10 py-4 text-sm font-black text-white hover:bg-gray-700 transition-colors"
        >
          Shop Beats <ArrowRight size={15} />
        </Link>
        <p className="mt-4 text-xs text-gray-400">From $75 · Instant Download · All Licenses</p>
      </section>
    </div>
  )
}
