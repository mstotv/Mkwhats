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
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Parallel fetch of accounts, subscriptions, plans, messages, and whatsapp configs
    const [
      { data: accounts, error: accError },
      { data: allPlans },
      { data: whatsappConfigs },
      { count: messagesLast30 },
      { count: signupsLast7 },
      { count: signupsPrev7 },
    ] = await Promise.all([
      supabase
        .from('accounts')
        .select(`
          id,
          name,
          created_at,
          is_suspended,
          subscriptions (
            id,
            status,
            billing_cycle,
            current_period_end,
            trial_ends_at,
            plan:plans (id, name, slug, price_monthly, price_yearly, max_whatsapp_instances, max_contacts, features)
          ),
          profiles (
            id,
            user_id,
            email,
            full_name,
            account_role,
            role
          )
        `)
        .order('created_at', { ascending: false }),
      supabase.from('plans').select('id, name, slug, price_monthly, is_active').eq('is_active', true),
      supabase.from('whatsapp_config').select('account_id, status, connection_type, phone_number_id, evolution_connected_phone'),
      supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      supabase.from('accounts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('accounts').select('*', { count: 'exact', head: true }).gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo),
    ]);

    if (accError) {
      console.error('[AdminAccountsAPI] Query error:', accError);
      throw accError;
    }

    // Map whatsapp configs by account_id
    const waMap = new Map<string, any>();
    (whatsappConfigs || []).forEach((c: any) => {
      waMap.set(c.account_id, c);
    });

    let totalActiveCount = 0;
    let totalTrialingCount = 0;
    let totalSuspendedCount = 0;
    let totalConnectedWa = 0;

    // 2. Map safely with message count query for each account
    const result = await Promise.all(
      (accounts ?? []).map(async (acc: any) => {
        const { count: msgCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('account_id', acc.id);

        const activeSub = (acc.subscriptions ?? []).find(
          (s: any) => s.status === 'active' || s.status === 'trialing',
        );

        const isSuspended = Boolean(acc.is_suspended);
        const subStatus = activeSub?.status || 'trialing';

        if (isSuspended) {
          totalSuspendedCount++;
        } else if (subStatus === 'trialing') {
          totalTrialingCount++;
          totalActiveCount++;
        } else {
          totalActiveCount++;
        }

        const ownerProfile =
          (acc.profiles ?? []).find((p: any) => p.account_role === 'owner' || p.role === 'owner') ||
          (acc.profiles ?? [])[0];

        const wa = waMap.get(acc.id);
        const isWaConnected = wa?.status === 'connected';
        if (isWaConnected) totalConnectedWa++;

        const plan = activeSub?.plan;
        const maxInstances = plan?.max_whatsapp_instances || 1;
        const connectedDevices = isWaConnected ? 1 : 0;

        // Message quota calculation
        const features = (plan?.features as Record<string, any>) || {};
        const quotaLimit = features.monthly_message_limit || (plan?.max_contacts ? plan.max_contacts * 5 : 5000);
        const quotaUsed = msgCount ?? 0;
        const quotaPercentage = Math.min(100, Math.round((quotaUsed / Math.max(1, quotaLimit)) * 100));

        // Phone number resolution
        const displayPhone = wa?.evolution_connected_phone || wa?.phone_number_id || '';

        return {
          account_id: acc.id,
          account_name: acc.name || 'بدون اسم',
          tenant_code: `#tn-${acc.id.slice(0, 6)}`,
          created_at: acc.created_at,
          is_suspended: isSuspended,
          plan_id: plan?.id ?? null,
          plan_name: plan?.name ?? 'Free Sandbox',
          plan_slug: plan?.slug ?? 'free',
          plan_price_monthly: Number(plan?.price_monthly || 0),
          subscription_status: subStatus,
          billing_cycle: activeSub?.billing_cycle || 'monthly',
          current_period_end: activeSub?.current_period_end || null,
          trial_ends_at: activeSub?.trial_ends_at || null,
          user_count: (acc.profiles ?? []).length || 1,
          message_count: quotaUsed,
          quota_used: quotaUsed,
          quota_limit: quotaLimit,
          quota_percentage: quotaPercentage,
          owner_email: ownerProfile?.email ?? 'N/A',
          owner_name: ownerProfile?.full_name ?? '',
          owner_phone: displayPhone,
          owner_user_id: ownerProfile?.user_id || ownerProfile?.id || null,
          whatsapp_status: isWaConnected ? 'connected' : 'disconnected',
          whatsapp_connection_type: wa?.connection_type || 'evolution',
          connected_devices: connectedDevices,
          max_devices: maxInstances,
          cluster_label: wa?.connection_type === 'meta' ? 'Meta Cloud API' : 'WA-01 (MENA)',
        };
      }),
    );

    const totAcc = accounts?.length || 0;
    const s7 = signupsLast7 ?? 0;
    const sp7 = signupsPrev7 ?? 0;
    const signupsGrowthPct = sp7 > 0 ? Number((((s7 - sp7) / sp7) * 100).toFixed(1)) : s7 > 0 ? 100.0 : 0;
    const activeRatePct = totAcc > 0 ? Number(((totalActiveCount / totAcc) * 100).toFixed(1)) : 100.0;
    const capacityTotal = Math.max(250, (Math.floor(totAcc / 50) + 1) * 50);
    const capacityRatePct = Number(((totalConnectedWa / capacityTotal) * 100).toFixed(1));
    const avgMessagesPerTenant = totAcc > 0 ? ((messagesLast30 ?? 0) / totAcc).toFixed(1) : '0';

    // Calculate real delivery rate
    const { count: deliveredCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('status', ['delivered', 'read']);

    const totalMsgsCount = messagesLast30 ?? 0;
    const deliveryRatePct =
      totalMsgsCount > 0 && deliveredCount !== null
        ? Number(((deliveredCount / totalMsgsCount) * 100).toFixed(1))
        : 100.0;

    return NextResponse.json({
      accounts: result,
      plans: allPlans || [],
      kpi: {
        total_accounts: totAcc,
        growth_pct: signupsGrowthPct,
        active_subscriptions: totalActiveCount,
        active_rate_pct: activeRatePct,
        connected_wa_instances: totalConnectedWa,
        capacity_total: capacityTotal,
        capacity_rate_pct: capacityRatePct,
        monthly_dispatched_messages: messagesLast30 ?? 0,
        delivery_rate_pct: deliveryRatePct,
        avg_messages_per_tenant: avgMessagesPerTenant,
      },
      status_counts: {
        all: totAcc,
        active: totalActiveCount - totalTrialingCount,
        trialing: totalTrialingCount,
        suspended: totalSuspendedCount,
      },
    });
  } catch (err) {
    console.error('[AdminAccountsAPI] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, plan_id } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Create or get user in Supabase Auth
    let userId: string;
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: password || 'MkWhats12345!',
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (createError) {
      // If user already registered, find user id
      if (createError.message?.includes('already been registered') || (createError as any).status === 422) {
        const { data: userList } = await supabase.auth.admin.listUsers();
        const existing = userList?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (!existing) {
          return NextResponse.json({ error: createError.message }, { status: 400 });
        }
        userId = existing.id;
      } else {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }
    } else {
      userId = newUser.user.id;
    }

    // 2. Create tenant Account
    const { data: account, error: accError } = await supabase
      .from('accounts')
      .insert({ name })
      .select('id, name, created_at')
      .single();

    if (accError || !account) {
      return NextResponse.json({ error: accError?.message || 'Failed to create account' }, { status: 500 });
    }

    // 3. Upsert owner Profile
    await supabase.from('profiles').upsert({
      user_id: userId,
      account_id: account.id,
      email,
      full_name: name,
      account_role: 'owner',
      role: 'owner',
    }, { onConflict: 'user_id' });

    // 4. Assign Plan Subscription if provided, or default free plan
    let targetPlanId = plan_id;
    if (!targetPlanId) {
      const { data: freePlan } = await supabase
        .from('plans')
        .select('id')
        .eq('slug', 'free')
        .maybeSingle();
      if (freePlan) targetPlanId = freePlan.id;
    }

    if (targetPlanId) {
      await supabase.from('subscriptions').insert({
        account_id: account.id,
        plan_id: targetPlanId,
        status: 'active',
        billing_cycle: 'monthly',
      });
    }

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        name: account.name,
        created_at: account.created_at,
        owner_email: email,
      },
    });
  } catch (err: any) {
    console.error('[AdminAccountsAPI] POST error:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

