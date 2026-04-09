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
    <footer className="w-full border-t border-white/[0.06] bg-black pb-24">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 pt-12 pb-8">

        {/* Top row */}
        <div className="mb-10 flex flex-col items-start gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/"
              className="text-[13px] font-bold tracking-tight text-foreground hover:opacity-70 transition-opacity block mb-2"
            >
              PRODKJ<span className="text-muted-low">BEATS</span>
            </Link>
            <p className="text-[12px] text-muted-low leading-relaxed max-w-[200px]">
              Premium beats for serious artists.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-4 sm:gap-x-12">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[12px] text-muted hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="mb-6 h-px w-full bg-white/[0.06]" />

        {/* Bottom row */}
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <p className="text-[11px] text-muted-low">
              © {new Date().getFullYear()} PRODKJBEATS. All rights reserved.
            </p>
            <a
              href="https://www.instagram.com/prodkjbeats/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-muted-low hover:text-white transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="3"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
              @prodkjbeats
            </a>
          </div>

          <div className="flex flex-wrap gap-4 sm:gap-5">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[11px] text-muted-low hover:text-foreground transition-colors"
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
