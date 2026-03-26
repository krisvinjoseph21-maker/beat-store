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
    <footer className="w-full border-t border-gray-200 bg-gray-50 pb-24">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        {/* Top row — logo + nav links */}
        <div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <Link
            href="/"
            className="text-base font-black tracking-tight text-gray-900 hover:opacity-70 transition-opacity"
          >
            PRODKJ<span className="text-gray-400">BEATS</span>
          </Link>

          <div className="flex flex-wrap justify-center gap-5 sm:gap-6">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="mb-6 h-px w-full bg-gray-200" />

        {/* Bottom row — copyright + legal links */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} PRODKJBEATS. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
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
