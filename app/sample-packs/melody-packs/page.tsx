import { createAdminClient } from '@/lib/supabase-admin'
import MelodyPacksGrid from '@/components/MelodyPacksGrid'

export const revalidate = 60

export const metadata = {
  title: 'Melody Packs — PRODKJBEATS',
  description: 'Browse and purchase premium melody loop kits and sample packs.',
}

export default async function MelodyPacksPage() {
  const supabase = createAdminClient()
  const { data: packs } = await supabase
    .from('melody_packs')
    .select('id, title, vendor, description, price, compare_at_price, cover_url, is_featured, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen pt-[48px]">
      <MelodyPacksGrid initialPacks={packs ?? []} />
    </main>
  )
}
