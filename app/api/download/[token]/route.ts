import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

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
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params
  const supabase = createAdminClient()

  // Look up the download record
  const { data: download, error } = await supabase
    .from('downloads')
    .select('*, orders(beat_ids)')
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
  const { data: beats } = await supabase
    .from('beats')
    .select('id, title, bpm, file_url, file_path')
    .in('id', beatIds)

  if (!beats?.length) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${SITE_URL}/download-invalid` },
    })
  }

  // Generate signed URLs for each beat file (requires bucket to be private in Supabase)
  type SignedBeat = { title: string; bpm: number; signedUrl: string }
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
        `<li><a href="${escapeHtml(b.signedUrl)}" download style="color:#fff;padding:12px 0;display:block;font-weight:600">${escapeHtml(b.title)}</a></li>`
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
