export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { checkAdminAuth } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 20, 60_000)) {
    return Response.json({ error: 'Too many requests.' }, { status: 429 })
  }
  if (!(await checkAdminAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) ?? 'full' // 'full' | 'preview' | 'cover' | 'stems'

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const VALID_MIMES: Record<string, string[]> = {
      full:    ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-wav', 'audio/wave'],
      preview: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-wav', 'audio/wave'],
      cover:   ['image/jpeg', 'image/png', 'image/webp'],
      stems:   ['application/zip', 'application/x-zip-compressed', 'application/x-zip'],
    }
    const allowedMimes = VALID_MIMES[type]
    if (!allowedMimes) {
      return Response.json({ error: 'Invalid upload type' }, { status: 400 })
    }
    if (file.type && !allowedMimes.includes(file.type)) {
      return Response.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const bucket = 'beats'
    // Strip everything except safe characters to prevent path traversal.
    // Keep only the original extension (single dot allowed).
    const rawName = file.name
    const ext = rawName.includes('.') ? rawName.slice(rawName.lastIndexOf('.')).replace(/[^a-z0-9.]/gi, '') : ''
    const safeName = rawName
      .slice(0, rawName.lastIndexOf('.') >= 0 ? rawName.lastIndexOf('.') : rawName.length)
      .replace(/[^a-z0-9_-]/gi, '_')
      .slice(0, 80)
    const path = `${type}/${Date.now()}-${safeName}${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType: file.type || (type === 'cover' ? 'image/jpeg' : type === 'stems' ? 'application/zip' : 'audio/mpeg'),
        upsert: false,
      })

    if (error) {
      console.error('[upload] storage error:', error)
      return Response.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Preview and cover files are safe to expose as public URLs.
    // Full beat files must NEVER be exposed publicly.
    if (type === 'preview' || type === 'cover') {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
      return Response.json({ url: urlData.publicUrl, path: data.path })
    }

    return Response.json({ path: data.path })
  } catch (err) {
    console.error('[upload]', err)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
