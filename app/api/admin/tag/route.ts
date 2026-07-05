export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'

// GET — current producer tag (most recent upload), for the admin panel to display.
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (auth.rateLimited) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('producer_tag')
    .select('id, storage_path, public_url, uploaded_at')
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return Response.json({ error: 'Failed to fetch tag' }, { status: 500 })
  return Response.json(data)
}

// POST — record a newly-uploaded tag clip (file itself already uploaded via
// /api/admin/upload with type=tag; this just persists the reference).
export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (auth.rateLimited) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await req.json()) as { storagePath?: unknown; publicUrl?: unknown }

    if (typeof body.storagePath !== 'string' || !body.storagePath.trim()) {
      return Response.json({ error: 'storagePath is required' }, { status: 400 })
    }
    if (typeof body.publicUrl !== 'string' || !body.publicUrl.trim()) {
      return Response.json({ error: 'publicUrl is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('producer_tag')
      .insert({ storage_path: body.storagePath, public_url: body.publicUrl })
      .select('id, storage_path, public_url, uploaded_at')
      .single()

    if (error) return Response.json({ error: 'Failed to save tag' }, { status: 500 })
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}
