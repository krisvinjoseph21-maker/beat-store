import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BottomPlayer from '@/components/BottomPlayer'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'PRODKJBEATS — Premium Beats',
  description: 'Buy exclusive and leased beats from PRODKJBEATS. Trap, Drill, R&B, Afrobeats.',
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
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white" style={{ paddingBottom: '80px' }}>
        <Navbar />
        <main className="flex-1 w-full" style={{ paddingLeft: '55px' }}>{children}</main>
        <Footer />
        <BottomPlayer />
      </body>
    </html>
  )
}
