'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, ShoppingCart, Check, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePlayerStore, useCartStore, type Beat, type LicenseType } from '@/lib/store'
import { sharedAudioElement } from '@/lib/player-ref'
import ShareButton from './ShareButton'
import ExclusiveOfferForm from './ExclusiveOfferForm'
import { PRICES } from '@/lib/prices'
import { trackViewItem, trackAddToCart } from '@/lib/analytics'
import { getAnalyser } from '@/lib/audio-analyser'

type TierId = LicenseType | 'exclusive'

const TIERS: Array<{
  id: TierId
  name: string
  format: string
  price: string
  bullets: string[]
  tag?: string
  popular?: true
}> = [
  {
    id: 'standard',
    name: 'Basic Lease',
    format: 'MP3 (320kbps)',
    price: `$${PRICES.standard[1]}`,
    bullets: [
      '100k streams',
      '10k distribution copies',
      '1 music video',
      '2 radio stations',
      'Non-exclusive',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Lease',
    format: 'WAV (24-bit)',
    price: `$${PRICES.premium[1]}`,
    bullets: [
      '500k streams',
      '25k distribution copies',
      '1 music video',
      '5 radio stations',
      'Non-exclusive',
    ],
  },
  {
    id: 'unlimited',
    name: 'Unlimited Lease',
    format: 'WAV + Trackout Stems',
    price: `$${PRICES.unlimited[1]}`,
    bullets: [
      '1.5M streams',
      '75k distribution copies',
      'Unlimited music videos',
      'Unlimited radio / live',
      'Non-exclusive',
    ],
    popular: true,
  },
  {
    id: 'exclusive',
    name: 'Exclusive',
    format: 'WAV + Stems + MP3',
    price: '$500+',
    bullets: [
      'Unlimited streams',
      'Unlimited distribution',
      'Unlimited music videos',
      'Full performance rights',
      'Full exclusive ownership',
    ],
    tag: 'Contact us',
  },
]

const COMPARE_ROWS: Array<{ label: string; values: [string, string, string, string] }> = [
  { label: 'Format',       values: ['MP3 320kbps',  'WAV 24-bit',    'WAV + Stems',       'WAV + Stems + MP3']    },
  { label: 'Streams',      values: ['100k',          '500k',          '1.5M',              'Unlimited']            },
  { label: 'Distribution', values: ['10k copies',    '25k copies',    '75k copies',        'Unlimited']            },
  { label: 'Music Videos', values: ['1',             '1',             'Unlimited',         'Unlimited']            },
  { label: 'Performance',  values: ['2 stations',    '5 stations',    'Unlimited',         'Full rights']          },
  { label: 'Live Shows',   values: ['Unlimited',     'Unlimited',     'Unlimited',         'Unlimited']            },
  { label: 'Credit',       values: ['Required',      'Required',      'Required',          'Optional']             },
  { label: 'Ownership',    values: ['Non-exclusive', 'Non-exclusive', 'Non-exclusive',     'Full exclusive']       },
]

// Seeded PRNG so the same beat always gets the same static waveform shape
function seededBars(seed: string, count: number): number[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }
  return Array.from({ length: count }, (_, i) => {
    h = (Math.imul(31, h) + i) | 0
    h ^= h >>> 16
    h = Math.imul(h, 0x85ebca6b)
    h ^= h >>> 13
    h = Math.imul(h, 0xc2b2ae35)
    h ^= h >>> 16
    return 0.12 + ((h >>> 0) / 0xffffffff) * 0.78
  })
}

