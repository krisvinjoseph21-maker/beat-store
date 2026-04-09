'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/lib/store'
import CartDrawer from './CartDrawer'
import NavAuthButton from './NavAuthButton'

const NAV_LINKS = [
  { href: '/store',    label: 'Beats'     },
  { href: '/services', label: 'Services'  },
  { href: '/licensing',label: 'Licensing' },
  { href: '/about',    label: 'Contact'   },
]

export default function Navbar() {
  const { items, cartOpen, openCart, closeCart } = useCartStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 10) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          scrolled ? 'glass border-b border-white/[0.06]' : 'bg-transparent'
        }`}
        style={{
          height: '48px',
          fontFamily: 'var(--font-inter)',
        }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-8">

          {/* Logo */}
          <Link
            href="/"
            className="text-[13px] font-bold tracking-tight text-foreground hover:opacity-70 transition-opacity shrink-0"
          >
            PRODKJ<span style={{ color: 'var(--muted-low)' }}>BEATS</span>
          </Link>

          {/* Desktop nav — centered */}
          <div className="hidden lg:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[12px] font-normal text-muted hover:text-foreground transition-colors duration-150"
                style={{ letterSpacing: '0.01em' }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-3">
            <NavAuthButton />

            <button
              onClick={() => openCart()}
              className="text-[12px] text-muted hover:text-foreground transition-colors"
              style={{ letterSpacing: '0.01em' }}
            >
              Cart {items.length > 0 && (
                <span key={items.length} className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-black text-[9px] font-bold animate-badge-pop">
                  {items.length}
                </span>
              )}
            </button>

            <Link
              href="/store"
              className="inline-flex items-center justify-center rounded-full bg-white text-black text-[12px] font-semibold transition-all hover:bg-[#e8e8ed] active:scale-95"
              style={{ padding: '6px 16px', letterSpacing: '0.01em' }}
            >
              Shop Beats
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="flex lg:hidden items-center gap-4">
            <button
              onClick={() => openCart()}
              className="text-[11px] text-muted"
            >
              {items.length > 0 && (
                <span key={items.length} className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-black text-[9px] font-bold mr-1 animate-badge-pop">
                  {items.length}
                </span>
              )}
              Cart
            </button>
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="flex flex-col gap-[4.5px] p-1"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <span className={`block w-[18px] bg-foreground transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-[6.5px]' : ''}`} style={{ height: '1px' }} />
              <span className={`block w-[18px] bg-foreground transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} style={{ height: '1px' }} />
              <span className={`block w-[18px] bg-foreground transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-[6.5px]' : ''}`} style={{ height: '1px' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`fixed top-[48px] left-0 right-0 z-[99] glass border-b border-white/[0.06] transition-all duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div key={`menu-${mobileOpen}`} className="px-6 py-4 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label }, idx) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="py-3 text-[14px] text-muted hover:text-foreground transition-colors border-b border-white/[0.05] last:border-0 animate-menu-item-in"
              style={{ animationDelay: `${idx * 55}ms` }}
            >
              {label}
            </Link>
          ))}
          <div className="pt-3">
            <NavAuthButton />
          </div>
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={closeCart} />
    </>
  )
}
