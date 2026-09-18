import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      plan_id,
      brand_name,
      subdomain,
      whatsapp_number,
      billing_cycle = 'monthly',
      gateway = 'offline', // 'stripe' | 'plisio' | 'offline'
      // Offline payment details
      method_id,
      transaction_ref,
      proof_image_url,
      notes,
    } = body;

    if (!plan_id || !brand_name || !subdomain) {
      return NextResponse.json(
        { error: 'Plan, brand name, and subdomain are required' },
        { status: 400 }
      );
    }

    const cleanSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanSubdomain || cleanSubdomain.length < 3) {
      return NextResponse.json(
        { error: 'Subdomain must be at least 3 characters' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // 1. Check if user already has an active reseller account
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('account_id, email, full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    let accountId = profile?.account_id;
    if (!accountId) {
      const { data: acc } = await serviceClient
        .from('accounts')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle();
      if (acc) {
        accountId = acc.id;
      }
    }

    if (!accountId) {
      return NextResponse.json(
        { error: 'User does not have an active account' },
        { status: 400 }
      );
    }

    const { data: alreadyReseller } = await serviceClient
      .from('resellers')
      .select('id, status')
      .eq('owner_account_id', accountId)
      .maybeSingle();

    if (alreadyReseller && alreadyReseller.status === 'active') {
      return NextResponse.json(
        { error: 'Your account is already registered as an active reseller partner' },
        { status: 400 }
      );
    }

    // 2. Check subdomain uniqueness
    const { data: existingSub } = await serviceClient
      .from('resellers')
      .select('id')
      .eq('subdomain', cleanSubdomain)
      .maybeSingle();

    if (existingSub && existingSub.id !== alreadyReseller?.id) {
      return NextResponse.json(
        { error: 'Subdomain is already taken by another partner' },
        { status: 400 }
      );
    }

    // 3. Fetch reseller plan
    const { data: plan } = await serviceClient
      .from('reseller_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (!plan) {
      return NextResponse.json({ error: 'Reseller plan not found' }, { status: 404 });
    }

    const planPrice = billing_cycle === 'yearly' ? Number(plan.price_yearly) : Number(plan.price_monthly);

    // 4. Fetch site_settings to check configured gateways
    const { data: settings } = await serviceClient
      .from('site_settings')
      .select('stripe_enabled, stripe_secret_key, plisio_enabled, plisio_api_key, plisio_secret_key, platform_name')
      .limit(1)
      .maybeSingle();

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // ─────────────────────────────────────────────────────────────
    // GATEWAY 1: STRIPE
    // ─────────────────────────────────────────────────────────────
    if (gateway === 'stripe') {
      if (!settings?.stripe_enabled || !settings?.stripe_secret_key?.trim()) {
        return NextResponse.json(
          { error: 'بوابة دفع سترايب (Stripe) غير مفعلة حالياً في المنصة' },
          { status: 400 }
        );
      }

      const unitAmountCents = Math.round(planPrice * 100);
      const stripeSecretKey = settings.stripe_secret_key.trim();

      const params = new URLSearchParams();
      params.append('payment_method_types[0]', 'card');
      params.append('mode', 'payment');
      params.append('line_items[0][price_data][currency]', 'usd');
      params.append('line_items[0][price_data][unit_amount]', unitAmountCents.toString());
      params.append(
        'line_items[0][price_data][product_data][name]',
        `باقة الموزع: ${plan.name_ar || plan.name} (${cleanSubdomain})`
      );
      params.append(
        'line_items[0][price_data][product_data][description]',
        `ترقية إلى شريك ريسيلر بعلامة تجارية مستقلة - ${billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}`
      );
      params.append('line_items[0][quantity]', '1');
      params.append(
        'success_url',
        `${origin}/reseller?session_id={CHECKOUT_SESSION_ID}&payment=success&gateway=stripe`
      );
      params.append('cancel_url', `${origin}/reseller?payment=canceled`);
      params.append('metadata[type]', 'reseller_plan');
      params.append('metadata[plan_id]', plan.id);
      params.append('metadata[subdomain]', cleanSubdomain);
      params.append('metadata[brand_name]', brand_name);
      params.append('metadata[account_id]', accountId);
      params.append('metadata[user_id]', user.id);
      params.append('metadata[billing_cycle]', billing_cycle);
      if (whatsapp_number) params.append('metadata[whatsapp_number]', whatsapp_number);

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
        console.error('[ResellerCheckoutAPI] Stripe error:', sessionData);
        return NextResponse.json(
          { error: sessionData.error?.message || 'فشل إنشاء جلسة الدفع عبر سترايب' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        gateway: 'stripe',
        checkout_url: sessionData.url,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // GATEWAY 2: PLISIO (Crypto USDT/BTC)
    // ─────────────────────────────────────────────────────────────
    if (gateway === 'plisio') {
      const plisioApiKey = settings?.plisio_secret_key || settings?.plisio_api_key;
      if (!settings?.plisio_enabled || !plisioApiKey?.trim()) {
        return NextResponse.json(
          { error: 'بوابة دفع الكريبتو (Plisio) غير مفعلة حالياً في المنصة' },
          { status: 400 }
        );
      }

      // Upsert reseller record with status = 'pending_setup'
      let resellerId = alreadyReseller?.id;
      if (!resellerId) {
        const { data: newRes } = await serviceClient
          .from('resellers')
          .insert({
            owner_account_id: accountId,
            plan_id: plan.id,
            subdomain: cleanSubdomain,
            display_name: brand_name,
            display_name_ar: brand_name,
            status: 'pending_setup',
            support_email: profile?.email || user.email || '',
            support_whatsapp: whatsapp_number || null,
            custom_settings: {
              gateway: 'plisio',
              billing_cycle,
              created_at: new Date().toISOString(),
            },
          })
          .select('id')
          .single();
        resellerId = newRes?.id;
      }

      const orderNumber = `reseller_${resellerId}_${Date.now()}`;
      const callbackUrl = `${origin}/api/v1/webhooks/plisio?json=true`;
      const redirectUrl = `${origin}/reseller?payment=success&gateway=plisio`;

      const plisioParams = new URLSearchParams({
        api_key: plisioApiKey.trim(),
        source_currency: 'USD',
        source_amount: String(planPrice),
        currency: 'USDT_TRX',
        order_number: orderNumber,
        order_name: `Reseller Plan: ${plan.name} (${cleanSubdomain})`,
        callback_url: callbackUrl,
        redirect_url: redirectUrl,
        plugin: 'wacrm',
      });

      const plisioRes = await fetch(`https://api.plisio.net/api/v1/invoices/new?${plisioParams.toString()}`);
      const plisioData = await plisioRes.json();

      if (plisioData.status === 'success' && plisioData.data?.invoice_url) {
        // Save invoice tracking in custom_settings
        await serviceClient
          .from('resellers')
          .update({
            custom_settings: {
              gateway: 'plisio',
              plisio_invoice_id: plisioData.data.txn_id,
              plisio_order_number: orderNumber,
              plisio_amount: planPrice,
              billing_cycle,
            },
          })
          .eq('id', resellerId);

        // Ensure reseller_admins
        await serviceClient.from('reseller_admins').upsert({
          reseller_id: resellerId,
          user_id: user.id,
          role: 'owner',
        }, { onConflict: 'reseller_id,user_id', ignoreDuplicates: true });

        return NextResponse.json({
          success: true,
          gateway: 'plisio',
          checkout_url: plisioData.data.invoice_url,
        });
      } else {
        return NextResponse.json(
          { error: plisioData.data?.message || 'فشل إنشاء فاتورة الدفع الرقمي عبر Plisio' },
          { status: 400 }
        );
      }
    }

    // ─────────────────────────────────────────────────────────────
    // GATEWAY 3: OFFLINE / MANUAL TRANSFER
    // ─────────────────────────────────────────────────────────────
    if (!transaction_ref?.trim() && !proof_image_url) {
      return NextResponse.json(
        { error: 'يرجى تقديم رقم الحوالة/المرجع أو رفع إشعار التحويل البنكي' },
        { status: 400 }
      );
    }

    // Upsert reseller record with status = 'pending_setup'
    let resellerId = alreadyReseller?.id;
    const offlinePayload = {
      owner_account_id: accountId,
      plan_id: plan.id,
      subdomain: cleanSubdomain,
      display_name: brand_name,
      display_name_ar: brand_name,
      status: 'pending_setup',
      support_email: profile?.email || user.email || '',
      support_whatsapp: whatsapp_number || null,
      custom_settings: {
        gateway: 'offline',
        billing_cycle,
        offline_payment: {
          method_id: method_id || null,
          transaction_ref: transaction_ref || '',
          proof_image_url: proof_image_url || '',
          notes: notes || '',
          submitted_at: new Date().toISOString(),
        },
      },
    };

    if (resellerId) {
      await serviceClient.from('resellers').update(offlinePayload).eq('id', resellerId);
    } else {
      const { data: newRes, error: insErr } = await serviceClient
        .from('resellers')
        .insert(offlinePayload)
        .select('id')
        .single();
      if (insErr) throw insErr;
      resellerId = newRes.id;
    }

    // Assign owner admin
    await serviceClient.from('reseller_admins').upsert(
      {
        reseller_id: resellerId,
        user_id: user.id,
        role: 'owner',
      },
      { onConflict: 'reseller_id,user_id', ignoreDuplicates: true }
    );

    return NextResponse.json({
      success: true,
      gateway: 'offline',
      pending_approval: true,
      message: 'تم استلام طلب ترقية الموزع وإشعار التحويل بنجاح، سيتم تفعيل حسابك فور مراجعة الإدارة.',
    });
  } catch (err: any) {
    console.error('[ResellerCheckoutAPI] Error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
