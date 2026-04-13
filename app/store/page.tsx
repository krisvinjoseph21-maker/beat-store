import { createAdminClient } from '@/lib/supabase'
import { PLACEHOLDER_BEATS } from '@/lib/placeholder-data'
import type { Beat } from '@/lib/store'
import BeatStore from '@/components/BeatStore'

async function getBeats(): Promise<Beat[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('beats')
      .select('id, title, bpm, key, genre, subgenre, tags, preview_url, file_url, cover_url, is_active, created_at, pin_order')
      .eq('is_active', true)
      .order('pin_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error || !data?.length) return PLACEHOLDER_BEATS
    // Strip file_url — merge into preview_url if no dedicated preview exists,
    // then never send the full beat URL to the client.
    return data.map(({ file_url, ...b }) => ({
      ...b,
      preview_url: b.preview_url ?? (typeof file_url === 'string' && file_url.startsWith('http') ? file_url : null),
      cover_url: b.cover_url ?? null,
    })) as Beat[]
  } catch {
    return PLACEHOLDER_BEATS
  }
}

export const metadata = {
  title: 'Beat Store — PRODKJBEATS',
  description: 'Shop trap, drill, R&B, and Afrobeats instrumentals.',
}

export default async function StorePage() {
  const beats = await getBeats()
  return (
    <div className="flex justify-center w-full">
      <BeatStore initialBeats={beats} />
    </div>
  )
}
