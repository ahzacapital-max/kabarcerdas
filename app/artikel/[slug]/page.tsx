import { getArticleBySlug, getLatestArticles } from '@/lib/supabase'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const article = await getArticleBySlug(slug)
    return {
      title: article.seo_title || article.title + ' — KabarCerdas',
      description: article.seo_description || article.excerpt || '',
    }
  } catch {
    return { title: 'Artikel — KabarCerdas' }
  }
}

export const revalidate = 3600

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  let article
  try {
    article = await getArticleBySlug(slug)
  } catch {
    notFound()
  }

  const related = await getLatestArticles(4, article.category)
  const others = related.filter((a) => a.slug !== article.slug).slice(0, 3)

  return (
    <div className="article-layout">
      <main className="article-main">
        <Link href="/" className="back-btn">← Beranda</Link>
        <article>
          <header className="article-header">
            <div className="article-cat">
              <Link href={`/kategori/${article.category.toLowerCase()}`}>{article.category}</Link>
            </div>
            <h1 className="article-title">{article.title}</h1>
            <div className="article-meta">
              <span>Redaksi KabarCerdas</span>
              <span>·</span>
              <span>{formatDate(article.published_at)}</span>
              <span>·</span>
              <span>{article.reading_time} menit baca</span>
              {article.source_name && (
                <>
                  <span>·</span>
                  <span>Sumber: {article.source_name}</span>
                </>
              )}
            </div>
          </header>
          {article.excerpt && <p className="article-lead">{article.excerpt}</p>}
          <div className="article-body" dangerouslySetInnerHTML={{ __html: article.content }} />
          {article.context_note && (
            <div className="context-box">
              <h4>Konteks &amp; Signifikansi</h4>
              <p>{article.context_note}</p>
            </div>
          )}
          {article.tags && article.tags.length > 0 && (
            <div className="article-tags">
              {article.tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
{/* Share buttons */}
          <div style={{ display: 'flex', gap: '.75rem', margin: '1.5rem 0', alignItems: 'center' }}>
            <span style={{ fontSize: '.72rem', color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Bagikan</span>
            <a href={`https://wa.me/?text=${encodeURIComponent(article.title + ' https://kabarcerdaspisan.vercel.app/artikel/' + article.slug)}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" style={{ display: 'flex' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#25D366"/><path d="M23 9a9.9 9.9 0 0 0-7-2.9C11.1 6.1 7 10.2 7 15.2c0 1.6.4 3.2 1.2 4.6L7 25l5.4-1.4a9.8 9.8 0 0 0 4.6 1.2c5 0 9.1-4.1 9.1-9.1 0-2.4-1-4.7-2.7-6.4l-.4-.3zm-7 14a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.2.8.9-3.1-.2-.3A8.1 8.1 0 0 1 7.9 15c0-4.5 3.7-8.2 8.2-8.2 2.2 0 4.3.9 5.8 2.4a8.1 8.1 0 0 1-5.9 13.8zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.9 6.9 0 0 1-2-1.2 7.5 7.5 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.5c.1-.1.2-.3.2-.4 0-.2 0-.3-.1-.5-.1-.2-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.1 0 1.3.9 2.5 1 2.7.1.1 1.8 2.8 4.5 3.8.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.4-.2z" fill="white"/></svg>
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://kabarcerdaspisan.vercel.app/artikel/' + article.slug)}`} target="_blank" rel="noopener noreferrer" title="Facebook" style={{ display: 'flex' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#1877F2"/><path d="M21 16h-3v9h-4v-9h-2v-3h2v-2c0-2.6 1.1-4 4-4h2v3h-1c-1 0-1 .4-1 1v2h2.1L21 16z" fill="white"/></svg>
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent('https://kabarcerdaspisan.vercel.app/artikel/' + article.slug)}`} target="_blank" rel="noopener noreferrer" title="X" style={{ display: 'flex' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#000"/><path d="M17.7 14.8L23 9h-1.3l-4.6 5.2L13.3 9H9l5.6 7.9L9 23h1.3l4.9-5.5 3.9 5.5H23l-5.3-8.2zm-1.7 2l-.6-.8-4.6-6.4h2l3.7 5.2.6.8 4.8 6.7h-2l-3.9-5.5z" fill="white"/></svg>
            </a>
            <a href={`https://t.me/share/url?url=${encodeURIComponent('https://kabarcerdaspisan.vercel.app/artikel/' + article.slug)}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noopener noreferrer" title="Telegram" style={{ display: 'flex' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#26A5E4"/><path d="M23.5 9.2l-2.8 13.2c-.2.9-.8 1.1-1.5.7l-4-3-1.9 1.8c-.2.2-.4.3-.8.3l.3-4.1 7-6.2c.3-.3 0-.4-.4-.2l-8.6 5.3-3.7-1.2c-.8-.3-.8-.8.2-1.1l14.4-5.5c.7-.3 1.3.2 1.1 1z" fill="white"/></svg>
            </a>
            <a href={`https://www.threads.net/intent/post?text=${encodeURIComponent(article.title + ' https://kabarcerdaspisan.vercel.app/artikel/' + article.slug)}`} target="_blank" rel="noopener noreferrer" title="Threads" style={{ display: 'flex' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#000"/><path d="M20.5 15.5c-.1-.1-.3-.1-.4-.2-.1-1.8-1-2.8-2.7-2.8-1 0-1.8.5-2.3 1.3l1 .6c.4-.5.9-.8 1.4-.8.9 0 1.4.5 1.6 1.5-.5-.1-1-.1-1.5 0-1.5.1-2.5.9-2.4 2.1 0 .6.3 1.1.8 1.4.4.3 1 .4 1.6.4 1.3-.1 2.2-.8 2.5-1.8.2.5.2 1 .1 1.4-.3 1.1-1.3 1.7-2.7 1.7-1.9 0-3.1-1.3-3.1-3.3s1.2-3.4 3.2-3.4c1.7 0 2.8.8 3.2 2.2l1-.3c-.5-1.9-1.9-3-4.2-3-2.5 0-4.3 1.7-4.3 4.4s1.7 4.4 4.2 4.4c1.9 0 3.2-.9 3.7-2.5.2-.8.2-1.6-.1-2.3l-.6-.1zm-3.2 2.3c-.6 0-1.1-.3-1.1-.8 0-.6.6-1 1.5-1 .5 0 .9 0 1.3.1-.1 1-.8 1.7-1.7 1.7z" fill="white"/></svg>
            </a>
          </div>
          {article.source_url && (
            <div className="source-note">
              Artikel ini disusun berdasarkan laporan dari {article.source_name}.{' '}
              <a href={article.source_url} target="_blank" rel="noopener noreferrer nofollow">
                Baca sumber asli
              </a>
            </div>
          )}
        </article>
      </main>
      {others.length > 0 && (
        <aside className="article-sidebar">
          <div className="sidebar-heading">Berita Terkait</div>
          {others.map((a) => (
            <Link key={a.id} href={`/artikel/${a.slug}`} className="sidebar-item">
              <div className="sidebar-cat">{a.category}</div>
              <div className="sidebar-title">{a.title}</div>
              <div className="sidebar-time">{formatRelativeTime(a.published_at)}</div>
            </Link>
          ))}
        </aside>
      )}
    </div>
  )
}