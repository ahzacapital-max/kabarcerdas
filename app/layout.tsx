import type { Metadata } from 'next'
import { Lora, DM_Sans } from 'next/font/google'
import './globals.css'

const lora = Lora({ subsets: ['latin'], variable: '--font-serif', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://kabarcerdas.my.id'),
  title: { default: 'KabarCerdas', template: '%s — KabarCerdas' },
  description: 'Konteks & signifikansi di setiap berita. Baca KabarCerdas — nyaman tanpa iklan, paham lebih dalam.',
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${lora.variable} ${dmSans.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="sitemap" href="/api/sitemap" />
      </head>
      <body>
        <header className="site-header">
          <div className="header-inner">
            <a href="/" className="site-logo">Kabar<span>Cerdas</span></a>
            <nav className="header-nav">
              {['Nasional','Daerah','Ekonomi','Bisnis','Teknologi','Dunia','Politik','Olahraga','Sepakbola','Viral'].map((c) => (
                <a key={c} href={`/kategori/${c.toLowerCase()}`} className="header-nav-link">{c}</a>
              ))}
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-logo">KabarCerdas</div>
            <div className="footer-copy">
              © {new Date().getFullYear()} KabarCerdas · Berita terkini dari sumber terpercaya, disajikan dengan jurnalisme berkualitas tinggi
              <a href="/admin" style={{color:'rgba(255,255,255,.2)',fontSize:'.65rem',marginLeft:'1rem'}}>Admin</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