function BeatWaveform({
  beatId,
  progressPct,
  isPlaying,
}: {
  beatId: string
  progressPct: number
  isPlaying: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const progressRef = useRef(progressPct)
  const isPlayingRef = useRef(isPlaying)
  const liveDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const staticBars = useRef<number[]>([])
  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => { progressRef.current = progressPct }, [progressPct])
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])

  useEffect(() => {
    staticBars.current = seededBars(beatId, 140)

    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const CSS_H = 80

    function resize() {
      if (!canvas) return
      const w = canvas.offsetWidth
      if (!w) return
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(CSS_H * dpr)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const AR = 200, AG = 168, AB = 106 // --accent colour

    function draw() {
      const ctx = canvas!.getContext('2d')
      if (!ctx) { rafRef.current = requestAnimationFrame(draw); return }

      const W = canvas!.width
      const H = canvas!.height
      ctx.clearRect(0, 0, W, H)

      const bars = staticBars.current
      const BAR_W = Math.round(2 * dpr)
      const GAP   = Math.round(1.5 * dpr)
      const STEP  = BAR_W + GAP
      const numBars = Math.min(Math.floor(W / STEP), bars.length)
      const progressFrac = Math.min(progressRef.current / 100, 1)
      const playedCount  = Math.round(numBars * progressFrac)

      let liveData: Uint8Array<ArrayBuffer> | null = null
      if (!reducedMotion.current && isPlayingRef.current) {
        const analyser = getAnalyser()
        if (analyser) {
          const binCount = analyser.frequencyBinCount
          if (!liveDataRef.current || liveDataRef.current.length !== binCount) {
            liveDataRef.current = new Uint8Array(binCount)
          }
          analyser.getByteFrequencyData(liveDataRef.current)
          liveData = liveDataRef.current
        }
      }

      for (let i = 0; i < numBars; i++) {
        let v = bars[i]
        if (liveData) {
          const bin  = Math.floor((i / numBars) * liveData.length * 0.72)
          const live = liveData[bin] / 255
          v = Math.max(v * 0.45, live)
        }

        const barH = Math.round(v * H * 0.88)
        const x    = i * STEP
        const y    = Math.round((H - barH) / 2)

        ctx.fillStyle = i < playedCount
          ? `rgba(${AR},${AG},${AB},0.9)`
          : `rgba(255,255,255,${isPlayingRef.current ? 0.15 : 0.1})`
        ctx.fillRect(x, y, BAR_W, barH)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect() }
  }, [beatId])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="w-full block"
      style={{ height: '80px' }}
    />
  )
}

