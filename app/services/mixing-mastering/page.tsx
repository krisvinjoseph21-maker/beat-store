import type { Metadata } from 'next'
import MixingMasteringClient from '@/components/MixingMasteringClient'

export const metadata: Metadata = {
  title: 'Mixing & Mastering — PRODKJBEATS',
  description: 'Professional mix and master services. 48-hour turnaround, stem-level mixdowns, streaming-ready masters.',
}

export default function MixingMasteringPage() {
  return <MixingMasteringClient />
}
