import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = supabaseAdmin()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const last7 = new Date(today)
    last7.setDate(last7.getDate() - 7)
    const last30 = new Date(today)
    last30.setDate(last30.getDate() - 30)

    // Artikel per hari (7 hari terakhir)
    const { data: dailyRaw } = await db
      .from('articles')
      .select('published_at')
      .eq('status', 'published')
      .gte('published_at', last7.toISOString())
      .order('published_at')

    // Artikel per kategori
    const { data: byCategory } = await db
      .from('articles')
      .select('category')
      .eq('status', 'published')
      .gte('published_at', last30.toISOString())

    // Top artikel by view
    const { data: topArticles } = await db
      .from('articles')
      .select('title, slug, view_count, category, published_at')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(10)

    // Total stats
    const { count: totalArticles } = await db
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    const { count: todayArticles } = await db
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', today.toISOString())

    const { data: totalViews } = await db
      .from('articles')
      .select('view_count')
      .eq('status', 'published')

    const { count: totalSources } = await db
      .from('sources')
      .select('id', { count: 'exact', head: true })
      .eq('active', true)

    // Artikel per sumber (30 hari)
    const { data: bySource } = await db
      .from('articles')
      .select('source_name')
      .eq('status', 'published')
      .gte('published_at', last30.toISOString())
      .not('source_name', 'is', null)

    // Process daily data
    const dailyMap: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      dailyMap[key] = 0
    }
    dailyRaw?.forEach((a) => {
      const key = a.published_at.slice(0, 10)
      if (dailyMap[key] !== undefined) dailyMap[key]++
    })

    // Process category
    const catMap: Record<string, number> = {}
    byCategory?.forEach((a) => {
      catMap[a.category] = (catMap[a.category] || 0) + 1
    })

    // Process source
    const srcMap: Record<string, number> = {}
    bySource?.forEach((a) => {
      if (a.source_name) srcMap[a.source_name] = (srcMap[a.source_name] || 0) + 1
    })

    const sumViews = totalViews?.reduce((s, a) => s + (a.view_count || 0), 0) || 0

    return NextResponse.json({
      stats: {
        totalArticles: totalArticles || 0,
        todayArticles: todayArticles || 0,
        totalViews: sumViews,
        activeSources: totalSources || 0,
      },
      daily: Object.entries(dailyMap).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
        count,
      })),
      byCategory: Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count })),
      bySource: Object.entries(srcMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count })),
      topArticles: topArticles || [],
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
