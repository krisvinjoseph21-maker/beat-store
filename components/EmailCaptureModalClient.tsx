'use client'

import dynamic from 'next/dynamic'

const EmailCaptureModal = dynamic(() => import('@/components/EmailCaptureModal'), { ssr: false })

export default function EmailCaptureModalClient() {
  return <EmailCaptureModal />
}
