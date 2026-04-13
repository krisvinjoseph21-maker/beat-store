import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { headers } from 'next/headers'
import { rateLimit, getIp } from '@/lib/rate-limit'
import crypto from 'crypto'

function verifyAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? ''
  if (!expected) return false
  const secret = 'prodkjbeats-admin'
  const inputHash = crypto.createHmac('sha256', secret).update(input).digest()
  const expectedHash = crypto.createHmac('sha256', secret).update(expected).digest()
  return crypto.timingSafeEqual(inputHash, expectedHash)
}

async function checkAuth() {
  const headersList = await headers()
  const auth = headersList.get('x-admin-password') ?? ''
  return verifyAdminPassword(auth)
}

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 20, 60_000)) {
    return Response.json({ error: 'Too many requests.' }, { status: 429 })
  }
  if (!(await checkAuth())) {
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
    const path = `${type}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`

    const arrayBuffer = await file.arrayBuffer()
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType: file.type || (type === 'cover' ? 'image/jpeg' : type === 'stems' ? 'application/zip' : 'audio/mpeg'),
        upsert: false,
      })

    if (error) return Response.json({ error: error.message }, { status: 500 })

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
