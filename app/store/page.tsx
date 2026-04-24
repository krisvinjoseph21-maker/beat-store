import { createAdminClient } from '@/lib/supabase-admin'
import { PLACEHOLDER_BEATS } from '@/lib/placeholder-data'
import type { Beat } from '@/lib/store'
import BeatStore from '@/components/BeatStore'

async function getBeats(): Promise<Beat[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('beats')
      .select('id, title, bpm, key, genre, subgenre, tags, preview_url, cover_url, is_active, created_at, pin_order')
      .eq('is_active', true)
      .order('pin_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) return PLACEHOLDER_BEATS
    if (!data?.length) return PLACEHOLDER_BEATS
    return data.map((b) => ({
      ...b,
      file_url: null,
      stems_path: null,
      preview_url: b.preview_url ?? null,
      cover_url: b.cover_url ?? null,
    })) as Beat[]
  } catch {
    return PLACEHOLDER_BEATS
  }
}

export const revalidate = 30

export const metadata = {
  title: 'Beat Store — PRODKJBEATS',
  description: 'Shop trap, drill, R&B, and Afrobeats instrumentals. Instant download. Standard, Premium, and Unlimited leases available.',
  openGraph: {
    title: 'Beat Store — PRODKJBEATS',
    description: 'Shop trap, drill, R&B, and Afrobeats instrumentals.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beat Store — PRODKJBEATS',
    description: 'Shop trap, drill, R&B, and Afrobeats instrumentals.',
  },
}

export default async function StorePage() {
  const beats = await getBeats()
  return (
    <div className="flex justify-center w-full">
      <BeatStore initialBeats={beats} />
    </div>
  )
}
