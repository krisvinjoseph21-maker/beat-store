'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
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

interface MelodyPack {
  id: string
  title: string
  vendor: string
  description: string
  price: number
  compare_at_price: number | null
  cover_url: string | null
  file_path: string | null
  is_active: boolean
  is_featured: boolean
  created_at: string
}

interface DrumPack {
  id: string
  title: string
  vendor: string
  description: string
  price: number
  compare_at_price: number | null
  cover_url: string | null
  file_path: string | null
  is_active: boolean
  is_featured: boolean
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

interface BatchBeat {
  id: string
  file: File
  preview: File | null
  generatingPreview: boolean
  autoPreview: boolean
  title: string
  bpm: number
  key: string
  uploadStatus: 'pending' | 'uploading' | 'done' | 'error'
  errorMsg: string
}

// Normalise a raw key string to standard format.
// "c min" → "Cm", "C minor" → "Cm", "Amaj" → "Amaj", "Bm" → "Bm"
function normalizeKey(raw: string): string {
  const s = raw.trim()
  const noteMatch = s.match(/^([A-Ga-g][#b]?)/)
  if (!noteMatch) return raw
  const note = noteMatch[1].charAt(0).toUpperCase() + noteMatch[1].slice(1)
  const quality = s.slice(noteMatch[1].length).trim().toLowerCase()
  if (quality.startsWith('maj')) return note + 'maj'
  if (quality.startsWith('min') || quality === 'm') return note + 'm'
  if (!quality) return note + 'm' // bare note → assume minor
  return note + quality
}

// Smart filename parser.
// Strategy: strip noise tokens, split on the BPM number, take the title
// from what came before and the key from what came after.
//
// Examples:
//   "! lifetime 153 c min @prodkjbeats @andrzxz.wav"
//     → { title: "Lifetime", bpm: 153, key: "Cm" }
//   "(2000s, tecca) whispering to you 104 prodkjbeats x pantydiamanty.mp3"
//     → { title: "Whispering To You", bpm: 104, key: "Am" }
function parseBeatFilename(filename: string): { title: string; key: string; bpm: number | null } {
  let s = filename.replace(/\.[^.]+$/, '')       // strip extension
  s = s.replace(/^[!*#]+\s*/, '')                // strip leading ! * #
  s = s.replace(/^\([^)]+\)\s*/g, '')            // strip (tag, genre) prefix
  s = s.replace(/@\S+/g, '')                     // strip @mentions
  s = s.trim()

  // BPM: standalone integer in the realistic range 60–220
  const bpmRe = /\b(2[0-1][0-9]|1[0-9]{2}|[6-9][0-9])\b/
  const bpmMatch = s.match(bpmRe)

  let rawTitle: string
  let afterBpm: string
  let bpm: number | null = null

  if (bpmMatch && bpmMatch.index !== undefined) {
    bpm = Number(bpmMatch[0])
    rawTitle = s.slice(0, bpmMatch.index)
    afterBpm = s.slice(bpmMatch.index + bpmMatch[0].length)
  } else {
    rawTitle = s
    afterBpm = ''
  }

  // Key: look in the segment after BPM first, then fall back to tail of title
  const keyRe = /\b([A-Ga-g][#b]?\s*(?:maj(?:or)?|min(?:or)?|m))\b/i
  let key = 'Am'
  const keyInAfter = afterBpm.match(keyRe)
  if (keyInAfter) {
    key = normalizeKey(keyInAfter[1])
  } else {
    const keyInTitle = rawTitle.match(keyRe)
    if (keyInTitle) {
      key = normalizeKey(keyInTitle[1])
      rawTitle = rawTitle.slice(0, keyInTitle.index).trim()
    }
  }

  // Clean up title: strip trailing commas/dashes, collapse spaces, title-case
  let title = rawTitle.replace(/[,\-–—]+$/, '').replace(/\s+/g, ' ').trim()
  title = title.replace(/\b\w/g, (c) => c.toUpperCase())

  return { title: title || filename.replace(/\.[^.]+$/, ''), key, bpm }
}

// Idle timeout: lock the admin session after 30 minutes of inactivity.
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

const PREVIEW_SECS = 30

function writeStr(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
}

function audioBufferToWav(buf: AudioBuffer): ArrayBuffer {
  const ch = buf.numberOfChannels
  const len = buf.length
  const ab = new ArrayBuffer(44 + len * ch * 2)
  const v = new DataView(ab)
  writeStr(v, 0, 'RIFF'); v.setUint32(4, ab.byteLength - 8, true)
  writeStr(v, 8, 'WAVE'); writeStr(v, 12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true)
  v.setUint16(22, ch, true); v.setUint32(24, buf.sampleRate, true)
  v.setUint32(28, buf.sampleRate * ch * 2, true); v.setUint16(32, ch * 2, true)
  v.setUint16(34, 16, true); writeStr(v, 36, 'data'); v.setUint32(40, len * ch * 2, true)
  let off = 44
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, buf.getChannelData(c)[i]))
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2
    }
  }
  return ab
}

async function trimToPreview(file: File): Promise<File> {
  const ab = await file.arrayBuffer()
  const ctx = new AudioContext()
  const decoded = await ctx.decodeAudioData(ab)
  await ctx.close()
  const trimSamples = Math.min(decoded.length, Math.floor(PREVIEW_SECS * decoded.sampleRate))
  const offline = new OfflineAudioContext(decoded.numberOfChannels, trimSamples, decoded.sampleRate)
  const src = offline.createBufferSource()
  src.buffer = decoded; src.connect(offline.destination); src.start(0)
  const trimmed = await offline.startRendering()
  const wav = audioBufferToWav(trimmed)
  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([wav], `${baseName}_preview.wav`, { type: 'audio/wav' })
}

export default function AdminClient() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [beats, setBeats] = useState<Beat[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<'beats' | 'orders' | 'upload' | 'promos' | 'melody-packs' | 'drum-packs'>('beats')
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
  const [discountCodes, setDiscountCodes] = useState<{ code: string; pct: number; created_at: string }[]>([])
  const [dcForm, setDcForm] = useState({ code: '', pct: '' })
  const [dcSaving, setDcSaving] = useState(false)
  const [dcMsg, setDcMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const stemsRef = useRef<HTMLInputElement>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [dragOver, setDragOver] = useState<'beat' | 'preview' | 'cover' | 'stems' | null>(null)
  const [droppedBeat, setDroppedBeat] = useState<File | null>(null)
  const [droppedPreview, setDroppedPreview] = useState<File | null>(null)
  const [autoPreview, setAutoPreview] = useState(false)
  const [generatingPreview, setGeneratingPreview] = useState(false)
  const [droppedCover, setDroppedCover] = useState<File | null>(null)
  const [droppedStems, setDroppedStems] = useState<File | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [batchBeats, setBatchBeats] = useState<BatchBeat[]>([])
  const [sharedMeta, setSharedMeta] = useState({ genre: 'Trap', subgenre: '', tags: '', bpm: 140, key: 'Am' })
  const [batchDragOver, setBatchDragOver] = useState(false)
  const [batchUploading, setBatchUploading] = useState(false)
  const batchFileRef = useRef<HTMLInputElement>(null)

  // Melody packs state
  const [melodyPacks, setMelodyPacks] = useState<MelodyPack[]>([])
  const [mpEditId, setMpEditId] = useState<string | null>(null)
  const [mpEditForm, setMpEditForm] = useState<Partial<MelodyPack>>({})
  const [mpNewPack, setMpNewPack] = useState({ title: '', vendor: 'PRODKJBEATS', description: '', price: '', compare_at_price: '' })
  const [mpError, setMpError] = useState<string | null>(null)
  const [mpUploading, setMpUploading] = useState(false)
  const [mpUploadMsg, setMpUploadMsg] = useState('')
  const [mpCoverUrl, setMpCoverUrl] = useState('')
  const [mpFilePath, setMpFilePath] = useState('')
  const [mpEditCoverUrl, setMpEditCoverUrl] = useState('')
  const [mpEditFilePath, setMpEditFilePath] = useState('')
  const mpCoverRef = useRef<HTMLInputElement>(null)
  const mpFileRef = useRef<HTMLInputElement>(null)
  const mpEditCoverRef = useRef<HTMLInputElement>(null)
  const mpEditFileRef = useRef<HTMLInputElement>(null)

  // Drum packs state
  const [drumPacks, setDrumPacks] = useState<DrumPack[]>([])
  const [dpEditId, setDpEditId] = useState<string | null>(null)
  const [dpEditForm, setDpEditForm] = useState<Partial<DrumPack>>({})
  const [dpNewPack, setDpNewPack] = useState({ title: '', vendor: 'PRODKJBEATS', description: '', price: '', compare_at_price: '' })
  const [dpError, setDpError] = useState<string | null>(null)
  const [dpUploading, setDpUploading] = useState(false)
  const [dpUploadMsg, setDpUploadMsg] = useState('')
  const [dpCoverUrl, setDpCoverUrl] = useState('')
  const [dpFilePath, setDpFilePath] = useState('')
  const [dpEditCoverUrl, setDpEditCoverUrl] = useState('')
  const [dpEditFilePath, setDpEditFilePath] = useState('')
  const dpCoverRef = useRef<HTMLInputElement>(null)
  const dpFileRef = useRef<HTMLInputElement>(null)
  const dpEditCoverRef = useRef<HTMLInputElement>(null)
  const dpEditFileRef = useRef<HTMLInputElement>(null)

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

  // ── Melody Packs ─────────────────────────────────────────────────────────
  async function fetchMelodyPacks() {
    const res = await fetch('/api/admin/melody-packs', {
      headers: { 'x-admin-password': password },
    })
    if (res.ok) setMelodyPacks(await res.json())
  }

  async function uploadMpFile(file: File, type: 'cover' | 'stems'): Promise<{ publicUrl?: string; path?: string } | null> {
    const res = await fetch(`/api/admin/upload?type=${type}&filename=${encodeURIComponent(file.name)}`, {
      headers: { 'x-admin-password': password },
    })
    if (!res.ok) return null
    const { signedUrl, path, publicUrl } = await res.json()
    const put = await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || (type === 'cover' ? 'image/jpeg' : 'application/zip') } })
    if (!put.ok) return null
    return { publicUrl, path }
  }

  async function handleMpCreate(e: React.FormEvent) {
    e.preventDefault()
    setMpError(null)
    setMpUploading(true)
    setMpUploadMsg('')
    try {
      const body: Record<string, unknown> = {
        title: mpNewPack.title,
        vendor: mpNewPack.vendor,
        description: mpNewPack.description,
        price: Number(mpNewPack.price) || 0,
        compare_at_price: mpNewPack.compare_at_price !== '' ? Number(mpNewPack.compare_at_price) : null,
        cover_url: mpCoverUrl || null,
        file_path: mpFilePath || null,
        is_active: true,
      }
      const res = await fetch('/api/admin/melody-packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setMpError(data.error ?? 'Failed to create'); return }
      setMelodyPacks((prev) => [data, ...prev])
      setMpNewPack({ title: '', vendor: 'PRODKJBEATS', description: '', price: '', compare_at_price: '' })
      setMpCoverUrl('')
      setMpFilePath('')
      setMpUploadMsg('Pack created successfully.')
    } finally {
      setMpUploading(false)
    }
  }

  async function handleMpSave(id: string) {
    setMpError(null)
    const updates: Record<string, unknown> = { id, ...mpEditForm }
    if (mpEditCoverUrl) updates.cover_url = mpEditCoverUrl
    if (mpEditFilePath) updates.file_path = mpEditFilePath
    const res = await fetch('/api/admin/melody-packs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(updates),
    })
    const data = await res.json()
    if (!res.ok) { setMpError(data.error ?? 'Failed to update'); return }
    setMelodyPacks((prev) => prev.map((p) => (p.id === id ? data : p)))
    setMpEditId(null)
    setMpEditCoverUrl('')
    setMpEditFilePath('')
  }

  async function handleMpToggle(pack: MelodyPack) {
    const res = await fetch('/api/admin/melody-packs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ id: pack.id, is_active: !pack.is_active }),
    })
    if (res.ok) {
      const data = await res.json()
      setMelodyPacks((prev) => prev.map((p) => (p.id === pack.id ? data : p)))
    }
  }

