export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'

const VALID_TYPES = ['full', 'preview', 'cover', 'stems'] as const
type UploadType = typeof VALID_TYPES[number]

// Strip everything except safe characters to prevent path traversal.
// Returns { safeName, ext } ready to compose into a storage path.
function sanitiseFilename(rawName: string): { safeName: string; ext: string } {
  const dotIdx = rawName.lastIndexOf('.')
  const ext = dotIdx >= 0
    ? rawName.slice(dotIdx).replace(/[^a-z0-9.]/gi, '').toLowerCase()
    : ''
  const base = rawName
    .slice(0, dotIdx >= 0 ? dotIdx : rawName.length)
    .replace(/[^a-z0-9_-]/gi, '_')
    .slice(0, 80)
  return { safeName: base || 'file', ext }
}

// ── GET — return a pre-signed upload URL ────────────────────────────────────
// Files are uploaded directly from the browser to Supabase storage,
// bypassing Next.js/Vercel entirely (no 4.5 MB body limit).
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (auth.rateLimited) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type') as UploadType | null
  const filename = req.nextUrl.searchParams.get('filename') ?? ''

  if (!type || !VALID_TYPES.includes(type)) {
    return Response.json({ error: 'Invalid upload type' }, { status: 400 })
  }
  if (!filename) {
    return Response.json({ error: 'filename is required' }, { status: 400 })
  }

  const { safeName, ext } = sanitiseFilename(filename)
  const path = `${type}/${Date.now()}-${safeName}${ext}`

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('beats')
    .createSignedUploadUrl(path)

  if (error) {
    console.error('[upload/signed-url]', error)
    return Response.json({ error: 'Failed to create upload URL' }, { status: 500 })
  }

  // Pre-calculate public URL for preview and cover assets.
  // Full beat files and stems are private — never expose their public URLs.
  let publicUrl: string | undefined
  if (type === 'preview' || type === 'cover') {
    const { data: urlData } = supabase.storage.from('beats').getPublicUrl(path)
    publicUrl = urlData.publicUrl
  }

  return Response.json({ signedUrl: data.signedUrl, path, publicUrl })
}

// ── POST — kept for backward compat; validates MIME and proxies to storage ──
// Only used as a fallback. Prefer the GET → direct-upload flow.
export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (auth.rateLimited) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) ?? 'full'

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const VALID_MIMES: Record<string, string[]> = {
      full:    ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
                'audio/x-wav', 'audio/wave', 'audio/vnd.wave', 'audio/flac'],
      preview: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
                'audio/x-wav', 'audio/wave', 'audio/vnd.wave', 'audio/flac'],
      cover:   ['image/jpeg', 'image/png', 'image/webp'],
      stems:   ['application/zip', 'application/x-zip-compressed',
                'application/x-zip', 'application/octet-stream'],
    }
    const allowedMimes = VALID_MIMES[type]
    if (!allowedMimes) {
      return Response.json({ error: 'Invalid upload type' }, { status: 400 })
    }
    if (file.type && !allowedMimes.includes(file.type)) {
      return Response.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { safeName, ext } = sanitiseFilename(file.name)
    const path = `${type}/${Date.now()}-${safeName}${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { data, error } = await supabase.storage
      .from('beats')
      .upload(path, arrayBuffer, {
        contentType: file.type || (type === 'cover' ? 'image/jpeg' : type === 'stems' ? 'application/zip' : 'audio/mpeg'),
        upsert: false,
      })

    if (error) {
      console.error('[upload] storage error:', error)
      return Response.json({ error: 'Upload failed' }, { status: 500 })
    }

    if (type === 'preview' || type === 'cover') {
      const { data: urlData } = supabase.storage.from('beats').getPublicUrl(data.path)
      return Response.json({ url: urlData.publicUrl, path: data.path })
    }

    return Response.json({ path: data.path })
  } catch (err) {
    console.error('[upload]', err)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
