# KabarCerdas — Panduan Setup & Deploy

Portal berita bertenaga AI dengan pipeline RSS → rewrite otomatis → publish.

## Struktur File

```
app/
  page.tsx                    ← Homepage (ISR 5 menit)
  layout.tsx                  ← Root layout + global styles
  globals.css                 ← Semua styling
  artikel/[slug]/page.tsx     ← Halaman artikel
  admin/page.tsx              ← Dashboard admin
  api/
    cron/fetch/route.ts       ← Cron: ambil RSS (tiap 2 jam)
    cron/rewrite/route.ts     ← Cron: rewrite artikel (tiap 2 jam + 30 menit)
    admin/stats/route.ts      ← API stats untuk admin
    sitemap/route.ts          ← Dynamic sitemap XML
lib/
  supabase.ts                 ← Client + semua query
  claude.ts                   ← AI rewriter engine
  rss.ts                      ← RSS parser + fetcher
  utils.ts                    ← Helpers (slugify, format tanggal, dll)
supabase/
  schema.sql                  ← Schema + RLS + seed sumber
```

## Setup (10 Langkah)

### 1. Clone & Install

```bash
git clone https://github.com/kamu/kabarcerdas.git
cd kabarcerdas
npm install
```

### 2. Buat Project Supabase

- Pergi ke https://supabase.com → New Project
- Catat: Project URL, anon key, service_role key

### 3. Jalankan Schema

Di Supabase Dashboard → SQL Editor → paste isi `supabase/schema.sql` → Run

### 4. Setup Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local dengan nilai dari Supabase & Anthropic
```

Generate CRON_SECRET:
```bash
openssl rand -hex 32
```

### 5. Test Lokal

```bash
npm run dev
# Buka http://localhost:3000
```

### 6. Push ke GitHub

```bash
git init
git add .
git commit -m "init: KabarCerdas"
gh repo create kabarcerdas --private --push
```

### 7. Deploy ke Vercel

```bash
npm i -g vercel
vercel --prod
```

Atau: Vercel Dashboard → Import Git Repository

### 8. Set Environment Variables di Vercel

Vercel Dashboard → Project → Settings → Environment Variables
→ Tambahkan semua variabel dari `.env.example`

### 9. Aktifkan Cron Jobs

Cron sudah dikonfigurasi di `vercel.json`. Akan aktif otomatis setelah deploy.
Untuk trigger manual: buka `https://kabarcerdas.id/api/cron/fetch` dengan header `Authorization: Bearer {CRON_SECRET}`

### 10. Verifikasi

- Homepage: `https://kabarcerdas.id`
- Admin: `https://kabarcerdas.id/admin`
- Sitemap: `https://kabarcerdas.id/api/sitemap`

## Alur Pipeline

```
Vercel Cron (tiap 2 jam)
  → /api/cron/fetch
  → Ambil RSS dari 6 sumber
  → Simpan ke articles_raw (skip duplikat)

Vercel Cron (tiap 2 jam 30 menit)
  → /api/cron/rewrite
  → Ambil 8 artikel yang belum diproses
  → Claude API: rewrite + kategorisasi + SEO
  → Simpan ke articles (status: published)
  → Update ISR homepage otomatis
```

## Estimasi Biaya Bulanan

| Layanan | Biaya |
|---------|-------|
| Vercel Pro | $20/bulan |
| Supabase | $0 (free tier cukup untuk awal) |
| Anthropic API | ~$15-30/bulan (tergantung volume) |
| Domain .id | ~$15/tahun |
| **Total** | **~$35-50/bulan** |

## Troubleshooting

**Artikel tidak muncul di homepage**
→ Cek Supabase: apakah ada data di tabel `articles` dengan status `published`?
→ Trigger manual: `curl -H "Authorization: Bearer {SECRET}" https://kabarcerdas.id/api/cron/fetch`

**Claude API error**
→ Cek `ANTHROPIC_API_KEY` di Vercel environment variables
→ Cek Anthropic dashboard untuk usage limit

**RSS tidak terfetch**
→ Beberapa RSS URL berubah dari waktu ke waktu. Update di tabel `sources` di Supabase Dashboard.

**Build error**
→ Pastikan semua env variables sudah diset di Vercel sebelum deploy
