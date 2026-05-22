import { getLatestArticles } from '@/lib/supabase'
import { headers } from 'next/headers'
import InfiniteFeed from '@/app/components/InfiniteFeed'
import type { Metadata } from 'next'

type Props = { params: Promise<{ nama: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nama } = await params
  const label = nama.charAt(0).toUpperCase() + nama.slice(1)
  return {
    title: `${label} — KabarCerdas`,
    description: `Berita ${label} terkini dari KabarCerdas.`,
  }
}

export const revalidate = 300

function getInitialBatch(ua: string): number {
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua)
  return isMobile ? 5 : 8
}

export default async function KategoriPage({ params }: Props) {
  const { nama } = await params
  const label = nama.charAt(0).toUpperCase() + nama.slice(1)

  const headersList = await headers()
  const ua = headersList.get('user-agent') || ''
  const initialBatch = getInitialBatch(ua)

  const articles = await getLatestArticles(initialBatch, label)

  return (
    <>
      <div className="kategori-header">
        <div className="kategori-eyebrow">Kategori</div>
        <h1 className="kategori-title">{label}</h1>
      </div>
      <InfiniteFeed
        initialArticles={articles}
        batchSize={10}
        category={label}
      />
    </>
  )
}
