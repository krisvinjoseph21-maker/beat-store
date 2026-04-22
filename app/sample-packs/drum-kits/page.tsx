import type { Metadata } from 'next'
import DrumKitsClient from '@/components/DrumKitsClient'

export const metadata: Metadata = {
  title: 'Drum Kits — PRODKJBEATS',
  description: 'Premium drum kits from PRODKJBEATS. Trap, Drill, R&B, and more.',
}

export default function DrumKitsPage() {
  return <DrumKitsClient />
}
