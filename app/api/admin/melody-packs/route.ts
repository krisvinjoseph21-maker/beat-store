export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'

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

export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (auth.rateLimited) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('melody_packs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/melody-packs GET]', error)
    return Response.json({ error: 'Failed to fetch melody packs' }, { status: 500 })
  }
  return Response.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (auth.rateLimited) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : null
    if (!title) return Response.json({ error: 'Title is required' }, { status: 400 })

    const price = Number(body.price)
    if (isNaN(price) || price < 0) return Response.json({ error: 'Invalid price' }, { status: 400 })

    const rawCompare = body.compare_at_price
    const compare_at_price =
      rawCompare === null || rawCompare === '' || rawCompare === undefined
        ? null
        : Number(rawCompare)
    if (compare_at_price !== null && isNaN(compare_at_price)) {
      return Response.json({ error: 'Invalid compare price' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('melody_packs')
      .insert({
        title,
        vendor: typeof body.vendor === 'string' ? body.vendor.trim().slice(0, 100) : 'PRODBATTS',
        description: typeof body.description === 'string' ? body.description.trim().slice(0, 1000) : '',
        price,
        compare_at_price,
        cover_url: sanitizeUrl(body.cover_url),
        file_path: sanitizePath(body.file_path),
        is_active: body.is_active !== false,
        is_featured: body.is_featured === true,
      })
      .select()
      .single()

    if (error) {
      console.error('[admin/melody-packs POST]', error)
      return Response.json({ error: 'Failed to create melody pack' }, { status: 500 })
    }
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (auth.rateLimited) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { id } = body
    if (!id || typeof id !== 'string') return Response.json({ error: 'Missing id' }, { status: 400 })

    const updates: Record<string, unknown> = {}

    if ('title' in body) {
      if (!body.title?.trim()) return Response.json({ error: 'Invalid title' }, { status: 400 })
      updates.title = body.title.trim().slice(0, 200)
    }
    if ('vendor' in body) {
      updates.vendor = typeof body.vendor === 'string' ? body.vendor.trim().slice(0, 100) : 'PRODBATTS'
    }
    if ('description' in body) {
      updates.description = typeof body.description === 'string' ? body.description.trim().slice(0, 1000) : ''
    }
    if ('price' in body) {
      const price = Number(body.price)
      if (isNaN(price) || price < 0) return Response.json({ error: 'Invalid price' }, { status: 400 })
      updates.price = price
    }
    if ('compare_at_price' in body) {
      updates.compare_at_price =
        body.compare_at_price === null || body.compare_at_price === ''
          ? null
          : Number(body.compare_at_price)
    }
    if ('cover_url' in body) updates.cover_url = sanitizeUrl(body.cover_url)
    if ('file_path' in body) updates.file_path = sanitizePath(body.file_path)
    if ('is_active' in body) updates.is_active = body.is_active === true
    if ('is_featured' in body) updates.is_featured = body.is_featured === true

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('melody_packs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[admin/melody-packs PATCH]', error)
      return Response.json({ error: 'Failed to update melody pack' }, { status: 500 })
    }
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (auth.rateLimited) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await req.json()
    if (!id || typeof id !== 'string') return Response.json({ error: 'Missing id' }, { status: 400 })

    const supabase = createAdminClient()

    const { data: pack } = await supabase
      .from('melody_packs')
      .select('file_path')
      .eq('id', id)
      .single()

    if (pack?.file_path) {
      await supabase.storage.from('beats').remove([pack.file_path])
    }

    const { error } = await supabase.from('melody_packs').delete().eq('id', id)
    if (error) {
      console.error('[admin/melody-packs DELETE]', error)
      return Response.json({ error: 'Failed to delete melody pack' }, { status: 500 })
    }
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}
