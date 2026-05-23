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
  'antara':   30,
  'antaranews': 30,
  'bbc':      30,
  'tempo':    28,
  'kompas':   25,
  'detik':    22,
  'cnnindonesia': 22,
  'republika': 20,
  'tribun':   15,
  'liputan6': 15,
  'okezone':  10,
}

// Kata kunci topik PENTING → skor tinggi
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

// Kata kunci topik RENDAH NILAI → kurangi skor
const LOW_PRIORITY_KEYWORDS: Array<{ pattern: RegExp; penalty: number }> = [
  { pattern: /gosip|selebritis|seleb|artis/i,   penalty: 30 },
  { pattern: /viral tiktok|tiktok|reels|fyp/i,  penalty: 25 },
  { pattern: /zodiak|ramalan|horoskop/i,         penalty: 35 },
  { pattern: /resep|kuliner|makanan enak/i,      penalty: 20 },
  { pattern: /fashion|outfit|ootd/i,             penalty: 20 },
  { pattern: /drakor|kdrama|k-pop|kpop/i,        penalty: 15 },
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

/**
 * Hitung skor artikel mentah (0–100).
 * @param title        Judul artikel
 * @param content      Konten/deskripsi artikel
 * @param sourceName   Nama sumber RSS
 * @param recentTitles Judul-judul artikel lain yang sudah diambil sesi ini (anti-duplikat topik)
 */
export function scoreArticle(
  title: string,
  content: string,
  sourceName: string,
  recentTitles: string[] = []
): { score: number; breakdown: { source: number; topic: number; length: number; dedup: number } } {
  const text = `${title} ${content}`.toLowerCase()
  const sourceKey = sourceName.toLowerCase()

  // ── 1. Sumber terpercaya (0–30) ──────────────────────────────────────
  let sourceScore = 0
  for (const [key, val] of Object.entries(TRUSTED_SOURCES)) {
    if (sourceKey.includes(key)) {
      sourceScore = val
      break
    }
  }

  // ── 2. Topik penting (-40 s/d +40) ───────────────────────────────────
  let topicScore = 0
  for (const { pattern, score } of HIGH_PRIORITY_KEYWORDS) {
    if (pattern.test(text)) {
      topicScore = Math.max(topicScore, score) // ambil yang tertinggi, tidak dikumulatif
    }
  }
  for (const { pattern, penalty } of LOW_PRIORITY_KEYWORDS) {
    if (pattern.test(text)) {
      topicScore -= penalty
    }
  }

  // ── 3. Panjang konten (+10 jika ≥200 karakter) ───────────────────────
  const lengthScore = content.length >= 200 ? 10 : 0

  // ── 4. Anti-duplikat topik (+20 jika unik, 0 jika mirip) ─────────────
  //    Cek apakah ada ≥3 kata kunci yang overlap dengan judul-judul terbaru
  const titleWords = new Set(
    title.toLowerCase().split(/\s+/).filter((w) => w.length > 4)
  )
  let overlapCount = 0
  for (const recent of recentTitles) {
    const recentWords = recent.toLowerCase().split(/\s+/).filter((w) => w.length > 4)
    const overlap = recentWords.filter((w) => titleWords.has(w)).length
    if (overlap >= 3) {
      overlapCount++
      break
    }
  }
  const dedupScore = overlapCount === 0 ? 20 : 0

  const rawScore = sourceScore + topicScore + lengthScore + dedupScore
  const score = Math.min(100, Math.max(0, rawScore))

  return {
    score,
    breakdown: {
      source: sourceScore,
      topic: topicScore,
      length: lengthScore,
      dedup: dedupScore,
    },
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

    const pubDateStr = get('pubDate')

    // Skip berita lebih dari 24 jam
    if (pubDateStr) {
      const age = Date.now() - new Date(pubDateStr).getTime()
      if (age > 24 * 60 * 60 * 1000) continue
    }

    items.push({
      title,
      link,
      description: get('description').replace(/<[^>]+>/g, '').slice(0, 2000),
      pubDate: pubDateStr,
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
    const items = parseRSS(xml).slice(0, 15)

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
        skipped++
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

// ─────────────────────────────────────────────
// QUERY: ambil artikel mentah + scoring
// ─────────────────────────────────────────────

const SCORE_THRESHOLD = 40 // artikel di bawah ini di-skip

/**
 * Ambil artikel mentah yang belum diproses, sudah di-score & diurutkan.
 * Artikel dengan skor < SCORE_THRESHOLD otomatis di-skip.
 * Anti-duplikat topik dihitung dalam batch yang sama.
 */
export async function getUnprocessedRaw(limit = 10): Promise<ScoredRaw[]> {
  // Ambil lebih banyak dari DB supaya setelah filter masih cukup
  const fetchLimit = limit * 4

  const { data, error } = await supabaseAdmin()
    .from('articles_raw')
    .select('id, title, original_content, original_url, sources(name)')
    .eq('processed', false)
    .order('fetched_at', { ascending: true })
    .limit(fetchLimit)

  if (error) throw error

  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title ?? '',
    content: r.original_content ?? '',
    url: r.original_url ?? '',
    source: r.sources?.name ?? 'Tidak diketahui',
  }))

  // Hitung skor — anti-duplikat dihitung terhadap judul-judul yang sudah diterima
  const acceptedTitles: string[] = []
  const scored: ScoredRaw[] = []

  for (const row of rows) {
    const { score, breakdown } = scoreArticle(row.title, row.content, row.source, acceptedTitles)

    if (score < SCORE_THRESHOLD) continue // skip artikel berkualitas rendah

    scored.push({ ...row, score, scoreBreakdown: breakdown })
    acceptedTitles.push(row.title)
  }

  // Urutkan skor tertinggi dulu, ambil sejumlah limit
  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}
