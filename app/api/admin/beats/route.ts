export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'

// GET — list all beats (including inactive)
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (auth.rateLimited) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('beats')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[admin/beats GET]', error)
    return Response.json({ error: 'Failed to fetch beats' }, { status: 500 })
  }
  return Response.json(data)
}

const VALID_GENRES = ['Trap', 'Drill', 'R&B', 'Afrobeats']
// Storage paths must look like "type/timestamp-filename.ext" — no path traversal
const STORAGE_PATH_RE = /^[a-z]+\/[0-9]+-[a-zA-Z0-9_.-]{1,120}$/

function sanitizePath(val: unknown): string | null {
  if (!val || typeof val !== 'string') return null
  return STORAGE_PATH_RE.test(val) ? val : null
}

function sanitizeUrl(val: unknown): string | null {
  if (!val || typeof val !== 'string') return null
  try {
    const u = new URL(val)
    return u.protocol === 'https:' ? val.slice(0, 2048) : null
  } catch { return null }
}

function sanitizeBeatBody(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : null
  if (!title) return { error: 'Title is required' }

  const bpm = Number(body.bpm)
  if (!Number.isInteger(bpm) || bpm < 40 || bpm > 300) return { error: 'BPM must be 40–300' }

  const key = typeof body.key === 'string' ? body.key.trim().slice(0, 20) : ''
  const genre = typeof body.genre === 'string' ? body.genre.trim() : ''
  if (!VALID_GENRES.includes(genre)) return { error: 'Invalid genre' }

  const subgenre = typeof body.subgenre === 'string' ? body.subgenre.trim().slice(0, 100) : ''
  const tags = Array.isArray(body.tags)
    ? body.tags.slice(0, 20).map((t) => String(t).trim().slice(0, 50)).filter(Boolean)
    : []

  return {
    data: {
      title,
      bpm,
      key,
      genre,
      subgenre,
      tags,
      file_url: sanitizeUrl(body.file_url),
      file_path: sanitizePath(body.file_path),
      preview_url: sanitizeUrl(body.preview_url),
      preview_path: sanitizePath(body.preview_path),
      cover_url: sanitizeUrl(body.cover_url),
      stems_path: sanitizePath(body.stems_path),
      is_active: body.is_active !== false,
    },
  }
}

// POST — create a new beat
export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (auth.rateLimited) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const result = sanitizeBeatBody(body)
    if ('error' in result) return Response.json({ error: result.error }, { status: 400 })

    const supabase = createAdminClient()
    const { data, error } = await supabase.from('beats').insert(result.data).select().single()
    if (error) {
      console.error('[admin/beats POST]', error)
      return Response.json({ error: 'Failed to create beat' }, { status: 500 })
    }
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
  const auth = await checkAdminAuth(req)
  if (auth.rateLimited) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })
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
    if (error) {
      console.error('[admin/beats DELETE]', error)
      return Response.json({ error: 'Failed to delete beat' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// PATCH — update beat (toggle active, edit metadata)
export async function PATCH(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (auth.rateLimited) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { id } = body
    if (typeof id !== 'string' || !id) return Response.json({ error: 'Missing id' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if ('title' in body) {
      if (typeof body.title !== 'string' || !body.title.trim()) return Response.json({ error: 'Invalid title' }, { status: 400 })
      updates.title = body.title.trim().slice(0, 200)
    }
    if ('bpm' in body) {
      const bpm = Number(body.bpm)
      if (!Number.isInteger(bpm) || bpm < 40 || bpm > 300) return Response.json({ error: 'BPM must be 40–300' }, { status: 400 })
      updates.bpm = bpm
    }
    if ('key' in body) updates.key = typeof body.key === 'string' ? body.key.trim().slice(0, 20) : ''
    if ('genre' in body) {
      if (!VALID_GENRES.includes(body.genre as string)) return Response.json({ error: 'Invalid genre' }, { status: 400 })
      updates.genre = body.genre
    }
    if ('subgenre' in body) updates.subgenre = typeof body.subgenre === 'string' ? body.subgenre.trim().slice(0, 100) : ''
    if ('tags' in body) updates.tags = Array.isArray(body.tags) ? body.tags.slice(0, 20).map((t: unknown) => String(t).trim().slice(0, 50)).filter(Boolean) : []
    if ('is_active' in body) updates.is_active = body.is_active === true
    if ('is_featured' in body) updates.is_featured = body.is_featured === true
    if ('pin_order' in body) {
      updates.pin_order = body.pin_order === null ? null : (Number.isInteger(Number(body.pin_order)) ? Number(body.pin_order) : null)
    }
    if ('file_url' in body) updates.file_url = sanitizeUrl(body.file_url)
    if ('file_path' in body) updates.file_path = sanitizePath(body.file_path)
    if ('preview_url' in body) updates.preview_url = sanitizeUrl(body.preview_url)
    if ('preview_path' in body) updates.preview_path = sanitizePath(body.preview_path)
    if ('cover_url' in body) updates.cover_url = sanitizeUrl(body.cover_url)
    if ('stems_path' in body) updates.stems_path = sanitizePath(body.stems_path)
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('beats')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('[admin/beats PATCH]', error)
      return Response.json({ error: 'Failed to update beat' }, { status: 500 })
    }
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}
