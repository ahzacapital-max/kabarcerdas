import { getArticlesByCategory } from '@/lib/supabase'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

type Props = { params: Promise<{ nama: string }> }

const CATEGORY_MAP: Record<string, string> = {
  nasional: 'Nasional',
  daerah: 'Daerah',
  ekonomi: 'Ekonomi',
  bisnis: 'Bisnis',
  teknologi: 'Teknologi',
  dunia: 'Dunia',
  politik: 'Politik',
  olahraga: 'Olahraga',
  sepakbola: 'Sepakbola',
  viral: 'Viral',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nama } = await params
  const label = CATEGORY_MAP[nama] || nama
  return {
    title: `${label} — KabarCerdas`,
    description: `Berita ${label} terkini dari KabarCerdas`,
  }
}

export const revalidate = 300

export default async function KategoriPage({ params }: Props) {
  const { nama } = await params
  const label = CATEGORY_MAP[nama]
  if (!label) notFound()

  const articles = await getArticlesByCategory(label, 20)

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ borderBottom: '2px solid #1a1814', paddingBottom: '.5rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 600 }}>{label}</h1>
      </div>

      {articles.length === 0 ? (
        <p style={{ color: 'var(--ink3)', fontSize: '.9rem' }}>Belum ada berita di kategori ini.</p>
      ) : (
        <div className="articles-grid">
          {articles.map((a) => (
            <Link key={a.id} href={`/artikel/${a.slug}`} className="article-card">
              <div className="card-cat">{a.category}</div>
              <div className="card-title">{a.title}</div>
              {a.excerpt && <div className="card-excerpt">{a.excerpt}</div>}
              <div className="card-time">{formatRelativeTime(a.published_at)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}