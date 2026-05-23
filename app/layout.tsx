import type { Metadata } from 'next'
import { Lora, DM_Sans } from 'next/font/google'
import './globals.css'
import GoogleAnalytics from './components/GoogleAnalytics'

const lora = Lora({ subsets: ['latin'], variable: '--font-serif', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://kabarcerdas.my.id'),
  title: { default: 'KabarCerdas', template: '%s — KabarCerdas' },
  description: 'Konteks & signifikansi di setiap berita. Baca KabarCerdas — nyaman tanpa iklan, paham lebih dalam.',
  robots: { index: true, follow: true },
}

const CATEGORIES = ['Nasional','Ekonomi','Politik','Teknologi','Dunia','Daerah','Bisnis','Olahraga','Viral']

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${lora.variable} ${dmSans.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="sitemap" href="/api/sitemap" />
      </head>
      <GoogleAnalytics ga_id="G-TR84SCNXHB" />
      <body>
        <header className="site-header">
          <div className="header-inner">
            <button className="hamburger-btn" id="hamburger-btn" aria-label="Buka menu kategori" aria-expanded="false">
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div className="header-center">
              <a href="/" className="site-logo">Kabar<span>Cerdas</span></a>
              <div className="site-tagline">Membaca Fakta Lebih Cerdas</div>
            </div>
            <div style={{ width: '60px' }} />
          </div>
        </header>

        {/* Drawer menu kategori */}
        <div className="menu-overlay" id="menu-overlay"></div>
        <nav className="menu-drawer" id="menu-drawer" aria-hidden="true">
          <div className="menu-drawer-header">
            <span className="menu-drawer-title">Kategori</span>
            <button className="menu-close-btn" id="menu-close-btn" aria-label="Tutup menu">✕</button>
          </div>
          <ul className="menu-category-list">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <a href={`/kategori/${c.toLowerCase()}`} className="menu-category-link">{c}</a>
              </li>
            ))}
          </ul>
          <div className="menu-drawer-footer">
            <a href="/admin" className="menu-admin-link">Admin Panel</a>
          </div>
        </nav>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-logo">KabarCerdas</div>
            <p className="footer-tagline">Media digital Indonesia yang paling nyaman dibaca.</p>
            <div className="footer-copy">
              © {new Date().getFullYear()} KabarCerdas · Berita dengan konteks & signifikansi
            </div>
          </div>
        </footer>

        <script dangerouslySetInnerHTML={{ __html: `
          const btn = document.getElementById('hamburger-btn');
          const drawer = document.getElementById('menu-drawer');
          const overlay = document.getElementById('menu-overlay');
          const closeBtn = document.getElementById('menu-close-btn');
          function openMenu() {
            drawer.classList.add('open');
            overlay.classList.add('open');
            btn.setAttribute('aria-expanded','true');
            drawer.setAttribute('aria-hidden','false');
          }
          function closeMenu() {
            drawer.classList.remove('open');
            overlay.classList.remove('open');
            btn.setAttribute('aria-expanded','false');
            drawer.setAttribute('aria-hidden','true');
          }
          btn.addEventListener('click', openMenu);
          closeBtn.addEventListener('click', closeMenu);
          overlay.addEventListener('click', closeMenu);
        `}} />
      </body>
    </html>
  )
}
