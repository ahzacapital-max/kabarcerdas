'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { formatRelativeTime } from '@/lib/utils'

type Article = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  context_note: string | null
  category: string
  source_name: string | null
  reading_time: number
  published_at: string
}

type UserPrefs = {
  categories: string[]
  schedule: string
  onboarded: boolean
}

export default function PersonalizedFeed() {
  const [articles, setArticles] = useState<Article[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [prefs, setPrefs] = useState<UserPrefs | null>(null)
  const [userName, setUserName] = useState('')
  const observer = useRef<IntersectionObserver | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserName(data.user.user_metadata?.full_name?.split(' ')[0] || 'Kamu')
        supabase
          .from('user_preferences')
          .select('categories, schedule, onboarded')
          .eq('user_id', data.user.id)
          .single()
          .then(({ data: p }) => {
            if (p) setPrefs(p)
          })
      }
    })
  }, [])

  useEffect(() => {
    if (prefs) loadArticles(1, true)
  }, [prefs])

  async function loadArticles(p: number, reset = false) {
    if (loading) return
    setLoading(true)
    try {
      const cats = prefs?.categories?.join(',') || ''
      const res = await fetch(`/api/feed?page=${p}&categories=${encodeURIComponent(cats)}`)
      const data = await res.json()
      const newArticles = data.articles || []
      setArticles(prev => reset ? newArticles : [...prev, ...newArticles])
      setHasMore(newArticles.length === 10)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }

  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadArticles(page + 1)
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, hasMore, page])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return `Selamat pagi, ${userName} 👋`
    if (h < 17) return `Selamat siang, ${userName} 👋`
    return `Selamat malam, ${userName} 👋`
  }

  const scheduleLabel = () => {
    const map: Record<string, string> = {
      morning: 'Pagi Cerdas',
      afternoon: 'Siang Update',
      evening: 'Malam Ringkas',
      all: 'Berita Pilihan',
    }
    return map[prefs?.schedule || 'all']
  }

  return (
    <div className="feed-container">
      {/* Greeting bubble */}
      <div className="chat-date-label">
        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>

      <div className="chat-greeting-bubble">
        <div className="chat-avatar">KC</div>
        <div className="chat-bubble chat-bubble-left">
          <p>{greeting()}</p>
          <p>Ini <strong>{scheduleLabel()}</strong> untukmu — berita pilihan berdasarkan topik favoritmu.</p>
          <div className="chat-bubble-time">KabarCerdas · sekarang</div>
        </div>
      </div>

      {/* Artikel sebagai bubble */}
      {articles.map((article, i) => (
        <div
          key={article.id}
          ref={i === articles.length - 1 ? lastItemRef : null}
          className="chat-article-wrap"
        >
          <Link href={`/artikel/${article.slug}`} className="chat-article-bubble">
            <div className="chat-article-cat">{article.category}</div>
            <div className="chat-article-title">{article.title}</div>
            {article.excerpt && (
              <div className="chat-article-excerpt">{article.excerpt}</div>
            )}
            {article.context_note && (
              <div className="chat-sorotan">
                <span className="chat-sorotan-label">Sorotan</span>
                <span className="chat-sorotan-text">{article.context_note.slice(0, 120)}…</span>
              </div>
            )}
            <div className="chat-article-meta">
              {formatRelativeTime(article.published_at)} · {article.reading_time} menit baca
            </div>
          </Link>
        </div>
      ))}

      {loading && (
        <div className="feed-loading">
          <span /><span /><span />
        </div>
      )}

      {!hasMore && articles.length > 0 && (
        <div className="chat-end-bubble">
          <div className="chat-avatar">KC</div>
          <div className="chat-bubble chat-bubble-left">
            <p>Itu semua berita pilihan untuk hari ini. Sampai besok! 👋</p>
            <div className="chat-bubble-time">KabarCerdas</div>
          </div>
        </div>
      )}
    </div>
  )
}
