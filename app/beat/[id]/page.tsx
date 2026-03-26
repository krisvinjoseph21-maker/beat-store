import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase'
import type { Beat } from '@/lib/store'
import BeatPageClient from '@/components/BeatPageClient'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('beats')
    .select('title, genre, bpm, key')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Beat — PRODKJBEATS' }

  return {
    title: `${data.title} — PRODKJBEATS`,
    description: `${data.genre} beat by PRODKJBEATS · ${data.bpm} BPM · ${data.key}`,
    openGraph: {
      title: `${data.title} — PRODKJBEATS`,
      description: `${data.genre} · ${data.bpm} BPM · ${data.key}`,
    },
  }
}

export default async function BeatPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('beats')
    .select('id, title, bpm, key, genre, subgenre, tags, preview_url, is_active, created_at, pin_order')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!data) notFound()

  return <BeatPageClient beat={data as Beat} />
}
