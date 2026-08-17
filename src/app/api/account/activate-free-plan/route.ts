import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const clientAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user } } = await clientAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_id } = await req.json();
    if (!plan_id) {
      return NextResponse.json({ error: 'Missing plan_id' }, { status: 400 });
    }

    const service = createServiceClient();

    // Fetch user profile and account_id
    const { data: profile } = await service
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const accountId = profile.account_id;

    // Fetch requested plan
    const { data: plan } = await service
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (!plan) {
      return NextResponse.json({ error: 'الخطة غير موجودة' }, { status: 404 });
    }

    // Verify it is a free plan ($0)
    const isFree = plan.price_monthly === 0 || plan.slug === 'free';
    if (!isFree) {
      return NextResponse.json({ error: 'هذه الخطة ليست مجانية وتتطلب الدفع' }, { status: 400 });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setFullYear(periodEnd.getFullYear() + 10); // Free plan active for 10 years

    // 1. Update accounts table
    await service
      .from('accounts')
      .update({ plan_id: plan.id, updated_at: now.toISOString() })
      .eq('id', accountId);

    // 2. Cancel existing active subscriptions
    await service
      .from('subscriptions')
      .update({ status: 'canceled', canceled_at: now.toISOString(), updated_at: now.toISOString() })
      .eq('account_id', accountId)
      .in('status', ['active', 'trialing']);

    // 3. Insert active subscription row for free plan
    await service
      .from('subscriptions')
      .insert({
        account_id: accountId,
        plan_id: plan.id,
        status: 'active',
        billing_cycle: 'monthly',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });

    return NextResponse.json({
      success: true,
      message: 'تم الانتقال إلى الخطة المجانية بنجاح 🎁',
    });
  } catch (err) {
    console.error('[ActivateFreePlanAPI] Exception:', err);
    return NextResponse.json({ error: 'Failed to activate free plan' }, { status: 500 });
  }
}
