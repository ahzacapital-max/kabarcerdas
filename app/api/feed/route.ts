import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category') || ''

    let query = supabase
      .from('articles')
      .select('id,slug,title,excerpt,category,context_note,reading_time,published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) query = query.eq('category', category)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ articles: data ?? [], hasMore: (data ?? []).length === limit })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
