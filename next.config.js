/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.kompas.com' },
      { protocol: 'https', hostname: '**.tempo.co' },
      { protocol: 'https', hostname: '**.reuters.com' },
      { protocol: 'https', hostname: '**.bbc.co.uk' },
      { protocol: 'https', hostname: '**.cnbcindonesia.com' },
      { protocol: 'https', hostname: '**.antaranews.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      { source: '/sitemap.xml', destination: '/api/sitemap', permanent: true },
      { source: '/robots.txt', destination: '/api/robots', permanent: false },
    ]
  },
}

module.exports = nextConfig
