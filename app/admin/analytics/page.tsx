'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Analytics = {
  stats: { totalArticles: number; todayArticles: number; totalViews: number; activeSources: number }
  daily: { date: string; count: number }[]
  byCategory: { name: string; count: number }[]
  bySource: { name: string; count: number }[]
  topArticles: { title: string; slug: string; view_count: number; category: string; published_at: string }[]
}

const COLORS = ['#c0392b','#e8c96a','#4a4640','#888380','#1a1814','#ede9e2','#c0392b','#e8c96a']

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">KC Admin</div>
        <nav>
          <Link href="/admin" className="admin-nav">📊 Ringkasan</Link>
          <a className="admin-nav active">📈 Analitik</a>
          <Link href="/admin/upload" className="admin-nav">✍️ Upload Bahan</Link>
          <Link href="/" className="admin-nav">🏠 Lihat Portal</Link>
        </nav>
      </aside>
      <main className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--ink3)', fontSize: '.9rem' }}>Memuat data...</div>
      </main>
    </div>
  )

  const maxDaily = Math.max(...(data?.daily.map((d) => d.count) || [1]), 1)
  const maxCat = Math.max(...(data?.byCategory.map((c) => c.count) || [1]), 1)
  const maxSrc = Math.max(...(data?.bySource.map((s) => s.count) || [1]), 1)

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">KC Admin</div>
        <nav>
          <Link href="/admin" className="admin-nav">📊 Ringkasan</Link>
          <a className="admin-nav active">📈 Analitik</a>
          <Link href="/admin/upload" className="admin-nav">✍️ Upload Bahan</Link>
          <Link href="/" className="admin-nav">🏠 Lihat Portal</Link>
        </nav>
      </aside>

      <main className="admin-main">
        <h1 className="admin-title">Analitik Portal</h1>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          {[
            { label: 'Total Artikel', val: data?.stats.totalArticles.toLocaleString('id-ID'), sub: 'Sepanjang waktu' },
            { label: 'Terbit Hari Ini', val: data?.stats.todayArticles, sub: 'Artikel baru' },
            { label: 'Total Dibaca', val: data?.stats.totalViews.toLocaleString('id-ID'), sub: 'Total page views' },
            { label: 'Sumber Aktif', val: data?.stats.activeSources, sub: 'RSS feeds' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-val">{s.val}</div>
              <div style={{ fontSize: '.68rem', color: 'var(--ink3)', marginTop: '.3rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="analytics-grid">
          {/* Bar chart - artikel per hari */}
          <div className="chart-card">
            <div className="chart-title">Artikel Terbit — 7 Hari Terakhir</div>
            <div className="bar-chart">
              {data?.daily.map((d, i) => (
                <div key={i} className="bar-item">
                  <div className="bar-label-top">{d.count > 0 ? d.count : ''}</div>
                  <div className="bar-wrap">
                    <div
                      className="bar-fill"
                      style={{ height: `${Math.max((d.count / maxDaily) * 100, d.count > 0 ? 8 : 2)}%`, background: d.count > 0 ? 'var(--red)' : 'var(--paper3)' }}
                    />
                  </div>
                  <div className="bar-label">{d.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Kategori */}
          <div className="chart-card">
            <div className="chart-title">Artikel per Kategori — 30 Hari</div>
            <div className="hbar-list">
              {data?.byCategory.map((c, i) => (
                <div key={c.name} className="hbar-item">
                  <div className="hbar-name">{c.name}</div>
                  <div className="hbar-track">
                    <div
                      className="hbar-fill"
                      style={{ width: `${(c.count / maxCat) * 100}%`, background: COLORS[i % COLORS.length] }}
                    />
                  </div>
                  <div className="hbar-val">{c.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sumber */}
          <div className="chart-card">
            <div className="chart-title">Artikel per Sumber — 30 Hari</div>
            <div className="hbar-list">
              {data?.bySource.map((s, i) => (
                <div key={s.name} className="hbar-item">
                  <div className="hbar-name">{s.name}</div>
                  <div className="hbar-track">
                    <div
                      className="hbar-fill"
                      style={{ width: `${(s.count / maxSrc) * 100}%`, background: COLORS[i % COLORS.length] }}
                    />
                  </div>
                  <div className="hbar-val">{s.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top artikel */}
          <div className="chart-card chart-card-full">
            <div className="chart-title">Artikel Paling Banyak Dibaca</div>
            <div className="top-articles">
              {data?.topArticles.map((a, i) => (
                <div key={a.slug} className="top-article-row">
                  <div className="top-rank">{i + 1}</div>
                  <div className="top-info">
                    <Link href={`/artikel/${a.slug}`} className="top-title" target="_blank">{a.title}</Link>
                    <div className="top-meta">{a.category} · {new Date(a.published_at).toLocaleDateString('id-ID')}</div>
                  </div>
                  <div className="top-views">
                    <span className="top-views-num">{(a.view_count || 0).toLocaleString('id-ID')}</span>
                    <span className="top-views-label">views</span>
                  </div>
                </div>
              ))}
              {(!data?.topArticles || data.topArticles.length === 0) && (
                <div style={{ color: 'var(--ink3)', fontSize: '.85rem', padding: '.5rem 0' }}>Belum ada data views.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
