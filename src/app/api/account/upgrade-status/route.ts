import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح للوصول' }, { status: 401 })
    }

    // 2. Get user's account_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('request_id')

    if (!requestId) {
      return NextResponse.json(
        { error: 'معرّف طلب الترقية مطلوب' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // 3. Fetch upgrade request row for this account
    const { data: upgradeReq, error: reqErr } = await serviceClient
      .from('upgrade_requests')
      .select(`
        id,
        account_id,
        current_plan_id,
        target_plan_id,
        billing_cycle,
        status,
        plisio_invoice_id,
        plisio_amount,
        plisio_currency,
        plisio_status,
        created_at,
        plans:target_plan_id (id, name, price_monthly, price_yearly)
      `)
      .eq('id', requestId)
      .eq('account_id', profile.account_id)
      .maybeSingle()

    if (reqErr || !upgradeReq) {
      return NextResponse.json(
        { error: 'طلب الترقية غير موجود' },
        { status: 404 }
      )
    }

    // 4. Fetch current active subscription for this account
    const { data: activeSub } = await serviceClient
      .from('subscriptions')
      .select('id, plan_id, status, current_period_end, plans(name)')
      .eq('account_id', profile.account_id)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    const targetPlan = upgradeReq.plans as any
    const planName = targetPlan?.name || 'الخطة الجديدة'

    // Determine price
    const amount = upgradeReq.plisio_amount
      ? upgradeReq.plisio_amount
      : upgradeReq.billing_cycle === 'yearly'
      ? targetPlan?.price_yearly
      : targetPlan?.price_monthly

    // Check if subscription is activated for the target plan or request status is completed
    const isCompleted =
      upgradeReq.status === 'completed' ||
      upgradeReq.plisio_status === 'completed' ||
      upgradeReq.plisio_status === 'mismatch' ||
      (activeSub && activeSub.plan_id === upgradeReq.target_plan_id)

    if (isCompleted) {
      return NextResponse.json({
        status: 'completed',
        plan_name: planName,
        billing_cycle: upgradeReq.billing_cycle,
        amount: amount ? Number(amount) : null,
        expires_at: activeSub?.current_period_end || null,
        created_at: upgradeReq.created_at,
      })
    }

    if (upgradeReq.status === 'rejected') {
      return NextResponse.json({
        status: 'failed',
        error: 'تم رفض طلب الترقية',
      })
    }

    // Otherwise still pending verification
    return NextResponse.json({
      status: 'pending',
      message: 'جاري فحص تأكيد الشبكة وتفعيل الاشتراك',
      created_at: upgradeReq.created_at,
    })
  } catch (err: any) {
    console.error('[UpgradeStatusAPI] Error:', err)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء فحص حالة الاشتراك' },
      { status: 500 }
    )
  }
}
