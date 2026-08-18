import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح للوصول' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 403 });
    }

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('offline_payment_submissions')
      .select('*, plans(name), offline_payment_methods(name, account_number, logo_url)')
      .eq('account_id', profile.account_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AccountOfflinePaymentAPI] GET error:', error);
      return NextResponse.json({ submissions: [] });
    }

    return NextResponse.json({ submissions: data || [] });
  } catch (err) {
    console.error('[AccountOfflinePaymentAPI] GET Exception:', err);
    return NextResponse.json({ submissions: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح للوصول' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, full_name, email')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 403 });
    }

    const body = await request.json();
    const {
      plan_id,
      billing_cycle = 'monthly',
      method_id,
      transaction_ref,
      proof_image_url,
      user_notes,
    } = body || {};

    if (!plan_id) {
      return NextResponse.json({ error: 'يرجى تحديد الباقة المطلوبة' }, { status: 400 });
    }

    if (!transaction_ref && !proof_image_url) {
      return NextResponse.json(
        { error: 'يرجى تقديم إما رقم الحوالة/المرجع أو صورة وصل الدفع' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Fetch plan details to get calculated amount
    const { data: plan } = await serviceClient
      .from('plans')
      .select('id, name, price_monthly, price_monthly_discounted, price_yearly, price_yearly_discounted')
      .eq('id', plan_id)
      .maybeSingle();

    if (!plan) {
      return NextResponse.json({ error: 'الباقة غير موجودة' }, { status: 404 });
    }

    const planPrice =
      billing_cycle === 'yearly'
        ? (Number(plan.price_yearly_discounted) > 0 ? Number(plan.price_yearly_discounted) : Number(plan.price_yearly))
        : (Number(plan.price_monthly_discounted) > 0 ? Number(plan.price_monthly_discounted) : Number(plan.price_monthly));

    // Insert offline payment submission
    const { data: submission, error: insertError } = await serviceClient
      .from('offline_payment_submissions')
      .insert({
        account_id: profile.account_id,
        user_id: user.id,
        method_id: method_id || null,
        plan_id: plan.id,
        billing_cycle,
        amount: planPrice,
        currency: 'USD',
        transaction_ref: transaction_ref || null,
        proof_image_url: proof_image_url || null,
        user_notes: user_notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !submission) {
      console.error('[AccountOfflinePaymentAPI] Insert error:', insertError);
      return NextResponse.json({ error: 'فشل إرسال إثبات الدفع، يرجى إعادة المحاولة' }, { status: 500 });
    }

    // Also register an upgrade request entry for admin visibility
    try {
      await serviceClient
        .from('upgrade_requests')
        .insert({
          account_id: profile.account_id,
          requested_by: user.id,
          target_plan_id: plan.id,
          billing_cycle,
          status: 'pending',
          notes: `Offline Payment Proof Submitted (Ref: ${transaction_ref || 'Image Receipt'})`,
        });
    } catch (e) {
      console.warn('[AccountOfflinePaymentAPI] Upgrade request track notice:', e);
    }

    return NextResponse.json({
      success: true,
      submission,
      message: 'تم إرسال إثبات الدفع بنجاح! جاري مراجعة الطلب وتفعيل الباقة من قبل الإدارة.',
    });
  } catch (err) {
    console.error('[AccountOfflinePaymentAPI] POST Exception:', err);
    return NextResponse.json({ error: 'حدث خطأ عند إرسال إثبات الدفع' }, { status: 500 });
  }
}
