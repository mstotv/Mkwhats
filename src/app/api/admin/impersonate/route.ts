import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClientIp } from '@/lib/get-client-ip'
import {
  signImpersonationToken,
  IMPERSONATION_COOKIE_NAME,
  IMPERSONATION_DISPLAY_COOKIE_NAME,
  type ImpersonationPayload,
} from '@/lib/admin-impersonation'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // 1. Verify caller session with Supabase Auth
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

    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify platform super-admin role
    const serviceClient = createServiceClient()
    const { data: adminRow } = await serviceClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', adminUser.id)
      .maybeSingle()

    if (!adminRow) {
      return NextResponse.json(
        { error: 'Forbidden: Super-admin access required.' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const { target_user_id, account_id } = body || {}

    if (!target_user_id || !account_id) {
      return NextResponse.json(
        { error: 'target_user_id and account_id are required' },
        { status: 400 }
      )
    }

    // 4. Fetch target user profile & account info
    const { data: targetProfile, error: profileError } = await serviceClient
      .from('profiles')
      .select('full_name, email, account_id')
      .eq('user_id', target_user_id)
      .maybeSingle()

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'Target user profile not found' }, { status: 404 })
    }

    const { data: targetAccount, error: accountError } = await serviceClient
      .from('accounts')
      .select('name')
      .eq('id', account_id)
      .maybeSingle()

    if (accountError || !targetAccount) {
      return NextResponse.json({ error: 'Target account not found' }, { status: 404 })
    }

    // 5. Gather metadata (IP, User Agent)
    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // 6. Create Audit Log entry (Mandatory - permanent record)
    const { data: logEntry, error: logError } = await serviceClient
      .from('admin_impersonation_logs')
      .insert({
        admin_user_id: adminUser.id,
        target_user_id: target_user_id,
        account_id: account_id,
        admin_email: adminUser.email || 'admin@platform',
        target_email: targetProfile.email || 'user@platform',
        target_name: targetProfile.full_name || '',
        account_name: targetAccount.name || '',
        metadata: {
          ip_address: ip,
          user_agent: userAgent,
        },
      })
      .select('id')
      .single()

    if (logError || !logEntry) {
      console.error('[ImpersonateAPI] Audit log creation failed:', logError)
      return NextResponse.json(
        { error: 'Failed to record impersonation audit log' },
        { status: 500 }
      )
    }

    // 7. Create Signed Impersonation Token (24h max age)
    const exp = Math.floor(Date.now() / 1000) + 86400 // 24 hours
    const payload: ImpersonationPayload = {
      log_id: logEntry.id,
      admin_user_id: adminUser.id,
      target_user_id,
      target_account_id: account_id,
      target_user_name: targetProfile.full_name || targetProfile.email || 'User',
      target_user_email: targetProfile.email || '',
      target_account_name: targetAccount.name || 'Account',
      exp,
    }

    const signedToken = await signImpersonationToken(payload)

    // 8. Prepare Response & Cookies
    const response = NextResponse.json({
      success: true,
      redirect: '/dashboard',
    })

    // HttpOnly Cookie for Server-side verification
    response.cookies.set(IMPERSONATION_COOKIE_NAME, signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400, // 24 hours
    })

    // Non-HttpOnly Display Cookie for UI Banner
    const displayInfo = {
      userName: targetProfile.full_name || targetProfile.email,
      accountName: targetAccount.name,
      userEmail: targetProfile.email,
    }

    response.cookies.set(
      IMPERSONATION_DISPLAY_COOKIE_NAME,
      JSON.stringify(displayInfo),
      {
        httpOnly: false, // accessible to client component
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400, // 24 hours
      }
    )

    return response
  } catch (err: any) {
    console.error('[ImpersonateAPI] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
