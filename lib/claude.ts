import Anthropic from '@anthropic-ai/sdk'
import { slugify } from './utils'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type RewriteResult = {
  title: string
  excerpt: string
  content: string
  context_note: string
  sorotan_cerdas: string
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
- Jika berita tentang sepak bola (Liga Indonesia, Liga Inggris, Liga Champions, timnas, transfer pemain, dll) WAJIB kategori: Sepakbola
- Jika berita tentang olahraga selain sepak bola (bulutangkis, basket, atletik, dll) kategori: Olahraga
- Kategori "Daerah" HANYA untuk berita yang secara spesifik terjadi di atau menyangkut wilayah: Sumedang, Majalengka, atau Subang. Jika berita daerah dari wilayah lain (Bandung, Jakarta, Bekasi, dll), pilih kategori lain yang sesuai (Nasional, Ekonomi, Politik, dll) — JANGAN gunakan kategori Daerah.
- Jika berita menyebut Sumedang, Majalengka, atau Subang tapi juga relevan secara nasional, tetap gunakan kategori Daerah.
- Tulis bagian "Konteks & Signifikansi" yang menjawab 4 pertanyaan ini dalam 1 paragraf padat:
  1. Apa latar belakang kejadian ini?
  2. Kenapa isu ini penting?
  3. Dampaknya ke masyarakat/bisnis/politik?
  4. Apa yang kemungkinan terjadi selanjutnya?

- Tulis "Sorotan Cerdas": 1-2 kalimat yang menangkap makna terdalam berita — bukan ringkasan, bukan opini dangkal, tapi insight yang membuat pembaca berkata "oh, iya juga ya". Harus terasa seperti catatan pinggir dari seorang analis berpengalaman yang melihat pola atau implikasi di balik fakta yang dilaporkan.
  
  ATURAN KETAT untuk Sorotan Cerdas:
  - JANGAN mulai dengan: "Hal ini menunjukkan", "Perlu dicermati", "Patut diperhatikan", "Ini merupakan", "Kondisi ini"
  - JANGAN hanya mengulang isi berita dengan kata berbeda
  - HARUS mulai langsung dengan substansi atau perspektif yang tidak ada di berita
  - HARUS spesifik — sebutkan implikasi konkret, bukan pernyataan umum
  
  Contoh BURUK: "Kebijakan ini perlu dicermati karena berdampak pada masyarakat luas dan perekonomian nasional."
  Contoh BURUK: "Penurunan IHSG ini menunjukkan bahwa investor sedang khawatir terhadap kondisi ekonomi."
  Contoh BAIK: "Di balik angka pertumbuhan yang solid, tekanan pada daya beli kelas menengah justru semakin dalam — sinyal bahwa pemulihan ekonomi belum merata ke bawah."
  Contoh BAIK: "Pelemahan rupiah kali ini bukan sekadar tekanan eksternal; pasar sedang menguji seberapa dalam komitmen Bank Indonesia menjaga stabilitas tanpa mengorbankan pertumbuhan."
  Contoh BAIK: "Transfer senilai ini bukan hanya soal bakat — ini adalah pernyataan bahwa klub sedang membangun narasi baru untuk menarik investor dan sponsor kelas dunia."

- PENTING: Jangan mengarang fakta spesifik seperti nama tempat, harga, atau lokasi yang tidak kamu ketahui pasti.

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
  "context_note": "1 paragraf padat menjawab: latar belakang, mengapa penting, dampak, kemungkinan selanjutnya (3-4 kalimat)",
  "sorotan_cerdas": "1-2 kalimat insight tajam — mulai langsung dengan substansi, ungkap pola atau implikasi tersembunyi, BUKAN ringkasan berita",
  "category": "satu dari: Nasional | Ekonomi | Bisnis | Teknologi | Dunia | Politik | Olahraga | Sepakbola | Daerah | Viral",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seo_title": "judul SEO optimal (50-60 karakter)",
  "seo_description": "meta description (120-155 karakter)",
  "reading_time": 3
}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ] as any,
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
