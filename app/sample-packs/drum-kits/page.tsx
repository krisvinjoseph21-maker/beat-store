import type { Metadata } from 'next'
import DrumKitsClient from '@/components/DrumKitsClient'
import CtaBanner from '@/components/CtaBanner'

export const metadata: Metadata = {
  title: 'Drum Kits — PRODKJBEATS',
  description: 'Download premium drum kits from PRODKJBEATS. Trap, drill, R&B, and Afrobeats one-shots and samples crafted for modern music production — instant download.',
  alternates: { canonical: '/sample-packs/drum-kits' },
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
