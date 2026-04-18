'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/lib/store'
import CartDrawer from './CartDrawer'
import NavAuthButton from './NavAuthButton'
import { ChevronDown } from 'lucide-react'

type NavChild = { href: string; label: string }
type NavLink  = { href: string; label: string; children?: NavChild[] }

const NAV_LINKS: NavLink[] = [
  { href: '/store',    label: 'Beats'    },
  { href: '/services', label: 'Services', children: [
    { href: '/services/custom-beats',     label: 'Custom Beats'      },
    { href: '/services/mixing-mastering', label: 'Mixing & Mastering' },
  ]},
  { href: '/sample-packs', label: 'Sample Packs', children: [
    { href: '/sample-packs/best-sellers',           label: 'Best Sellers'            },
    { href: '/sample-packs/melody-packs',           label: 'Melody Packs'            },
    { href: '/sample-packs/weekly-essentials',      label: 'Weekly Essentials'       },
    { href: '/sample-packs/weekly-loop-subscription', label: 'Weekly Loop Subscription' },
    { href: '/sample-packs/drum-kits',              label: 'Drum Kits'               },
  ]},
  { href: '/licensing', label: 'Licensing' },
  { href: '/about',     label: 'Contact'   },
]

export default function Navbar() {
  const { items, cartOpen, openCart, closeCart } = useCartStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const [cartAnnouncement, setCartAnnouncement] = useState('')
  const pathname = usePathname()

  useEffect(() => {
    if (items.length === 0) return
    setCartAnnouncement(`${items.length} item${items.length === 1 ? '' : 's'} in cart`)
  }, [items.length])

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10)
      if (mobileOpen) setMobileOpen(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [mobileOpen])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-[background,border-color,backdrop-filter] duration-300 ${
          scrolled ? 'glass border-b border-white/[0.06]' : 'bg-transparent'
        }`}
        style={{ height: '48px', fontFamily: 'var(--font-inter)' }}
      >
        <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-6 sm:px-10 lg:px-16">

          {/* Logo */}
          <Link
            href="/"
            className="text-[13px] font-bold tracking-tight text-foreground hover:opacity-70 transition-opacity shrink-0"
          >
            PRODKJ<span style={{ color: 'var(--muted-low)' }}>BEATS</span>
          </Link>

          {/* Desktop nav — centered */}
          <div className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))

              if (link.children) {
                return (
                  <div key={link.href} className="relative group">
                    <button
                      className={`flex items-center gap-0.5 text-[12px] transition-colors duration-150 ${active ? 'text-foreground font-medium' : 'font-normal text-muted hover:text-foreground'}`}
                      style={{ letterSpacing: '0.01em' }}
                      aria-haspopup="true"
                    >
                      {link.label}
                      <ChevronDown size={10} className="mt-px transition-transform duration-150 group-hover:rotate-180" aria-hidden="true" />
                      {active && (
                        <span className="absolute -bottom-[14px] left-0 right-0 h-px bg-foreground/40" />
                      )}
                    </button>
                    {/* Dropdown panel */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-44 glass border border-white/[0.08] py-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block px-4 py-2 text-[12px] transition-colors duration-100 ${pathname.startsWith(child.href) ? 'text-foreground font-medium' : 'text-muted hover:text-foreground'}`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-[12px] transition-colors duration-150 ${active ? 'text-foreground font-medium' : 'font-normal text-muted hover:text-foreground'}`}
                  style={{ letterSpacing: '0.01em' }}
                >
                  {link.label}
                  {active && (
                    <span className="absolute -bottom-[14px] left-0 right-0 h-px bg-foreground/40" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <NavAuthButton />

            <button
              onClick={() => openCart()}
              aria-label={items.length > 0 ? `Cart — ${items.length} item${items.length === 1 ? '' : 's'}` : 'Cart'}
              className="h-11 inline-flex items-center text-[12px] text-muted hover:text-foreground transition-colors"
            >
              Cart {items.length > 0 && (
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
              Shop Beats
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-4">
            <button
              onClick={() => openCart()}
              aria-label={items.length > 0 ? `Cart — ${items.length} item${items.length === 1 ? '' : 's'}` : 'Cart'}
              className="flex h-11 items-center text-[11px] text-muted"
            >
              {items.length > 0 && (
                <span key={items.length} className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-black text-[9px] font-bold mr-1 animate-badge-pop" aria-hidden="true">
                  {items.length}
                </span>
              )}
              Cart
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

      {/* Mobile menu backdrop — tap outside to dismiss */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-[48px] z-[98] md:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div
        id="mobile-nav-menu"
        className={`fixed top-[48px] left-0 right-0 z-[99] glass border-b border-white/[0.06] transition-[opacity,transform] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
          mobileOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div key={`menu-${mobileOpen}`} className="px-6 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link, idx) => {
            if (link.children) {
              return (
                <div key={link.href} className="animate-menu-item-in" style={{ animationDelay: `${idx * 55}ms` }}>
                  <p className="py-3 text-[11px] font-semibold uppercase text-muted-low border-b border-white/[0.05]" style={{ letterSpacing: '0.15em' }}>
                    {link.label}
                  </p>
                  {link.children.map((child, cIdx) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => { setMobileOpen(false); menuTriggerRef.current?.focus() }}
                      className="block pl-4 py-2.5 text-[14px] text-muted hover:text-foreground transition-colors border-b border-white/[0.03] last:border-0"
                      style={{ animationDelay: `${(idx + cIdx + 1) * 55}ms` }}
                    >
                      {child.label}
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
                {link.label}
              </Link>
            )
          })}
          <div className="pt-3">
            <NavAuthButton />
          </div>
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={closeCart} />

      {/* Screen reader cart count announcements */}
      <span role="status" aria-live="polite" className="sr-only">
        {cartAnnouncement}
      </span>
    </>
  )
}
