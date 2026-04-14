'use client'

import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, Upload, ToggleLeft, ToggleRight, Edit3, Check, X, RefreshCw, Pin, PinOff, Trash2, Star, Tag, Zap } from 'lucide-react'
import type { PromoConfig } from '@/lib/promos'

interface Beat {
  id: string
  title: string
  bpm: number
  key: string
  genre: string
  subgenre: string
  tags: string[]
  file_url: string | null
  preview_url: string | null
  cover_url: string | null
  stems_path: string | null
  is_active: boolean
  is_featured: boolean
  created_at: string
  pin_order: number | null
}

interface Order {
  id: string
  customer_email: string
  customer_name: string
  beat_ids: string[]
  license_type: string
  quantity_tier: number
  total_price: number
  status: string
  created_at: string
}

const BLANK_BEAT = {
  title: '',
  bpm: 140,
  key: 'Am',
  genre: 'Trap',
  subgenre: '',
  tags: '',
  file_url: '',
  preview_url: '',
  is_active: true,
}

// Idle timeout: lock the admin session after 30 minutes of inactivity.
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

export default function AdminClient() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [beats, setBeats] = useState<Beat[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<'beats' | 'orders' | 'upload' | 'promos'>('beats')
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Beat>>({})
  const [editTagsStr, setEditTagsStr] = useState('')
  const [newBeat, setNewBeat] = useState({ ...BLANK_BEAT })
  const [actionError, setActionError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [promo, setPromo] = useState<PromoConfig>({ sitewide_discount_pct: null, bogo_free_count: null })
  const [promoForm, setPromoForm] = useState({ sitewide_discount_pct: '', bogo_free_count: '' })
  const [promoSaving, setPromoSaving] = useState(false)
  const [promoMsg, setPromoMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const stemsRef = useRef<HTMLInputElement>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear the password from memory and force re-login after SESSION_TIMEOUT_MS of inactivity.
  function resetIdleTimer() {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      setAuthed(false)
      setPassword('')
      setAuthError('Session expired — please log in again.')
    }, SESSION_TIMEOUT_MS)
  }

  useEffect(() => {
    if (!authed) return
    const events = ['mousedown', 'keydown', 'pointerdown', 'scroll']
    events.forEach((e) => window.addEventListener(e, resetIdleTimer, { passive: true }))
    resetIdleTimer()
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer))
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/beats', {
        headers: { 'x-admin-password': password },
      })
      if (res.ok) {
        setAuthed(true)
        const data = await res.json()
        setBeats(data)
        fetchOrders()
        fetchPromos()
      } else {
        setAuthError('Wrong password')
      }
    } catch {
      setAuthError('Error connecting')
    } finally {
      setLoading(false)
    }
  }

  async function fetchBeats() {
    const res = await fetch('/api/admin/beats', {
      headers: { 'x-admin-password': password },
    })
    if (res.ok) setBeats(await res.json())
  }

  async function fetchOrders() {
    const res = await fetch('/api/admin/orders', {
      headers: { 'x-admin-password': password },
    })
    if (res.ok) setOrders(await res.json())
  }

  async function fetchPromos() {
    const res = await fetch('/api/admin/promos', {
      headers: { 'x-admin-password': password },
    })
    if (res.ok) {
      const data: PromoConfig = await res.json()
      setPromo(data)
      setPromoForm({
        sitewide_discount_pct: data.sitewide_discount_pct !== null ? String(data.sitewide_discount_pct) : '',
        bogo_free_count: data.bogo_free_count !== null ? String(data.bogo_free_count) : '',
      })
    }
  }

  async function savePromos() {
    setPromoSaving(true)
    setPromoMsg('')
    try {
      const body: Partial<PromoConfig> = {
        sitewide_discount_pct: promoForm.sitewide_discount_pct !== '' ? Number(promoForm.sitewide_discount_pct) : null,
        bogo_free_count: promoForm.bogo_free_count !== '' ? Number(promoForm.bogo_free_count) : null,
      }
      const res = await fetch('/api/admin/promos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data: PromoConfig = await res.json()
        setPromo(data)
        setPromoMsg('Saved!')
      } else {
        const err = await res.json().catch(() => ({}))
        setPromoMsg(`Error: ${err.error ?? 'Failed to save'}`)
      }
    } finally {
      setPromoSaving(false)
    }
  }

  async function toggleActive(beat: Beat) {
    setActionError(null)
    const res = await fetch('/api/admin/beats', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ id: beat.id, is_active: !beat.is_active }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setActionError(err.error ?? 'Failed to update beat')
    }
    fetchBeats()
  }

  async function setFeatured(beat: Beat) {
    setActionError(null)
    // Clear existing featured beat first
    const current = beats.find((b) => b.is_featured)
    if (current && current.id !== beat.id) {
      await fetch('/api/admin/beats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ id: current.id, is_featured: false }),
      })
    }
    const res = await fetch('/api/admin/beats', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ id: beat.id, is_featured: !beat.is_featured }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setActionError(err.error ?? 'Failed to update featured beat')
    }
    fetchBeats()
  }

  async function deleteBeat(beat: Beat) {
    if (!confirm(`Delete "${beat.title}"? This cannot be undone.`)) return
    setActionError(null)
    const res = await fetch('/api/admin/beats', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ id: beat.id }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setActionError(err.error ?? 'Failed to delete beat')
    }
    fetchBeats()
  }

  async function setPinOrder(beat: Beat, order: number | null) {
    setActionError(null)
    const res = await fetch('/api/admin/beats', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ id: beat.id, pin_order: order }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setActionError(err.error ?? 'Failed to update pin order')
    }
    fetchBeats()
  }

  function startEdit(beat: Beat) {
    setEditId(beat.id)
    setEditForm({
      title: beat.title,
      bpm: beat.bpm,
      key: beat.key,
      genre: beat.genre,
      subgenre: beat.subgenre,
    })
    setEditTagsStr(Array.isArray(beat.tags) ? beat.tags.join(', ') : '')
  }

  async function saveEdit() {
    if (!editId) return
    setActionError(null)
    const tags = editTagsStr.split(',').map((t) => t.trim()).filter(Boolean)
    const res = await fetch('/api/admin/beats', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ id: editId, ...editForm, tags }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setActionError(err.error ?? 'Failed to save changes')
      return
    }
    setEditId(null)
    fetchBeats()
  }

  async function uploadFile(
    file: File,
    type: 'full' | 'preview' | 'cover' | 'stems'
  ): Promise<{ path: string; url?: string }> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'x-admin-password': password },
      body: fd,
    })
    return res.json()
  }

  async function handleAddBeat(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    setUploadMsg('')
    try {
      let filePath: string | null = null
      let previewUrl: string | null = newBeat.preview_url || null
      let previewPath: string | null = null
      let coverUrl: string | null = null

      const mainFile = fileRef.current?.files?.[0]
      const prevFile = previewRef.current?.files?.[0]
      const coverFile = coverRef.current?.files?.[0]
      const stemsFile = stemsRef.current?.files?.[0]

      if (mainFile) {
        setUploadMsg('Uploading beat file…')
        const result = await uploadFile(mainFile, 'full')
        filePath = result.path
      }
      if (prevFile) {
        setUploadMsg('Uploading preview…')
        const result = await uploadFile(prevFile, 'preview')
        previewPath = result.path
        previewUrl = result.url ?? null
      }
      if (coverFile) {
        setUploadMsg('Uploading cover image…')
        const result = await uploadFile(coverFile, 'cover')
        coverUrl = result.url ?? null
      }
      let stemsPath: string | null = null
      if (stemsFile) {
        setUploadMsg('Uploading stems…')
        const result = await uploadFile(stemsFile, 'stems')
        stemsPath = result.path
      }

      setUploadMsg('Saving…')
      const tagsArr = typeof newBeat.tags === 'string'
        ? newBeat.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : newBeat.tags

      const res = await fetch('/api/admin/beats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          ...newBeat,
          tags: tagsArr,
          file_url: null,
          file_path: filePath,
          preview_url: previewUrl,
          preview_path: previewPath,
          cover_url: coverUrl,
          stems_path: stemsPath,
          bpm: Number(newBeat.bpm),
        }),
      })
      if (res.ok) {
        setUploadMsg('Beat added!')
        setNewBeat({ ...BLANK_BEAT })
        if (fileRef.current) fileRef.current.value = ''
        if (previewRef.current) previewRef.current.value = ''
        if (coverRef.current) coverRef.current.value = ''
        if (stemsRef.current) stemsRef.current.value = ''
        fetchBeats()
      } else {
        const err = await res.json()
        setUploadMsg(`Error: ${err.error}`)
      }
    } catch (err) {
      setUploadMsg('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (!authed) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <form
          onSubmit={handleAuth}
          className="w-full max-w-sm rounded-2xl border border-[#1f1f1f] bg-[#111] p-8"
        >
          <h1 className="mb-6 text-xl font-black text-white">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mb-4 w-full rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-zinc-500"
          />
          {authError && <p className="mb-3 text-sm text-red-400">{authError}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white py-3.5 text-sm font-bold text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Admin Panel</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchBeats(); fetchOrders(); fetchPromos() }}
            className="flex items-center gap-2 rounded-lg border border-[#1f1f1f] px-3 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => { setAuthed(false); setPassword('') }}
            className="flex items-center gap-2 rounded-lg border border-[#1f1f1f] px-3 py-2 text-xs text-zinc-400 hover:text-red-400 transition-colors"
          >
            <X size={14} /> Lock
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-[#1f1f1f] pb-0">
        {(['beats', 'orders', 'upload', 'promos'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === 'promos') fetchPromos() }}
            className={`px-4 py-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-white text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t === 'beats' ? `Beats (${beats.length})` : t === 'orders' ? `Orders (${orders.length})` : t === 'upload' ? 'Add Beat' : 'Promos'}
          </button>
        ))}
      </div>

      {/* Beats tab */}
      {tab === 'beats' && (
        <div className="space-y-2">
          {actionError && (
            <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              <span>{actionError}</span>
              <button onClick={() => setActionError(null)} className="ml-3 text-red-400/60 hover:text-red-400">
                <X size={14} />
              </button>
            </div>
          )}
          {beats.length === 0 && (
            <p className="text-center text-zinc-500 py-12">No beats yet. Add some in the Upload tab.</p>
          )}
          {beats.map((beat) => (
            <div
              key={beat.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-[#1f1f1f] bg-[#111] px-4 py-3"
            >
              {editId === beat.id ? (
                <div className="flex-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <input
                    value={editForm.title ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="col-span-2 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none"
                    placeholder="Title"
                  />
                  <input
                    type="number"
                    value={editForm.bpm ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, bpm: Number(e.target.value) }))}
                    className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none"
                    placeholder="BPM"
                  />
                  <input
                    value={editForm.key ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, key: e.target.value }))}
                    className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none"
                    placeholder="Key"
                  />
                  <select
                    value={editForm.genre ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, genre: e.target.value }))}
                    className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none"
                  >
                    <option>Trap</option>
                    <option>Drill</option>
                    <option>R&B</option>
                    <option>Afrobeats</option>
                  </select>
                  <input
                    value={editForm.subgenre ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, subgenre: e.target.value }))}
                    className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none"
                    placeholder="Subgenre"
                  />
                  <input
                    value={editTagsStr}
                    onChange={(e) => setEditTagsStr(e.target.value)}
                    className="col-span-2 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none"
                    placeholder="Tags (comma separated)"
                  />
                  <div className="col-span-2 flex gap-2">
                    <button onClick={saveEdit} className="flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-bold text-black">
                      <Check size={12} /> Save
                    </button>
                    <button onClick={() => setEditId(null)} className="flex items-center gap-1 rounded-lg border border-[#2a2a2a] px-3 py-2 text-xs text-zinc-400">
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${beat.is_active ? 'bg-green-400' : 'bg-zinc-600'}`} />
                      <p className="text-sm font-semibold text-white truncate">{beat.title}</p>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 ml-4">
                      {beat.genre} · {beat.subgenre} · {beat.bpm} BPM · {beat.key}
                      {beat.stems_path && <span className="ml-2 text-emerald-500">· stems ✓</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {/* Feature toggle */}
                    <button
                      onClick={() => setFeatured(beat)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        beat.is_featured
                          ? 'text-yellow-400 bg-yellow-400/10'
                          : 'text-zinc-600 hover:text-yellow-400 hover:bg-yellow-400/10'
                      }`}
                      title={beat.is_featured ? 'Remove from featured' : 'Set as featured track'}
                    >
                      <Star size={14} fill={beat.is_featured ? 'currentColor' : 'none'} />
                    </button>
                    {/* Pin control */}
                    {beat.pin_order !== null ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 rounded px-1.5 py-0.5">
                          #{beat.pin_order}
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          defaultValue={beat.pin_order}
                          onBlur={(e) => {
                            const v = parseInt(e.target.value)
                            if (!isNaN(v) && v > 0 && v !== beat.pin_order) setPinOrder(beat, v)
                          }}
                          className="w-10 rounded border border-amber-400/30 bg-[#0a0a0a] px-1 py-0.5 text-center text-xs text-white outline-none"
                        />
                        <button
                          onClick={() => setPinOrder(beat, null)}
                          className="flex h-7 w-7 items-center justify-center rounded text-amber-400 hover:bg-amber-400/10 transition-colors"
                          title="Unpin"
                        >
                          <PinOff size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPinOrder(beat, (Math.max(0, ...beats.filter(b => b.pin_order !== null).map(b => b.pin_order as number))) + 1)}
                        className="flex h-8 items-center gap-1 rounded-lg border border-[#2a2a2a] px-2 text-xs text-zinc-500 hover:text-amber-400 hover:border-amber-400/30 transition-colors"
                        title="Pin to top"
                      >
                        <Pin size={12} /> Pin
                      </button>
                    )}
                    <button onClick={() => startEdit(beat)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => toggleActive(beat)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        beat.is_active
                          ? 'text-green-400 hover:bg-green-400/10'
                          : 'text-zinc-600 hover:bg-white/10 hover:text-zinc-300'
                      }`}
                    >
                      {beat.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    {beat.file_url ? (
                      <a href={beat.file_url} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                        <Eye size={14} />
                      </a>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center text-zinc-700">
                        <EyeOff size={14} />
                      </span>
                    )}
                    <button
                      onClick={() => deleteBeat(beat)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      title="Delete beat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Orders tab */}
      {tab === 'orders' && (
        <div className="space-y-2">
          {orders.length === 0 && (
            <p className="text-center text-zinc-500 py-12">No orders yet.</p>
          )}
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-[#1f1f1f] bg-[#111] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{order.customer_name}</p>
                  <p className="text-xs text-zinc-500">{order.customer_email}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {order.license_type} · {order.quantity_tier} beat{order.quantity_tier > 1 ? 's' : ''} · ${order.total_price}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    order.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {order.status}
                  </span>
                  <p className="mt-1 text-xs text-zinc-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Promos tab */}
      {tab === 'promos' && (
        <div className="max-w-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Promotions</h2>
            <p className="text-xs text-zinc-500">Changes apply immediately to all visitors. Set a value to 0 or leave blank to disable.</p>
          </div>

          {/* Status cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border px-4 py-3 ${promo.sitewide_discount_pct ? 'border-amber-500/30 bg-amber-500/10' : 'border-[#1f1f1f] bg-[#111]'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Tag size={13} className={promo.sitewide_discount_pct ? 'text-amber-400' : 'text-zinc-600'} />
                <p className="text-xs font-semibold text-zinc-400">Sitewide Discount</p>
              </div>
              <p className={`text-2xl font-black ${promo.sitewide_discount_pct ? 'text-amber-400' : 'text-zinc-700'}`}>
                {promo.sitewide_discount_pct ? `${promo.sitewide_discount_pct}% OFF` : 'Off'}
              </p>
            </div>
            <div className={`rounded-xl border px-4 py-3 ${promo.bogo_free_count ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-[#1f1f1f] bg-[#111]'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={13} className={promo.bogo_free_count ? 'text-emerald-400' : 'text-zinc-600'} />
                <p className="text-xs font-semibold text-zinc-400">BOGO</p>
              </div>
              <p className={`text-2xl font-black ${promo.bogo_free_count ? 'text-emerald-400' : 'text-zinc-700'}`}>
                {promo.bogo_free_count ? `Buy 1 Get ${promo.bogo_free_count}` : 'Off'}
              </p>
            </div>
          </div>

          {/* Edit form */}
          <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-5 space-y-5">
            {/* Sitewide discount */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Sitewide Discount (%)
              </label>
              <p className="text-[11px] text-zinc-600 mb-2">Applies a % off all beats at checkout. Takes effect over any coupon code that gives less.</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={promoForm.sitewide_discount_pct}
                  onChange={(e) => setPromoForm((f) => ({ ...f, sitewide_discount_pct: e.target.value }))}
                  placeholder="0 = off"
                  className="w-32 rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                />
                <span className="text-sm text-zinc-500">% off all beats</span>
              </div>
            </div>

            <div className="h-px bg-[#1f1f1f]" />

            {/* BOGO */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                BOGO — Free Beats Count
              </label>
              <p className="text-[11px] text-zinc-600 mb-2">
                When set, customers see a &ldquo;Buy 1 Get N Free&rdquo; deal in the checkout modal — they pay the single-beat price regardless of how many beats they add up to that limit.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={promoForm.bogo_free_count}
                  onChange={(e) => setPromoForm((f) => ({ ...f, bogo_free_count: e.target.value }))}
                  placeholder="0 = off"
                  className="w-32 rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                />
                <span className="text-sm text-zinc-500">
                  {promoForm.bogo_free_count && Number(promoForm.bogo_free_count) > 0
                    ? `→ "Buy 1 Get ${promoForm.bogo_free_count} Free" (${1 + Number(promoForm.bogo_free_count)} beats total)`
                    : 'free beats (e.g. 1 = classic BOGO, 2 = buy 1 get 2 free)'}
                </span>
              </div>
            </div>
          </div>

          {promoMsg && (
            <p className={`text-sm ${promoMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {promoMsg}
            </p>
          )}

          <button
            onClick={savePromos}
            disabled={promoSaving}
            className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            <Check size={14} />
            {promoSaving ? 'Saving…' : 'Save Promotions'}
          </button>
        </div>
      )}

      {/* Upload/Add Beat tab */}
      {tab === 'upload' && (
        <form onSubmit={handleAddBeat} className="max-w-xl space-y-4">
          <h2 className="text-lg font-bold text-white">Add New Beat</h2>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title *</label>
            <input required value={newBeat.title} onChange={(e) => setNewBeat((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-4 py-3 text-sm text-white outline-none focus:border-zinc-500" placeholder="Dark Intentions" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">BPM *</label>
              <input required type="number" value={newBeat.bpm} onChange={(e) => setNewBeat((f) => ({ ...f, bpm: Number(e.target.value) }))}
                className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-4 py-3 text-sm text-white outline-none focus:border-zinc-500" placeholder="140" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Key *</label>
              <input required value={newBeat.key} onChange={(e) => setNewBeat((f) => ({ ...f, key: e.target.value }))}
                className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-4 py-3 text-sm text-white outline-none focus:border-zinc-500" placeholder="Am" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Genre *</label>
              <select required value={newBeat.genre} onChange={(e) => setNewBeat((f) => ({ ...f, genre: e.target.value }))}
                className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-4 py-3 text-sm text-white outline-none focus:border-zinc-500">
                <option>Trap</option>
                <option>Drill</option>
                <option>R&B</option>
                <option>Afrobeats</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Subgenre</label>
              <input value={newBeat.subgenre} onChange={(e) => setNewBeat((f) => ({ ...f, subgenre: e.target.value }))}
                className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-4 py-3 text-sm text-white outline-none focus:border-zinc-500" placeholder="Dark Trap" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tags (comma separated)</label>
            <input value={newBeat.tags} onChange={(e) => setNewBeat((f) => ({ ...f, tags: e.target.value }))}
              className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-4 py-3 text-sm text-white outline-none focus:border-zinc-500" placeholder="dark, 808, hard" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Beat File (MP3/WAV)</label>
            <input ref={fileRef} type="file" accept="audio/*"
              className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-4 py-3 text-sm text-zinc-400 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Preview File (optional, 30s clip)</label>
            <input ref={previewRef} type="file" accept="audio/*"
              className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-4 py-3 text-sm text-zinc-400 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cover Image (optional — replaces the genre square)</label>
            <input ref={coverRef} type="file" accept="image/*"
              className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-4 py-3 text-sm text-zinc-400 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white" />
            <p className="mt-1 text-[10px] text-zinc-600">JPG, PNG, WEBP — will show in the beat list and player bar</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Stems (optional — ZIP file of all track stems)</label>
            <input ref={stemsRef} type="file" accept=".zip,application/zip"
              className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-4 py-3 text-sm text-zinc-400 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white" />
            <p className="mt-1 text-[10px] text-zinc-600">ZIP only — delivered automatically to customers who buy the Stems License</p>
          </div>

          {uploadMsg && (
            <p className={`text-sm ${uploadMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {uploadMsg}
            </p>
          )}

          <button type="submit" disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 text-sm font-bold text-black hover:bg-zinc-200 transition-colors disabled:opacity-50 min-h-[52px]">
            <Upload size={16} />
            {uploading ? 'Uploading…' : 'Add Beat'}
          </button>
        </form>
      )}
    </div>
  )
}
