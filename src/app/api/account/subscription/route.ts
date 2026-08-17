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

    const accountId = profile.account_id;

    const [
      subRes,
      allPlansRes,
      msgCountRes,
      memberCountRes,
      contactsCountRes,
      ordersCountRes,
      broadcastsCountRes,
    ] = await Promise.all([
      service
        .from('subscriptions')
        .select('status, billing_cycle, current_period_end, trial_ends_at, plans(*)')
        .eq('account_id', accountId)
        .in('status', ['active', 'trialing'])
        .maybeSingle(),
      service
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true }),
      service
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId),
      service
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId),
      service
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId),
      service
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId),
      service
        .from('broadcast_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId),
    ]);

    const sub = subRes.data;
    const plan = sub?.plans ? (Array.isArray(sub.plans) ? sub.plans[0] : sub.plans) : null;
    const availablePlans = (allPlansRes.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price_monthly: p.price_monthly,
      price_monthly_discounted: p.price_monthly_discounted || 0,
      price_yearly: p.price_yearly,
      price_yearly_discounted: p.price_yearly_discounted || 0,
      max_users: p.max_users,
      max_contacts: p.max_contacts,
      max_messages_monthly: p.max_messages_monthly,
      max_broadcasts_monthly: p.max_broadcasts_monthly,
      max_orders_monthly: p.max_orders_monthly || 500,
      is_popular: p.is_popular || false,
      features: p.features || {},
    }));

    const currentPlanObj = plan || availablePlans[0] || {
      name: 'المجانية / Free',
      slug: 'free',
      price_monthly: 0,
      price_yearly: 0,
      max_users: 1,
      max_contacts: 1000,
      max_messages_monthly: 1000,
      max_broadcasts_monthly: 10,
      max_orders_monthly: 500,
      features: { ai_assistant: false, excel_export: false, telegram_bot: false },
    };

    const messagesCount = msgCountRes.count ?? 0;
    const membersCount = memberCountRes.count ?? 1;
    const contactsCount = contactsCountRes.count ?? 0;
    const ordersCount = ordersCountRes.count ?? 0;
    const broadcastsCount = broadcastsCountRes.count ?? 0;

    const maxMessages = currentPlanObj.max_messages_monthly ?? 1000;
    const maxBroadcasts = currentPlanObj.max_broadcasts_monthly ?? 10;
    const maxUsers = currentPlanObj.max_users ?? 1;
    const maxContacts = currentPlanObj.max_contacts ?? 1000;
    const maxOrders = currentPlanObj.max_orders_monthly ?? 500;

    return NextResponse.json({
      plan: currentPlanObj,
      plan_name: currentPlanObj.name,
      subscription: {
        status: sub?.status ?? 'trialing',
        billing_cycle: sub?.billing_cycle ?? 'monthly',
        current_period_end: sub?.current_period_end ?? new Date(Date.now() + 14 * 86400000).toISOString(),
        trial_ends_at: sub?.trial_ends_at ?? null,
      },
      available_plans: availablePlans,
      usage: {
        year_month: new Date().toISOString().slice(0, 7),
        messages_count: messagesCount,
        max_messages: maxMessages,
        messages_remaining: maxMessages === -1 ? -1 : Math.max(0, maxMessages - messagesCount),
        messages_percentage: maxMessages === -1 ? 0 : Math.min(100, Math.round((messagesCount / maxMessages) * 100)),

        broadcasts_count: broadcastsCount,
        max_broadcasts: maxBroadcasts,
        broadcasts_remaining: maxBroadcasts === -1 ? -1 : Math.max(0, maxBroadcasts - broadcastsCount),
        broadcasts_percentage: maxBroadcasts === -1 ? 0 : Math.min(100, Math.round((broadcastsCount / (maxBroadcasts || 1)) * 100)),

        members_count: membersCount,
        max_users: maxUsers,
        members_remaining: maxUsers === -1 ? -1 : Math.max(0, maxUsers - membersCount),
        members_percentage: maxUsers === -1 ? 0 : Math.min(100, Math.round((membersCount / maxUsers) * 100)),

        contacts_count: contactsCount,
        max_contacts: maxContacts,
        contacts_remaining: maxContacts === -1 ? -1 : Math.max(0, maxContacts - contactsCount),
        contacts_percentage: maxContacts === -1 ? 0 : Math.min(100, Math.round((contactsCount / (maxContacts || 1)) * 100)),

        orders_count: ordersCount,
        max_orders: maxOrders,
        orders_remaining: maxOrders === -1 ? -1 : Math.max(0, maxOrders - ordersCount),
        orders_percentage: maxOrders === -1 ? 0 : Math.min(100, Math.round((ordersCount / (maxOrders || 1)) * 100)),
      },
      features: currentPlanObj.features || {},
      limits: {
        max_users: maxUsers,
        max_contacts: maxContacts,
        max_messages_monthly: maxMessages,
        max_broadcasts_monthly: maxBroadcasts,
        max_orders_monthly: maxOrders,
      },
    });
  } catch (err) {
    console.error('[AccountSubscriptionAPI] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
