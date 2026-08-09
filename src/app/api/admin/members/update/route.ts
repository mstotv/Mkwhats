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
    const { userId, fullName, email } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'معرّف المستخدم مطلوب' }, { status: 400 })
    }

    const trimmedName = (fullName || '').trim()
    const trimmedEmail = (email || '').trim().toLowerCase()

    if (!trimmedName) {
      return NextResponse.json({ error: 'الاسم الكامل مطلوب' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ error: 'يرجى إدخال بريد إلكتروني صحيح' }, { status: 400 })
    }

    // 3. Fetch existing profile to compare
    const { data: existingProfile } = await serviceClient
      .from('profiles')
      .select('user_id, email, full_name')
      .eq('user_id', userId)
      .maybeSingle()

    if (!existingProfile) {
      return NextResponse.json({ error: 'الملف الشخصي للمستخدم غير موجود' }, { status: 404 })
    }

    const oldEmail = existingProfile.email.toLowerCase()
    const oldName = existingProfile.full_name
    const isEmailChanging = oldEmail !== trimmedEmail
    const isNameChanging = oldName !== trimmedName

    if (!isEmailChanging && !isNameChanging) {
      return NextResponse.json({ message: 'لم يتم تغيير أي بيانات' })
    }

    // 4. If email is changing, pre-check if email exists in another profile
    if (isEmailChanging) {
      const { data: existingEmailProfile } = await serviceClient
        .from('profiles')
        .select('user_id')
        .eq('email', trimmedEmail)
        .neq('user_id', userId)
        .maybeSingle()

      if (existingEmailProfile) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مستخدم بالفعل من قبل حساب آخر في المنصة' },
          { status: 409 }
        )
      }
    }

    // 5. Update auth.users via Admin API (Atomic Step 1)
    const updatePayload: { email?: string; email_confirm?: boolean; user_metadata?: { full_name: string } } = {}

    if (isEmailChanging) {
      updatePayload.email = trimmedEmail
      updatePayload.email_confirm = true
    }

    if (isNameChanging) {
      updatePayload.user_metadata = { full_name: trimmedName }
    }

    const { error: authErr } = await serviceClient.auth.admin.updateUserById(userId, updatePayload)

    if (authErr) {
      console.error('[Admin Member Update] Supabase Auth update error:', authErr)
      if (
        authErr.message?.toLowerCase().includes('already exists') ||
        authErr.message?.toLowerCase().includes('already registered') ||
        authErr.status === 422
      ) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مستخدم بالفعل من قبل حساب آخر في المنصة' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: `فشل تحديث بيانات المستخدم بـ Auth: ${authErr.message}` },
        { status: 500 }
      )
    }

    // 6. Update profiles table (Atomic Step 2)
    const { error: profileErr } = await serviceClient
      .from('profiles')
      .update({
        email: trimmedEmail,
        full_name: trimmedName,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    // 7. Rollback Strategy if profiles update fails
    if (profileErr) {
      console.error('[Admin Member Update] Profiles update failed, triggering rollback:', profileErr)
      if (isEmailChanging) {
        await serviceClient.auth.admin.updateUserById(userId, {
          email: oldEmail,
          email_confirm: true,
          user_metadata: { full_name: oldName },
        })
      }
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تحديث بيانات الملف الشخصي، تم إلغاء التغييرات تلقائياً' },
        { status: 500 }
      )
    }

    // 8. Notification Log Placeholder (If email changed)
    if (isEmailChanging) {
      console.log('[ADMIN EMAIL CHANGE NOTIFICATION TODO]', {
        event: 'MEMBER_EMAIL_CHANGED_BY_ADMIN',
        adminUserId: adminUser.id,
        targetUserId: userId,
        oldEmail,
        newEmail: trimmedEmail,
        changedAt: new Date().toISOString(),
        note: 'Send email notification to old and new email addresses once email service is integrated.',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث بيانات العضو بنجاح',
    })
  } catch (err: any) {
    console.error('[Admin Member Update] Unexpected server error:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع في السيرفر' }, { status: 500 })
  }
}
