import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Inter, Montserrat } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BottomPlayer from '@/components/BottomPlayer'
import EmailCaptureModal from '@/components/EmailCaptureModal'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prodkjbeats.com'),
  title: 'PRODKJBEATS — Premium Beats',
  description: 'Buy exclusive and leased beats from PRODKJBEATS. Trap, Drill, R&B, Afrobeats.',
  icons: {
    icon: { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    shortcut: '/android-chrome-512x512.png',
    apple: '/android-chrome-512x512.png',
  },
  openGraph: {
    title: 'PRODKJBEATS — Premium Beats',
    description: 'Buy exclusive and leased beats from PRODKJBEATS. Trap, Drill, R&B, Afrobeats.',
    type: 'website',
    siteName: 'PRODKJBEATS',
    locale: 'en_US',
    images: [{ url: '/android-chrome-512x512.png', width: 512, height: 512, alt: 'PRODKJBEATS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRODKJBEATS — Premium Beats',
    description: 'Buy exclusive and leased beats from PRODKJBEATS. Trap, Drill, R&B, Afrobeats.',
    images: ['/android-chrome-512x512.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${inter.variable} ${montserrat.variable}`}>
      <body className="min-h-screen flex flex-col bg-black text-foreground font-[family-name:var(--font-inter)]" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[999] focus:rounded-full focus:bg-white focus:px-5 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-black focus:shadow-lg"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" className="flex-1 w-full" style={{ paddingTop: '48px' }}>{children}</main>
        <Footer />
        <BottomPlayer />
        <EmailCaptureModal />
      </body>
    </html>
  )
}
