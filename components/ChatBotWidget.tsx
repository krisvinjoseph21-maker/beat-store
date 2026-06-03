'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { usePlayerStore } from '@/lib/store'

// ── Types ──────────────────────────────────────────────────────────────────

type Message = { role: 'bot' | 'user'; text: string; id: number }

// ── Knowledge base ─────────────────────────────────────────────────────────

const QA: Array<{ kw: string[]; answer: string }> = [
  {
    kw: ['license', 'licenses', 'types', 'tiers', 'options', 'plans', 'available'],
    answer:
      'We have 4 license options:\n• **Basic Lease** — from $39.95 (MP3, 100K streams)\n• **Premium Lease** — from $49.95 (WAV, 500K streams)\n• **Unlimited Lease** — from $149.95 (WAV + Stems, 1.5M streams)\n• **Exclusive** — $500+ (full exclusive rights)\n\nAll leases are non-exclusive. [View full comparison →](/licensing)',
  },
  {
    kw: ['price', 'prices', 'cost', 'how much', 'pricing', 'cheap', 'fee', 'bundle', 'deal', '$', 'dollar'],
    answer:
      'Current pricing:\n• Basic — **$39.95** each / 3 for $80 / 5 for $160\n• Premium — **$49.95** each / 3 for $100 / 5 for $200\n• Unlimited — **$149.95** each / 3 for $300 / 5 for $600\n• Exclusive — **$500+** (contact us)\n\nBundle packs give the best value per beat.',
  },
  {
    kw: ['file', 'files', 'format', 'formats', 'mp3', 'wav', 'stem', 'stems', 'trackout', 'receive', 'included'],
    answer:
      'Files included per license:\n• Basic — MP3 (320kbps)\n• Premium — WAV (24-bit)\n• Unlimited — WAV + full trackout stems\n• Exclusive — WAV + Stems + MP3\n\nYour download link arrives by email instantly after purchase.',
  },
  {
    kw: ['non-exclusive', 'nonexclusive', 'what is non', 'still sell', 'sell to others', 'other artists'],
    answer:
      'Non-exclusive means **KJYOUCRAZY can still lease the same beat to other artists**. Your license gives you full use rights within your tier limits, but the beat stays in the store.\n\nWant to be the only one with it? Buy the **Exclusive** license.',
  },
  {
    kw: ['exclusive', 'buyout', 'buy out', 'full rights', 'ownership', 'own the beat'],
    answer:
      'Yes — exclusive rights start at **$500+**. With an exclusive:\n• Beat is removed from the store permanently\n• Full exclusive ownership\n• Unlimited streams, copies, and music videos\n• WAV + Stems + MP3 included\n\nContact us on the [About page](/about) to check availability.',
  },
  {
    kw: ['youtube', 'spotify', 'soundcloud', 'apple music', 'streaming', 'stream', 'monetize', 'monetization', 'dsp', 'tidal'],
    answer:
      'All leases allow streaming on every major platform — Spotify, Apple Music, YouTube, SoundCloud, and more.\n\nStream limits:\n• Basic — 100K streams\n• Premium — 500K streams\n• Unlimited — 1.5M streams\n\nYouTube monetization is included in all tiers. Credit **Prod. KJYOUCRAZY** in your descriptions.',
  },
  {
    kw: ['credit', 'credits', 'producer tag', 'attribute', 'mention', 'prod.'],
    answer:
      'Credit is required on all leased beats. Use **"Prod. KJYOUCRAZY"** in:\n• Song title — e.g. "Song Name (Prod. KJYOUCRAZY)"\n• YouTube and social video descriptions\n• Streaming platform song credits\n\nNo credit required on exclusive purchases.',
  },
  {
    kw: ['refund', 'return', 'money back', 'cancel', 'policy'],
    answer:
      'All sales are **final** — digital files cannot be returned. If there is an issue with your order (wrong file, missing link), reach out and we will fix it right away.',
  },
  {
    kw: ['download', 're-download', 'redownload', 'access', 'lost', 'account', 'purchases', 'link expired'],
    answer:
      'Your download link arrives by email right after payment and is valid for 48 hours. You can re-download any time by logging into your account at **kjyoucrazy.com/purchases**.',
  },
  {
    kw: ['radio', 'broadcast', 'broadcasting', 'station', 'fm'],
    answer:
      'Radio broadcasting limits:\n• Basic — up to 2 stations\n• Premium — up to 5 stations\n• Unlimited & Exclusive — unlimited stations',
  },
  {
    kw: ['music video', 'video', 'visual', 'film', 'shoot', 'mv', 'sync'],
    answer:
      'Music video rights:\n• Basic & Premium — 1 music video\n• Unlimited & Exclusive — unlimited music videos\n\nTV / film sync requires an exclusive license.',
  },
  {
    kw: ['live', 'performance', 'perform', 'concert', 'show', 'tour', 'gig', 'stage'],
    answer:
      '**Unlimited live performances** are included with every license — Basic, Premium, Unlimited, and Exclusive. No cap on shows or tours.',
  },
  {
    kw: ['distribution', 'distribute', 'copies', 'units', 'sold', 'physical'],
    answer:
      'Distribution limits:\n• Basic — 10,000 copies\n• Premium — 25,000 copies\n• Unlimited — 75,000 copies\n• Exclusive — Unlimited\n\nExpecting big numbers? Upgrade to the next tier.',
  },
  {
    kw: ['custom', 'custom beat', 'make a beat', 'beat for me', 'commission'],
    answer:
      'Custom beat production is available. Head to the [Services page](/services) or reach out on the [About page](/about) to discuss your vision, budget, and turnaround time.',
  },
  {
    kw: ['mixing', 'mastering', 'master', 'audio engineering', 'engineer'],
    answer:
      'Professional mixing & mastering services are available. Check out the [Mixing & Mastering page](/services/mixing-mastering) for details and pricing.',
  },
  {
    kw: ['contact', 'reach', 'email', 'message', 'talk', 'inquiry', 'get in touch', 'hit up'],
    answer:
      'The best way to reach us is through the [Contact / About page](/about). For exclusive beat or custom production inquiries, that is the place to start — we respond quickly.',
  },
  {
    kw: ['hello', 'hey', 'sup', 'help', 'yo', 'what can'],
    answer:
      'Hey! Ask me anything about licensing, prices, file formats, or downloads — I am here to help.',
  },
]

