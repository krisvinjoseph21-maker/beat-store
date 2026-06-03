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
    <footer className="w-full flex justify-center border-t border-white/[0.06] bg-background" style={{ paddingBottom: 'calc(var(--player-height) + 1.5rem)' }}>
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
                © {new Date().getFullYear()} KJYOUCRAZY. {t.footer.allRights}
              </p>
              <a
                href="https://www.instagram.com/kjyoucrazy/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex items-center justify-center w-11 h-11 text-muted-low hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="3"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
              </a>
              <a
                href="https://www.youtube.com/@KJDRAKE-t8i"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="inline-flex items-center justify-center w-11 h-11 text-muted-low hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a
                href="https://open.spotify.com/playlist/4sUOga77xbnYim0G2C0Ze8?si=O-ErQJjaSKWWhqZZI16YRw"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Spotify"
                className="inline-flex items-center justify-center w-11 h-11 text-muted-low hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
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
