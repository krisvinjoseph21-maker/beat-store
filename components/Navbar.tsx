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
  { href: '/about',    label: 'About'     },
]

export default function Navbar() {
  const { items } = useCartStore()
  const [cartOpen, setCartOpen]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 50) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between transition-colors duration-300"
        style={{
          height: '80px',
          padding: '0 40px',
          background: scrolled
            ? 'rgba(8,8,8,0.97)'
            : 'linear-gradient(rgba(8,8,8,0.95), rgba(0,0,0,0))',
          fontFamily: 'var(--font-inter)',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="text-[15px] font-black tracking-tight text-[#f0ede8] hover:opacity-80 transition-opacity shrink-0"
        >
          PRODKJ<span style={{ color: '#555' }}>BEATS</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-[13px] font-medium uppercase transition-colors duration-200 hover:text-[#f0ede8]"
              style={{ letterSpacing: '1.3px', color: '#888', fontFamily: 'var(--font-inter)' }}
            >
              {label}
            </Link>
          ))}

          <NavAuthButton />

          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            className="border text-[#f0ede8] text-[12px] font-semibold transition-colors duration-200 hover:bg-white/5"
            style={{
              borderColor: '#2a2a2a',
              padding: '8px 16px',
              letterSpacing: '0.6px',
              fontFamily: 'var(--font-inter)',
            }}
          >
            Cart ({items.length})
          </button>

          {/* Shop Beats CTA */}
          <Link
            href="/store"
            className="bg-white text-black text-[12px] font-bold uppercase transition-colors duration-200 hover:bg-zinc-100"
            style={{ padding: '10px 20px', letterSpacing: '1.2px', fontFamily: 'var(--font-inter)' }}
          >
            Shop Beats
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex lg:hidden items-center gap-4">
          <button
            onClick={() => setCartOpen(true)}
            className="text-[11px] font-semibold text-[#f0ede8]"
            style={{ letterSpacing: '0.55px' }}
          >
            Cart ({items.length})
          </button>
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="flex flex-col gap-[5px] p-1"
            aria-label="Toggle menu"
          >
            <span className="block w-[22px] bg-[#f0ede8]" style={{ height: '1.5px' }} />
            <span className="block w-[22px] bg-[#f0ede8]" style={{ height: '1.5px' }} />
            <span className="block w-[22px] bg-[#f0ede8]" style={{ height: '1.5px' }} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="fixed top-[80px] left-0 right-0 z-[99] border-b border-[#1a1a1a]"
          style={{ background: 'rgba(8,8,8,0.98)' }}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center border-b border-[#111] px-10 py-4 text-[13px] font-medium uppercase transition-colors hover:text-[#f0ede8]"
              style={{ letterSpacing: '1.3px', color: '#888' }}
            >
              {label}
            </Link>
          ))}
          <div className="px-10 py-4">
            <NavAuthButton />
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
