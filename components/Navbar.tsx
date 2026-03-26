'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '@/lib/store'
import CartDrawer from './CartDrawer'
import NavAuthButton from './NavAuthButton'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/store', label: 'Store' },
  { href: '/services', label: 'Services' },
  { href: '/purchases', label: 'Purchases' },
  { href: '/about', label: 'About' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { items } = useCartStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 z-40 w-full border-b border-[#191919] bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="flex h-14 w-full items-center justify-between pl-6 pr-32">
          {/* Logo */}
          <Link href="/" className="text-base font-black tracking-tight text-white hover:opacity-80 transition-opacity">
            PRODKJ<span className="text-zinc-500">BEATS</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-stretch gap-6 h-14">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center text-sm font-medium transition-colors border-b-2 ${
                  pathname === href
                    ? 'text-white border-white'
                    : 'text-zinc-400 hover:text-white border-transparent hover:border-white'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Cart + auth + mobile toggle */}
          <div className="flex items-center gap-3">
            <NavAuthButton />
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              aria-label="Open cart"
            >
              <ShoppingCart size={20} />
              {items.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
                  {items.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#1f1f1f] bg-[#0a0a0a]">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-4 text-base font-medium border-b border-[#1f1f1f] transition-colors ${
                  pathname === href ? 'text-white' : 'text-zinc-400'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
