'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Stats = { publishedToday: number; pending: number; activeSources: number }
type QueueItem = { id: string; slug: string; title: string; status: string; source_name: string; published_at: string }

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => { setStats(d.stats); setQueue(d.queue) })
      .finally(() => setLoading(false))
  }, [])

  async function triggerCron(type: 'fetch' | 'rewrite') {
    setRunning(type)
    setMessage(null)
    try {
      const res = await fetch(`/api/cron/${type}`, {
        headers: { authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}` },
      })
      const data = await res.json()
      setMessage(type === 'fetch'
        ? `✓ Fetch selesai: ${data.totalSaved} artikel baru`
        : `✓ Rewrite selesai: ${data.processed} artikel diproses`)
    } catch {
      setMessage('✗ Gagal menjalankan proses')
    } finally {
      setRunning(null)
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      published: 'badge-pub',
      draft: 'badge-pend',
      rejected: 'badge-rej',
    }
    const label: Record<string, string> = {
      published: 'Terbit',
      draft: 'Draft',
      rejected: 'Ditolak',
    }
    return <span className={`badge ${map[status] || 'badge-pend'}`}>{label[status] || status}</span>
  }

  if (loading) return <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Memuat...</div>

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">KC Admin</div>
        <nav>
  <Link href="/admin" className="admin-nav active">📊 Ringkasan</Link>
  <Link href="/admin/analytics" className="admin-nav">📈 Analitik</Link>
  <Link href="/admin/upload" className="admin-nav">✍️ Upload Bahan</Link>
  <Link href="/" className="admin-nav">🏠 Lihat Portal</Link>
</nav>
      </aside>

      <main className="admin-main">
        <h1 className="admin-title">Ringkasan</h1>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Terbit Hari Ini</div>
            <div className="stat-val">{stats?.publishedToday ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Menunggu Proses</div>
            <div className="stat-val">{stats?.pending ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sumber Aktif</div>
            <div className="stat-val">{stats?.activeSources ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Fetch Berikutnya</div>
            <div className="stat-val">~2j</div>
          </div>
        </div>

        {/* Manual trigger */}
        <div className="action-row">
          <button
            className="action-btn"
            onClick={() => triggerCron('fetch')}
            disabled={!!running}
          >
            {running === 'fetch' ? 'Mengambil...' : '📡 Fetch Sekarang'}
          </button>
          <button
            className="action-btn"
            onClick={() => triggerCron('rewrite')}
            disabled={!!running}
          >
            {running === 'rewrite' ? 'Memproses...' : '✍️ Rewrite Sekarang'}
          </button>
          {message && <span className="action-msg">{message}</span>}
        </div>

        {/* Queue */}
        <h2 className="section-title">Artikel Terbaru</h2>
        <div className="queue-table">
          <div className="queue-head">
            <span>Judul</span>
            <span>Sumber</span>
            <span>Status</span>
            <span>Waktu</span>
          </div>
          {queue.map((item) => (
            <div key={item.id} className="queue-row">
              <Link href={`/artikel/${item.slug}`} className="queue-title">{item.title}</Link>
              <span className="queue-source">{item.source_name || '—'}</span>
              <span>{statusBadge(item.status)}</span>
              <span className="queue-time">
                {new Date(item.published_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
