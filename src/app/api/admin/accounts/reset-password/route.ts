import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard';

export async function POST(req: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { account_id, new_password } = await req.json();

    if (!account_id || !new_password || new_password.length < 6) {
      return NextResponse.json(
        { error: 'يرجى تقديم معرّف الشركة وكلمة مرور لا تقل عن 6 أحرف' },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // 1. Find target owner profile for this account
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('id, user_id, email, role')
      .eq('account_id', account_id)
      .limit(1)
      .maybeSingle();

    if (profErr || !profile?.user_id) {
      return NextResponse.json(
        { error: 'تعذر العثور على مالك الحساب لتغيير كلمة المرور' },
        { status: 404 },
      );
    }

    // 2. Update user password via Auth Admin API
    const { error: updateErr } = await supabase.auth.admin.updateUserById(profile.user_id, {
      password: new_password,
    });

    if (updateErr) {
      console.error('[ResetPasswordAPI] Update password error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `تم تغيير كلمة المرور للبريد (${profile.email}) بنجاح 🎉`,
    });
  } catch (err) {
    console.error('[ResetPasswordAPI] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
