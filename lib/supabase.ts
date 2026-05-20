import { createClient } from '@supabase/supabase-js'

export type Article = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  context_note: string | null
  category: string
  tags: string[]
  source_name: string | null
  source_url: string | null
  reading_time: number
  view_count: number
  published_at: string
}

export type Source = {
  id: string
  name: string
  rss_url: string
  category: string
  active: boolean
  fetch_count: number
  last_fetched_at: string | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Service client untuk operasi server-side (cron, rewriter)
export const supabaseAdmin = () =>
  createClient(supabaseUrl, serviceKey)

// ─── Queries ──────────────────────────────────────────────

export async function getLatestArticles(limit = 10, category?: string) {
  let q = supabase
    .from('articles')
    .select('id,slug,title,excerpt,category,tags,source_name,reading_time,published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (category) q = q.eq('category', category)
  const { data, error } = await q
  if (error) throw error
  return data as Article[]
}

export async function getArticleBySlug(slug: string) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) throw error

  // increment view count (fire & forget)
  supabase
    .from('articles')
    .update({ view_count: (data.view_count ?? 0) + 1 })
    .eq('id', data.id)
    .then(() => {})

  return data as Article
}

export async function getArticlesByCategory(category: string, limit = 12) {
  return getLatestArticles(limit, category)
}

export async function getSources() {
  const { data, error } = await supabaseAdmin()
    .from('sources')
    .select('*')
    .order('name')
  if (error) throw error
  return data as Source[]
}

export async function getAdminStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [published, pending, sources] = await Promise.all([
    supabaseAdmin()
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', today.toISOString()),
    supabaseAdmin()
      .from('articles_raw')
      .select('id', { count: 'exact', head: true })
      .eq('processed', false),
    supabaseAdmin()
      .from('sources')
      .select('id', { count: 'exact', head: true })
      .eq('active', true),
  ])

  return {
    publishedToday: published.count ?? 0,
    pending: pending.count ?? 0,
    activeSources: sources.count ?? 0,
  }
}

export async function getQueueArticles(limit = 20) {
  const { data, error } = await supabaseAdmin()
    .from('articles')
    .select('id,slug,title,status,source_name,published_at')
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// Simpan artikel mentah dari RSS
export async function saveRawArticle(payload: {
  source_id: string
  title: string
  original_url: string
  original_content?: string
  author?: string
  published_at?: string
}) {
  const { data, error } = await supabaseAdmin()
    .from('articles_raw')
    .insert(payload)
    .select()
    .single()
  if (error && error.code !== '23505') throw error // ignore duplicate
  return data
}

// Simpan artikel hasil rewrite
export async function saveArticle(payload: Omit<Article, 'id' | 'view_count'> & { raw_id?: string }) {
  const { data, error } = await supabaseAdmin()
    .from('articles')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

// Mark raw sebagai processed
export async function markRawProcessed(rawId: string) {
  await supabaseAdmin()
    .from('articles_raw')
    .update({ processed: true })
    .eq('id', rawId)
}
