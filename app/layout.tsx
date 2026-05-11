import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Inter, Montserrat } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BottomPlayer from '@/components/BottomPlayer'
import AnalyticsScripts from '@/components/AnalyticsScripts'
import EmailCaptureModalClient from '@/components/EmailCaptureModalClient'
import HtmlLang from '@/components/HtmlLang'
import ChatBotWidget from '@/components/ChatBotWidgetLoader'
import BodyPlayerPadding from '@/components/BodyPlayerPadding'
import ScrollProgress from '@/components/ScrollProgress'
import AudioReactiveStage from '@/components/AudioReactiveStageLoader'

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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
      ? process.env.NEXT_PUBLIC_SITE_URL
      : 'https://beat-store-d3iw.vercel.app'
  ),
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
    images: [{ url: '/og', width: 1200, height: 630, alt: 'PRODKJBEATS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRODKJBEATS — Premium Beats',
    description: 'Buy exclusive and leased beats from PRODKJBEATS. Trap, Drill, R&B, Afrobeats.',
    images: ['/og'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${inter.variable} ${montserrat.variable}`}>
      <head>
        {/* Ensure scroll-reveal content is visible when JS is disabled or blocked */}
        <noscript><style>{`.scroll-reveal { opacity: 1 !important; }`}</style></noscript>
      </head>
      <body className="min-h-screen flex flex-col bg-black text-foreground font-[family-name:var(--font-inter)]">
        <AudioReactiveStage />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[999] focus:rounded-full focus:bg-white focus:px-5 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-black focus:shadow-lg"
        >
          Skip to content
        </a>
        <HtmlLang />
        <ScrollProgress />
        <BodyPlayerPadding />
        <Navbar />
        <main id="main-content" className="flex-1 w-full" style={{ paddingTop: '48px' }}>{children}</main>
        <Footer />
        <BottomPlayer />
        <EmailCaptureModalClient />
        <ChatBotWidget />
        <AnalyticsScripts />
      </body>
    </html>
  )
}