const FALLBACK =
  'Good question. For anything not listed here, the [Contact page](/about) is the fastest way to get an answer — we respond quickly.'

const QUICK_CHIPS = [
  'What licenses do you offer?',
  'How much do beats cost?',
  'What files do I get?',
  'Can I use on Spotify/YouTube?',
  'Do you offer exclusives?',
  'Refund policy?',
]

const GREETING =
  'Hey! Ask me about licensing, prices, file formats, downloads, or anything else — I am here to help.'

// ── Inline text renderer ───────────────────────────────────────────────────
// Handles **bold** and [text](url) within a single line of text.

function parseInline(text: string, lineKey: string): React.ReactNode {
  const pattern = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g
  const nodes: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1]) {
      nodes.push(
        <strong key={`${lineKey}-b${m.index}`} className="font-semibold text-foreground">
          {m[1]}
        </strong>,
      )
    } else {
      nodes.push(
        <a
          key={`${lineKey}-a${m.index}`}
          href={m[3]}
          className="underline underline-offset-2 text-accent hover:opacity-80 transition-opacity"
        >
          {m[2]}
        </a>,
      )
    }
    last = pattern.lastIndex
  }
  if (last < text.length) nodes.push(text.slice(last))
  return <>{nodes}</>
}

function BotText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="text-[13px] leading-[1.65] text-muted">
      {lines.map((line, i) => {
        if (line.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-2 pl-0.5 mt-1.5 first:mt-0">
              <span className="text-muted-low shrink-0 select-none">•</span>
              <span>{parseInline(line.slice(2), String(i))}</span>
            </div>
          )
        }
        if (line === '') return <div key={i} className="h-3" />
        return (
          <div key={i} className={i > 0 ? 'mt-1.5' : ''}>
            {parseInline(line, String(i))}
          </div>
        )
      })}
    </div>
  )
}

