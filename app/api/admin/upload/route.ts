import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { headers } from 'next/headers'

async function checkAuth() {
  const headersList = await headers()
  const auth = headersList.get('x-admin-password')
  return auth === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) ?? 'full' // 'full' | 'preview' | 'cover'

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const bucket = 'beats'
    const path = `${type}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`

    const arrayBuffer = await file.arrayBuffer()
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType: file.type || (type === 'cover' ? 'image/jpeg' : 'audio/mpeg'),
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
