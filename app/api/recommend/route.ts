// app/api/recommend/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const session_id = searchParams.get('session_id')
  const limit = Number(searchParams.get('limit') || 6)

  try {
    // Kalau tidak ada session atau histori, return trending
    if (!session_id) {
      return NextResponse.json({ articles: await getTrending(limit), type: 'trending' })
    }

    // Ambil histori baca user — kategori & tag yang sering dibaca
    const { data: reads } = await supabaseAdmin()
      .from('user_reads')
      .select('category, tags, article_id')
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (!reads || reads.length < 2) {
      return NextResponse.json({ articles: await getTrending(limit), type: 'trending' })
    }

    // Hitung kategori favorit
    const catCount: Record<string, number> = {}
    const readIds: string[] = []
    for (const r of reads) {
      if (r.category) catCount[r.category] = (catCount[r.category] || 0) + 1
      if (r.article_id) readIds.push(r.article_id)
    }
    const topCategories = Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([cat]) => cat)

    // Ambil artikel terbaru dari kategori favorit, exclude yang sudah dibaca
    const { data: articles } = await supabaseAdmin()
      .from('articles')
      .select('id, title, slug, category, excerpt, published_at, reading_time')
      .eq('status', 'published')
      .in('category', topCategories)
      .not('id', 'in', `(${readIds.join(',')})`)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (!articles || articles.length === 0) {
      return NextResponse.json({ articles: await getTrending(limit), type: 'trending' })
    }

    return NextResponse.json({ articles, type: 'personal', categories: topCategories })
  } catch {
    return NextResponse.json({ articles: await getTrending(limit), type: 'trending' })
  }
}

async function getTrending(limit: number) {
  // Artikel terbanyak dibaca 24 jam terakhir
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: topReads } = await supabaseAdmin()
    .from('user_reads')
    .select('article_id')
    .gte('created_at', since)

  const countMap: Record<string, number> = {}
  for (const r of topReads ?? []) {
    if (r.article_id) countMap[r.article_id] = (countMap[r.article_id] || 0) + 1
  }

  const topIds = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)

  if (topIds.length > 0) {
    const { data } = await supabaseAdmin()
      .from('articles')
      .select('id, title, slug, category, excerpt, published_at, reading_time')
      .in('id', topIds)
      .eq('status', 'published')
    if (data && data.length > 0) return data
  }

  // Fallback: artikel terbaru
  const { data } = await supabaseAdmin()
    .from('articles')
    .select('id, title, slug, category, excerpt, published_at, reading_time')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)
  return data ?? []
}
