import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Inter, Montserrat } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BottomPlayer from '@/components/BottomPlayer'

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
}

export const metadata: Metadata = {
  title: 'PRODKJBEATS — Premium Beats',
  description: 'Buy exclusive and leased beats from PRODKJBEATS. Trap, Drill, R&B, Afrobeats.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'PRODKJBEATS',
    description: 'Premium beats for serious artists.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`h-full ${bebasNeue.variable} ${inter.variable} ${montserrat.variable}`}>
      <body className="min-h-full flex flex-col bg-black text-[#f5f5f7] font-[family-name:var(--font-inter)]" style={{ paddingBottom: '64px' }}>
        <Navbar />
        <main className="flex-1 w-full" style={{ paddingTop: '48px' }}>{children}</main>
        <Footer />
        <BottomPlayer />
      </body>
    </html>
  )
}
