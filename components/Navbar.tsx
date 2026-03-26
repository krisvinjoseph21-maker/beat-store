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
      <nav className="fixed top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="flex h-14 w-full items-center justify-between pl-6 pr-32">
          {/* Logo */}
          <Link href="/" className="text-base font-black tracking-tight text-gray-900 hover:opacity-70 transition-opacity">
            PRODKJ<span className="text-gray-400">BEATS</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-stretch gap-6 h-14">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center text-sm font-medium transition-colors border-b-2 ${
                  pathname === href
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-900'
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
              className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Open cart"
            >
              <ShoppingCart size={20} className="text-gray-700" />
              {items.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
                  {items.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} className="text-gray-700" /> : <Menu size={20} className="text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-4 text-base font-medium border-b border-gray-100 transition-colors ${
                  pathname === href ? 'text-gray-900' : 'text-gray-500'
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