  async function handleMpDelete(id: string) {
    if (!confirm('Delete this melody pack? This cannot be undone.')) return
    const res = await fetch('/api/admin/melody-packs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setMelodyPacks((prev) => prev.filter((p) => p.id !== id))
    else setMpError('Failed to delete pack')
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── Drum Packs ────────────────────────────────────────────────────────────
  async function fetchDrumPacks() {
    const res = await fetch('/api/admin/drum-packs', {
      headers: { 'x-admin-password': password },
    })
    if (res.ok) setDrumPacks(await res.json())
  }

  async function handleDpCreate(e: React.FormEvent) {
    e.preventDefault()
    setDpError(null)
    setDpUploading(true)
    setDpUploadMsg('')
    try {
      const body: Record<string, unknown> = {
        title: dpNewPack.title,
        vendor: dpNewPack.vendor,
        description: dpNewPack.description,
        price: Number(dpNewPack.price) || 0,
        compare_at_price: dpNewPack.compare_at_price !== '' ? Number(dpNewPack.compare_at_price) : null,
        cover_url: dpCoverUrl || null,
        file_path: dpFilePath || null,
        is_active: true,
      }
      const res = await fetch('/api/admin/drum-packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setDpError(data.error ?? 'Failed to create'); return }
      setDrumPacks((prev) => [data, ...prev])
      setDpNewPack({ title: '', vendor: 'PRODKJBEATS', description: '', price: '', compare_at_price: '' })
      setDpCoverUrl('')
      setDpFilePath('')
      setDpUploadMsg('Pack created successfully.')
    } finally {
      setDpUploading(false)
    }
  }

  async function handleDpSave(id: string) {
    setDpError(null)
    const updates: Record<string, unknown> = { id, ...dpEditForm }
    if (dpEditCoverUrl) updates.cover_url = dpEditCoverUrl
    if (dpEditFilePath) updates.file_path = dpEditFilePath
    const res = await fetch('/api/admin/drum-packs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(updates),
    })
    const data = await res.json()
    if (!res.ok) { setDpError(data.error ?? 'Failed to update'); return }
    setDrumPacks((prev) => prev.map((p) => (p.id === id ? data : p)))
    setDpEditId(null)
    setDpEditCoverUrl('')
    setDpEditFilePath('')
  }

  async function handleDpToggle(pack: DrumPack) {
    const res = await fetch('/api/admin/drum-packs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ id: pack.id, is_active: !pack.is_active }),
    })
    if (res.ok) {
      const data = await res.json()
      setDrumPacks((prev) => prev.map((p) => (p.id === pack.id ? data : p)))
    }
  }

  async function handleDpDelete(id: string) {
    if (!confirm('Delete this drum pack? This cannot be undone.')) return
    const res = await fetch('/api/admin/drum-packs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setDrumPacks((prev) => prev.filter((p) => p.id !== id))
    else setDpError('Failed to delete pack')
  }
  // ─────────────────────────────────────────────────────────────────────────

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

  async function fetchDiscountCodes() {
    const res = await fetch('/api/admin/discount-codes', {
      headers: { 'x-admin-password': password },
    })
    if (res.ok) setDiscountCodes(await res.json())
  }

  async function createDiscountCode() {
    setDcSaving(true)
    setDcMsg('')
    try {
      const res = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ code: dcForm.code, pct: Number(dcForm.pct) }),
      })
      if (res.ok) {
        const created = await res.json()
        setDiscountCodes((prev) => {
          const without = prev.filter((c) => c.code !== created.code)
          return [created, ...without]
        })
        setDcForm({ code: '', pct: '' })
        setDcMsg('Code saved!')
      } else {
        const err = await res.json().catch(() => ({}))
        setDcMsg(`Error: ${err.error ?? 'Failed to save'}`)
      }
    } finally {
      setDcSaving(false)
    }
  }

  async function deleteDiscountCode(code: string) {
    const res = await fetch('/api/admin/discount-codes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ code }),
    })
    if (res.ok) setDiscountCodes((prev) => prev.filter((c) => c.code !== code))
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

  async function deleteSelected() {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} beat${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return
    setActionError(null)
    await Promise.all(
      [...selectedIds].map((id) =>
        fetch('/api/admin/beats', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
          body: JSON.stringify({ id }),
        })
      )
    )
    setSelectedIds(new Set())
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
    // Step 1 — get a pre-signed Supabase upload URL (tiny request, no file body).
    const params = new URLSearchParams({ type, filename: file.name })
    const signRes = await fetch(`/api/admin/upload?${params}`, {
      headers: { 'x-admin-password': password },
    })
    if (!signRes.ok) {
      const err = await signRes.json().catch(() => ({}))
      throw new Error(err.error ?? `Server error ${signRes.status}`)
    }
    const { signedUrl, path, publicUrl } = await signRes.json()

    // Step 2 — upload directly to Supabase (browser → Supabase, bypasses Vercel size limits).
    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    if (!uploadRes.ok) {
      throw new Error(`Storage upload failed (${uploadRes.status})`)
    }

    return { path, url: publicUrl }
  }

  async function handleBeatFile(file: File) {
    setDroppedBeat(file)
    const { title, key, bpm } = parseBeatFilename(file.name)
    setNewBeat((prev) => ({
      ...prev,
      title: title || prev.title,
      key: key || prev.key,
      bpm: bpm ?? prev.bpm,
    }))
    // Auto-generate a 30s preview only if the user hasn't manually set one
    if (!droppedPreview) {
      setGeneratingPreview(true)
      try {
        const preview = await trimToPreview(file)
        setDroppedPreview(preview)
        setAutoPreview(true)
      } catch {
        // silently skip — user can upload a preview manually
      } finally {
        setGeneratingPreview(false)
      }
    }
  }

  async function handleBatchFiles(files: File[]) {
    const newBeats: BatchBeat[] = files.map((f) => {
      const { title, key, bpm } = parseBeatFilename(f.name)
      return {
        id: Math.random().toString(36).slice(2),
        file: f, preview: null,
        generatingPreview: false, autoPreview: false,
        title, bpm: bpm ?? sharedMeta.bpm, key,
        uploadStatus: 'pending', errorMsg: '',
      }
    })
    setBatchBeats((prev) => [...prev, ...newBeats])
    for (const b of newBeats) {
      setBatchBeats((prev) => prev.map((x) => x.id === b.id ? { ...x, generatingPreview: true } : x))
      try {
        const preview = await trimToPreview(b.file)
        setBatchBeats((prev) => prev.map((x) => x.id === b.id ? { ...x, preview, generatingPreview: false, autoPreview: true } : x))
      } catch {
        setBatchBeats((prev) => prev.map((x) => x.id === b.id ? { ...x, generatingPreview: false } : x))
      }
    }
  }

  function applySharedToAll(field: 'bpm' | 'key') {
    setBatchBeats((prev) => prev.map((b) => ({ ...b, [field]: sharedMeta[field] })))
  }

  async function handleBatchUpload(e: React.FormEvent) {
    e.preventDefault()
    const pending = batchBeats.filter((b) => b.uploadStatus === 'pending' || b.uploadStatus === 'error')
    if (pending.length === 0) return
    setBatchUploading(true)
    const tagsArr = sharedMeta.tags.split(',').map((t) => t.trim()).filter(Boolean)
    for (const beat of pending) {
      setBatchBeats((prev) => prev.map((x) => x.id === beat.id ? { ...x, uploadStatus: 'uploading', errorMsg: '' } : x))
      try {
        const fileResult = await uploadFile(beat.file, 'full')
        let previewUrl: string | null = null
        let previewPath: string | null = null
        if (beat.preview) {
          const prevResult = await uploadFile(beat.preview, 'preview')
          previewPath = prevResult.path
          previewUrl = prevResult.url ?? null
        }
        const res = await fetch('/api/admin/beats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
          body: JSON.stringify({
            title: beat.title, bpm: Number(beat.bpm), key: beat.key,
            genre: sharedMeta.genre, subgenre: sharedMeta.subgenre, tags: tagsArr,
            file_url: null, file_path: fileResult.path,
            preview_url: previewUrl, preview_path: previewPath,
            cover_url: null, stems_path: null, is_active: true,
          }),
        })
        setBatchBeats((prev) => prev.map((x) => x.id === beat.id
          ? { ...x, uploadStatus: res.ok ? 'done' : 'error', errorMsg: res.ok ? '' : 'Failed' }
          : x))
      } catch {
        setBatchBeats((prev) => prev.map((x) => x.id === beat.id ? { ...x, uploadStatus: 'error', errorMsg: 'Upload failed' } : x))
      }
    }
    setBatchUploading(false)
    fetchBeats()
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

      const mainFile = droppedBeat ?? fileRef.current?.files?.[0]
      const prevFile = droppedPreview ?? previewRef.current?.files?.[0]
      const coverFile = droppedCover ?? coverRef.current?.files?.[0]
      const stemsFile = droppedStems ?? stemsRef.current?.files?.[0]

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
        setDroppedBeat(null)
        setDroppedPreview(null)
        setDroppedCover(null)
        setDroppedStems(null)
        setAutoPreview(false)
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
          className="w-full max-w-sm rounded-2xl border border-line-card bg-surface-1 p-8"
        >
          <h1 className="mb-6 text-xl font-black text-white">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mb-4 w-full rounded-xl border border-line-card bg-surface-3 px-4 py-3 text-sm text-white outline-none focus:border-muted"
          />
          {authError && <p className="mb-3 text-sm text-danger">{authError}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white py-3.5 text-sm font-bold text-black hover:bg-white-hover transition-colors disabled:opacity-50"
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
            onClick={() => { fetchBeats(); fetchOrders(); fetchPromos(); fetchDiscountCodes() }}
            className="flex items-center gap-2 rounded-lg border border-line-card px-3 py-2 text-xs text-muted-mid hover:text-white transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => { setAuthed(false); setPassword('') }}
            className="flex items-center gap-2 rounded-lg border border-line-card px-3 py-2 text-xs text-muted-mid hover:text-danger transition-colors"
          >
            <X size={14} /> Lock
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-line-card pb-0 overflow-x-auto">
        {(['beats', 'orders', 'upload', 'promos', 'melody-packs', 'drum-packs'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === 'promos') { fetchPromos(); fetchDiscountCodes() } if (t === 'melody-packs') fetchMelodyPacks(); if (t === 'drum-packs') fetchDrumPacks() }}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-white text-white'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {t === 'beats' ? `Beats (${beats.length})` : t === 'orders' ? `Orders (${orders.length})` : t === 'upload' ? 'Add Beat' : t === 'promos' ? 'Promos' : t === 'melody-packs' ? `Melody Packs (${melodyPacks.length})` : `Drum Packs (${drumPacks.length})`}
          </button>
        ))}
      </div>

      {/* Beats tab */}
      {tab === 'beats' && (
        <div className="space-y-2">
          {actionError && (
            <div className="flex items-center justify-between rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
              <span>{actionError}</span>
              <button onClick={() => setActionError(null)} className="ml-3 text-danger/60 hover:text-danger">
                <X size={14} />
              </button>
            </div>
          )}
          {beats.length > 0 && (
            <div className="flex items-center gap-3 px-1 pb-1">
              <button
                type="button"
                onClick={() => setSelectedIds(selectedIds.size === beats.length ? new Set() : new Set(beats.map((b) => b.id)))}
                className={`h-4 w-4 flex-shrink-0 rounded border transition-colors ${selectedIds.size > 0 ? 'border-white bg-white' : 'border-muted bg-transparent hover:border-muted-mid'}`}
              >
                {selectedIds.size > 0 && (
                  <svg viewBox="0 0 10 10" className="w-full h-full p-0.5" fill="none">
                    {selectedIds.size < beats.length
                      ? <line x1="1" y1="5" x2="9" y2="5" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
                      : <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}
                  </svg>
                )}
              </button>
              <span className="text-xs text-muted">{selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}</span>
              {selectedIds.size > 0 && (
                <button
                  onClick={deleteSelected}
                  className="ml-auto flex items-center gap-1.5 rounded-lg bg-danger/10 border border-danger/20 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/20 transition-colors"
                >
                  <Trash2 size={12} /> Delete {selectedIds.size}
                </button>
              )}
            </div>
          )}
          {beats.length === 0 && (
            <p className="text-center text-muted py-12">No beats yet. Add some in the Upload tab.</p>
          )}
          {beats.map((beat) => (
            <div
              key={beat.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-line-card bg-surface-1 px-4 py-3"
            >
              {editId === beat.id ? (
                <div className="flex-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <input
                    value={editForm.title ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="col-span-2 rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none"
                    placeholder="Title"
                  />
                  <input
                    type="number"
                    value={editForm.bpm ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, bpm: Number(e.target.value) }))}
                    className="rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none"
                    placeholder="BPM"
                  />
                  <input
                    value={editForm.key ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, key: e.target.value }))}
                    className="rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none"
                    placeholder="Key"
                  />
                  <select
                    value={editForm.genre ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, genre: e.target.value }))}
                    className="rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none"
                  >
                    <option>Trap</option>
                    <option>Drill</option>
                    <option>R&B</option>
                    <option>Afrobeats</option>
                  </select>
                  <input
                    value={editForm.subgenre ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, subgenre: e.target.value }))}
                    className="rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none"
                    placeholder="Subgenre"
                  />
                  <input
                    value={editTagsStr}
                    onChange={(e) => setEditTagsStr(e.target.value)}
                    className="col-span-2 rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none"
                    placeholder="Tags (comma separated)"
                  />
                  <div className="col-span-2 flex gap-2">
                    <button onClick={saveEdit} className="flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-bold text-black">
                      <Check size={12} /> Save
                    </button>
                    <button onClick={() => setEditId(null)} className="flex items-center gap-1 rounded-lg border border-line-input px-3 py-2 text-xs text-muted-mid">
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedIds((prev) => { const next = new Set(prev); prev.has(beat.id) ? next.delete(beat.id) : next.add(beat.id); return next })}
                    className={`h-4 w-4 flex-shrink-0 rounded border transition-colors ${selectedIds.has(beat.id) ? 'border-white bg-white' : 'border-line-hover bg-transparent hover:border-muted-mid'}`}
                  >
                    {selectedIds.has(beat.id) && (
                      <svg viewBox="0 0 10 10" className="w-full h-full p-0.5" fill="none">
                        <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${beat.is_active ? 'bg-green-400' : 'bg-muted-low'}`} />
                      <p className="text-sm font-semibold text-white truncate">{beat.title}</p>
                    </div>
                    <p className="text-xs text-muted mt-0.5 ml-4">
                      {beat.genre} · {beat.subgenre} · {beat.bpm} BPM · {beat.key}
                      {beat.stems_path && <span className="ml-2 text-promo">· stems ✓</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {/* Feature toggle */}
                    <button
                      onClick={() => setFeatured(beat)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        beat.is_featured
                          ? 'text-yellow-400 bg-yellow-400/10'
                          : 'text-muted-low hover:text-yellow-400 hover:bg-yellow-400/10'
                      }`}
                      title={beat.is_featured ? 'Remove from featured' : 'Set as featured track'}
                    >
                      <Star size={14} fill={beat.is_featured ? 'currentColor' : 'none'} />
                    </button>
                    {/* Pin control */}
                    {beat.pin_order !== null ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-accent bg-accent/10 rounded px-1.5 py-0.5">
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
                          className="w-10 rounded border border-accent/30 bg-surface-3 px-1 py-0.5 text-center text-xs text-white outline-none"
                        />
                        <button
                          onClick={() => setPinOrder(beat, null)}
                          className="flex h-7 w-7 items-center justify-center rounded text-accent hover:bg-accent/10 transition-colors"
                          title="Unpin"
                        >
                          <PinOff size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPinOrder(beat, (Math.max(0, ...beats.filter(b => b.pin_order !== null).map(b => b.pin_order as number))) + 1)}
                        className="flex h-8 items-center gap-1 rounded-lg border border-line-input px-2 text-xs text-muted hover:text-accent hover:border-accent/30 transition-colors"
                        title="Pin to top"
                      >
                        <Pin size={12} /> Pin
                      </button>
                    )}
                    <button onClick={() => startEdit(beat)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 text-muted-mid hover:text-white transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => toggleActive(beat)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        beat.is_active
                          ? 'text-green-400 hover:bg-green-400/10'
                          : 'text-muted-low hover:bg-white/10 hover:text-foreground'
                      }`}
                    >
                      {beat.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    {beat.file_url ? (
                      <a href={beat.file_url} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 text-muted-mid hover:text-white transition-colors">
                        <Eye size={14} />
                      </a>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center text-muted-low">
                        <EyeOff size={14} />
                      </span>
                    )}
                    <button
                      onClick={() => deleteBeat(beat)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-low hover:bg-danger/10 hover:text-danger transition-colors"
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
            <p className="text-center text-muted py-12">No orders yet.</p>
          )}
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-line-card bg-surface-1 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{order.customer_name}</p>
                  <p className="text-xs text-muted">{order.customer_email}</p>
                  <p className="mt-1 text-xs text-muted-mid">
                    {order.license_type} · {order.quantity_tier} beat{order.quantity_tier > 1 ? 's' : ''} · ${order.total_price}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    order.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {order.status}
                  </span>
                  <p className="mt-1 text-xs text-muted-low">
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
        <div className="max-w-xl space-y-8">
          {/* BOGO section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Promotions</h2>
              <p className="text-xs text-muted">Changes apply immediately to all visitors. Leave blank or set to 0 to disable.</p>
            </div>

            <div className={`rounded-xl border px-4 py-3 ${promo.bogo_free_count ? 'border-promo/30 bg-promo/10' : 'border-line-card bg-surface-1'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={13} className={promo.bogo_free_count ? 'text-promo' : 'text-muted-low'} />
                <p className="text-xs font-semibold text-muted-mid">BOGO</p>
              </div>
              <p className={`text-2xl font-black ${promo.bogo_free_count ? 'text-promo' : 'text-muted-low'}`}>
                {promo.bogo_free_count ? `Buy 1 Get ${promo.bogo_free_count}` : 'Off'}
              </p>
            </div>

            <div className="rounded-xl border border-line-card bg-surface-1 p-5">
              <label className="block text-xs font-semibold text-muted-mid mb-1.5">
                BOGO — Free Beats Count
              </label>
              <p className="text-[11px] text-muted-low mb-2">
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
                  className="w-32 rounded-xl border border-line-card bg-surface-3 px-4 py-2.5 text-sm text-white outline-none focus:border-muted"
                />
                <span className="text-sm text-muted">
                  {promoForm.bogo_free_count && Number(promoForm.bogo_free_count) > 0
                    ? `→ "Buy 1 Get ${promoForm.bogo_free_count} Free" (${1 + Number(promoForm.bogo_free_count)} beats total)`
                    : 'free beats (e.g. 1 = classic BOGO, 2 = buy 1 get 2 free)'}
                </span>
              </div>
            </div>

            {promoMsg && (
              <p className={`text-sm ${promoMsg.startsWith('Error') ? 'text-danger' : 'text-green-400'}`}>
                {promoMsg}
              </p>
            )}

            <button
              onClick={savePromos}
              disabled={promoSaving}
              className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black hover:bg-white-hover transition-colors disabled:opacity-50"
            >
              <Check size={14} />
              {promoSaving ? 'Saving…' : 'Save Promotions'}
            </button>
          </div>

          <div className="h-px bg-line-card" />

          {/* Discount Codes section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Discount Codes</h2>
              <p className="text-xs text-muted">Create codes customers can enter at checkout for a % off.</p>
            </div>

            <div className="rounded-xl border border-line-card bg-surface-1 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-muted-mid mb-1.5">Code</label>
                  <input
                    type="text"
                    value={dcForm.code}
                    onChange={(e) => setDcForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="e.g. SUMMER20"
                    maxLength={50}
                    className="w-full rounded-xl border border-line-card bg-surface-3 px-4 py-2.5 text-sm text-white uppercase outline-none focus:border-muted placeholder:normal-case"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-muted-mid mb-1.5">% Off</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={dcForm.pct}
                    onChange={(e) => setDcForm((f) => ({ ...f, pct: e.target.value }))}
                    placeholder="e.g. 20"
                    className="w-full rounded-xl border border-line-card bg-surface-3 px-4 py-2.5 text-sm text-white outline-none focus:border-muted"
                  />
                </div>
              </div>

              {dcMsg && (
                <p className={`text-sm ${dcMsg.startsWith('Error') ? 'text-danger' : 'text-green-400'}`}>
                  {dcMsg}
                </p>
              )}

              <button
                onClick={createDiscountCode}
                disabled={dcSaving || !dcForm.code.trim() || !dcForm.pct}
                className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-white-hover transition-colors disabled:opacity-40"
              >
                <Tag size={13} />
                {dcSaving ? 'Saving…' : 'Create Code'}
              </button>
            </div>

            {discountCodes.length > 0 && (
              <div className="rounded-xl border border-line-card bg-surface-1 divide-y divide-line-card overflow-hidden">
                {discountCodes.map((dc) => (
                  <div key={dc.code} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Tag size={13} className="text-accent shrink-0" />
                      <span className="text-sm font-bold text-white">{dc.code}</span>
                      <span className="text-xs font-semibold text-accent bg-accent/10 rounded-lg px-2 py-0.5">{dc.pct}% OFF</span>
                    </div>
                    <button
                      onClick={() => deleteDiscountCode(dc.code)}
                      className="p-1.5 text-muted-low hover:text-danger transition-colors"
                      title="Delete code"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {discountCodes.length === 0 && (
              <p className="text-xs text-muted-low text-center py-4">No discount codes yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Upload tab */}
      {tab === 'upload' && (
        <div className="max-w-2xl space-y-8">

          {/* ── BATCH UPLOAD ─────────────────────────────────── */}
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Batch Upload</h2>
            <p className="text-xs text-muted mb-5">Drop multiple beats at once. Set shared metadata below, then tweak individual fields per beat.</p>

            {/* Shared metadata */}
            <div className="rounded-xl border border-line-card bg-surface-2 p-4 space-y-4 mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Shared Metadata — applies to all beats</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">Genre</label>
                  <select value={sharedMeta.genre} onChange={(e) => setSharedMeta((m) => ({ ...m, genre: e.target.value }))}
                    className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted">
                    <option>Trap</option>
                    <option>Drill</option>
                    <option>R&B</option>
                    <option>Afrobeats</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">Subgenre</label>
                  <input value={sharedMeta.subgenre} onChange={(e) => setSharedMeta((m) => ({ ...m, subgenre: e.target.value }))}
                    className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="Dark Trap" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-mid mb-1.5">Tags (comma separated)</label>
                <input value={sharedMeta.tags} onChange={(e) => setSharedMeta((m) => ({ ...m, tags: e.target.value }))}
                  className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="dark, 808, hard" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">Default BPM</label>
                  <div className="flex gap-2">
                    <input type="number" value={sharedMeta.bpm} onChange={(e) => setSharedMeta((m) => ({ ...m, bpm: Number(e.target.value) }))}
                      className="flex-1 rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="140" />
                    <button type="button" onClick={() => applySharedToAll('bpm')}
                      className="rounded-xl border border-line-card bg-surface-1 px-3 py-2 text-xs text-muted-mid hover:border-muted hover:text-white transition-colors whitespace-nowrap">
                      Apply all
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">Default Key</label>
                  <div className="flex gap-2">
                    <input value={sharedMeta.key} onChange={(e) => setSharedMeta((m) => ({ ...m, key: e.target.value }))}
                      className="flex-1 rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="Am" />
                    <button type="button" onClick={() => applySharedToAll('key')}
                      className="rounded-xl border border-line-card bg-surface-1 px-3 py-2 text-xs text-muted-mid hover:border-muted hover:text-white transition-colors whitespace-nowrap">
                      Apply all
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-file drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setBatchDragOver(true) }}
              onDragLeave={() => setBatchDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setBatchDragOver(false)
                const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|flac|aif|aiff)$/i))
                if (files.length) handleBatchFiles(files)
              }}
              onClick={() => batchFileRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors mb-4 ${batchDragOver ? 'border-white/40 bg-white/5' : 'border-line-card bg-surface-1 hover:border-line-hover'}`}
            >
              <input ref={batchFileRef} type="file" accept="audio/*" multiple className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? [])
                  if (files.length) handleBatchFiles(files)
                  e.target.value = ''
                }}
              />
              <Upload size={20} className="mx-auto mb-2 text-muted" />
              <p className="text-sm text-muted-mid">Drop multiple audio files here or click to browse</p>
              <p className="text-xs text-muted-low mt-1">MP3, WAV, FLAC — previews auto-generated from first 30s</p>
            </div>

            {/* Beat queue */}
            {batchBeats.length > 0 && (
              <form onSubmit={handleBatchUpload} className="space-y-3">
                {batchBeats.map((b) => (
                  <div key={b.id} className={`rounded-xl border px-4 py-3 ${b.uploadStatus === 'done' ? 'border-promo/30 bg-promo/5' : b.uploadStatus === 'error' ? 'border-danger/30 bg-danger/5' : b.uploadStatus === 'uploading' ? 'border-line-hover bg-surface-1' : 'border-line-card bg-surface-1'}`}>
                    <div className="flex items-center gap-3 mb-2.5">
                      {/* Status indicator */}
                      <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                        {b.uploadStatus === 'done' && <Check size={14} className="text-promo" />}
                        {b.uploadStatus === 'error' && <span className="text-danger text-xs font-bold">!</span>}
                        {b.uploadStatus === 'uploading' && <RefreshCw size={12} className="text-muted-mid animate-spin" />}
                        {b.uploadStatus === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-muted-low block" />}
                      </div>
                      {/* Filename */}
                      <span className="text-[11px] text-muted truncate flex-1 min-w-0">{b.file.name}</span>
                      {/* Preview badge */}
                      {b.generatingPreview && <span className="text-[10px] text-muted shrink-0 flex items-center gap-1"><RefreshCw size={9} className="animate-spin" />Preview…</span>}
                      {!b.generatingPreview && b.autoPreview && <span className="text-[10px] text-promo shrink-0">Preview ✓</span>}
                      {/* Remove button */}
                      {b.uploadStatus !== 'uploading' && (
                        <button type="button" onClick={() => setBatchBeats((prev) => prev.filter((x) => x.id !== b.id))}
                          className="text-muted-low hover:text-foreground transition-colors shrink-0 text-xs">✕</button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1 sm:col-span-1">
                        <input value={b.title} onChange={(e) => setBatchBeats((prev) => prev.map((x) => x.id === b.id ? { ...x, title: e.target.value } : x))}
                          disabled={b.uploadStatus === 'uploading' || b.uploadStatus === 'done'}
                          className="w-full rounded-lg border border-line-card bg-surface-3 px-3 py-2 text-xs text-white outline-none focus:border-muted disabled:opacity-40 col-span-full sm:col-span-1"
                          placeholder="Title" />
                      </div>
                      <div>
                        <input type="number" value={b.bpm} onChange={(e) => setBatchBeats((prev) => prev.map((x) => x.id === b.id ? { ...x, bpm: Number(e.target.value) } : x))}
                          disabled={b.uploadStatus === 'uploading' || b.uploadStatus === 'done'}
                          className="w-full rounded-lg border border-line-card bg-surface-3 px-3 py-2 text-xs text-white outline-none focus:border-muted disabled:opacity-40"
                          placeholder="BPM" />
                      </div>
                      <div>
                        <input value={b.key} onChange={(e) => setBatchBeats((prev) => prev.map((x) => x.id === b.id ? { ...x, key: e.target.value } : x))}
                          disabled={b.uploadStatus === 'uploading' || b.uploadStatus === 'done'}
                          className="w-full rounded-lg border border-line-card bg-surface-3 px-3 py-2 text-xs text-white outline-none focus:border-muted disabled:opacity-40"
                          placeholder="Key" />
                      </div>
                    </div>

                    {b.errorMsg && <p className="mt-1.5 text-[11px] text-danger">{b.errorMsg}</p>}
                  </div>
                ))}

                <div className="flex items-center gap-3 pt-1">
                  <button type="submit" disabled={batchUploading || batchBeats.every((b) => b.uploadStatus === 'done')}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-black hover:bg-white-hover transition-colors disabled:opacity-50">
                    <Upload size={15} />
                    {batchUploading
                      ? `Uploading ${batchBeats.filter((b) => b.uploadStatus === 'uploading').length > 0 ? `(${batchBeats.findIndex((b) => b.uploadStatus === 'uploading') + 1}/${batchBeats.filter((b) => b.uploadStatus !== 'done').length})` : '…'}`
                      : `Upload ${batchBeats.filter((b) => b.uploadStatus === 'pending' || b.uploadStatus === 'error').length} Beat${batchBeats.filter((b) => b.uploadStatus === 'pending' || b.uploadStatus === 'error').length !== 1 ? 's' : ''}`}
                  </button>
                  <button type="button" onClick={() => setBatchBeats([])} disabled={batchUploading}
                    className="rounded-xl border border-line-card px-4 py-3.5 text-xs text-muted hover:border-line-hover hover:text-foreground transition-colors disabled:opacity-40">
                    Clear all
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── SINGLE UPLOAD (cover + stems) ────────────────── */}
          <details className="group">
            <summary className="cursor-pointer list-none flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground transition-colors">
              <span className="group-open:hidden">▸</span>
              <span className="hidden group-open:inline">▾</span>
              Single upload — use when adding cover art or stems
            </summary>

            <form onSubmit={handleAddBeat} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-mid mb-1.5">Title *</label>
                <input required value={newBeat.title} onChange={(e) => setNewBeat((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="Dark Intentions" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">BPM *</label>
                  <input required type="number" value={newBeat.bpm} onChange={(e) => setNewBeat((f) => ({ ...f, bpm: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="140" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">Key *</label>
                  <input required value={newBeat.key} onChange={(e) => setNewBeat((f) => ({ ...f, key: e.target.value }))}
                    className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="Am" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">Genre *</label>
                  <select required value={newBeat.genre} onChange={(e) => setNewBeat((f) => ({ ...f, genre: e.target.value }))}
                    className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted">
                    <option>Trap</option>
                    <option>Drill</option>
                    <option>R&B</option>
                    <option>Afrobeats</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">Subgenre</label>
                  <input value={newBeat.subgenre} onChange={(e) => setNewBeat((f) => ({ ...f, subgenre: e.target.value }))}
                    className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="Dark Trap" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-mid mb-1.5">Tags (comma separated)</label>
                <input value={newBeat.tags} onChange={(e) => setNewBeat((f) => ({ ...f, tags: e.target.value }))}
                  className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="dark, 808, hard" />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-mid mb-1.5">Beat File (MP3/WAV)</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver('beat') }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(null); const f = e.dataTransfer.files[0]; if (f) handleBeatFile(f) }}
                  onClick={() => fileRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${dragOver === 'beat' ? 'border-white/40 bg-white/5' : 'border-line-card bg-surface-1 hover:border-line-hover'}`}
                >
                  <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleBeatFile(e.target.files[0]) }} />
                  <Upload size={16} className="mx-auto mb-1.5 text-muted" />
                  <p className="text-xs text-muted-mid">{droppedBeat ? droppedBeat.name : 'Drop file here or click to browse'}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-mid mb-1.5">
                  Preview File (30s clip)
                  {autoPreview && <span className="ml-2 text-promo">· auto-generated ✓</span>}
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver('preview') }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(null); const f = e.dataTransfer.files[0]; if (f) { setDroppedPreview(f); setAutoPreview(false) } }}
                  onClick={() => previewRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${dragOver === 'preview' ? 'border-white/40 bg-white/5' : autoPreview ? 'border-promo/30 bg-promo/5 hover:border-promo/50' : 'border-line-card bg-surface-1 hover:border-line-hover'}`}
                >
                  <input ref={previewRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { setDroppedPreview(e.target.files[0]); setAutoPreview(false) } }} />
                  {generatingPreview
                    ? <><RefreshCw size={16} className="mx-auto mb-1.5 text-muted animate-spin" /><p className="text-xs text-muted">Generating 30s preview…</p></>
                    : <><Upload size={16} className="mx-auto mb-1.5 text-muted" /><p className="text-xs text-muted-mid">{droppedPreview ? droppedPreview.name : 'Drop file here or click to browse'}</p></>
                  }
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-mid mb-1.5">Cover Image (optional — replaces the genre square)</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver('cover') }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(null); const f = e.dataTransfer.files[0]; if (f) setDroppedCover(f) }}
                  onClick={() => coverRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${dragOver === 'cover' ? 'border-white/40 bg-white/5' : 'border-line-card bg-surface-1 hover:border-line-hover'}`}
                >
                  <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setDroppedCover(e.target.files[0]) }} />
                  <Upload size={16} className="mx-auto mb-1.5 text-muted" />
                  <p className="text-xs text-muted-mid">{droppedCover ? droppedCover.name : 'Drop file here or click to browse'}</p>
                </div>
                <p className="mt-1 text-[10px] text-muted-low">JPG, PNG, WEBP — will show in the beat list and player bar</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-mid mb-1.5">Stems (optional — ZIP file of all track stems)</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver('stems') }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(null); const f = e.dataTransfer.files[0]; if (f) setDroppedStems(f) }}
                  onClick={() => stemsRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${dragOver === 'stems' ? 'border-white/40 bg-white/5' : 'border-line-card bg-surface-1 hover:border-line-hover'}`}
                >
                  <input ref={stemsRef} type="file" accept=".zip,application/zip" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setDroppedStems(e.target.files[0]) }} />
                  <Upload size={16} className="mx-auto mb-1.5 text-muted" />
                  <p className="text-xs text-muted-mid">{droppedStems ? droppedStems.name : 'Drop file here or click to browse'}</p>
                </div>
                <p className="mt-1 text-[10px] text-muted-low">ZIP only — delivered automatically to customers who buy the Stems License</p>
              </div>

              {uploadMsg && (
                <p className={`text-sm ${uploadMsg.startsWith('Error') ? 'text-danger' : 'text-green-400'}`}>
                  {uploadMsg}
                </p>
              )}

              <button type="submit" disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 text-sm font-bold text-black hover:bg-white-hover transition-colors disabled:opacity-50 min-h-[52px]">
                <Upload size={16} />
                {uploading ? 'Uploading…' : 'Add Beat'}
              </button>
            </form>
          </details>
        </div>
      )}

      {/* Melody Packs tab */}
      {tab === 'melody-packs' && (
        <div className="space-y-6 max-w-3xl">
          {mpError && (
            <div className="flex items-center justify-between rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
              <span>{mpError}</span>
              <button onClick={() => setMpError(null)} className="ml-3 text-danger/60 hover:text-danger"><X size={14} /></button>
            </div>
          )}

          {/* Create new pack */}
          <div className="rounded-xl border border-line-card bg-surface-2 p-5">
            <h2 className="text-base font-bold text-white mb-4">Add Melody Pack</h2>
            <form onSubmit={handleMpCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">Title *</label>
                  <input required value={mpNewPack.title} onChange={(e) => setMpNewPack((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="Sentiments" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">Vendor</label>
                  <input value={mpNewPack.vendor} onChange={(e) => setMpNewPack((f) => ({ ...f, vendor: e.target.value }))}
                    className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="PRODKJBEATS" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">Price (USD) *</label>
                  <input required type="number" min="0" step="0.01" value={mpNewPack.price} onChange={(e) => setMpNewPack((f) => ({ ...f, price: e.target.value }))}
                    className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="25.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">Compare-at Price (sale)</label>
                  <input type="number" min="0" step="0.01" value={mpNewPack.compare_at_price} onChange={(e) => setMpNewPack((f) => ({ ...f, compare_at_price: e.target.value }))}
                    className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="42.00 (optional)" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-mid mb-1.5">Description</label>
                <input value={mpNewPack.description} onChange={(e) => setMpNewPack((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="Emotive sample bundle…" />
              </div>

              {/* Cover image upload */}
              <div>
                <label className="block text-xs font-medium text-muted-mid mb-1.5">Cover Image (JPG/PNG/WEBP)</label>
                <div
                  onClick={() => mpCoverRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-line-card bg-surface-1 px-4 py-4 text-center hover:border-line-hover transition-colors"
                >
                  <input ref={mpCoverRef} type="file" accept="image/*" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setMpUploading(true)
                      const result = await uploadMpFile(file, 'cover')
                      if (result?.publicUrl) setMpCoverUrl(result.publicUrl)
                      else setMpError('Cover upload failed')
                      setMpUploading(false)
                      e.target.value = ''
                    }}
                  />
                  <Upload size={16} className="mx-auto mb-1 text-muted" />
                  <p className="text-xs text-muted-mid">{mpCoverUrl ? '✓ Cover uploaded' : 'Click to upload cover art'}</p>
                </div>
              </div>

              {/* Pack file upload */}
              <div>
                <label className="block text-xs font-medium text-muted-mid mb-1.5">Pack File (ZIP — delivered to customer after purchase)</label>
                <div
                  onClick={() => mpFileRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-line-card bg-surface-1 px-4 py-4 text-center hover:border-line-hover transition-colors"
                >
                  <input ref={mpFileRef} type="file" accept=".zip,application/zip" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setMpUploading(true)
                      const result = await uploadMpFile(file, 'stems')
                      if (result?.path) setMpFilePath(result.path)
                      else setMpError('File upload failed')
                      setMpUploading(false)
                      e.target.value = ''
                    }}
                  />
                  <Upload size={16} className="mx-auto mb-1 text-muted" />
                  <p className="text-xs text-muted-mid">{mpFilePath ? '✓ File uploaded' : 'Click to upload ZIP file'}</p>
                </div>
              </div>

              {mpUploadMsg && <p className="text-sm text-green-400">{mpUploadMsg}</p>}

              <button type="submit" disabled={mpUploading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-black hover:bg-white-hover transition-colors disabled:opacity-50">
                <Upload size={15} />
                {mpUploading ? 'Uploading…' : 'Create Melody Pack'}
              </button>
            </form>
          </div>

          {/* Existing packs list */}
          {melodyPacks.length === 0 ? (
            <p className="text-center text-muted py-8">No melody packs yet.</p>
          ) : (
            <div className="space-y-2">
              {melodyPacks.map((pack) => (
                <div key={pack.id} className="rounded-xl border border-line-card bg-surface-1 px-4 py-3">
                  {mpEditId === pack.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input value={mpEditForm.title ?? pack.title} onChange={(e) => setMpEditForm((f) => ({ ...f, title: e.target.value }))}
                          className="rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none col-span-2" placeholder="Title" />
                        <input value={mpEditForm.vendor ?? pack.vendor} onChange={(e) => setMpEditForm((f) => ({ ...f, vendor: e.target.value }))}
                          className="rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none" placeholder="Vendor" />
                        <input value={mpEditForm.description ?? pack.description} onChange={(e) => setMpEditForm((f) => ({ ...f, description: e.target.value }))}
                          className="rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none" placeholder="Description" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-muted mb-1">Price (USD)</label>
                          <input type="number" min="0" step="0.01" value={mpEditForm.price ?? pack.price} onChange={(e) => setMpEditForm((f) => ({ ...f, price: Number(e.target.value) }))}
                            className="w-full rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted mb-1">Compare-at Price</label>
                          <input type="number" min="0" step="0.01"
                            value={mpEditForm.compare_at_price !== undefined ? (mpEditForm.compare_at_price ?? '') : (pack.compare_at_price ?? '')}
                            onChange={(e) => setMpEditForm((f) => ({ ...f, compare_at_price: e.target.value === '' ? null : Number(e.target.value) }))}
                            className="w-full rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none" placeholder="(none)" />
                        </div>
                      </div>

                      {/* Cover update */}
                      <div>
                        <label className="block text-[10px] text-muted mb-1">Cover Image</label>
                        <div onClick={() => mpEditCoverRef.current?.click()} className="cursor-pointer rounded-lg border border-dashed border-line-input px-3 py-2 text-center hover:border-muted">
                          <input ref={mpEditCoverRef} type="file" accept="image/*" className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]; if (!file) return
                              const result = await uploadMpFile(file, 'cover')
                              if (result?.publicUrl) setMpEditCoverUrl(result.publicUrl)
                              e.target.value = ''
                            }} />
                          <p className="text-xs text-muted-mid">{mpEditCoverUrl ? '✓ New cover uploaded' : 'Click to replace cover'}</p>
                        </div>
                      </div>

                      {/* File update */}
                      <div>
                        <label className="block text-[10px] text-muted mb-1">Pack File (ZIP)</label>
                        <div onClick={() => mpEditFileRef.current?.click()} className="cursor-pointer rounded-lg border border-dashed border-line-input px-3 py-2 text-center hover:border-muted">
                          <input ref={mpEditFileRef} type="file" accept=".zip,application/zip" className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]; if (!file) return
                              const result = await uploadMpFile(file, 'stems')
                              if (result?.path) setMpEditFilePath(result.path)
                              e.target.value = ''
                            }} />
                          <p className="text-xs text-muted-mid">{mpEditFilePath ? '✓ New file uploaded' : pack.file_path ? '✓ File on record — click to replace' : 'Click to upload ZIP'}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => handleMpSave(pack.id)} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-black hover:bg-white-hover transition-colors">
                          <Check size={13} /> Save
                        </button>
                        <button onClick={() => { setMpEditId(null); setMpEditForm({}); setMpEditCoverUrl(''); setMpEditFilePath('') }}
                          className="flex items-center gap-1.5 rounded-lg border border-line-input px-3 py-2 text-xs text-muted-mid hover:text-white transition-colors">
                          <X size={13} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {pack.cover_url && (
                        <Image src={pack.cover_url} alt="" width={40} height={40} className="rounded-md object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{pack.title}</p>
                        <p className="text-xs text-muted">
                          {pack.vendor} · ${pack.price.toFixed(2)}
                          {pack.compare_at_price ? ` (was $${pack.compare_at_price.toFixed(2)})` : ''}
                          {!pack.file_path && <span className="ml-2 text-amber-500">⚠ No file</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => handleMpToggle(pack)} title={pack.is_active ? 'Deactivate' : 'Activate'}
                          className="text-muted hover:text-white transition-colors">
                          {pack.is_active ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} />}
                        </button>
                        <button onClick={() => { setMpEditId(pack.id); setMpEditForm({ title: pack.title, vendor: pack.vendor, description: pack.description, price: pack.price, compare_at_price: pack.compare_at_price }) }}
                          className="text-muted hover:text-white transition-colors">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleMpDelete(pack.id)} className="text-muted-low hover:text-danger transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drum Packs tab */}
      {tab === 'drum-packs' && (
        <div className="space-y-6 max-w-3xl">
          {dpError && (
            <div className="flex items-center justify-between rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
              <span>{dpError}</span>
              <button onClick={() => setDpError(null)} className="ml-3 text-danger/60 hover:text-danger"><X size={14} /></button>
            </div>
          )}

          {/* Create new pack */}
          <div className="rounded-xl border border-line-card bg-surface-2 p-5">
            <h2 className="text-base font-bold text-white mb-4">Add Drum Pack</h2>
            <form onSubmit={handleDpCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">Title *</label>
                  <input required value={dpNewPack.title} onChange={(e) => setDpNewPack((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="808 Essentials" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">Vendor</label>
                  <input value={dpNewPack.vendor} onChange={(e) => setDpNewPack((f) => ({ ...f, vendor: e.target.value }))}
                    className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="PRODKJBEATS" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">Price (USD) *</label>
                  <input required type="number" min="0" step="0.01" value={dpNewPack.price} onChange={(e) => setDpNewPack((f) => ({ ...f, price: e.target.value }))}
                    className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="25.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-mid mb-1.5">Compare-at Price (sale)</label>
                  <input type="number" min="0" step="0.01" value={dpNewPack.compare_at_price} onChange={(e) => setDpNewPack((f) => ({ ...f, compare_at_price: e.target.value }))}
                    className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="42.00 (optional)" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-mid mb-1.5">Description</label>
                <input value={dpNewPack.description} onChange={(e) => setDpNewPack((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl border border-line-card bg-surface-1 px-4 py-3 text-sm text-white outline-none focus:border-muted" placeholder="Hard-hitting drum kit…" />
              </div>

              {/* Cover image upload */}
              <div>
                <label className="block text-xs font-medium text-muted-mid mb-1.5">Cover Image (JPG/PNG/WEBP)</label>
                <div
                  onClick={() => dpCoverRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-line-card bg-surface-1 px-4 py-4 text-center hover:border-line-hover transition-colors"
                >
                  <input ref={dpCoverRef} type="file" accept="image/*" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setDpUploading(true)
                      const result = await uploadMpFile(file, 'cover')
                      if (result?.publicUrl) setDpCoverUrl(result.publicUrl)
                      else setDpError('Cover upload failed')
                      setDpUploading(false)
                      e.target.value = ''
                    }}
                  />
                  <Upload size={16} className="mx-auto mb-1 text-muted" />
                  <p className="text-xs text-muted-mid">{dpCoverUrl ? '✓ Cover uploaded' : 'Click to upload cover art'}</p>
                </div>
              </div>

              {/* Pack file upload */}
              <div>
                <label className="block text-xs font-medium text-muted-mid mb-1.5">Pack File (ZIP — delivered to customer after purchase)</label>
                <div
                  onClick={() => dpFileRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-line-card bg-surface-1 px-4 py-4 text-center hover:border-line-hover transition-colors"
                >
                  <input ref={dpFileRef} type="file" accept=".zip,application/zip" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setDpUploading(true)
                      const result = await uploadMpFile(file, 'stems')
                      if (result?.path) setDpFilePath(result.path)
                      else setDpError('File upload failed')
                      setDpUploading(false)
                      e.target.value = ''
                    }}
                  />
                  <Upload size={16} className="mx-auto mb-1 text-muted" />
                  <p className="text-xs text-muted-mid">{dpFilePath ? '✓ File uploaded' : 'Click to upload ZIP file'}</p>
                </div>
              </div>

              {dpUploadMsg && <p className="text-sm text-green-400">{dpUploadMsg}</p>}

              <button type="submit" disabled={dpUploading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-black hover:bg-white-hover transition-colors disabled:opacity-50">
                <Upload size={15} />
                {dpUploading ? 'Uploading…' : 'Create Drum Pack'}
              </button>
            </form>
          </div>

          {/* Existing packs list */}
          {drumPacks.length === 0 ? (
            <p className="text-center text-muted py-8">No drum packs yet.</p>
          ) : (
            <div className="space-y-2">
              {drumPacks.map((pack) => (
                <div key={pack.id} className="rounded-xl border border-line-card bg-surface-1 px-4 py-3">
                  {dpEditId === pack.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input value={dpEditForm.title ?? pack.title} onChange={(e) => setDpEditForm((f) => ({ ...f, title: e.target.value }))}
                          className="rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none col-span-2" placeholder="Title" />
                        <input value={dpEditForm.vendor ?? pack.vendor} onChange={(e) => setDpEditForm((f) => ({ ...f, vendor: e.target.value }))}
                          className="rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none" placeholder="Vendor" />
                        <input value={dpEditForm.description ?? pack.description} onChange={(e) => setDpEditForm((f) => ({ ...f, description: e.target.value }))}
                          className="rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none" placeholder="Description" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-muted mb-1">Price (USD)</label>
                          <input type="number" min="0" step="0.01" value={dpEditForm.price ?? pack.price} onChange={(e) => setDpEditForm((f) => ({ ...f, price: Number(e.target.value) }))}
                            className="w-full rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted mb-1">Compare-at Price</label>
                          <input type="number" min="0" step="0.01"
                            value={dpEditForm.compare_at_price !== undefined ? (dpEditForm.compare_at_price ?? '') : (pack.compare_at_price ?? '')}
                            onChange={(e) => setDpEditForm((f) => ({ ...f, compare_at_price: e.target.value === '' ? null : Number(e.target.value) }))}
                            className="w-full rounded-lg border border-line-input bg-surface-3 px-3 py-2 text-sm text-white outline-none" placeholder="(none)" />
                        </div>
                      </div>

                      {/* Cover update */}
                      <div>
                        <label className="block text-[10px] text-muted mb-1">Cover Image</label>
                        <div onClick={() => dpEditCoverRef.current?.click()} className="cursor-pointer rounded-lg border border-dashed border-line-input px-3 py-2 text-center hover:border-muted">
                          <input ref={dpEditCoverRef} type="file" accept="image/*" className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]; if (!file) return
                              const result = await uploadMpFile(file, 'cover')
                              if (result?.publicUrl) setDpEditCoverUrl(result.publicUrl)
                              e.target.value = ''
                            }} />
                          <p className="text-xs text-muted-mid">{dpEditCoverUrl ? '✓ New cover uploaded' : 'Click to replace cover'}</p>
                        </div>
                      </div>

                      {/* File update */}
                      <div>
                        <label className="block text-[10px] text-muted mb-1">Pack File (ZIP)</label>
                        <div onClick={() => dpEditFileRef.current?.click()} className="cursor-pointer rounded-lg border border-dashed border-line-input px-3 py-2 text-center hover:border-muted">
                          <input ref={dpEditFileRef} type="file" accept=".zip,application/zip" className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]; if (!file) return
                              const result = await uploadMpFile(file, 'stems')
                              if (result?.path) setDpEditFilePath(result.path)
                              e.target.value = ''
                            }} />
                          <p className="text-xs text-muted-mid">{dpEditFilePath ? '✓ New file uploaded' : pack.file_path ? '✓ File on record — click to replace' : 'Click to upload ZIP'}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => handleDpSave(pack.id)} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-black hover:bg-white-hover transition-colors">
                          <Check size={13} /> Save
                        </button>
                        <button onClick={() => { setDpEditId(null); setDpEditForm({}); setDpEditCoverUrl(''); setDpEditFilePath('') }}
                          className="flex items-center gap-1.5 rounded-lg border border-line-input px-3 py-2 text-xs text-muted-mid hover:text-white transition-colors">
                          <X size={13} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {pack.cover_url && (
                        <Image src={pack.cover_url} alt="" width={40} height={40} className="rounded-md object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{pack.title}</p>
                        <p className="text-xs text-muted">
                          {pack.vendor} · ${pack.price.toFixed(2)}
                          {pack.compare_at_price ? ` (was $${pack.compare_at_price.toFixed(2)})` : ''}
                          {!pack.file_path && <span className="ml-2 text-amber-500">⚠ No file</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => handleDpToggle(pack)} title={pack.is_active ? 'Deactivate' : 'Activate'}
                          className="text-muted hover:text-white transition-colors">
                          {pack.is_active ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} />}
                        </button>
                        <button onClick={() => { setDpEditId(pack.id); setDpEditForm({ title: pack.title, vendor: pack.vendor, description: pack.description, price: pack.price, compare_at_price: pack.compare_at_price }) }}
                          className="text-muted hover:text-white transition-colors">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleDpDelete(pack.id)} className="text-muted-low hover:text-danger transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
