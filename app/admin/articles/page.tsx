'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Article = {
  id: string
  slug: string
  title: string
  category: string
  source_name: string
  published_at: string
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => setArticles(d.queue || []))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Hapus artikel:\n"${title}"?`)) return
    setDeleting(id)
    try {
      await fetch('/api/admin/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setArticles((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      alert('Gagal menghapus artikel')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">KC Admin</div>
        <nav>
          <Link href="/admin" className="admin-nav">📊 Ringkasan</Link>
          <Link href="/admin/analytics" className="admin-nav">📈 Analitik</Link>
          <Link href="/admin/upload" className="admin-nav">✍️ Upload Bahan</Link>
          <a className="admin-nav active">📰 Kelola Artikel</a>
          <Link href="/" className="admin-nav">🏠 Lihat Portal</Link>
        </nav>
      </aside>

      <main className="admin-main">
        <h1 className="admin-title">Kelola Artikel</h1>
        {loading ? (
          <div style={{ color: 'var(--ink3)', fontSize: '.9rem' }}>Memuat...</div>
        ) : (
          <div className="queue-table">
            <div className="queue-head">
              <span>Judul</span>
              <span>Kategori</span>
              <span>Sumber</span>
              <span>Waktu</span>
              <span>Aksi</span>
            </div>
            {articles.map((a) => (
              <div key={a.id} className="queue-row" style={{ gridTemplateColumns: '2fr 80px 100px 70px 60px' }}>
                <Link href={`/artikel/${a.slug}`} className="queue-title" target="_blank">{a.title}</Link>
                <span className="queue-source">{a.category}</span>
                <span className="queue-source">{a.source_name || '—'}</span>
                <span className="queue-time">
                  {new Date(a.published_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => handleDelete(a.id, a.title)}
                  disabled={deleting === a.id}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--red)',
                    cursor: 'pointer',
                    fontSize: '.8rem',
                    fontWeight: 500,
                    opacity: deleting === a.id ? .5 : 1
                  }}
                >
                  {deleting === a.id ? '...' : 'Hapus'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}