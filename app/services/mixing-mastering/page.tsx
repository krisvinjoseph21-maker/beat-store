import type { Metadata } from 'next'
import MixingMasteringClient from '@/components/MixingMasteringClient'
import CtaBanner from '@/components/CtaBanner'

export const metadata: Metadata = {
  title: 'Mixing & Mastering — PRODKJBEATS',
  description: 'Professional mix and master services. 48-hour turnaround, stem-level mixdowns, streaming-ready masters.',
}

export default function MixingMasteringPage() {
  return (
    <>
      <MixingMasteringClient />
      <CtaBanner
        label="Your Sound Starts Here"
        heading="Find Your Next Hit."
        subtext="Pick your sound, license instantly, and bring it in for a professional mix."
      />
    </>
  )
}
