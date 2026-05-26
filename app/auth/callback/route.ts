import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)

    // Cek apakah user sudah onboarding
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('onboarded')
        .eq('user_id', user.id)
        .single()

      if (!prefs?.onboarded) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/`)
}
