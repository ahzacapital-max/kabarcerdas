'use client'

import { useState } from 'react'
import Link from 'next/link'

type PreviewResult = {
  title: string
  excerpt: string
  content: string
  context_note: string
  category: string
  tags: string[]
  reading_time: number
  slug: string
}

export default function UploadPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [published, setPublished] = useState(false)
  const [error, setError] = useState('')
  const [charCount, setCharCount] = useState(0)

  async function handlePreview() {
    if (content.trim().length < 50) {
      setError('Minimal 50 karakter konten')
      return
    }
    setLoading(true)
    setError('')
    setPreview(null)
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, source, type: 'preview' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPreview(data.preview)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handlePublish() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, source, type: 'publish' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPublished(true)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setTitle('')
    setContent('')
    setSource('')
    setPreview(null)
    setPublished(false)
    setError('')
    setCharCount(0)
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">KC Admin</div>
        <nav>
          <Link href="/admin" className="admin-nav">📊 Ringkasan</Link>
          <Link href="/admin/analytics" className="admin-nav">📈 Analitik</Link>
          <a className="admin-nav active">✍️ Upload Bahan</a>
          <Link href="/" className="admin-nav">🏠 Lihat Portal</Link>
        </nav>
      </aside>

      <main className="admin-main">
        {published ? (
          <div className="upload-success">
            <div className="success-icon">✓</div>
            <h2>Artikel Berhasil Diterbitkan!</h2>
            <p>Artikel sudah live di KabarCerdas</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button className="action-btn" onClick={handleReset}>Upload Lagi</button>
              <Link href="/" className="action-btn" style={{ textDecoration: 'none' }}>Lihat Portal</Link>
            </div>
          </div>
        ) : !preview ? (
          <>
            <h1 className="admin-title">Upload Bahan Berita</h1>
            <p style={{ fontSize: '.85rem', color: 'var(--ink3)', marginBottom: '1.5rem' }}>
              Paste press release, catatan wawancara, atau konten apapun — AI akan menulis ulang jadi artikel berkualitas editorial KabarCerdas.
            </p>

            <div className="upload-form">
              <div className="form-group">
                <label className="form-label">Judul / Topik <span style={{color:'var(--ink3)'}}}>(opsional)</span></label>
                <input
                  className="form-input"
                  placeholder="Contoh: Peluncuran Produk Baru PT XYZ"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nama Sumber / Klien <span style={{color:'var(--ink3)'}}}>(opsional)</span></label>
                <input
                  className="form-input"
                  placeholder="Contoh: PT Maju Bersama, Pemkab Sumedang"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Konten / Bahan Berita
                  <span style={{ color: 'var(--ink3)', fontWeight: 400, marginLeft: '.5rem' }}>
                    {charCount} karakter
                  </span>
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="Paste press release, catatan wawancara, laporan, atau konten lainnya di sini..."
                  value={content}
                  onChange={(e) => { setContent(e.target.value); setCharCount(e.target.value.length) }}
                  rows={12}
                />
              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="form-actions">
                <button
                  className="action-btn action-btn-primary"
                  onClick={handlePreview}
                  disabled={loading || content.trim().length < 50}
                >
                  {loading ? (
                    <span className="loading-dots">AI sedang menulis<span>.</span><span>.</span><span>.</span></span>
                  ) : '✨ Proses dengan AI'}
                </button>
                <span style={{ fontSize: '.75rem', color: 'var(--ink3)' }}>~30 detik</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h1 className="admin-title" style={{ margin: 0 }}>Preview Artikel</h1>
              <button className="action-btn" onClick={() => setPreview(null)} style={{ background: 'transparent', color: 'var(--ink2)', border: '1px solid var(--paper3)' }}>
                ← Edit Ulang
              </button>
            </div>

            <div className="preview-card">
              <div className="preview-meta">
                <span className="preview-cat">{preview.category}</span>
                <span style={{ fontSize: '.72rem', color: 'var(--ink3)' }}>{preview.reading_time} menit baca</span>
              </div>
              <h2 className="preview-title">{preview.title}</h2>
              {preview.context_note && (
                <div className="context-box-top" style={{ margin: '1rem 0' }}>
                  <div className="context-box-label"><span className="context-dot" />Konteks &amp; Signifikansi</div>
                  <p>{preview.context_note}</p>
                </div>
              )}
              <p className="preview-excerpt">{preview.excerpt}</p>
              <div className="preview-body" dangerouslySetInnerHTML={{ __html: preview.content }} />
              <div className="preview-tags">
                {preview.tags.map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="form-actions" style={{ marginTop: '1.5rem' }}>
              <button
                className="action-btn action-btn-primary"
                onClick={handlePublish}
                disabled={loading}
              >
                {loading ? 'Menerbitkan...' : '🚀 Terbitkan Sekarang'}
              </button>
              <button className="action-btn" onClick={handleReset} style={{ background: 'transparent', color: 'var(--ink2)', border: '1px solid var(--paper3)' }}>
                Batal
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
