import type { Metadata } from 'next'
import AdminClient from '@/components/AdminClient'

export const metadata: Metadata = {
  title: 'Admin — PRODKJBEATS',
  robots: 'noindex,nofollow',
}

export default function AdminPage() {
  return <AdminClient />
}
