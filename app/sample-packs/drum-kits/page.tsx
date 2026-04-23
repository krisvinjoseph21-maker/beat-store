import type { Metadata } from 'next'
import DrumKitsClient from '@/components/DrumKitsClient'
import CtaBanner from '@/components/CtaBanner'

export const metadata: Metadata = {
  title: 'Drum Kits — PRODKJBEATS',
  description: 'Premium drum kits from PRODKJBEATS. Trap, Drill, R&B, and more.',
}

export default function DrumKitsPage() {
  return (
    <>
      <DrumKitsClient />
      <CtaBanner
        label="Shop the Beats"
        heading="Shop the Beats Too."
        subtext="Pair your new drum kit with a licensed beat from the full catalog."
      />
    </>
  )
}
