import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { headers } from 'next/headers'

import crypto from 'crypto'

/**
 * Constant-time password check using HMAC digests to prevent:
 * 1. Timing attacks (timingSafeEqual)
 * 2. Length oracle attacks (comparing fixed-length hashes, not raw strings)
 */
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

// GET — list all beats (including inactive)
export async function GET(_req: NextRequest) {
  if (!(await checkAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('beats')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

// POST — create a new beat
export async function POST(req: NextRequest) {
  if (!(await checkAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const allowed = {
      title: body.title,
      bpm: Number(body.bpm) || 140,
      key: body.key ?? '',
      genre: body.genre ?? '',
      subgenre: body.subgenre ?? '',
      tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
      file_url: body.file_url ?? null,
      file_path: body.file_path ?? null,
      preview_url: body.preview_url ?? null,
      preview_path: body.preview_path ?? null,
      cover_url: body.cover_url ?? null,
      is_active: body.is_active !== false,
    }
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('beats').insert(allowed).select().single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}

function storagePathFromUrl(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/beats\/(.+?)(\?|$)/)
  return match ? match[1] : null
}

// DELETE — permanently remove a beat and its storage files
export async function DELETE(req: NextRequest) {
  if (!(await checkAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await req.json()
    if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })
    const supabase = createAdminClient()

    // Fetch the beat first so we have the file paths
    const { data: beat } = await supabase
      .from('beats')
      .select('file_url, file_path, preview_url, preview_path')
      .eq('id', id)
      .single()

    // Delete from storage
    if (beat) {
      const toDelete: string[] = []

      const fullPath = beat.file_path ?? (beat.file_url ? storagePathFromUrl(beat.file_url) : null)
      if (fullPath) toDelete.push(fullPath)

      const previewPath = beat.preview_path ?? (beat.preview_url ? storagePathFromUrl(beat.preview_url) : null)
      if (previewPath && previewPath !== fullPath) toDelete.push(previewPath)

      if (toDelete.length > 0) {
        await supabase.storage.from('beats').remove(toDelete)
      }
    }

    // Delete DB record
    const { error } = await supabase.from('beats').delete().eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// PATCH — update beat (toggle active, edit metadata)
export async function PATCH(req: NextRequest) {
  if (!(await checkAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { id } = body
    if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })
    const ALLOWED = ['title','bpm','key','genre','subgenre','tags','file_url','file_path',
      'preview_url','preview_path','cover_url','is_active','pin_order','is_featured']
    const updates: Record<string, unknown> = {}
    for (const key of ALLOWED) {
      if (key in body) updates[key] = body[key]
    }
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('beats')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}
