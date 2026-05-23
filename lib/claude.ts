import Anthropic from '@anthropic-ai/sdk'
import { slugify } from './utils'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type RewriteResult = {
  title: string
  excerpt: string
  content: string
  context_note: string
  category: string
  tags: string[]
  seo_title: string
  seo_description: string
  reading_time: number
  slug: string
}

const SYSTEM_PROMPT = `Kamu adalah wartawan senior Indonesia dengan 20 tahun pengalaman di media nasional terkemuka.

Tugas kamu adalah menulis ulang berita yang diberikan dengan standar jurnalisme berkualitas tinggi.

Panduan penulisan:
- Lead kuat di paragraf pertama: jawab who, what, when, where, why secara ringkas
- Gaya bahasa: lugas, berbobot, tidak sensasional, tidak clickbait
- Struktur: piramida terbalik — informasi terpenting di awal
- Panjang konten: 350-450 kata
- Bahasa: Indonesia formal namun mudah dipahami pembaca umum
- Tambahkan paragraf "Konteks & Signifikansi" yang menjelaskan mengapa berita ini penting
- Kategori HANYA: Nasional | Ekonomi | Teknologi | Dunia | Politik | Olahraga | Daerah | Viral
- Berita sepakbola, bola, liga, timnas → kategori: Olahraga
- Berita bisnis, keuangan, pasar modal, saham → kategori: Ekonomi
- Berita daerah HANYA jika menyebut Sumedang, Majalengka, atau Subang → kategori: Daerah. Selain itu masukkan ke Nasional
- PENTING: Jangan mengarang fakta spesifik seperti nama tempat, harga, atau lokasi yang tidak kamu ketahui pasti

PENTING: Selalu balas dalam format JSON yang valid. Jangan tambahkan teks apapun di luar JSON.`

export async function rewriteArticle(input: {
  title: string
  content: string
  source: string
  url: string
}): Promise<RewriteResult> {
  const prompt = `Tulis ulang berita berikut sesuai panduan. Balas HANYA dengan JSON valid tanpa markdown.

BERITA ASLI:
Judul: ${input.title}
Sumber: ${input.source}
Konten: ${input.content.slice(0, 3000)}

FORMAT JSON yang harus kamu kembalikan:
{
  "title": "judul baru yang informatif dan tidak clickbait (max 80 karakter)",
  "excerpt": "ringkasan 1-2 kalimat untuk preview (max 160 karakter)",
  "content": "konten artikel lengkap 350-450 kata dalam format paragraf HTML (<p>...</p>)",
  "context_note": "1 paragraf analisis konteks dan signifikansi berita ini (2-3 kalimat)",
  "category": "satu dari: Nasional | Ekonomi | Teknologi | Dunia | Politik | Olahraga | Daerah | Viral",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seo_title": "judul SEO optimal (50-60 karakter)",
  "seo_description": "meta description (120-155 karakter)",
  "reading_time": 3
}`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')

  const clean = text.replace(/```json\n?|\n?```/g, '').trim()
  const parsed = JSON.parse(clean) as RewriteResult

  parsed.slug = slugify(parsed.title) + '-' + Date.now().toString(36)
  parsed.reading_time = Math.max(2, Math.ceil((parsed.content.split(' ').length) / 200))

  return parsed
}

export async function batchRewrite(
  articles: Array<{ id: string; title: string; content: string; source: string; url: string }>,
  onDone?: (id: string, result: RewriteResult) => Promise<void>
) {
  const results = []
  for (const article of articles) {
    try {
      const result = await rewriteArticle(article)
      if (onDone) await onDone(article.id, result)
      results.push({ id: article.id, success: true, result })
    } catch (err) {
      console.error(`Gagal rewrite ${article.id}:`, err)
      results.push({ id: article.id, success: false, error: String(err) })
    }
    await new Promise((r) => setTimeout(r, 1500))
  }
  return results
}