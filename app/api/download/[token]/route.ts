import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit, getIp } from '@/lib/rate-limit'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const SIGNED_URL_TTL = 300 // 5 minutes — enough time to trigger a browser download

function escapeHtml(str: string): string {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
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
  if (!rateLimit(getIp(req), 10, 60_000)) {
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
    .select('*, orders(beat_ids, license_type)')
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

  // Fetch beat file URLs
  const beatIds: string[] = download.orders?.beat_ids ?? []
  const licenseType: string = download.orders?.license_type ?? 'standard'
  const includeStems = licenseType === 'unlimited'
  const { data: beats } = await supabase
    .from('beats')
    .select('id, title, bpm, file_url, file_path, stems_path')
    .in('id', beatIds)

  if (!beats?.length) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${SITE_URL}/download-invalid` },
    })
  }

  // Generate signed URLs for each beat file (requires bucket to be private in Supabase)
  type SignedBeat = { title: string; bpm: number; signedUrl: string; isStems?: boolean }
  const signed: SignedBeat[] = []

  for (const beat of beats) {
    if (!beat.file_url) continue
    const path = beat.file_path ?? storagePathFromUrl(beat.file_url)
    if (!path) continue

    const { data: signedData, error: signedError } = await supabase.storage
      .from('beats')
      .createSignedUrl(path, SIGNED_URL_TTL, {
        download: `${beat.title.replace(/[^a-z0-9 _-]/gi, '_')}_${beat.bpm}BPM_@prodkjbeats.mp3`,
      })

    if (!signedError && signedData?.signedUrl) {
      signed.push({ title: beat.title, bpm: beat.bpm, signedUrl: signedData.signedUrl })
    }

    // Include stems if this is an unlimited (stems) license and stems exist
    if (includeStems && beat.stems_path) {
      const { data: stemsData, error: stemsError } = await supabase.storage
        .from('beats')
        .createSignedUrl(beat.stems_path, SIGNED_URL_TTL, {
          download: `${beat.title.replace(/[^a-z0-9 _-]/gi, '_')}_stems.zip`,
        })
      if (!stemsError && stemsData?.signedUrl) {
        signed.push({ title: beat.title, bpm: beat.bpm, signedUrl: stemsData.signedUrl, isStems: true })
      }
    }
  }

  if (signed.length === 0) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${SITE_URL}/download-invalid` },
    })
  }

  // Single beat — redirect straight to signed URL (browser triggers download)
  if (signed.length === 1) {
    return new Response(null, {
      status: 302,
      headers: { Location: signed[0].signedUrl },
    })
  }

  // Multiple beats — minimal download page with signed links (each expires in 5 min)
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
  <title>Your Downloads — PRODKJBEATS</title>
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
  <p>Links expire in 5 minutes. Click each beat to download.</p>
  <ul>${links}</ul>
</body>
</html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    }
  )
}
