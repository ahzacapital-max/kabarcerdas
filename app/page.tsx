import { getLatestArticles } from '@/lib/supabase'
import { headers } from 'next/headers'
import InfiniteFeed from './components/InfiniteFeed'
import type { Metadata } from 'next'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'KabarCerdas — Membaca Fakta Lebih Cerdas',
  description: 'Konteks & signifikansi di setiap berita. Baca KabarCerdas — nyaman tanpa iklan, paham lebih dalam.',
  openGraph: {
    title: 'KabarCerdas',
    description: 'Membaca Fakta Lebih Cerdas',
    url: 'https://kabarcerdas.my.id',
    siteName: 'KabarCerdas',
    locale: 'id_ID',
    type: 'website',
  },
}

function getInitialBatch(ua: string): number {
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua)
  return isMobile ? 5 : 8
}

export default async function HomePage() {
  const headersList = await headers()
  const ua = headersList.get('user-agent') || ''
  const initialBatch = getInitialBatch(ua)
  const batchSize = 10

  const articles = await getLatestArticles(initialBatch)

  return (
    <InfiniteFeed
      initialArticles={articles}
      batchSize={batchSize}
    />
  )
}
