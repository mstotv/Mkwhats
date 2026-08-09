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

    // 4. Fetch subscription counts grouped by plan_id
    const { data: subscriptions, error: subsError } = await serviceClient
      .from('subscriptions')
      .select('plan_id, status')
      .in('status', ['active', 'trialing'])

    if (subsError) {
      console.error('[AdminPlansAPI] Error fetching subscriptions:', subsError)
    }

    const countsMap: Record<string, number> = {}
    if (subscriptions) {
      subscriptions.forEach((sub) => {
        countsMap[sub.plan_id] = (countsMap[sub.plan_id] || 0) + 1
      })
    }

    const plansWithCounts = (plans || []).map((plan) => ({
      ...plan,
      subscriber_count: countsMap[plan.id] || 0,
    }))

    return NextResponse.json({ plans: plansWithCounts })
  } catch (err: any) {
    console.error('[AdminPlansAPI] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
