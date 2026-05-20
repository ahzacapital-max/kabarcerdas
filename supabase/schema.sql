-- KabarCerdas Database Schema

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- Sumber berita
create table sources (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  rss_url text not null unique,
  category text default 'Umum',
  active boolean default true,
  fetch_count int default 0,
  last_fetched_at timestamptz,
  created_at timestamptz default now()
);

-- Artikel mentah dari RSS
create table articles_raw (
  id uuid primary key default uuid_generate_v4(),
  source_id uuid references sources(id),
  title text not null,
  original_url text not null unique,
  original_content text,
  author text,
  published_at timestamptz,
  fetched_at timestamptz default now(),
  processed boolean default false
);

-- Artikel siap publish
create table articles (
  id uuid primary key default uuid_generate_v4(),
  raw_id uuid references articles_raw(id),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null,
  context_note text,
  category text not null default 'Umum',
  tags text[] default '{}',
  source_name text,
  source_url text,
  seo_title text,
  seo_description text,
  status text default 'published' check (status in ('published','draft','rejected')),
  reading_time int default 3,
  view_count int default 0,
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Index untuk performa
create index idx_articles_slug on articles(slug);
create index idx_articles_status on articles(status);
create index idx_articles_category on articles(category);
create index idx_articles_published on articles(published_at desc);
create index idx_articles_raw_processed on articles_raw(processed);
create index idx_articles_search on articles using gin(to_tsvector('indonesian', title || ' ' || coalesce(excerpt,'')));

-- Full text search helper
create or replace function search_articles(query text)
returns setof articles as $$
  select * from articles
  where status = 'published'
    and to_tsvector('indonesian', title || ' ' || coalesce(excerpt,'')) @@ plainto_tsquery('indonesian', query)
  order by published_at desc
  limit 20;
$$ language sql stable;

-- RLS
alter table articles enable row level security;
alter table articles_raw enable row level security;
alter table sources enable row level security;

-- Artikel published bisa dibaca semua orang
create policy "articles_public_read" on articles for select using (status = 'published');

-- Sources bisa dibaca semua orang
create policy "sources_public_read" on sources for select using (true);

-- Seed sumber berita
insert into sources (name, rss_url, category) values
  ('Kompas', 'https://rss.kompas.com/asset/html/feed.aspx?category=news', 'Nasional'),
  ('Tempo', 'https://rss.tempo.co/', 'Nasional'),
  ('CNBC Indonesia', 'https://www.cnbcindonesia.com/rss', 'Ekonomi'),
  ('Antara', 'https://www.antaranews.com/rss/terkini.xml', 'Nasional'),
  ('BBC Indonesia', 'https://feeds.bbci.co.uk/indonesia/rss.xml', 'Dunia'),
  ('Reuters', 'https://feeds.reuters.com/reuters/topNews', 'Dunia');
