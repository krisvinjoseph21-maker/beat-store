import type { NextConfig } from 'next'

// Content-Security-Policy
// - script-src: self + Next.js inline hydration (unsafe-inline required) + Stripe
// - style-src:  self + inline (Tailwind) + Google Fonts
// - frame-src:  Spotify embeds + Stripe checkout/3DS frames
// - connect-src: Supabase storage/API + Stripe API + Spotify (embed metadata)
// - img-src:    self + data URIs + Supabase CDN + Spotify CDN
// - media-src:  Supabase storage (audio previews) + blob (AudioContext)
// - object-src / base-uri / form-action: locked down
const CSP = [
  "default-src 'self'",
  // unsafe-eval removed — Next.js prod builds and Stripe do not require it
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://i.scdn.co https://mosaic.scdn.co",
  "media-src 'self' blob: https://*.supabase.co",
  "frame-src https://open.spotify.com https://js.stripe.com https://hooks.stripe.com",
  // wss: added for Supabase Realtime WebSocket connections
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://open.spotify.com",
  "worker-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
  // Content Security Policy — restricts what origins scripts/frames/media can load from
  { key: 'Content-Security-Policy', value: CSP },
  // Prevent clickjacking — DENY matches frame-ancestors 'none' in CSP above
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Force HTTPS for 2 years (only effective in production)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Control referrer information
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable unused browser features
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // DNS prefetch for performance
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        // Supabase storage for cover images
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
