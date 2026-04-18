import type { Metadata } from 'next'
import CustomBeatsClient from '@/components/CustomBeatsClient'

export const metadata: Metadata = {
  title: 'Custom Beats — PRODKJBEATS',
  description: 'Custom beat production packages for serious artists. Basic, Full, Mix Bundle, Executive Producer, and Project Launch packages.',
}

export default function CustomBeatsPage() {
  return <CustomBeatsClient />
}
