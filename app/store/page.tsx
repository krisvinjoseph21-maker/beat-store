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
    if (error) {
      console.error('[store] DB error:', error.message)
      return PLACEHOLDER_BEATS
    }
    if (!data?.length) return PLACEHOLDER_BEATS
    // Strip file_url entirely — it must never reach the client.
    // Beats without a dedicated preview_url will have no audio preview
    // until the admin uploads one.
    return data.map(({ file_url: _fileUrl, ...b }) => ({
      ...b,
      file_url: null,
      preview_url: b.preview_url ?? null,
      cover_url: b.cover_url ?? null,
      stems_path: null,
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
