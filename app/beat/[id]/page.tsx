import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import type { Beat } from '@/lib/store'
import BeatPageClient from '@/components/BeatPageClient'

const getBeat = cache(async (id: string) => {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('beats')
    .select('id, title, bpm, key, genre, subgenre, tags, preview_url, cover_url, is_active, created_at')
    .eq('id', id)
    .eq('is_active', true)
    .single()
  return data ?? null
})

export async function generateStaticParams() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('beats')
    .select('id')
    .eq('is_active', true)
  return (data ?? []).map((b) => ({ id: b.id }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const data = await getBeat(id)

  if (!data) return { title: 'Beat — PRODKJBEATS' }

  const ogImages = data.cover_url
    ? [{ url: data.cover_url, width: 1200, height: 630, alt: `${data.title} by PRODKJBEATS` }]
    : []

  return {
    title: `${data.title} — PRODKJBEATS`,
    description: `${data.genre} beat by PRODKJBEATS · ${data.bpm} BPM · ${data.key}`,
    openGraph: {
      title: `${data.title} — PRODKJBEATS`,
      description: `${data.genre} · ${data.bpm} BPM · ${data.key}`,
      type: 'website',
      ...(ogImages.length > 0 ? { images: ogImages } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.title} — PRODKJBEATS`,
      description: `${data.genre} · ${data.bpm} BPM · ${data.key}`,
      ...(data.cover_url ? { images: [data.cover_url] } : {}),
    },
  }
}

export default async function BeatPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const data = await getBeat(id)

  if (!data) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.title,
    description: `${data.genre} beat by PRODKJBEATS · ${data.bpm} BPM · ${data.key}`,
    brand: { '@type': 'Brand', name: 'PRODKJBEATS' },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '39.95',
      highPrice: '149.95',
      priceCurrency: 'USD',
      offerCount: 3,
      availability: 'https://schema.org/InStock',
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Genre', value: data.genre },
      { '@type': 'PropertyValue', name: 'BPM', value: String(data.bpm) },
      { '@type': 'PropertyValue', name: 'Key', value: data.key },
    ],
    ...(data.preview_url ? { audio: data.preview_url } : {}),
    ...(data.cover_url ? { image: data.cover_url } : {}),
  }

  const beat: Beat = {
    ...data,
    file_url: null,
    tags: data.tags ?? [],
    cover_url: null,
    stems_path: null,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BeatPageClient beat={beat} />
    </>
  )
}
