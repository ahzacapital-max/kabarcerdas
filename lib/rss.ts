import { supabaseAdmin, saveRawArticle } from './supabase'

type RssItem = {
  title: string
  link: string
  description?: string
  pubDate?: string
  author?: string
}

// ─────────────────────────────────────────────
// SCORING SYSTEM
// ─────────────────────────────────────────────

const TRUSTED_SOURCES: Record<string, number> = {
  'antara':       30,
  'antaranews':   30,
  'bbc':          30,
  'tempo':        28,
  'kompas':       25,
  'detik':        22,
  'cnnindonesia': 22,
  'republika':    20,
  'tribun':       15,
  'liputan6':     15,
  'okezone':      10,
}

const HIGH_PRIORITY_KEYWORDS: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /presiden|jokowi|prabowo|wapres/i,          score: 40 },
  { pattern: /dpr|mpr|dprd|senayan|legislasi/i,          score: 35 },
  { pattern: /ekonomi|inflasi|rupiah|bi rate|kurs/i,     score: 35 },
  { pattern: /bencana|gempa|tsunami|banjir|longsor/i,    score: 38 },
  { pattern: /korupsi|kpk|tipikor|suap|koruptor/i,       score: 36 },
  { pattern: /timnas|piala|fifa|asian games|sea games/i, score: 32 },
  { pattern: /persib|persija|liga 1|psis|arema/i,        score: 28 },
  { pattern: /hukum|mahkamah|mk|ma|pengadilan/i,         score: 30 },
  { pattern: /kesehatan|wabah|virus|pandemi|vaksin/i,    score: 35 },
  { pattern: /pendidikan|beasiswa|kampus|kemdikbud/i,    score: 25 },
]

const LOW_PRIORITY_KEYWORDS: Array<{ pattern: RegExp; penalty: number }> = [
  { pattern: /gosip|selebritis|seleb|artis/i,  penalty: 30 },
  { pattern: /viral tiktok|tiktok|reels|fyp/i, penalty: 25 },
  { pattern: /zodiak|ramalan|horoskop/i,        penalty: 35 },
  { pattern: /resep|kuliner|makanan enak/i,     penalty: 20 },
  { pattern: /fashion|outfit|ootd/i,            penalty: 20 },
  { pattern: /drakor|kdrama|k-pop|kpop/i,       penalty: 15 },
]

export type ScoredRaw = {
  id: string
  title: string
  content: string
  url: string
  source: string
  score: number
  scoreBreakdown: {
    source: number
    topic: number
    length: number
    dedup: number
  }
}

export function scoreArticle(
  title: string,
  content: string,
  sourceName: string,
  recentTitles: string[] = []
): { score: number; breakdown: ScoredRaw['scoreBreakdown'] } {
  const text = `${title} ${content}`.toLowerCase()
  const sourceKey = sourceName.toLowerCase()

  // 1. Sumber terpercaya (0–30)
  let sourceScore = 0
  for (const [key, val] of Object.entries(TRUSTED_SOURCES)) {
    if (sourceKey.includes(key)) {
      sourceScore = val
      break
    }
  }

  // 2. Topik penting — ambil nilai tertinggi, kurangi jika ada keyword rendah
  let topicScore = 0
  for (const { pattern, score } of HIGH_PRIORITY_KEYWORDS) {
    if (pattern.test(text)) topicScore = Math.max(topicScore, score)
  }
  for (const { pattern, penalty } of LOW_PRIORITY_KEYWORDS) {
    if (pattern.test(text)) topicScore -= penalty
  }

  // 3. Panjang konten (+10 jika ≥200 karakter)
  const lengthScore = content.length >= 200 ? 10 : 0

  // 4. Anti-duplikat topik (+20 jika unik dalam batch)
  const titleWords = new Set(
    title.toLowerCase().split(/\s+/).filter((w) => w.length > 4)
  )
  const isDuplicate = recentTitles.some((recent) => {
    const overlap = recent
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4 && titleWords.has(w)).length
    return overlap >= 3
  })
  const dedupScore = isDuplicate ? 0 : 20

  const score = Math.min(100, Math.max(0, sourceScore + topicScore + lengthScore + dedupScore))

  return {
    score,
    breakdown: { source: sourceScore, topic: topicScore, length: lengthScore, dedup: dedupScore },
  }
}

// ─────────────────────────────────────────────
// RSS PARSER
// ─────────────────────────────────────────────

function parseRSS(xml: string): RssItem[] {
  const items: RssItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const get = (tag: string) => {
      const m = block.match(
        new RegExp(
          `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`
        )
      )
      return m ? (m[1] || m[2] || '').trim() : ''
    }

    const title = get('title')
    const link = get('link') || get('guid')
    if (!title || !link) continue

    items.push({
      title,
      link,
      description: get('description').replace(/<[^>]+>/g, '').slice(0, 2000),
      pubDate: get('pubDate'),
      author: get('author') || get('dc:creator'),
    })
  }

  return items
}

// ─────────────────────────────────────────────
// FETCH & SAVE
// ─────────────────────────────────────────────

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
    const items = parseRSS(xml).slice(0, 5)

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

    await supabaseAdmin()
      .from('sources')
      .update({ last_fetched_at: new Date().toISOString(), fetch_count: saved })
      .eq('id', source.id)
  } catch (err) {
    console.error(`Gagal fetch ${source.name}:`, err)
  }

  return { saved, skipped }
}

/**
 * Fetch 5 sumber yang paling lama tidak di-fetch.
 * Karena last_fetched_at diupdate setiap run, semua sumber bergilir otomatis.
 */
export async function fetchAllSources(batchSize = 5) {
  const { data: sources, error } = await supabaseAdmin()
    .from('sources')
    .select('id, name, rss_url, last_fetched_at')
    .eq('active', true)
    .order('last_fetched_at', { ascending: true, nullsFirst: true })
    .limit(batchSize)

  if (error) throw error

  let totalSaved = 0
  let totalSkipped = 0

  for (const source of sources ?? []) {
    const { saved, skipped } = await fetchAndSaveSource(source)
    totalSaved += saved
    totalSkipped += skipped
  }

  return { totalSaved, totalSkipped, fetched: (sources ?? []).length }
}

// ─────────────────────────────────────────────
// QUERY: ambil artikel mentah + scoring
// ─────────────────────────────────────────────

const SCORE_THRESHOLD = 40

/**
 * Ambil artikel mentah yang belum diproses, sudah di-score & diurutkan skor tertinggi.
 * Artikel skor < SCORE_THRESHOLD di-skip otomatis.
 */
export async function getUnprocessedRaw(limit = 10): Promise<ScoredRaw[]> {
  const { data, error } = await supabaseAdmin()
    .from('articles_raw')
    .select('id, title, original_content, original_url, sources(name)')
    .eq('processed', false)
    .order('fetched_at', { ascending: true })
    .limit(limit * 4) // ambil lebih banyak supaya setelah filter masih cukup

  if (error) throw error

  const acceptedTitles: string[] = []
  const scored: ScoredRaw[] = []

  for (const r of data ?? []) {
    const title = r.title ?? ''
    const content = r.original_content ?? ''
    const source = (r.sources as any)?.name ?? 'Tidak diketahui'

    const { score, breakdown } = scoreArticle(title, content, source, acceptedTitles)
    if (score < SCORE_THRESHOLD) continue

    scored.push({
      id: r.id,
      title,
      content,
      url: r.original_url ?? '',
      source,
      score,
      scoreBreakdown: breakdown,
    })
    acceptedTitles.push(title)
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}
