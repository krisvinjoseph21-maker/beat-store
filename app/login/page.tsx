import type { Metadata } from 'next'
import { Suspense } from 'react'
import AuthClient from '@/components/AuthClient'

export const metadata: Metadata = {
  title: 'Sign In — PRODKJBEATS',
}

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pr-14 py-16 text-center">
      <div className="mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Your Account
        </p>
        <h1 className="text-3xl font-black text-white sm:text-4xl">Sign In</h1>
        <p className="mt-3 text-sm text-zinc-500">
          Access your purchases and download history.
        </p>
      </div>
      <Suspense>
        <AuthClient />
      </Suspense>
    </div>
  )
}
