import { NextResponse } from 'next/server'
import { fetchAllSources } from '@/lib/rss'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  // Verifikasi cron secret
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await fetchAllSources()
    console.log('[CRON fetch]', result)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[CRON fetch] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
