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
      openGraph: {
        title: article.title,
        description: article.excerpt || '',
        url: `https://kabarcerdas.id/artikel/${article.slug}`,
        siteName: 'KabarCerdas',
        locale: 'id_ID',
        type: 'article',
        publishedTime: article.published_at,
      },
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
        <Link href="/" className="back-btn">? Beranda</Link>
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
          {article.source_url && (
            <div className="source-note">
              Artikel ini disusun berdasarkan laporan dari {article.source_name}.{' '}
              <a href={article.source_url} target="_blank" rel="noopener noreferrer nofollow">
                Baca sumber asli ?
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
