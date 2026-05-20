import { supabase } from '@/lib/supabase'

export const revalidate = 3600

export async function GET() {
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(500)

  const base = 'https://kabarcerdas.id'
  const staticPages = ['', '/tentang', '/kontak']

  const urls = [
    ...staticPages.map((p) => `
  <url>
    <loc>${base}${p}</loc>
    <changefreq>daily</changefreq>
    <priority>${p === '' ? '1.0' : '0.7'}</priority>
  </url>`),
    ...(articles ?? []).map(
      (a) => `
  <url>
    <loc>${base}/artikel/${a.slug}</loc>
    <lastmod>${new Date(a.published_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    ),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
