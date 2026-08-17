import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصمص للوصول' }, { status: 401 })
    }

    // 2. Resolve account_id and user details from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_id, full_name, email, accounts(name)')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError || !profile?.account_id) {
      return NextResponse.json(
        { error: 'ملف المستخدم غير مرتبط بحساب منظم' },
        { status: 403 }
      )
    }

    const accountId = profile.account_id
    const userDisplayName = profile.full_name || profile.email || user.email || 'مستخدم'
    const accountName = (profile.accounts as any)?.name || 'الحساب'

    // 3. Parse request body
    const body = await request.json()
    const { target_plan_id, billing_cycle = 'monthly', notes } = body || {}

    if (!target_plan_id) {
      return NextResponse.json(
        { error: 'يرجى تحديد الخطة المطلوبة للترقية' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // 4. Fetch target plan details, current active subscription, and site_settings
    const [{ data: targetPlan }, { data: currentSub }, { data: siteSettings }] =
      await Promise.all([
        serviceClient
          .from('plans')
          .select('id, name, slug, price_monthly, price_monthly_discounted, price_yearly, price_yearly_discounted')
          .eq('id', target_plan_id)
          .maybeSingle(),
        serviceClient
          .from('subscriptions')
          .select('plan_id, plans(name)')
          .eq('account_id', accountId)
          .in('status', ['active', 'trialing'])
          .maybeSingle(),
        serviceClient
          .from('site_settings')
          .select('platform_name, plisio_api_key, plisio_secret_key, plisio_enabled')
          .limit(1)
          .maybeSingle(),
      ])

    if (!targetPlan) {
      return NextResponse.json(
        { error: 'الخطة المطلوبة غير موجودة أو غير متاحة' },
        { status: 404 }
      )
    }

    const currentPlanId = currentSub?.plan_id || null
    const currentPlanName = (currentSub?.plans as any)?.name || 'الخطة الحالية'

    // Prevent submitting a request for the plan already active
    if (currentPlanId === target_plan_id) {
      return NextResponse.json(
        { error: 'حسابك مشترك بالفعل في هذه الخطة' },
        { status: 400 }
      )
    }

    const planPrice =
      billing_cycle === 'yearly'
        ? (Number(targetPlan.price_yearly_discounted) > 0 ? Number(targetPlan.price_yearly_discounted) : Number(targetPlan.price_yearly))
        : (Number(targetPlan.price_monthly_discounted) > 0 ? Number(targetPlan.price_monthly_discounted) : Number(targetPlan.price_monthly))

    // 5. Insert upgrade request into database (status = 'pending')
    const { data: requestRow, error: insertError } = await serviceClient
      .from('upgrade_requests')
      .insert({
        account_id: accountId,
        requested_by: user.id,
        current_plan_id: currentPlanId,
        target_plan_id: targetPlan.id,
        billing_cycle,
        status: 'pending',
        notes: notes || null,
      })
      .select('id, created_at')
      .single()

    if (insertError || !requestRow) {
      console.error('[UpgradeRequestAPI] Insert error:', insertError)
      return NextResponse.json(
        { error: 'فشل تسليط طلب الترقية في قاعدة البيانات' },
        { status: 500 }
      )
    }

    // 6. Check if Plisio Payment Gateway is configured and enabled site-wide
    console.log('[UpgradeRequestAPI] Debug siteSettings fetched:', siteSettings)

    const plisioEnabled = Boolean(siteSettings?.plisio_enabled)
    const plisioApiKey = siteSettings?.plisio_secret_key || siteSettings?.plisio_api_key

    console.log('[UpgradeRequestAPI] Decision check:', {
      plisioEnabled,
      hasApiKey: Boolean(plisioApiKey),
      apiKeyLength: plisioApiKey ? plisioApiKey.length : 0,
    })

    const reqHeaders = request.headers
    const host = reqHeaders.get('host') || 'crm.example.com'
    const protocol = reqHeaders.get('x-forwarded-proto') || 'https'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`

    if (plisioEnabled && plisioApiKey) {
      try {
        const callbackUrl = `${siteUrl}/api/v1/webhooks/plisio?json=true`
        const redirectUrl = `${siteUrl}/settings/upgrade-success?request_id=${requestRow.id}`

        const plisioParams = new URLSearchParams({
          api_key: plisioApiKey,
          source_currency: 'USD',
          source_amount: String(planPrice),
          currency: 'USDT_TRX',
          order_number: requestRow.id,
          order_name: `Upgrade to ${targetPlan.name} (${billing_cycle})`,
          callback_url: callbackUrl,
          redirect_url: redirectUrl,
          plugin: 'wacrm',
        })

        const plisioApiUrl = `https://api.plisio.net/api/v1/invoices/new?${plisioParams.toString()}`
        console.log('[UpgradeRequestAPI] Calling Plisio API:', plisioApiUrl)

        const plisioRes = await fetch(plisioApiUrl, { method: 'GET' })
        const plisioData = await plisioRes.json()

        console.log('[UpgradeRequestAPI] Plisio API response:', plisioData)

        if (plisioData.status === 'success' && plisioData.data?.invoice_url) {
          const { txn_id, invoice_url, currency: pCurrency } = plisioData.data

          // Store Plisio invoice tracking details
          await serviceClient
            .from('upgrade_requests')
            .update({
              plisio_invoice_id: txn_id,
              plisio_invoice_url: invoice_url,
              plisio_amount: planPrice,
              plisio_currency: pCurrency || 'USDT_TRX',
              plisio_status: 'new',
            })
            .eq('id', requestRow.id)

          return NextResponse.json({
            success: true,
            payment_method: 'plisio',
            checkout_url: invoice_url,
            request_id: requestRow.id,
            target_plan_name: targetPlan.name,
            message: 'تم إنشاء فاتورة الدفع الرقمي بالكريبتو، يرجى إتمام الدفع لتفعيل الخطة فوراً.',
          })
        } else {
          console.warn('[UpgradeRequestAPI] Plisio invoice creation returned error status:', plisioData)
        }
      } catch (plisioErr) {
        console.error('[UpgradeRequestAPI] Exception while calling Plisio API:', plisioErr)
      }
    } else {
      console.log('[UpgradeRequestAPI] Plisio is disabled or missing key. Falling back to WhatsApp.')
    }

    // 7. Fallback mode: WhatsApp Direct Contact link if Plisio is disabled or unavailable
    const requestIdShort = requestRow.id.slice(0, 8).toUpperCase()
    const supportPhone = (siteSettings as any)?.support_whatsapp || '966500000000'
    const cleanPhone = supportPhone.replace(/\D/g, '')

    const cycleText = billing_cycle === 'yearly' ? 'سنوي' : 'شهري'
    const priceText = `$${planPrice}/${billing_cycle === 'yearly' ? 'سنة' : 'شهر'}`

    const messageText = `مرحباً، أود ترقية حسابي (${accountName} - ${userDisplayName}) من خطة [${currentPlanName}] إلى خطة [${targetPlan.name}] (${priceText} - اشتراك ${cycleText}).
رقم طلب الترقية: #REQ-${requestIdShort}`

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`

    return NextResponse.json({
      success: true,
      payment_method: 'whatsapp',
      whatsapp_url: whatsappUrl,
      request_id: requestRow.id,
      target_plan_name: targetPlan.name,
      message: 'تم تسجيل طلب الترقية بنجاح، جاري توجيهك للتواصل المباشر مع الدعم',
    })
  } catch (err: any) {
    console.error('[UpgradeRequestAPI] Unexpected error:', err)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع عند تسجيل طلب الترقية' },
      { status: 500 }
    )
  }
}
