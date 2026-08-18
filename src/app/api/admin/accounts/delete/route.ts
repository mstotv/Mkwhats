import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard';

export async function POST(request: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'غير مصرح لك بتأدية هذا الإجراء' }, { status: 401 });
    }

    const body = await request.json();
    const { account_id } = body || {};

    if (!account_id) {
      return NextResponse.json({ error: 'يرجى تزويد معرف الحساب المطلوب حذفه' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // 1. Fetch all associated user profiles to delete from auth.users
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('user_id')
      .eq('account_id', account_id);

    if (profiles && profiles.length > 0) {
      for (const pr of profiles) {
        if (pr.user_id) {
          try {
            await serviceClient.auth.admin.deleteUser(pr.user_id);
          } catch (authDeleteErr) {
            console.warn('[AdminDeleteAccount] Delete auth user notice:', pr.user_id, authDeleteErr);
          }
        }
      }
    }

    // 2. Delete the account row from public.accounts (cascades to all multi-tenant tables)
    const { error: deleteErr } = await serviceClient
      .from('accounts')
      .delete()
      .eq('id', account_id);

    if (deleteErr) {
      console.error('[AdminDeleteAccount] Delete account error:', deleteErr);
      return NextResponse.json({ error: 'فشل حذف الحساب من قاعدة البيانات' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف الحساب وكافة مستخدميه وبياناته نهائياً من قاعدة البيانات وسجلات التوثيق 🗑️',
    });
  } catch (err) {
    console.error('[AdminDeleteAccount] Exception:', err);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع عند حذف الحساب' }, { status: 500 });
  }
}
