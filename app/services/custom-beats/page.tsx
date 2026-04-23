import type { Metadata } from 'next'
import CustomBeatsClient from '@/components/CustomBeatsClient'
import CtaBanner from '@/components/CtaBanner'

export const metadata: Metadata = {
  title: 'Custom Beats — PRODKJBEATS',
  description: 'Custom beat production packages for serious artists. Basic, Full, Mix Bundle, Executive Producer, and Project Launch packages.',
}

export default function CustomBeatsPage() {
  return (
    <>
      <CustomBeatsClient />
      <CtaBanner
        label="Or Start Here"
        heading="Or Start With a Lease."
        subtext="Not ready for custom? Browse the full catalog and license a beat instantly."
      />
    </>
  )
}
