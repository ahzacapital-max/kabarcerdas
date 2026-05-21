import { supabaseAdmin, saveRawArticle } from './supabase'

type RssItem = {
  title: string
  link: string
  description?: string
  pubDate?: string
  author?: string
}

// Parse RSS XML sederhana tanpa dependency eksternal
function parseRSS(xml: string): RssItem[] {
  const items: RssItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`))
      return m ? (m[1] || m[2] || '').trim() : ''
    }

    const title = get('title')
    const link = get('link') || get('guid')
    if (title && link) {
      items.push({
        title,
        link,
        description: get('description').replace(/<[^>]+>/g, '').slice(0, 2000),
        pubDate: get('pubDate'),
        author: get('author') || get('dc:creator'),
      })
    }
  }
  return items
}

export async function fetchAndSaveSource(source: {
  id: string
  name: string
  rss_url: string
}): Promise<{ saved: number; skipped: number }> {
  let saved = 0
  let skipped = 0

  try {
    const res = await fetch(source.rss_url, {
      headers: { 'User-Agent': 'KabarCerdas RSS Reader/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const xml = await res.text()
    const items = parseRSS(xml).slice(0, 5) // max 15 per fetch

    for (const item of items) {
      try {
        await saveRawArticle({
          source_id: source.id,
          title: item.title,
          original_url: item.link,
          original_content: item.description,
          author: item.author,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
        })
        saved++
      } catch {
        skipped++ // duplicate atau error
      }
    }

    // Update last_fetched_at
    await supabaseAdmin()
      .from('sources')
      .update({ last_fetched_at: new Date().toISOString(), fetch_count: saved })
      .eq('id', source.id)

  } catch (err) {
    console.error(`Gagal fetch ${source.name}:`, err)
  }

  return { saved, skipped }
}

export async function fetchAllSources() {
  const { data: sources, error } = await supabaseAdmin()
    .from('sources')
    .select('id, name, rss_url')
    .eq('active', true)

  if (error) throw error

  let totalSaved = 0
  let totalSkipped = 0

  for (const source of sources ?? []) {
    const { saved, skipped } = await fetchAndSaveSource(source)
    totalSaved += saved
    totalSkipped += skipped
  }

  return { totalSaved, totalSkipped }
}

// Ambil artikel mentah yang belum diproses
export async function getUnprocessedRaw(limit = 10) {
  const { data, error } = await supabaseAdmin()
    .from('articles_raw')
    .select('id, title, original_content, original_url, sources(name)')
    .eq('processed', false)
    .order('fetched_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    content: r.original_content ?? '',
    url: r.original_url,
    source: r.sources?.name ?? 'Tidak diketahui',
  }))
}
