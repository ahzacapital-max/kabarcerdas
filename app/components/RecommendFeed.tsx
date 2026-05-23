// app/components/RecommendFeed.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSessionId } from '@/lib/useSession'

type Article = {
  id: string
  title: string
  slug: string
  category: string
  excerpt?: string
  published_at: string
  reading_time?: number
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}

export default function RecommendFeed() {
  const [articles, setArticles] = useState<Article[]>([])
  const [type, setType] = useState<'personal' | 'trending'>('trending')
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session_id = getSessionId()
    fetch(`/api/recommend?session_id=${session_id}&limit=6`)
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles ?? [])
        setType(data.type ?? 'trending')
        setCategories(data.categories ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="feed-loading" style={{ margin: '1.5rem 0' }}>
      <span /><span /><span />
    </div>
  )

  if (articles.length === 0) return null

  const label = type === 'personal'
    ? `Pilihan untuk kamu · ${categories.join(', ')}`
    : 'Sedang banyak dibaca'

  return (
    <section className="recommend-section">
      <div className="recommend-label">{label}</div>
      <div className="recommend-grid">
        {articles.map((article) => (
          <Link key={article.id} href={`/artikel/${article.slug}`} className="recommend-item">
            <div className="feed-item-category">{article.category}</div>
            <div className="recommend-title">{article.title}</div>
            <div className="feed-item-meta">
              <span>{formatRelativeTime(article.published_at)}</span>
              {article.reading_time && (
                <>
                  <span className="feed-meta-dot">·</span>
                  <span>{article.reading_time} mnt baca</span>
                </>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
