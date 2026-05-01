import { createAdminClient } from '@/lib/supabase-admin'
import MelodyPacksGrid from '@/components/MelodyPacksGrid'
import CtaBanner from '@/components/CtaBanner'

export const revalidate = 60

export const metadata = {
  title: 'Melody Packs — PRODKJBEATS',
  description: 'Browse premium melody loop kits and sample packs from PRODKJBEATS. Designed for trap, drill, R&B, and Afrobeats producers. Instant download, royalty-free.',
  alternates: { canonical: '/sample-packs/melody-packs' },
}

export default async function MelodyPacksPage() {
  const supabase = createAdminClient()
  const { data: packs } = await supabase
    .from('melody_packs')
    .select('id, title, vendor, description, price, compare_at_price, cover_url, is_featured, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <>
      <main className="min-h-screen pt-[48px]">
        <MelodyPacksGrid initialPacks={packs ?? []} />
      </main>
      <CtaBanner
        label="Shop the Beats"
        heading="Shop the Beats Too."
        subtext="Pair your new melody pack with a licensed beat from the full catalog."
      />
    </>
  )
}
