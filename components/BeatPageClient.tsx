'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, ShoppingCart, Check, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { usePlayerStore, useCartStore, type Beat, type LicenseType } from '@/lib/store'
import { sharedAudioElement } from '@/lib/player-ref'
import ShareButton from './ShareButton'
import ExclusiveOfferForm from './ExclusiveOfferForm'
import { GENRE_COLORS, GENRE_COLOR_FALLBACK } from '@/lib/genre-colors'
import { PRICES } from '@/lib/prices'
import { trackViewItem, trackAddToCart } from '@/lib/analytics'

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

export default function BeatPageClient({ beat }: { beat: Beat }) {
  const { currentBeat, isPlaying, setCurrentBeat, togglePlay, setPlaying } = usePlayerStore()
  const { addBeat, isInCart, setLicenseType } = useCartStore()
  const [selectedTier, setSelectedTier] = useState<TierId>('standard')
  const [compareOpen, setCompareOpen] = useState(false)

  const isThisPlaying = currentBeat?.id === beat.id && isPlaying
  const inCart = isInCart(beat.id)

  useEffect(() => {
    trackViewItem({ id: beat.id, name: beat.title, category: beat.genre, price: PRICES.standard[1] })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const genreBg = GENRE_COLORS[beat.genre] ?? GENRE_COLOR_FALLBACK
  const activeTierData = TIERS.find((t) => t.id === selectedTier)!

  function handlePlay() {
    if (currentBeat?.id === beat.id) {
      togglePlay()
    } else {
      // Call audio.src + play() synchronously within the gesture context (iOS Safari requirement).
      // BottomPlayer's useEffect detects the already-playing src and skips the re-load.
      const audio = sharedAudioElement.current
      if (audio && beat.preview_url) {
        audio.src = beat.preview_url
        audio.play().catch(() => {})
      }
      setCurrentBeat(beat)
      setPlaying(true)  // bug fix: was missing, so clicking play on this page never started playback
    }
  }

  function handleSelectTier(id: TierId) {
    setSelectedTier(id)
    if (id !== 'exclusive') setLicenseType(id)
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <Link
        href="/store"
        className="mb-8 inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft size={13} /> Back to Store
      </Link>

      <div className="rounded-sm border border-line bg-surface-2 overflow-hidden">
        {/* Artwork banner */}
        <div className={`${genreBg} h-40 flex items-center justify-center select-none`}>
          <span className="text-4xl font-black text-foreground/20 uppercase tracking-widest">
            {beat.genre}
          </span>
        </div>

        <div className="p-6">
          {/* Title + meta */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-foreground leading-tight">{beat.title}</h1>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                <span>{beat.bpm} BPM</span>
                <span>·</span>
                <span>{beat.key}</span>
                <span>·</span>
                <span>{beat.genre}{beat.subgenre ? ` / ${beat.subgenre}` : ''}</span>
              </div>
            </div>
            <ShareButton beatId={beat.id} />
          </div>

          {beat.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-1.5">
              {beat.tags.map((tag) => (
                <span key={tag} className="rounded bg-white/5 px-2 py-1 text-xs text-muted">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Play */}
          <div className="mb-6">
            <button
              onClick={handlePlay}
              disabled={!beat.preview_url}
              aria-label={isThisPlaying ? 'Pause preview' : 'Play preview'}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black hover:bg-white-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isThisPlaying
                ? <Pause size={18} fill="black" aria-hidden="true" />
                : <Play size={18} fill="black" aria-hidden="true" />}
            </button>
          </div>

          {/* ── License picker ──────────────────────────────────── */}
          <p className="mb-2.5 text-[10px] font-normal uppercase tracking-[0.12em] text-muted-low">
            Select License
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {TIERS.map((tier) => {
              const isSelected = selectedTier === tier.id
              return (
                <button
                  key={tier.id}
                  onClick={() => handleSelectTier(tier.id)}
                  aria-pressed={isSelected}
                  className={`relative text-left rounded-sm border p-3 transition-[border-color,background-color] ${
                    isSelected
                      ? 'border-white/40 bg-white/[0.07]'
                      : 'border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {(tier.popular || tier.tag) && (
                    <span className={`absolute top-2 right-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${tier.popular ? 'bg-white text-black' : 'bg-white/10 text-muted'}`}>
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

          {/* Inline comparison table */}
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

                    {/* Price row */}
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <td className="py-2.5 px-3 text-[9px] uppercase tracking-[0.1em] text-muted-low">Price</td>
                      {TIERS.map((t) => (
                        <td key={t.id} className="py-2.5 px-2 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                              selectedTier === t.id
                                ? 'bg-white text-black'
                                : 'text-muted'
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
                <Link
                  href="/licensing"
                  className="text-[10px] text-muted hover:text-foreground transition-colors"
                >
                  Full licensing details →
                </Link>
              </div>
            </div>
          )}

          {/* ── CTA ─────────────────────────────────────────────── */}
          {selectedTier !== 'exclusive' ? (
            <button
              onClick={() => {
                if (inCart) return
                const licenseId = selectedTier as LicenseType
                addBeat(beat)
                trackAddToCart({ id: beat.id, name: beat.title, category: beat.genre, price: PRICES[licenseId][1] })
              }}
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
    </div>
  )
}
