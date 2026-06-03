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

  if (!data) return { title: 'Beat — KJYOUCRAZY' }

  const ogImages = data.cover_url
    ? [{ url: data.cover_url, width: 1200, height: 630, alt: `${data.title} by KJYOUCRAZY` }]
    : []

  const desc = `${data.genre} beat by KJYOUCRAZY · ${data.bpm} BPM · ${data.key} · Buy from $39.95 — Standard, Premium & Unlimited leases available.`
  const shortDesc = `${data.genre} · ${data.bpm} BPM · ${data.key} · From $39.95`

  return {
    title: `${data.title} — KJYOUCRAZY`,
    description: desc,
    openGraph: {
      title: `${data.title} — KJYOUCRAZY`,
      description: shortDesc,
      type: 'website',
      ...(ogImages.length > 0 ? { images: ogImages } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.title} — KJYOUCRAZY`,
      description: shortDesc,
      ...(data.cover_url ? { images: [data.cover_url] } : {}),
    },
    ...(data.preview_url
      ? {
          other: {
            'og:audio': data.preview_url,
            'og:audio:type': 'audio/mpeg',
          },
        }
      : {}),
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
    description: `${data.genre} beat by KJYOUCRAZY · ${data.bpm} BPM · ${data.key}`,
    brand: { '@type': 'Brand', name: 'KJYOUCRAZY' },
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
    stems_path: null,
  }

  return (
    <div className="flex justify-center w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')
            .replace(/&/g, '\\u0026'),
        }}
      />
      <BeatPageClient beat={beat} />
    </div>
  )
}
