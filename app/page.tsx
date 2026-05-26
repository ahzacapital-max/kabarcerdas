import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PersonalizedFeed from '@/app/components/PersonalizedFeed'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'KabarCerdas — Membaca Fakta Lebih Cerdas',
  description: 'Kurasi berita terpercaya, dipersonalisasi untuk kamu.',
}

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  // Kalau belum login, redirect ke login
  if (!session) {
    redirect('/login')
  }

  // Cek onboarding
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('onboarded')
    .eq('user_id', session.user.id)
    .single()

  if (!prefs?.onboarded) {
    redirect('/onboarding')
  }

  return <PersonalizedFeed />
}
