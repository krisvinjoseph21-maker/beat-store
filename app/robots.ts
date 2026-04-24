import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prodkjbeats.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api/',
        '/purchases',
        '/success',
        '/cancel',
        '/download-expired',
        '/download-invalid',
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  }
}
