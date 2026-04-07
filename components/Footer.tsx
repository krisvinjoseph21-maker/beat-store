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
      <div className="w-full px-6 pt-12 pb-8">

        {/* Top row */}
        <div className="mb-10 flex flex-col items-start gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/"
              className="text-[13px] font-bold tracking-tight text-[#f5f5f7] hover:opacity-70 transition-opacity block mb-2"
            >
              PRODKJ<span className="text-[#424245]">BEATS</span>
            </Link>
            <p className="text-[12px] text-[#424245] leading-relaxed max-w-[200px]">
              Premium beats for serious artists.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-4 sm:gap-x-12">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[12px] text-[#6e6e73] hover:text-[#f5f5f7] transition-colors"
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
          <p className="text-[11px] text-[#424245]">
            © {new Date().getFullYear()} PRODKJBEATS. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-4 sm:gap-5">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[11px] text-[#424245] hover:text-[#6e6e73] transition-colors"
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
