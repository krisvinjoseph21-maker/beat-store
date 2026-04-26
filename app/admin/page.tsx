import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

const AdminClient = dynamic(() => import('@/components/AdminClient'))

export const metadata: Metadata = {
  title: 'Admin — PRODKJBEATS',
  robots: 'noindex,nofollow',
}

export default function AdminPage() {
  return <AdminClient />
}
