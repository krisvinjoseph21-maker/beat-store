import type { Metadata } from 'next'
import WeeklyLoopSubscriptionClient from '@/components/WeeklyLoopSubscriptionClient'

export const metadata: Metadata = {
  title: 'Weekly Loop Subscription | PRODKJBEATS',
  description: 'Get 50+ fresh loops every week — melody loops, drum patterns, chord stabs & bass lines. WAV + MIDI included. From $7/month.',
}

export default function WeeklyLoopSubscriptionPage() {
  return <WeeklyLoopSubscriptionClient />
}
