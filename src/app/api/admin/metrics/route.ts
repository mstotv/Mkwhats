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

    // 1. Accounts count
    const { count: totalAccounts } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true });

    // 2. Profiles count
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 3. Messages count
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    // 4. Messages this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { count: messagesThisMonth } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth);

    // 5. Broadcasts count
    const { count: totalBroadcasts } = await supabase
      .from('broadcasts')
      .select('*', { count: 'exact', head: true });

    // 6. Subscriptions for MRR calculation
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('status, plan:plans(price_monthly)')
      .in('status', ['active', 'trialing']);

    let estimatedMrr = 0;
    if (subs) {
      estimatedMrr = subs.reduce((sum, s: any) => sum + Number(s.plan?.price_monthly || 0), 0);
    }

    return NextResponse.json({
      total_accounts: totalAccounts ?? 0,
      active_accounts: totalAccounts ?? 0,
      suspended_accounts: 0,
      total_users: totalUsers ?? 0,
      total_messages: totalMessages ?? 0,
      messages_this_month: messagesThisMonth ?? 0,
      total_broadcasts: totalBroadcasts ?? 0,
      estimated_mrr: estimatedMrr,
    });
  } catch (err) {
    console.error('[AdminMetricsAPI] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
