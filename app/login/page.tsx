import type { Metadata } from 'next'
import { Suspense } from 'react'
import AuthClient from '@/components/AuthClient'

export const metadata: Metadata = {
  title: 'Sign In — KJYOUCRAZY',
  description: 'Sign in to access your KJYOUCRAZY purchases and download history.',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-[400px]">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Your Account
          </p>
          <h1 className="text-3xl font-black text-white sm:text-4xl">Sign In</h1>
          <p className="mt-3 text-sm text-muted">
            Access your purchases and download history.
          </p>
        </div>
        <Suspense>
          <AuthClient />
        </Suspense>
      </div>
    </div>
  )
}
