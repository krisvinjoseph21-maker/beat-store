import Link from 'next/link'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/store', label: 'All Beats' },
  { href: '/services', label: 'Services' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'Contact' },
]

const LEGAL_LINKS = [
  { href: '/licensing', label: 'Licensing Info' },
  { href: '/terms', label: 'Terms of Use' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/cookies', label: 'Cookie Preferences' },
]

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#191919] bg-[#0a0a0a] pb-24">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        {/* Top row — logo + nav links */}
        <div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <Link
            href="/"
            className="text-base font-black tracking-tight text-white hover:opacity-80 transition-opacity"
          >
            PRODKJ<span className="text-zinc-500">BEATS</span>
          </Link>

          <div className="flex flex-wrap justify-center gap-5 sm:gap-6">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-zinc-500 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="mb-6 h-px w-full bg-[#191919]" />

        {/* Bottom row — copyright + legal links */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} PRODKJBEATS. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
