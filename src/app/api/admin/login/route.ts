import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getClientIp } from '@/lib/get-client-ip'
import {
  checkAdminRateLimit,
  recordFailedAttempt,
  clearAttempts,
} from '@/lib/admin-rate-limit'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body || {}

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const ip = getClientIp(request)

    // 1. Check Rate Limit (5 attempts / 15 minutes)
    const rateLimit = await checkAdminRateLimit(ip, email)
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Account temporarily locked. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
          retry_after_seconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds || 900),
          },
        }
      )
    }

    // 2. Prepare cookie-persisting Supabase SSR client for authentication
    let response = NextResponse.json({ success: true, redirect: '/admin/dashboard' })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
            })
            response = NextResponse.json({ success: true, redirect: '/admin/dashboard' })
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // 3. Attempt Auth Sign-In
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      await recordFailedAttempt(ip, email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 4. Verify Super-Admin privilege in platform_admins table (bypassing RLS with service_role)
    const serviceClient = createServiceClient()
    const { data: adminRow, error: adminCheckError } = await serviceClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (adminCheckError || !adminRow) {
      // User is authenticated in Auth, but is NOT a platform super-admin
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Access denied: User is not a platform administrator.' },
        { status: 403 }
      )
    }

    // 5. Success! Clear rate-limit attempts counter and return success response with cookies
    await clearAttempts(ip, email)
    return response

  } catch (err: any) {
    console.error('[AdminLoginAPI] Server error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
