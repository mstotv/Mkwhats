import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const supabase = createServiceClient();

    // 1. Fetch site settings to get Stripe keys
    const { data: settings } = await supabase
      .from('site_settings')
      .select('stripe_enabled, stripe_secret_key, stripe_publishable_key, platform_name')
      .limit(1)
      .maybeSingle();

    if (!settings || !settings.stripe_enabled || !settings.stripe_secret_key) {
      return NextResponse.json(
        { error: 'بوابة دفع سترايب (Stripe) معطلة حالياً أو غير مجهزة بمفتاح الـ Secret Key' },
        { status: 400 }
      );
    }

    const { plan_id, billing_cycle = 'monthly' } = await req.json();

    if (!plan_id) {
      return NextResponse.json({ error: 'يرجى اختيار الخطة المطلوبة' }, { status: 400 });
    }

    // 2. Fetch plan details including discounted prices
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (!plan) {
      return NextResponse.json({ error: 'الخطة غير موجودة' }, { status: 404 });
    }

    const price =
      billing_cycle === 'yearly'
        ? Number(plan.price_yearly_discounted) > 0
          ? Number(plan.price_yearly_discounted)
          : Number(plan.price_yearly)
        : Number(plan.price_monthly_discounted) > 0
          ? Number(plan.price_monthly_discounted)
          : Number(plan.price_monthly);

    const unitAmountCents = Math.round(price * 100);

    if (unitAmountCents <= 0) {
      return NextResponse.json({ error: 'هذه الخطة مجانية أو السعر 0' }, { status: 400 });
    }

    // 3. Resolve user & account context
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

    let accountId = '';
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.account_id) accountId = profile.account_id;
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const successUrl = `${origin}/settings?tab=plan&payment=success&gateway=stripe&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/settings?tab=plan&payment=cancel`;

    // 4. Call Stripe REST API to create a Checkout Session
    const stripeSecretKey = settings.stripe_secret_key.trim();
    const params = new URLSearchParams();
    params.append('payment_method_types[0]', 'card');
    params.append('mode', 'payment');
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][unit_amount]', unitAmountCents.toString());
    params.append(
      'line_items[0][price_data][product_data][name]',
      `اشتراك ${plan.name_ar || plan.name} - ${settings.platform_name || 'wacrm'}`
    );
    params.append(
      'line_items[0][price_data][product_data][description]',
      `دورة الفوترة: ${billing_cycle === 'yearly' ? 'سنوية' : 'شهرية'}`
    );
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    params.append('metadata[plan_id]', plan_id);
    if (accountId) params.append('metadata[account_id]', accountId);
    if (user?.id) params.append('metadata[user_id]', user.id);

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const sessionData = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('[StripeCheckoutAPI] Stripe error:', sessionData);
      return NextResponse.json(
        { error: sessionData.error?.message || 'فشل إنشاء جلسة الدفع عبر سترايب' },
        { status: stripeRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      url: sessionData.url,
      session_id: sessionData.id,
    });
  } catch (err) {
    console.error('[StripeCheckoutAPI] Exception:', err);
    return NextResponse.json({ error: 'فشل معالجة طلب الدفع عبر Stripe' }, { status: 500 });
  }
}
