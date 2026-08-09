import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getYearMonth(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Authenticate user from session ONLY
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Resolve account_id strictly from user profile (NO external inputs)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError || !profile?.account_id) {
      return NextResponse.json(
        { error: 'Profile not linked to an account' },
        { status: 403 }
      )
    }

    const accountId = profile.account_id
    const yearMonth = getYearMonth()

    // 3. Fetch active/trialing subscription and plan details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('status, billing_cycle, current_period_end, trial_ends_at, plans(*)')
      .eq('account_id', accountId)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    if (subError) {
      console.error('[UserSubscriptionAPI] Fetch error:', subError)
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
    }

    const plan = subscription?.plans
      ? Array.isArray(subscription.plans)
        ? subscription.plans[0]
        : subscription.plans
      : null

    // 4. Fetch current month usage counter and members count
    const [{ data: counter }, { count: membersCount }] = await Promise.all([
      supabase
        .from('account_usage_counters')
        .select('messages_count, broadcasts_count')
        .eq('account_id', accountId)
        .eq('year_month', yearMonth)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId),
    ])

    const messagesCount = counter?.messages_count || 0
    const broadcastsCount = counter?.broadcasts_count || 0
    const currentMembersCount = membersCount || 1

    const maxMessages = plan?.max_messages_monthly ?? 1000
    const maxBroadcasts = plan?.max_broadcasts_monthly ?? 10
    const maxUsers = plan?.max_users ?? 3

    const messagesLimitExceeded = maxMessages !== -1 && messagesCount >= maxMessages
    const broadcastsLimitExceeded = maxBroadcasts !== -1 && broadcastsCount >= maxBroadcasts
    const usersLimitExceeded = maxUsers !== -1 && currentMembersCount >= maxUsers

    return NextResponse.json({
      subscription: subscription
        ? {
            status: subscription.status,
            billing_cycle: subscription.billing_cycle,
            current_period_end: subscription.current_period_end,
            trial_ends_at: subscription.trial_ends_at,
          }
        : null,
      plan: plan
        ? {
            id: plan.id,
            name: plan.name,
            slug: plan.slug,
            price_monthly: Number(plan.price_monthly),
            price_yearly: Number(plan.price_yearly),
            max_users: plan.max_users,
            max_whatsapp_instances: plan.max_whatsapp_instances,
            max_contacts: plan.max_contacts,
            max_messages_monthly: plan.max_messages_monthly,
            max_broadcasts_monthly: plan.max_broadcasts_monthly,
            features: plan.features || {},
          }
        : null,
      usage: {
        year_month: yearMonth,
        messages_count: messagesCount,
        max_messages: maxMessages,
        messages_percentage:
          maxMessages === -1 ? 0 : Math.min(100, Math.round((messagesCount / maxMessages) * 100)),
        broadcasts_count: broadcastsCount,
        max_broadcasts: maxBroadcasts,
        broadcasts_percentage:
          maxBroadcasts === -1 ? 0 : Math.min(100, Math.round((broadcastsCount / maxBroadcasts) * 100)),
        members_count: currentMembersCount,
        max_users: maxUsers,
        members_percentage:
          maxUsers === -1 ? 0 : Math.min(100, Math.round((currentMembersCount / maxUsers) * 100)),
      },
      limits_exceeded: messagesLimitExceeded || broadcastsLimitExceeded || usersLimitExceeded,
    })
  } catch (err: any) {
    console.error('[UserSubscriptionAPI] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
