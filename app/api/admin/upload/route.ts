import { NextResponse } from 'next/server'
import { rewriteArticle } from '@/lib/claude'
import { saveArticle } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, content, source, type } = body

    if (!content || content.trim().length < 50) {
      return NextResponse.json({ error: 'Konten terlalu pendek' }, { status: 400 })
    }

    const result = await rewriteArticle({
      title: title || 'Artikel baru',
      content,
      source: source || 'Redaksi KabarCerdas',
      url: '',
    })

    // Jika type === 'preview', jangan simpan dulu
    if (type === 'preview') {
      return NextResponse.json({ ok: true, preview: result })
    }

    // Simpan ke database
    const article = await saveArticle({
      slug: result.slug,
      title: result.title,
      excerpt: result.excerpt,
      content: result.content,
      context_note: result.context_note,
      category: result.category,
      tags: result.tags,
      source_name: source || 'Redaksi KabarCerdas',
      source_url: null,
      seo_title: result.seo_title,
      seo_description: result.seo_description,
      reading_time: result.reading_time,
      published_at: new Date().toISOString(),
      status: 'published',
    })

    return NextResponse.json({ ok: true, slug: article.slug })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
