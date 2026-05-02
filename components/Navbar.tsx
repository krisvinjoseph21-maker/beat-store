'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/lib/store'
import CartDrawer from './CartDrawer'
import NavAuthButton from './NavAuthButton'
import LocaleSwitcher from './LocaleSwitcher'
import { ChevronDown } from 'lucide-react'
import { useT } from '@/lib/i18n'

type NavChild = { href: string; label: string }
type NavLink  = { href: string; label: string; children?: NavChild[] }

const NAV_LINKS: NavLink[] = [
  { href: '/store',    label: 'Beats'    },
  { href: '/services', label: 'Services', children: [
    { href: '/services/custom-beats',     label: 'Custom Beats'      },
    { href: '/services/mixing-mastering', label: 'Mixing & Mastering' },
  ]},
  { href: '/sample-packs', label: 'Sample Packs', children: [
    { href: '/sample-packs/melody-packs',             label: 'Melody Packs'            },
    { href: '/sample-packs/weekly-loop-subscription', label: 'Weekly Loop Subscription' },
    { href: '/sample-packs/drum-kits',                label: 'Drum Kits'               },
  ]},
  { href: '/licensing', label: 'Licensing' },
  { href: '/about',     label: 'Contact'   },
]

function DropdownMenu({ link, pathname }: { link: NavLink & { children: NavChild[] }; pathname: string }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))

  const close = useCallback(() => setOpen(false), [])

  const NAV_LABEL_MAP = useMemo<Record<string, string>>(() => ({
    '/services': t.nav.services,
    '/services/custom-beats': t.nav.customBeats,
    '/services/mixing-mastering': t.nav.mixingMastering,
    '/sample-packs': t.nav.samplePacks,
    '/sample-packs/melody-packs': t.nav.melodyPacks,
    '/sample-packs/weekly-loop-subscription': t.nav.loopSubscription,
    '/sample-packs/drum-kits': t.nav.drumKits,
  }), [t])

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
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, close])

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        id={`nav-trigger${link.href.replaceAll('/', '-')}`}
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-0.5 text-[12px] transition-colors duration-150 ${active ? 'text-foreground font-medium' : 'font-normal text-muted hover:text-foreground'}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {NAV_LABEL_MAP[link.href] ?? link.label}
        <ChevronDown
          size={10}
          className={`mt-px transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
        {active && (
          <span className="absolute -bottom-[14px] left-0 right-0 h-px bg-foreground/40" />
        )}
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-labelledby={`nav-trigger${link.href.replaceAll('/', '-')}`}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-44 glass border border-white/[0.08] py-1"
        >
          {link.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              role="menuitem"
              onClick={close}
              className={`block px-4 py-2 text-[12px] transition-colors duration-100 ${pathname.startsWith(child.href) ? 'text-foreground font-medium' : 'text-muted hover:text-foreground'}`}
            >
              {NAV_LABEL_MAP[child.href] ?? child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { items, cartOpen, openCart, closeCart } = useCartStore()
  const t = useT()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileOpenRef = useRef(false)
  const [scrolled, setScrolled]     = useState(false)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const [cartAnnouncement, setCartAnnouncement] = useState('')
  const pathname = usePathname()

  const NAV_LABEL_MAP = useMemo<Record<string, string>>(() => ({
    '/store': t.nav.beats,
    '/services': t.nav.services,
    '/services/custom-beats': t.nav.customBeats,
    '/services/mixing-mastering': t.nav.mixingMastering,
    '/sample-packs': t.nav.samplePacks,
    '/sample-packs/melody-packs': t.nav.melodyPacks,
    '/sample-packs/weekly-loop-subscription': t.nav.loopSubscription,
    '/sample-packs/drum-kits': t.nav.drumKits,
    '/licensing': t.nav.licensing,
    '/about': t.nav.contact,
  }), [t])

  useEffect(() => {
    if (items.length === 0) return
    setCartAnnouncement(`${items.length} item${items.length === 1 ? '' : 's'} in cart`)
  }, [items.length])

  useEffect(() => { mobileOpenRef.current = mobileOpen }, [mobileOpen])

  useEffect(() => {
    if (!mobileOpen) return
    const frame = requestAnimationFrame(() => {
      const menu = document.getElementById('mobile-nav-menu')
      menu?.querySelector<HTMLElement>('a, button')?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [mobileOpen])

  useEffect(() => {
    let lastScrollY = window.scrollY
    function onScroll() {
      const y = window.scrollY
      setScrolled(y > 10)
      if (mobileOpenRef.current && y > lastScrollY + 8) setMobileOpen(false)
      lastScrollY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav
        aria-label="Main navigation"
        className={`fixed top-0 left-0 right-0 z-[100] transition-[background,border-color,backdrop-filter] duration-300 ${
          scrolled ? 'glass border-b border-white/[0.06]' : 'bg-transparent'
        }`}
        style={{ height: '48px', fontFamily: 'var(--font-inter)' }}
      >
        <div className="mx-auto flex h-full w-full max-w-6xl items-center gap-4 px-6 sm:px-10 lg:px-16">

          {/* Logo */}
          <Link
            href="/"
            className="text-[13px] font-bold tracking-tight text-foreground hover:opacity-70 transition-opacity shrink-0"
          >
            PRODKJ<span style={{ color: 'var(--muted-low)' }}>BEATS</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-7 min-w-0">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))

              if (link.children) {
                return (
                  <DropdownMenu key={link.href} link={link as NavLink & { children: NavChild[] }} pathname={pathname} />
                )
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative shrink-0 text-[12px] transition-colors duration-150 ${active ? 'text-foreground font-medium' : 'font-normal text-muted hover:text-foreground'}`}
                          >
                  {NAV_LABEL_MAP[link.href] ?? link.label}
                  {active && (
                    <span className="absolute -bottom-[14px] left-0 right-0 h-px bg-foreground/40" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <LocaleSwitcher />
            <NavAuthButton />

            <button
              onClick={() => openCart()}
              aria-label={items.length > 0 ? `${t.nav.cart} — ${items.length} item${items.length === 1 ? '' : 's'}` : t.nav.cart}
              className="h-11 inline-flex items-center text-[12px] text-muted hover:text-foreground transition-colors"
            >
              {t.nav.cart} {items.length > 0 && (
                <span key={items.length} className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-black text-[9px] font-bold animate-badge-pop" aria-hidden="true">
                  {items.length}
                </span>
              )}
            </button>

            <Link
              href="/store"
              className="inline-flex items-center justify-center rounded-full bg-white text-black text-[12px] font-semibold transition-[background-color,transform] hover:bg-white-hover active:scale-95"
              style={{ padding: '8px 16px' }}
            >
              {t.nav.shopBeats}
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="flex lg:hidden items-center gap-4 ml-auto">
            <button
              onClick={() => openCart()}
              aria-label={items.length > 0 ? `${t.nav.cart} — ${items.length} item${items.length === 1 ? '' : 's'}` : t.nav.cart}
              className="flex h-11 items-center text-[11px] text-muted"
            >
              {items.length > 0 && (
                <span key={items.length} className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-black text-[9px] font-bold mr-1 animate-badge-pop" aria-hidden="true">
                  {items.length}
                </span>
              )}
              {t.nav.cart}
            </button>
            <button
              ref={menuTriggerRef}
              onClick={() => setMobileOpen(o => !o)}
              className="flex h-11 w-11 flex-col items-center justify-center gap-[4.5px]"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-menu"
            >
              <span className={`block w-[18px] bg-foreground transition-[transform,opacity] duration-200 ${mobileOpen ? 'rotate-45 translate-y-[6.5px]' : ''}`} style={{ height: '1px' }} />
              <span className={`block w-[18px] bg-foreground transition-[transform,opacity] duration-200 ${mobileOpen ? 'opacity-0' : ''}`} style={{ height: '1px' }} />
              <span className={`block w-[18px] bg-foreground transition-[transform,opacity] duration-200 ${mobileOpen ? '-rotate-45 -translate-y-[6.5px]' : ''}`} style={{ height: '1px' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-[48px] z-[98] lg:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <nav
        id="mobile-nav-menu"
        aria-label="Mobile navigation"
        inert={!mobileOpen}
        className={`fixed top-[48px] left-0 right-0 z-[99] glass border-b border-white/[0.06] transition-[opacity,transform] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
          mobileOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}

      >
        <div key={`menu-${mobileOpen}`} className="px-6 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link, idx) => {
            if (link.children) {
              return (
                <div key={link.href} className="animate-menu-item-in" style={{ animationDelay: `${idx * 55}ms` }}>
                  <span className="block py-3 text-[11px] font-semibold uppercase text-muted-low border-b border-white/[0.05]" style={{ letterSpacing: '0.15em' }}>
                    {NAV_LABEL_MAP[link.href] ?? link.label}
                  </span>
                  {link.children.map((child, cIdx) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => { setMobileOpen(false); menuTriggerRef.current?.focus() }}
                      className="block pl-4 py-2.5 text-[14px] text-muted hover:text-foreground transition-colors border-b border-white/[0.03] last:border-0"
                      style={{ animationDelay: `${(idx + cIdx + 1) * 55}ms` }}
                    >
                      {NAV_LABEL_MAP[child.href] ?? child.label}
                    </Link>
                  ))}
                </div>
              )
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => { setMobileOpen(false); menuTriggerRef.current?.focus() }}
                className="py-3 text-[14px] text-muted hover:text-foreground transition-colors border-b border-white/[0.05] last:border-0 animate-menu-item-in"
                style={{ animationDelay: `${idx * 55}ms` }}
              >
                {NAV_LABEL_MAP[link.href] ?? link.label}
              </Link>
            )
          })}
          <div className="pt-3 flex items-center justify-between">
            <NavAuthButton />
            <LocaleSwitcher />
          </div>
        </div>
      </nav>

      <CartDrawer open={cartOpen} onClose={closeCart} />

      {/* Screen reader cart count announcements */}
      <span role="status" aria-live="polite" className="sr-only">
        {cartAnnouncement}
      </span>
    </>
  )
}
