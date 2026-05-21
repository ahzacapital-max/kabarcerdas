import { NextResponse } from 'next/server'
import { getUnprocessedRaw } from '@/lib/rss'
import { rewriteArticle } from '@/lib/claude'
import { saveArticle, markRawProcessed } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const raws = await getUnprocessedRaw(5) // proses 8 artikel per run
    if (raws.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, message: 'Tidak ada artikel baru' })
    }

    let processed = 0
    let failed = 0

    for (const raw of raws) {
      try {
        const result = await rewriteArticle({
          title: raw.title,
          content: raw.content,
          source: raw.source,
          url: raw.url,
        })

        await saveArticle({
          raw_id: raw.id,
          slug: result.slug,
          title: result.title,
          excerpt: result.excerpt,
          content: result.content,
          context_note: result.context_note,
          category: result.category,
          tags: result.tags,
          source_name: raw.source,
          source_url: raw.url,
          seo_title: result.seo_title,
          seo_description: result.seo_description,
          reading_time: result.reading_time,
          published_at: new Date().toISOString(),
          status: 'published',
        })

        await markRawProcessed(raw.id)
        processed++

        // Delay antar artikel
        await new Promise((r) => setTimeout(r, 1500))
      } catch (err) {
        console.error(`[CRON rewrite] Gagal proses ${raw.id}:`, err)
        failed++
      }
    }

    return NextResponse.json({ ok: true, processed, failed })
  } catch (err) {
    console.error('[CRON rewrite] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
