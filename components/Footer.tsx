'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n'

export default function Footer() {
  const t = useT()

  const NAV_LINKS = [
    { href: '/',          label: t.footer.home },
    { href: '/store',     label: t.footer.allBeats },
    { href: '/services',  label: t.footer.services },
    { href: '/faq',       label: t.footer.faq },
    { href: '/about',     label: t.footer.contact },
  ]

  const LEGAL_LINKS = [
    { href: '/licensing', label: t.footer.licensingInfo },
    { href: '/terms',     label: t.footer.termsOfUse },
    { href: '/privacy',   label: t.footer.privacyPolicy },
    { href: '/cookies',   label: t.footer.cookiePrefs },
  ]

  return (
    <footer className="w-full flex justify-center border-t border-white/[0.06] bg-black pb-24">
      <div className="w-full max-w-6xl px-6 sm:px-10 lg:px-16 pt-12 pb-8">

        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">

          {/* Left — brand + copyright */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="text-[13px] font-bold tracking-tight text-foreground hover:opacity-70 transition-opacity"
            >
              PRODKJ<span className="text-muted-low">BEATS</span>
            </Link>
            <p className="text-[12px] text-muted-low leading-relaxed max-w-[200px]">
              {t.footer.tagline}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[11px] text-muted-low">
                © {new Date().getFullYear()} PRODKJBEATS. {t.footer.allRights}
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
          </div>

          {/* Right — nav links */}
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex flex-wrap gap-x-8 gap-y-2 sm:justify-end">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[12px] text-muted hover:text-foreground transition-colors py-4 inline-block"
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 sm:justify-end">
              {LEGAL_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[11px] text-muted-low hover:text-foreground transition-colors py-4 inline-block"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </footer>
  )
}
