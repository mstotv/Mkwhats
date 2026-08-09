import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  verifyImpersonationToken,
  IMPERSONATION_COOKIE_NAME,
  IMPERSONATION_DISPLAY_COOKIE_NAME,
} from '@/lib/admin-impersonation'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value

    let targetAccountId: string | null = null

    if (token) {
      const payload = await verifyImpersonationToken(token)
      if (payload) {
        targetAccountId = payload.target_account_id

        // Update audit log with session end timestamp
        if (payload.log_id) {
          const serviceClient = createServiceClient()
          await serviceClient
            .from('admin_impersonation_logs')
            .update({ ended_at: new Date().toISOString() })
            .eq('id', payload.log_id)
        }
      }
    }

    const redirectPath = targetAccountId
      ? `/admin/accounts/${targetAccountId}`
      : '/admin/dashboard'

    const response = NextResponse.json({
      success: true,
      redirect: redirectPath,
    })

    // Delete cookies
    response.cookies.set(IMPERSONATION_COOKIE_NAME, '', {
      path: '/',
      maxAge: 0,
    })
    response.cookies.set(IMPERSONATION_DISPLAY_COOKIE_NAME, '', {
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (err: any) {
    console.error('[EndImpersonationAPI] Error:', err)
    const response = NextResponse.json({
      success: true,
      redirect: '/admin/dashboard',
    })
    response.cookies.set(IMPERSONATION_COOKIE_NAME, '', {
      path: '/',
      maxAge: 0,
    })
    response.cookies.set(IMPERSONATION_DISPLAY_COOKIE_NAME, '', {
      path: '/',
      maxAge: 0,
    })
    return response
  }
}
