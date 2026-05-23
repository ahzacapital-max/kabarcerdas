'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import type { Article } from '@/lib/supabase'
import RecommendFeed from './RecommendFeed'

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  return `${d} hari lalu`
}

type Props = {
  initialArticles: Article[]
  batchSize: number
  category?: string
}

export default function InfiniteFeed({ initialArticles, batchSize, category }: Props) {
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(initialArticles.length)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(batchSize),
        offset: String(offsetRef.current),
      })
      if (category) params.set('category', category)
      const res = await fetch(`/api/feed?${params}`)
      const data = await res.json()
      if (data.articles?.length > 0) {
        setArticles((prev) => [...prev, ...data.articles])
        offsetRef.current += data.articles.length
      }
      setHasMore(data.hasMore)
    } catch {
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, batchSize, category])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="feed-container">
      {articles.map((article, i) => (
        <div key={article.id}>
          <article className={`feed-item${i === 0 ? ' feed-item--hero' : ''}`}>
            <Link href={`/artikel/${article.slug}`} className="feed-item-link">
              <div className="feed-item-category">{article.category}</div>
              <h2 className="feed-item-title">{article.title}</h2>
              <div className="feed-item-meta">
                <span>Redaksi KabarCerdas</span>
                <span className="feed-meta-dot">·</span>
                <span>{formatRelativeTime(article.published_at)}</span>
                {article.reading_time && (
                  <>
                    <span className="feed-meta-dot">·</span>
                    <span>{article.reading_time} mnt baca</span>
                  </>
                )}
              </div>
              {article.excerpt && (
                <p className="feed-item-excerpt">{article.excerpt}</p>
              )}
            </Link>
            <div className="feed-divider" />
          </article>

          {/* Sisipkan rekomendasi setelah artikel ke-5 */}
          {i === 4 && <RecommendFeed />}
        </div>
      ))}

      <div ref={sentinelRef} style={{ height: '1px' }} />

      {loading && (
        <div className="feed-loading">
          <span /><span /><span />
        </div>
      )}

      {!hasMore && articles.length > 0 && (
        <div className="feed-end">Kamu sudah membaca semua berita terbaru.</div>
      )}
    </div>
  )
}
