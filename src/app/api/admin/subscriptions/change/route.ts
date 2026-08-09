import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
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

    // 3. Parse request body
    const body = await request.json()
    const { account_id, plan_id, billing_cycle = 'monthly' } = body || {}

    if (!account_id || !plan_id) {
      return NextResponse.json(
        { error: 'account_id and plan_id are required' },
        { status: 400 }
      )
    }

    // 4. Fetch target plan
    const { data: targetPlan, error: planError } = await serviceClient
      .from('plans')
      .select('id, name, is_active')
      .eq('id', plan_id)
      .maybeSingle()

    if (planError || !targetPlan) {
      return NextResponse.json({ error: 'Selected plan not found' }, { status: 404 })
    }

    if (!targetPlan.is_active) {
      return NextResponse.json(
        { error: 'Selected plan is currently inactive' },
        { status: 400 }
      )
    }

    const now = new Date()
    const periodEnd = new Date(now)
    if (billing_cycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    // 5. Fetch current active or trialing subscription for this account
    const { data: currentSub } = await serviceClient
      .from('subscriptions')
      .select('id, plan_id')
      .eq('account_id', account_id)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    // 6. If account already has an active subscription, explicitly mark IT as 'canceled' by ID
    if (currentSub) {
      if (currentSub.plan_id === plan_id) {
        return NextResponse.json(
          { error: 'الحساب مشترك بالفعل في هذه الخطة' },
          { status: 400 }
        )
      }

      const { error: cancelError } = await serviceClient
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', currentSub.id)

      if (cancelError) {
        console.error('[AdminChangeSubscriptionAPI] Cancel error:', cancelError)
        return NextResponse.json(
          { error: 'فشل في إلغاء الاشتراك الحالي' },
          { status: 500 }
        )
      }
    }

    // 7. Insert NEW subscription row (preserving history)
    const { data: newSub, error: insertError } = await serviceClient
      .from('subscriptions')
      .insert({
        account_id,
        plan_id,
        status: 'active',
        billing_cycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select('*, plans(*)')
      .single()

    if (insertError || !newSub) {
      console.error('[AdminChangeSubscriptionAPI] Insert error:', insertError)
      return NextResponse.json(
        { error: 'فشل في إنشاء الاشتراك الجديد' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, subscription: newSub })
  } catch (err: any) {
    console.error('[AdminChangeSubscriptionAPI] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
