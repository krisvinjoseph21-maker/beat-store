import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import PurchasesClient from '@/components/PurchasesClient'

export const metadata: Metadata = {
  title: 'Purchases — PRODKJBEATS',
  description: 'View and re-download your purchased beats from PRODKJBEATS.',
  robots: { index: false, follow: false },
}

export default async function PurchasesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/purchases')
  }

  const admin = createAdminClient()

  const { data: orders } = await admin
    .from('orders')
    .select('id, beat_ids, license_type, total_price, created_at')
    .eq('customer_email', user.email!)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })

  const allBeatIds = [...new Set((orders ?? []).flatMap((o) => o.beat_ids as string[]))]

  const { data: beats } = allBeatIds.length
    ? await admin.from('beats').select('id, title').in('id', allBeatIds)
    : { data: [] }

  const beatMap: Record<string, string> = {}
  for (const b of beats ?? []) beatMap[b.id] = b.title

  const purchases = (orders ?? []).map((o) => ({
    id: o.id,
    beatTitles: (o.beat_ids as string[]).map((id) => beatMap[id] ?? 'Unknown Beat'),
    licenseType: o.license_type as string,
    totalPrice: o.total_price as number,
    createdAt: o.created_at as string,
  }))

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Your Account
        </p>
        <h1 className="text-3xl font-black text-white sm:text-4xl">Purchases</h1>
        <p className="mt-2 text-sm text-muted">{user.email}</p>
      </div>
      <PurchasesClient purchases={purchases} />
    </div>
  )
}
