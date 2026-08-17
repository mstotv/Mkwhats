import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard';

export async function GET() {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceClient();

    // Query accounts with plans and profiles
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(`
        id,
        name,
        created_at,
        subscriptions (
          status,
          plan:plans (id, name, slug)
        ),
        profiles (
          id,
          email,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AdminAccountsAPI] Query error:', error);
      throw error;
    }

    // Map safely with message count query for each account
    const result = await Promise.all(
      (accounts ?? []).map(async (acc: any) => {
        const { count: msgCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('account_id', acc.id);

        const activeSub = (acc.subscriptions ?? []).find(
          (s: any) => s.status === 'active' || s.status === 'trialing',
        );

        const ownerProfile =
          (acc.profiles ?? []).find((p: any) => p.role === 'owner') ||
          (acc.profiles ?? [])[0];

        return {
          account_id: acc.id,
          account_name: acc.name || 'بدون اسم',
          created_at: acc.created_at,
          is_suspended: acc.is_suspended ?? false,
          plan_id: activeSub?.plan?.id ?? null,
          plan_name: activeSub?.plan?.name ?? 'المجانية / Free',
          plan_slug: activeSub?.plan?.slug ?? 'free',
          subscription_status: activeSub?.status ?? 'trialing',
          user_count: (acc.profiles ?? []).length,
          message_count: msgCount ?? 0,
          owner_email: ownerProfile?.email ?? 'N/A',
        };
      }),
    );

    return NextResponse.json({ accounts: result });
  } catch (err) {
    console.error('[AdminAccountsAPI] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
