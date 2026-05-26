import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_USER = process.env.ADMIN_USER || 'admin'
const ADMIN_PASS = process.env.ADMIN_PASS || 'kabarcerdas123'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin: basic auth
  if (pathname.startsWith('/admin') && !pathname.startsWith('/api/')) {
    const auth = request.headers.get('authorization')
    if (auth) {
      const [scheme, encoded] = auth.split(' ')
      if (scheme === 'Basic' && encoded) {
        const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
        const [user, pass] = decoded.split(':')
        if (user === ADMIN_USER && pass === ADMIN_PASS) {
          return NextResponse.next()
        }
      }
    }
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="KabarCerdas Admin"' },
    })
  }

  // Public routes — tidak perlu auth
  const publicRoutes = ['/login', '/auth/callback', '/api/', '/artikel/', '/kategori/']
  if (publicRoutes.some(r => pathname.startsWith(r)) || pathname === '/') {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    await supabase.auth.getSession()
    return res
  }

  // Protected routes — cek auth
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|public).*)'],
}
