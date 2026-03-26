import type { Metadata } from 'next'
import { Suspense } from 'react'
import AuthClient from '@/components/AuthClient'

export const metadata: Metadata = {
  title: 'Sign In — PRODKJBEATS',
}

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
      <div className="mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
          Your Account
        </p>
        <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">Sign In</h1>
        <p className="mt-3 text-sm text-gray-500">
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
