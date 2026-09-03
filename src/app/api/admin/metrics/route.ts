import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get('range');
    const daysRange = rangeParam ? parseInt(rangeParam, 10) || 14 : 14;

    const supabase = createServiceClient();

    // 1. Try Calling High-Performance RPC first
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_admin_overview_complete_analytics',
        { p_days_range: daysRange }
      );

      if (!rpcError && rpcData) {
        // Also provide flat legacy fields for backwards compatibility
        return NextResponse.json({
          ...rpcData,
          total_accounts: rpcData.accounts?.total_accounts ?? 0,
          active_accounts: rpcData.accounts?.active_accounts ?? 0,
          suspended_accounts: rpcData.accounts?.suspended_accounts ?? 0,
          total_users: rpcData.accounts?.total_accounts ?? 0,
          total_messages: rpcData.messaging?.total_messages ?? 0,
          messages_this_month: rpcData.messaging?.messages_last_30_days ?? 0,
          total_broadcasts: 0,
          estimated_mrr: rpcData.financials?.estimated_mrr ?? 0,
        }, {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        });
      }
    } catch (rpcErr) {
      console.warn('[AdminMetricsAPI] RPC not available or failed, using robust fallback queries:', rpcErr);
    }

    // 2. Comprehensive Robust Fallback
    const now = new Date();
    const daysAgoDate = new Date(now.getTime() - daysRange * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgoDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgoDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgoDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalAccounts, data: accountsData },
      { count: activeAccounts },
      { count: signupsLast7 },
      { count: signupsPrev7 },
      { count: totalMessages, data: messagesData },
      { count: messagesLast30 },
      { count: incomingCustomerMessages },
      { count: botReplies },
      { count: agentReplies },
      { count: totalContacts },
      { count: contactsLast7 },
      { data: activeSubs },
      { data: allPlans },
      { data: offlineApproved },
      { data: offlinePending },
      { data: upgradeCompleted },
      { data: whatsappConfigs },
    ] = await Promise.all([
      supabase.from('accounts').select('id, created_at, is_suspended', { count: 'exact' }),
      supabase.from('accounts').select('*', { count: 'exact', head: true }).eq('is_suspended', false),
      supabase.from('accounts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgoDate),
      supabase.from('accounts').select('*', { count: 'exact', head: true }).gte('created_at', fourteenDaysAgoDate).lt('created_at', sevenDaysAgoDate),
      supabase.from('messages').select('id, created_at, sender_type, status', { count: 'exact' }),
      supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoDate),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('sender_type', 'customer'),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('sender_type', 'bot'),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('sender_type', 'agent'),
      supabase.from('contacts').select('*', { count: 'exact', head: true }),
      supabase.from('contacts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgoDate),
      supabase.from('subscriptions').select('account_id, plan_id, status, billing_cycle, created_at, plan:plans(id, name, slug, price_monthly, price_yearly)').in('status', ['active', 'trialing']),
      supabase.from('plans').select('id, name, slug, price_monthly, price_yearly, is_active').eq('is_active', true),
      supabase.from('offline_payment_submissions').select('amount, created_at').eq('status', 'approved'),
      supabase.from('offline_payment_submissions').select('amount, created_at').eq('status', 'pending'),
      supabase.from('upgrade_requests').select('plisio_amount, created_at').eq('status', 'completed'),
      supabase.from('whatsapp_config').select('account_id, status, connection_type'),
    ]);

    // Financial calculations
    const approvedOfflineSum = (offlineApproved || []).reduce((sum, item: any) => sum + Number(item.amount || 0), 0);
    const onlineRevenueSum = (upgradeCompleted || []).reduce((sum, item: any) => sum + Number(item.plisio_amount || 0), 0);
    const totalRevenue = approvedOfflineSum + onlineRevenueSum;

    // Real 30-day revenue growth calculation
    const revLast30 = (offlineApproved || []).filter((i: any) => i.created_at >= thirtyDaysAgoDate).reduce((s, i: any) => s + Number(i.amount || 0), 0)
      + (upgradeCompleted || []).filter((i: any) => i.created_at >= thirtyDaysAgoDate).reduce((s, i: any) => s + Number(i.plisio_amount || 0), 0);

    const revPrev30 = (offlineApproved || []).filter((i: any) => i.created_at >= sixtyDaysAgoDate && i.created_at < thirtyDaysAgoDate).reduce((s, i: any) => s + Number(i.amount || 0), 0)
      + (upgradeCompleted || []).filter((i: any) => i.created_at >= sixtyDaysAgoDate && i.created_at < thirtyDaysAgoDate).reduce((s, i: any) => s + Number(i.plisio_amount || 0), 0);

    let revenueGrowthPct = 0;
    if (revPrev30 > 0) {
      revenueGrowthPct = Number((((revLast30 - revPrev30) / revPrev30) * 100).toFixed(1));
    } else if (revLast30 > 0) {
      revenueGrowthPct = 100.0;
    }

    const pendingOfflineCount = offlinePending?.length || 0;
    const pendingOfflineAmount = (offlinePending || []).reduce((sum, item: any) => sum + Number(item.amount || 0), 0);

    const estimatedMrr = (activeSubs || []).reduce((sum, s: any) => {
      if (s.billing_cycle === 'yearly' && s.plan?.price_yearly) {
        return sum + Number(s.plan.price_yearly) / 12.0;
      }
      return sum + Number(s.plan?.price_monthly || 0);
    }, 0);

    // Real MRR growth calculation
    const mrrLast30 = (activeSubs || []).filter((s: any) => s.created_at >= thirtyDaysAgoDate).reduce((sum, s: any) => sum + Number(s.plan?.price_monthly || 0), 0);
    const mrrPrev30 = Math.max(0, estimatedMrr - mrrLast30);
    let mrrGrowthPct = 0;
    if (mrrPrev30 > 0) {
      mrrGrowthPct = Number((((estimatedMrr - mrrPrev30) / mrrPrev30) * 100).toFixed(1));
    } else if (estimatedMrr > 0) {
      mrrGrowthPct = 100.0;
    }


    // Accounts calculations
    const totAcc = totalAccounts ?? 0;
    const actAcc = activeAccounts ?? totAcc;
    const suspAcc = totAcc - actAcc;
    const activeRatePct = totAcc > 0 ? Number(((actAcc / totAcc) * 100).toFixed(1)) : 0.0;

    const s7 = signupsLast7 ?? 0;
    const sp7 = signupsPrev7 ?? 0;
    let signupsGrowthPct = 0;
    if (sp7 > 0) {
      signupsGrowthPct = Number((((s7 - sp7) / sp7) * 100).toFixed(1));
    } else if (s7 > 0) {
      signupsGrowthPct = 100.0;
    }

    // Paid vs Free
    const paidAccountIds = new Set(
      (activeSubs || [])
        .filter((s: any) => Number(s.plan?.price_monthly || 0) > 0)
        .map((s: any) => s.account_id)
    );
    const paidSubscribersCount = paidAccountIds.size;
    const freeSubscribersCount = Math.max(0, totAcc - paidSubscribersCount);

    // WhatsApp configs
    let evolutionConnected = 0;
    let metaConnected = 0;
    (whatsappConfigs || []).forEach((c: any) => {
      if (c.status === 'connected') {
        if (c.connection_type === 'evolution') {
          evolutionConnected++;
        } else {
          metaConnected++;
        }
      }
    });
    const activeInstances = evolutionConnected + metaConnected;
    const capacityTotal = Math.max(250, (Math.floor(totAcc / 50) + 1) * 50);
    const capacityRatePct = Number(((activeInstances / capacityTotal) * 100).toFixed(1));
    const disconnectedCount = Math.max(0, totAcc - activeInstances);

    // Messages delivery rate
    const totMsg = totalMessages ?? 0;
    const successfulMessages = (messagesData || []).filter((m: any) =>
      ['sent', 'delivered', 'read'].includes(m.status)
    ).length;
    const deliveryRatePct = totMsg > 0 ? Number(((successfulMessages / totMsg) * 100).toFixed(1)) : 99.2;

    // Plan distribution
    const planCountsMap = new Map<string, number>();
    (activeSubs || []).forEach((s: any) => {
      const pId = s.plan_id;
      planCountsMap.set(pId, (planCountsMap.get(pId) || 0) + 1);
    });

    const totalSubsWithCount = activeSubs?.length || 1;
    const plansDistribution = (allPlans || []).map((p: any) => {
      const count = planCountsMap.get(p.id) || 0;
      const percentage = Number(((count / Math.max(1, totalSubsWithCount)) * 100).toFixed(1));
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price_monthly: Number(p.price_monthly || 0),
        subscribers_count: count,
        percentage,
      };
    }).sort((a, b) => b.price_monthly - a.price_monthly);

    // Growth timeline for [daysRange]
    const growthTimeline: { date: string; label: string; signups: number; messages: number }[] = [];
    const accountsList = accountsData || [];
    const messagesList = messagesData || [];

    for (let i = daysRange; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const daySignups = accountsList.filter((a: any) => a.created_at?.startsWith(dateStr)).length;
      const dayMessages = messagesList.filter((m: any) => m.created_at?.startsWith(dateStr)).length;

      growthTimeline.push({
        date: dateStr,
        label,
        signups: daySignups,
        messages: dayMessages,
      });
    }

    const payload = {
      financials: {
        total_revenue: totalRevenue,
        estimated_mrr: estimatedMrr,
        pending_offline_count: pendingOfflineCount,
        pending_offline_amount: pendingOfflineAmount,
        approved_offline_count: offlineApproved?.length || 0,
        approved_offline_amount: approvedOfflineSum,
        revenue_growth_pct: revenueGrowthPct,
        mrr_growth_pct: mrrGrowthPct,
      },
      accounts: {
        total_accounts: totAcc,
        active_accounts: actAcc,
        suspended_accounts: suspAcc,
        active_rate_pct: activeRatePct,
        signups_last_7_days: s7,
        signups_prev_7_days: sp7,
        signups_growth_pct: signupsGrowthPct,
        paid_subscribers_count: paidSubscribersCount,
        free_subscribers_count: freeSubscribersCount,
      },
      whatsapp: {
        evolution_connected_count: evolutionConnected,
        meta_connected_count: metaConnected,
        disconnected_count: disconnectedCount,
        active_instances: activeInstances,
        capacity_total: capacityTotal,
        capacity_rate_pct: capacityRatePct,
      },
      messaging: {
        total_messages: totMsg,
        messages_last_30_days: messagesLast30 ?? 0,
        incoming_customer_messages: incomingCustomerMessages ?? 0,
        bot_replies: botReplies ?? 0,
        agent_replies: agentReplies ?? 0,
        total_replied_messages: (botReplies ?? 0) + (agentReplies ?? 0),
        delivery_rate_pct: deliveryRatePct,
        total_contacts: totalContacts ?? 0,
        contacts_added_last_7_days: contactsLast7 ?? 0,
      },
      plans_distribution: plansDistribution,
      growth_timeline: growthTimeline,

      // Backwards compatibility keys
      total_accounts: totAcc,
      active_accounts: actAcc,
      suspended_accounts: suspAcc,
      total_users: totAcc,
      total_messages: totMsg,
      messages_this_month: messagesLast30 ?? 0,
      total_broadcasts: 0,
      estimated_mrr: estimatedMrr,
    };

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('[AdminMetricsAPI] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
