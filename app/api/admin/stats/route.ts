import { NextResponse } from 'next/server'
import { getAdminStats, getQueueArticles } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [stats, queue] = await Promise.all([getAdminStats(), getQueueArticles(25)])
    return NextResponse.json({ stats, queue })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
