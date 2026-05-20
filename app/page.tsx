import { Suspense } from 'react'
import { getLatestArticles } from '@/lib/supabase'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 300 // ISR setiap 5 menit

export const metadata: Metadata = {
  title: 'KabarCerdas — Berita Terpercaya Indonesia',
  description: 'Berita terkini dari sumber terpercaya, disajikan dengan jurnalisme berkualitas tinggi.',
  openGraph: {
    title: 'KabarCerdas',
    description: 'Berita terkini dari sumber terpercaya',
    url: 'https://kabarcerdas.id',
    siteName: 'KabarCerdas',
    locale: 'id_ID',
    type: 'website',
  },
}

const CATEGORIES = ['Nasional', 'Ekonomi', 'Teknologi', 'Dunia', 'Politik', 'Viral']

export default async function HomePage() {
  const [hero, ...rest] = await getLatestArticles(13)
  const sidebar = rest.slice(0, 4)
  const grid = rest.slice(4, 10)
  const ekonomi = await getLatestArticles(4, 'Ekonomi')
  const teknologi = await getLatestArticles(4, 'Teknologi')

  return (
    <>
      {/* Ticker */}
      <div className="ticker">
        <div className="ticker-label">📡 Terkini</div>
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...rest.slice(0, 5), ...rest.slice(0, 5)].map((a, i) => (
              <span key={i}>{a.title}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Dateline */}
      <div className="dateline">
        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Jakarta
      </div>

      {/* Category nav */}
      <nav className="cat-nav">
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/kategori/${c.toLowerCase()}`} className="cat-link">{c}</Link>
        ))}
      </nav>

      {/* Hero grid */}
      {hero && (
        <section className="hero-section">
          <div className="hero-main">
            <div className="hero-cat">{hero.category}</div>
            <Link href={`/artikel/${hero.slug}`} className="hero-title">{hero.title}</Link>
            <div className="hero-meta">
              Redaksi KabarCerdas · {formatRelativeTime(hero.published_at)} · {hero.reading_time} menit baca
            </div>
            {hero.excerpt && <p className="hero-excerpt">{hero.excerpt}</p>}
            <Link href={`/artikel/${hero.slug}`} className="read-more">Baca selengkapnya →</Link>
          </div>

          <aside className="hero-sidebar">
            <div className="sidebar-heading">Berita Lainnya</div>
            {sidebar.map((a) => (
              <Link key={a.id} href={`/artikel/${a.slug}`} className="sidebar-item">
                <div className="sidebar-cat">{a.category}</div>
                <div className="sidebar-title">{a.title}</div>
                <div className="sidebar-time">{formatRelativeTime(a.published_at)}</div>
              </Link>
            ))}
          </aside>
        </section>
      )}

      {/* Grid artikel */}
      <section className="grid-section">
        <div className="section-label">Pilihan Redaksi</div>
        <div className="articles-grid">
          {grid.map((a) => (
            <Link key={a.id} href={`/artikel/${a.slug}`} className="article-card">
              <div className="card-cat">{a.category}</div>
              <div className="card-title">{a.title}</div>
              {a.excerpt && <div className="card-excerpt">{a.excerpt}</div>}
              <div className="card-time">{formatRelativeTime(a.published_at)}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Ekonomi section */}
      {ekonomi.length > 0 && (
        <section className="topic-section">
          <div className="topic-header">
            <span className="topic-label">Ekonomi</span>
            <Link href="/kategori/ekonomi" className="topic-more">Lihat semua →</Link>
          </div>
          <div className="topic-grid">
            {ekonomi.map((a) => (
              <Link key={a.id} href={`/artikel/${a.slug}`} className="topic-item">
                <div className="topic-title">{a.title}</div>
                <div className="topic-time">{formatRelativeTime(a.published_at)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Teknologi section */}
      {teknologi.length > 0 && (
        <section className="topic-section">
          <div className="topic-header">
            <span className="topic-label">Teknologi</span>
            <Link href="/kategori/teknologi" className="topic-more">Lihat semua →</Link>
          </div>
          <div className="topic-grid">
            {teknologi.map((a) => (
              <Link key={a.id} href={`/artikel/${a.slug}`} className="topic-item">
                <div className="topic-title">{a.title}</div>
                <div className="topic-time">{formatRelativeTime(a.published_at)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
