import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase-admin'

export const revalidate = 3600

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prodkjbeats.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient()
  const { data: beats } = await supabase
    .from('beats')
    .select('id, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const beatUrls: MetadataRoute.Sitemap = (beats ?? []).map((b) => ({
    url: `${BASE}/beat/${b.id}`,
    lastModified: new Date(b.created_at),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE,                                              lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/store`,                                   lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/licensing`,                               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/about`,                                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/booking`,                                 lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/faq`,                                     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/services/custom-beats`,                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/services/mixing-mastering`,               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/sample-packs/drum-kits`,                  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/sample-packs/melody-packs`,               lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/sample-packs/weekly-loop-subscription`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE}/terms`,                                   lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/privacy`,                                 lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]

  return [...staticUrls, ...beatUrls]
}
