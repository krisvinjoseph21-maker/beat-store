import type { Metadata } from 'next'
import WeeklyLoopSubscriptionClient from '@/components/WeeklyLoopSubscriptionClient'
import CtaBanner from '@/components/CtaBanner'

export const metadata: Metadata = {
  title: 'Weekly Loop Subscription | PRODKJBEATS',
  description: 'Get 50+ fresh loops every week — melody loops, drum patterns, chord stabs & bass lines. WAV + MIDI included. From $7/month.',
  alternates: { canonical: '/sample-packs/weekly-loop-subscription' },
}

export default function WeeklyLoopSubscriptionPage() {
  return (
    <>
      <WeeklyLoopSubscriptionClient />
      <CtaBanner
        label="Upgrade Your Sound"
        heading="Upgrade Your Sound."
        subtext="Fresh loops every week — and a full beat catalog waiting whenever you're ready."
      />
    </>
  )
}
