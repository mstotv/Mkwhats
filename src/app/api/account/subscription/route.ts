import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const supabaseUser = await createClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = createServiceClient();
    const { data: profile } = await service
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const { data: sub } = await service
      .from('subscriptions')
      .select('status, plans(*)')
      .eq('account_id', profile.account_id)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    const plan = sub?.plans ? (Array.isArray(sub.plans) ? sub.plans[0] : sub.plans) : null;

    return NextResponse.json({
      plan_name: plan?.name ?? 'المجانية / Free',
      features: (plan?.features || {}) as Record<string, boolean>,
      limits: {
        max_users: plan?.max_users ?? 1,
        max_contacts: plan?.max_contacts ?? 1000,
        max_messages_monthly: plan?.max_messages_monthly ?? 1000,
        max_broadcasts_monthly: plan?.max_broadcasts_monthly ?? 10,
        max_orders_monthly: plan?.max_orders_monthly ?? 500,
      },
    });
  } catch (err) {
    console.error('[AccountSubscriptionAPI] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
