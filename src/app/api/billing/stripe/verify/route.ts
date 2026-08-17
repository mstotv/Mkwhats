import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: settings } = await supabase
      .from('site_settings')
      .select('stripe_secret_key')
      .limit(1)
      .maybeSingle();

    if (!settings?.stripe_secret_key) {
      return NextResponse.json({ error: 'Stripe secret key not configured' }, { status: 400 });
    }

    // Call Stripe Session API with Expanding Objects: expand[]=line_items
    const stripeSecretKey = settings.stripe_secret_key.trim();
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}?expand[]=line_items`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    });

    const sessionData = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: sessionData.error?.message || 'Failed to verify session' }, { status: res.status });
    }

    if (sessionData.payment_status === 'paid') {
      const planId = sessionData.metadata?.plan_id;
      let accountId = sessionData.metadata?.account_id;

      // Fallback account resolution if missing in metadata
      if (!accountId) {
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
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('account_id')
            .eq('id', user.id)
            .maybeSingle();
          if (profile?.account_id) accountId = profile.account_id;
        }
      }

      if (planId && accountId) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        // 1. Upgrade account plan in DB
        await supabase
          .from('accounts')
          .update({ plan_id: planId, updated_at: now.toISOString() })
          .eq('id', accountId);

        // 2. Cancel existing active subscriptions
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', canceled_at: now.toISOString(), updated_at: now.toISOString() })
          .eq('account_id', accountId)
          .in('status', ['active', 'trialing']);

        // 3. Insert active subscription record
        await supabase
          .from('subscriptions')
          .insert({
            account_id: accountId,
            plan_id: planId,
            status: 'active',
            billing_cycle: 'monthly',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          });

        return NextResponse.json({
          success: true,
          paid: true,
          message: 'تم التأكد من عملية الدفع وترقية خطتك بنجاح 🎉',
          plan_id: planId,
        });
      }

      return NextResponse.json({
        success: true,
        paid: true,
        message: 'عملية الدفع مكتملة بنجاح ✅',
      });
    }

    return NextResponse.json({
      success: false,
      paid: false,
      status: sessionData.payment_status,
      message: 'لم يتم استكمال عملية الدفع بعد',
    });
  } catch (err) {
    console.error('[StripeVerifyAPI] Exception:', err);
    return NextResponse.json({ error: 'Failed to verify payment session' }, { status: 500 });
  }
}
