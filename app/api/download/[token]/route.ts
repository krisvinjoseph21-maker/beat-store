export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const SIGNED_URL_TTL = 300 // 5 minutes — enough time to trigger a browser download

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function safeFilename(title: string): string {
  return title.slice(0, 50).replace(/[^a-z0-9 _-]/gi, '_')
}

/**
 * Extract the storage object path from a Supabase public or private URL.
 * Works for both:
 *   .../storage/v1/object/public/beats/{path}
 *   .../storage/v1/object/sign/beats/{path}
 */
function storagePathFromUrl(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/beats\/(.+?)(\?|$)/)
  return match ? match[1] : null
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  // 10 attempts per IP per minute — tokens are 256-bit so guessing is impossible,
  // but rate-limiting prevents DoS and log flooding.
  if (!rateLimit(getRateLimitKey(req, '/api/download'), 10, 60_000)) {
    return new Response('Too many requests', { status: 429 })
  }

  const { token } = await ctx.params

  // Tokens are 64-char hex strings — reject anything else before touching the DB
  if (!/^[0-9a-f]{64}$/.test(token)) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${SITE_URL}/download-invalid` },
    })
  }

  const supabase = createAdminClient()

  // Look up the download record
  const { data: download, error } = await supabase
    .from('downloads')
    .select('*, orders(beat_ids, melody_pack_ids, license_type)')
    .eq('token', token)
    .single()

  if (error || !download) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${SITE_URL}/download-invalid` },
    })
  }

  const expiresAt = new Date(download.expires_at)
  if (expiresAt < new Date()) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${SITE_URL}/download-expired` },
    })
  }

  // Atomically claim the token — only one request can win this UPDATE.
  // If `used` is already true, no rows are returned and we reject immediately.
  const { data: claimed } = await supabase
    .from('downloads')
    .update({ used: true })
    .eq('token', token)
    .eq('used', false)
    .select('id')
    .single()

  if (!claimed) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${SITE_URL}/download-invalid` },
    })
  }

  // Fetch file URLs for beats and melody packs
  const beatIds: string[] = download.orders?.beat_ids ?? []
  const packIds: string[] = download.orders?.melody_pack_ids ?? []
  const licenseType: string = download.orders?.license_type ?? 'standard'
  const includeStems = licenseType === 'unlimited'

  if (beatIds.length === 0 && packIds.length === 0) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${SITE_URL}/download-invalid` },
    })
  }

  type SignedItem = { title: string; bpm?: number; signedUrl: string; isStems?: boolean }
  const signed: SignedItem[] = []

  // Generate signed URLs for each beat
  if (beatIds.length > 0) {
    const { data: beats } = await supabase
      .from('beats')
      .select('id, title, bpm, file_url, file_path, stems_path')
      .in('id', beatIds)

    for (const beat of (beats ?? [])) {
      if (!beat.file_url) continue
      const path = beat.file_path ?? storagePathFromUrl(beat.file_url)
      if (!path) continue

      const { data: signedData, error: signedError } = await supabase.storage
        .from('beats')
        .createSignedUrl(path, SIGNED_URL_TTL, {
          download: `${safeFilename(beat.title)}_${beat.bpm}BPM_@kjyoucrazy.mp3`,
        })

      if (!signedError && signedData?.signedUrl) {
        signed.push({ title: beat.title, bpm: beat.bpm, signedUrl: signedData.signedUrl })
      }

      if (includeStems && beat.stems_path) {
        const { data: stemsData, error: stemsError } = await supabase.storage
          .from('beats')
          .createSignedUrl(beat.stems_path, SIGNED_URL_TTL, {
            download: `${safeFilename(beat.title)}_stems.zip`,
          })
        if (!stemsError && stemsData?.signedUrl) {
          signed.push({ title: beat.title, bpm: beat.bpm, signedUrl: stemsData.signedUrl, isStems: true })
        }
      }
    }
  }

  // Generate signed URLs for each melody pack
  if (packIds.length > 0) {
    const { data: packs } = await supabase
      .from('melody_packs')
      .select('id, title, file_path')
      .in('id', packIds)

    for (const pack of (packs ?? [])) {
      if (!pack.file_path) continue
      const { data: signedData, error: signedError } = await supabase.storage
        .from('beats')
        .createSignedUrl(pack.file_path, SIGNED_URL_TTL, {
          download: `${safeFilename(pack.title)}_@kjyoucrazy.zip`,
        })
      if (!signedError && signedData?.signedUrl) {
        signed.push({ title: pack.title, signedUrl: signedData.signedUrl })
      }
    }
  }

  if (signed.length === 0) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${SITE_URL}/download-invalid` },
    })
  }

  // Single item — redirect straight to the signed URL (browser triggers download)
  if (signed.length === 1) {
    return new Response(null, {
      status: 302,
      headers: { Location: signed[0].signedUrl },
    })
  }

  // Multiple items — minimal download page with signed links (each expires in 5 min)
  const links = signed
    .map(
      (b) =>
        `<li><a href="${escapeHtml(b.signedUrl)}" download style="color:#fff;padding:12px 0;display:block;font-weight:600">${escapeHtml(b.title)}${b.isStems ? ' <span style="font-size:11px;color:#aaa;font-weight:400">(Stems ZIP)</span>' : ''}</a></li>`
    )
    .join('')

  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your Downloads — KJYOUCRAZY</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { background: #0a0a0a; color: #fff; font-family: sans-serif; max-width: 500px; margin: 80px auto; padding: 20px; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    p { color: #888; margin-bottom: 24px; }
    ul { list-style: none; padding: 0; }
    li { border-bottom: 1px solid #1f1f1f; }
    a { color: #fff; text-decoration: none; }
    a:hover { color: #ccc; }
  </style>
</head>
<body>
  <h1>Your Downloads</h1>
  <p>Links expire in 5 minutes. Click each item to download.</p>
  <ul>${links}</ul>
</body>
</html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
        'X-Content-Type-Options': 'nosniff',
      },
    }
  )
}
