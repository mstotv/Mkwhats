import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate requesting user as super admin
    let response = NextResponse.next()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user: adminUser },
    } = await supabaseAuth.auth.getUser()

    if (!adminUser) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 401 })
    }

    const serviceClient = createServiceClient()

    // Verify platform super admin role
    const { data: adminRow } = await serviceClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', adminUser.id)
      .maybeSingle()

    if (!adminRow) {
      return NextResponse.json({ error: 'صلاحيات غير كافية (Super Admin فقط)' }, { status: 403 })
    }

    // 2. Parse & Validate Payload
    const body = await request.json()
    const { accountId, status } = body

    if (!accountId || typeof accountId !== 'string') {
      return NextResponse.json({ error: 'معرّف الحساب مطلوب' }, { status: 400 })
    }

    if (status !== 'active' && status !== 'suspended') {
      return NextResponse.json({ error: 'حالة الحساب غير صالحة' }, { status: 400 })
    }

    // 3. Update account status in accounts table
    const { error: updateError } = await serviceClient
      .from('accounts')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)

    if (updateError) {
      console.error('[Admin Account Status Update] DB Update error:', updateError)
      return NextResponse.json({ error: 'فشل تحديث حالة الحساب في قاعدة البيانات' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      status,
      message: status === 'suspended' ? 'تم تعليق الحساب بنجاح' : 'تم إعادة تفعيل الحساب بنجاح',
    })
  } catch (err: any) {
    console.error('[Admin Account Status Update] Unexpected error:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع في السيرفر' }, { status: 500 })
  }
}
