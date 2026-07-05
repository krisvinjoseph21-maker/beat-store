'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Globe } from 'lucide-react'
import { useLocaleStore, type Currency, type Language } from '@/lib/locale'
import { useT } from '@/lib/i18n'
import { useIsMounted } from '@/lib/use-mounted'

const CURRENCIES: { code: Currency; label: string }[] = [
  { code: 'USD', label: 'USD – US Dollar' },
  { code: 'CAD', label: 'CAD – Canadian Dollar' },
  { code: 'GBP', label: 'GBP – British Pound' },
]

const LANGUAGES: { code: Language; native: string }[] = [
  { code: 'en', native: 'English' },
  { code: 'es', native: 'Español' },
  { code: 'fr', native: 'Français' },
]

export default function LocaleSwitcher() {
  const { currency, language, setCurrency, setLanguage } = useLocaleStore()
  const t = useT()
  const [open, setOpen] = useState(false)
  const mounted = useIsMounted()
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { close(); triggerRef.current?.focus(); return }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
        if (!items.length) return
        const idx = items.indexOf(document.activeElement as HTMLElement)
        const next = e.key === 'ArrowDown'
          ? items[(idx + 1) % items.length]
          : items[(idx - 1 + items.length) % items.length]
        next?.focus()
      }
    }
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-label={`${mounted ? currency : 'USD'} — change language or currency`}
        aria-expanded={open}
        aria-haspopup="menu"
        className="h-11 inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-foreground transition-colors"
      >
        <Globe size={13} aria-hidden="true" />
        <span>{mounted ? currency : 'USD'}</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Language and currency"
          className="absolute top-full right-0 mt-3 w-56 glass border border-border-soft py-3 z-[150]"
        >
          {/* Language */}
          <div className="px-4 pb-2">
            <p className="text-[10px] font-semibold uppercase text-muted-low mb-2" style={{ letterSpacing: '0.12em' }}>
              {t.locale.language}
            </p>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                role="menuitem"
                onClick={() => { setLanguage(lang.code); close() }}
                className={`w-full flex items-center justify-between px-2 py-1.5 text-[12px] rounded-sm transition-colors ${
                  language === lang.code ? 'text-foreground' : 'text-muted hover:text-foreground'
                }`}
              >
                <span>{lang.native}</span>
                {language === lang.code && <Check size={11} aria-hidden="true" />}
              </button>
            ))}
          </div>

          <div className="border-t border-border-subtle mx-2 my-2" />

          {/* Currency */}
          <div className="px-4 pt-1">
            <p className="text-[10px] font-semibold uppercase text-muted-low mb-2" style={{ letterSpacing: '0.12em' }}>
              {t.locale.currency}
            </p>
            {CURRENCIES.map((cur) => (
              <button
                key={cur.code}
                role="menuitem"
                onClick={() => { setCurrency(cur.code); close() }}
                className={`w-full flex items-center justify-between px-2 py-1.5 text-[12px] rounded-sm transition-colors ${
                  currency === cur.code ? 'text-foreground' : 'text-muted hover:text-foreground'
                }`}
              >
                <span>{cur.label}</span>
                {currency === cur.code && <Check size={11} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
