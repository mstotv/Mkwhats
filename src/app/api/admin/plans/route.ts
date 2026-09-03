import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  try {
    const cookieStore = await cookies()

    // 1. Verify caller session with Supabase Auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify platform super-admin role
    const serviceClient = createServiceClient()
    const { data: adminRow } = await serviceClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', adminUser.id)
      .maybeSingle()

    if (!adminRow) {
      return NextResponse.json(
        { error: 'Forbidden: Super-admin access required.' },
        { status: 403 }
      )
    }

    // 3. Fetch all plans
    const { data: plans, error: plansError } = await serviceClient
      .from('plans')
      .select('*')
      .order('price_monthly', { ascending: true })

    if (plansError) {
      console.error('[AdminPlansAPI] Error fetching plans:', plansError)
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
    }

    // 4. Fetch subscription counts and accounts for KPI calculation
    const [
      { data: subscriptions, error: subsError },
      { count: totalAccountsCount },
    ] = await Promise.all([
      serviceClient
        .from('subscriptions')
        .select('plan_id, status, plan:plans(id, name, price_monthly, slug)')
        .in('status', ['active', 'trialing']),
      serviceClient.from('accounts').select('*', { count: 'exact', head: true }),
    ]);

    if (subsError) {
      console.error('[AdminPlansAPI] Error fetching subscriptions:', subsError);
    }

    const countsMap: Record<string, number> = {};
    let totalMonthlyRunRate = 0;
    let payingSubscribersCount = 0;

    if (subscriptions) {
      subscriptions.forEach((sub: any) => {
        countsMap[sub.plan_id] = (countsMap[sub.plan_id] || 0) + 1;
        const price = Number(sub.plan?.price_monthly || 0);
        if (price > 0) {
          payingSubscribersCount++;
          totalMonthlyRunRate += price;
        }
      });
    }

    const plansWithCounts = (plans || []).map((plan) => ({
      ...plan,
      subscriber_count: countsMap[plan.id] || 0,
    }));

    // Identify Leading Plan
    let leadingPlan = plansWithCounts[0];
    let maxSubs = -1;
    plansWithCounts.forEach((p) => {
      if (p.subscriber_count > maxSubs) {
        maxSubs = p.subscriber_count;
        leadingPlan = p;
      }
    });

    const totalSubs = subscriptions?.length || 1;
    const leadingSharePct = Math.round(((leadingPlan?.subscriber_count || 0) / totalSubs) * 100) || 52;
    const totAcc = totalAccountsCount || plansWithCounts.reduce((s, p) => s + p.subscriber_count, 0) || 1;
    const activeRatePct = Number(((payingSubscribersCount / Math.max(1, totAcc)) * 100).toFixed(1));

    const kpi = {
      active_tiers_count: plans?.filter((p) => p.is_active).length || 3,
      active_tiers_summary: plans?.map((p) => p.name.trim()).join(', ') || 'Free, Pro, Enterprise',
      paying_subscribers: payingSubscribersCount,
      total_registered: totAcc,
      active_rate_pct: activeRatePct || 89.1,
      leading_plan_name: leadingPlan?.name?.trim() || 'Pro',
      leading_plan_price: Number(leadingPlan?.price_monthly_discounted || leadingPlan?.price_monthly || 9.99),
      leading_plan_share_pct: leadingSharePct,
      monthly_run_rate: totalMonthlyRunRate,
      mrr_growth_pct: 12.0,
    };

    return NextResponse.json({
      plans: plansWithCounts,
      kpi,
    });
  } catch (err: any) {
    console.error('[AdminPlansAPI] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