// ── Main widget ────────────────────────────────────────────────────────────

let _msgId = 0
const nextId = () => ++_msgId

function findAnswer(input: string): string {
  const lower = input.toLowerCase()
  for (const qa of QA) {
    if (qa.kw.some((kw) => lower.includes(kw))) return qa.answer
  }
  return FALLBACK
}

export default function ChatBotWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: GREETING, id: nextId() },
  ])
  const [input, setInput] = useState('')
  const [chipsShown, setChipsShown] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const currentBeat = usePlayerStore((s) => s.currentBeat)
  const playerActive = !!currentBeat

  useEffect(() => {
    if (!open) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [open, messages.length])

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const first = panel.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key !== 'Tab') return
      const focusable = Array.from(panel!.querySelectorAll<HTMLElement>(FOCUSABLE))
      const firstEl = focusable[0]
      const lastEl  = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === firstEl) { e.preventDefault(); lastEl?.focus() }
      } else {
        if (document.activeElement === lastEl) { e.preventDefault(); firstEl?.focus() }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      triggerRef.current?.focus()
    }
  }, [open])

  const send = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setChipsShown(false)
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: trimmed, id: nextId() },
      { role: 'bot', text: findAnswer(trimmed), id: nextId() },
    ])
    setInput('')
  }, [])

  const bottomOffset = playerActive ? 'calc(64px + 14px)' : '16px'

  return (
    <div
      className="fixed right-4 z-40 flex flex-col items-end gap-3"
      style={{ bottom: bottomOffset, transition: 'bottom 200ms ease' }}
    >
      {/* Chat panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Chat support"
          className="w-[320px] flex flex-col rounded-2xl border border-white/[0.1] bg-surface-3 shadow-2xl overflow-hidden"
          style={{ height: playerActive ? 'min(460px, calc(100dvh - 182px))' : 'min(460px, calc(100dvh - 120px))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06] bg-surface-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-accent shrink-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-black leading-none">KJ</span>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-foreground leading-none">KJYOUCRAZY</p>
                <p className="text-[10px] text-muted-low mt-[3px]">Licensing & Beat Support</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-muted-low hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/[0.06]"
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[86%] rounded-2xl px-4 py-3 ${
                    m.role === 'user'
                      ? 'bg-white/[0.07] text-[13px] leading-[1.55] text-foreground'
                      : 'bg-surface-1 border border-white/[0.06]'
                  }`}
                >
                  {m.role === 'bot' ? <BotText text={m.text} /> : m.text}
                </div>
              </div>
            ))}

            {/* Quick-reply chips */}
            {chipsShown && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => send(chip)}
                    className="text-[11px] px-3 py-2 rounded-full border border-white/[0.1] bg-white/[0.03] text-muted hover:border-white/25 hover:text-foreground hover:bg-white/[0.06] transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="shrink-0 px-3 pb-3 pt-2 border-t border-white/[0.06]">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className="flex items-center gap-2 bg-surface-1 border border-white/[0.08] rounded-full px-3.5 py-2 focus-within:border-white/[0.18] transition-colors"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                aria-label="Ask a question"
                className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-low outline-none min-w-0"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send"
                className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0 disabled:opacity-30 hover:opacity-80 active:scale-95 transition-[opacity,transform]"
              >
                <Send size={11} strokeWidth={2.5} className="text-black" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Chat with us'}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-[opacity,transform]"
      >
        {open ? (
          <X size={18} className="text-black" />
        ) : (
          <MessageCircle size={20} className="text-black" />
        )}
      </button>
    </div>
  )
}
