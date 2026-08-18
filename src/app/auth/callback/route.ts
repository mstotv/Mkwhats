import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const redirectTarget = next.startsWith('/') ? next : '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Ensure user has a profile and account
      const serviceClient = createServiceClient()
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('account_id')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (!profile || !profile.account_id) {
        // Create account and profile for new Google OAuth user
        const accountName = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'حساب جديد'
        const { data: acc } = await serviceClient
          .from('accounts')
          .insert({
            name: accountName,
          })
          .select('id')
          .single()

        if (acc?.id) {
          await serviceClient.from('profiles').upsert({
            user_id: data.user.id,
            account_id: acc.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'مستخدم جديد',
            role: 'owner',
          })
        }
      }

      // Relative Location header guarantees redirect stays on user's active domain in browser
      return new NextResponse(null, {
        status: 307,
        headers: {
          Location: redirectTarget,
        },
      })
    }
  }

  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: '/login?error=auth_failed',
    },
  })
}
