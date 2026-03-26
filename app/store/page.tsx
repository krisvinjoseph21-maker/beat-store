import { createAdminClient } from '@/lib/supabase'
import { PLACEHOLDER_BEATS } from '@/lib/placeholder-data'
import type { Beat } from '@/lib/store'
import BeatStore from '@/components/BeatStore'

async function getBeats(): Promise<Beat[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('beats')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error || !data?.length) return PLACEHOLDER_BEATS
    return data.map(({ file_url, ...b }: Record<string, unknown>) => ({
      ...b,
      preview_url: (b.preview_url as string | null) ?? ((file_url as string)?.startsWith('http') ? file_url : null),
      cover_url: (b.cover_url as string | null) ?? null,
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
  return <BeatStore initialBeats={beats} />
}