export default function BeatPageClient({ beat }: { beat: Beat }) {
  const { currentBeat, isPlaying, setCurrentBeat, togglePlay, setPlaying } = usePlayerStore()
  const { addBeat, isInCart, setLicenseType } = useCartStore()
  const [selectedTier, setSelectedTier] = useState<TierId>('standard')
  const [compareOpen, setCompareOpen] = useState(false)
  const [progress, setProgress] = useState(0)

  const isThisPlaying = currentBeat?.id === beat.id && isPlaying
  const inCart = isInCart(beat.id)
  const activeTierData = TIERS.find((t) => t.id === selectedTier)!

  useEffect(() => {
    trackViewItem({ id: beat.id, name: beat.title, category: beat.genre, price: PRICES.standard[1] })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Track audio progress for waveform fill
  useEffect(() => {
    const audio = sharedAudioElement.current
    if (!audio) return
    const onTime = () => {
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0
      setProgress(pct)
    }
    audio.addEventListener('timeupdate', onTime)
    return () => audio.removeEventListener('timeupdate', onTime)
  }, [])

  const formattedDate = beat.created_at
    ? new Date(beat.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  function handlePlay() {
    if (currentBeat?.id === beat.id) {
      togglePlay()
    } else {
      const audio = sharedAudioElement.current
      if (audio && beat.preview_url) {
        audio.src = beat.preview_url
        audio.play().catch(() => {})
      }
      setCurrentBeat(beat)
      setPlaying(true)
    }
  }

  function handleSelectTier(id: TierId) {
    setSelectedTier(id)
    if (id !== 'exclusive') setLicenseType(id)
  }

  function handleAddToCart() {
    if (inCart || selectedTier === 'exclusive') return
    const licenseId = selectedTier as LicenseType
    addBeat(beat)
    trackAddToCart({ id: beat.id, name: beat.title, category: beat.genre, price: PRICES[licenseId][1] })
  }

  return (
    <div className="w-full max-w-3xl px-4 py-8">
      <Link
        href="/store"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft size={13} /> Back to Store
      </Link>

      {/* ── Player card ──────────────────────────────────────────────── */}
      <div className="rounded-sm border border-line bg-surface-2 overflow-hidden">

        {/* Cover + info */}
        <div className="flex flex-col sm:flex-row gap-5 p-5">

          {/* Cover art with play overlay */}
          <div className="relative flex-shrink-0 w-full sm:w-36 h-36 rounded-sm overflow-hidden bg-black/50 group">
            {beat.cover_url ? (
              <Image
                src={beat.cover_url}
                alt={beat.title}
                fill
                sizes="144px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />
            )}
            <button
              onClick={handlePlay}
              disabled={!beat.preview_url}
              aria-label={isThisPlaying ? 'Pause preview' : 'Play preview'}
              className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/25 transition-[background-color] disabled:cursor-not-allowed"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-105 ${
                  isThisPlaying ? 'bg-white text-black' : 'bg-accent text-black'
                }`}
              >
                {isThisPlaying
                  ? <Pause size={20} fill="currentColor" aria-hidden="true" />
                  : <Play  size={20} fill="currentColor" aria-hidden="true" />}
              </span>
            </button>
          </div>

          {/* Title / meta / actions */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h1 className="text-xl font-black text-foreground leading-tight">{beat.title}</h1>
            <p className="mt-0.5 text-sm text-muted">PRODKJBEATS</p>

            {/* BPM · Key · Date */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span>
                <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-muted-low">BPM</span>
                {beat.bpm}
              </span>
              <span className="text-muted-low/40">·</span>
              <span>{beat.key}</span>
              {formattedDate && (
                <>
                  <span className="text-muted-low/40">·</span>
                  <span>{formattedDate}</span>
                </>
              )}
            </div>

            {/* Action row */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {selectedTier !== 'exclusive' && (
                <button
                  onClick={handleAddToCart}
                  disabled={inCart}
                  className={`inline-flex items-center gap-1.5 rounded-sm px-4 py-2 text-sm font-bold transition-colors ${
                    inCart
                      ? 'bg-white/10 text-muted-mid cursor-default'
                      : 'bg-accent text-black hover:brightness-110'
                  }`}
                >
                  {inCart
                    ? <><Check size={13} aria-hidden="true" /> Added</>
                    : <><ShoppingCart size={13} aria-hidden="true" /> {activeTierData.price}</>}
                </button>
              )}
              <ShareButton beatId={beat.id} />
              {beat.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/[0.08] px-3 py-1 text-[11px] font-medium text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Waveform */}
        <div className="border-t border-white/[0.04] px-4 py-4">
          <BeatWaveform beatId={beat.id} progressPct={progress} isPlaying={isThisPlaying} />
        </div>
      </div>

      {/* ── License section ──────────────────────────────────────────── */}
      <div className="mt-6">
        <p id="license-picker-label" className="mb-3 text-[10px] font-normal uppercase tracking-[0.12em] text-muted-low">
          Select License
        </p>
        <div role="radiogroup" aria-labelledby="license-picker-label" className="grid grid-cols-2 gap-2 mb-3">
          {TIERS.map((tier) => {
            const isSelected = selectedTier === tier.id
            return (
              <button
                key={tier.id}
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectTier(tier.id)}
                className={`relative text-left rounded-sm border p-3 transition-[border-color,background-color] ${
                  isSelected
                    ? 'border-white/40 bg-white/[0.07]'
                    : 'border-white/[0.08] hover:border-white/20'
                }`}
              >
                {(tier.popular || tier.tag) && (
                  <span
                    className={`absolute top-2 right-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      tier.popular ? 'bg-white text-black' : 'bg-white/10 text-muted'
                    }`}
                  >
                    {tier.popular ? 'Popular' : tier.tag}
                  </span>
                )}
                <p className="text-[11px] font-semibold text-foreground pr-14">{tier.name}</p>
                <p className="text-[10px] text-muted mb-1.5">{tier.format}</p>
                <p className="text-base font-bold text-foreground mb-2">{tier.price}</p>
                <ul className="space-y-1">
                  {tier.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-1.5 text-[10px] text-muted leading-tight">
                      <Check
                        size={10}
                        className={`mt-px flex-shrink-0 ${isSelected ? 'text-white/70' : 'text-muted-low'}`}
                        aria-hidden="true"
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        {/* Compare toggle */}
        <button
          onClick={() => setCompareOpen((v) => !v)}
          aria-expanded={compareOpen}
          className="mb-3 flex items-center gap-1.5 text-[11px] text-muted hover:text-foreground transition-colors"
        >
          {compareOpen ? <ChevronUp size={11} aria-hidden="true" /> : <ChevronDown size={11} aria-hidden="true" />}
          Compare all licenses
        </button>

        {compareOpen && (
          <div className="mb-4 rounded-sm border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[480px]">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th scope="col" className="py-2 px-3 text-left text-[9px] font-normal uppercase tracking-[0.1em] text-muted-low w-[22%]">
                      Feature
                    </th>
                    {TIERS.map((t) => (
                      <th
                        key={t.id}
                        scope="col"
                        aria-label={t.name}
                        className={`py-2 px-2 text-center text-[9px] font-semibold uppercase tracking-[0.08em] w-[19%] ${
                          selectedTier === t.id ? 'text-foreground' : 'text-muted-low'
                        }`}
                      >
                        {t.id === 'standard' ? 'Basic' : t.id === 'premium' ? 'Prem' : t.id === 'unlimited' ? 'Unlim' : 'Excl'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, i) => (
                    <tr
                      key={row.label}
                      className="border-b border-white/[0.04] last:border-0"
                      style={{ background: i % 2 !== 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}
                    >
                      <td className="py-2 px-3 text-[10px] text-muted-low">{row.label}</td>
                      {row.values.map((val, idx) => (
                        <td
                          key={idx}
                          className={`py-2 px-2 text-center text-[11px] font-medium ${
                            selectedTier === TIERS[idx].id ? 'text-foreground' : 'text-muted'
                          }`}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <td className="py-2.5 px-3 text-[9px] uppercase tracking-[0.1em] text-muted-low">Price</td>
                    {TIERS.map((t) => (
                      <td key={t.id} className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                            selectedTier === t.id ? 'bg-white text-black' : 'text-muted'
                          }`}
                        >
                          {t.price}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 border-t border-white/[0.06] flex justify-end">
              <Link href="/licensing" className="text-[10px] text-muted hover:text-foreground transition-colors">
                Full licensing details →
              </Link>
            </div>
          </div>
        )}

        {/* CTA */}
        {selectedTier !== 'exclusive' ? (
          <button
            onClick={handleAddToCart}
            disabled={inCart}
            className={`w-full flex items-center justify-center gap-2 rounded-sm px-5 py-3.5 text-sm font-bold transition-colors ${
              inCart
                ? 'bg-white/10 text-muted-mid cursor-default'
                : 'bg-white text-black hover:bg-white-hover'
            }`}
          >
            {inCart
              ? <><Check size={15} aria-hidden="true" /> Added to Cart</>
              : <><ShoppingCart size={15} aria-hidden="true" /> Add to Cart — {activeTierData.price}</>}
          </button>
        ) : (
          <>
            <div className="mb-4 rounded-sm border border-white/[0.1] bg-white/[0.03] p-4">
              <p className="text-[10px] font-normal uppercase tracking-[0.1em] text-muted-low mb-1">
                Exclusive Rights
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Purchasing exclusive rights removes this beat from the store and transfers full ownership to you. Contact us below to discuss terms and pricing.
              </p>
            </div>
            <ExclusiveOfferForm beatId={beat.id} beatTitle={beat.title} />
          </>
        )}
      </div>
    </div>
  )
}
