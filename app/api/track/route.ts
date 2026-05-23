// app/api/track/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { session_id, article_id, category, tags, read_duration } = await request.json()
    if (!session_id || !article_id) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    // Upsert — kalau sudah pernah baca artikel ini, update duration saja
    await supabaseAdmin()
      .from('user_reads')
      .upsert(
        { session_id, article_id, category, tags, read_duration },
        { onConflict: 'session_id,article_id' }
      )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
