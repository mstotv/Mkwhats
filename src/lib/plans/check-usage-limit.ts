import { createServiceClient } from '@/lib/supabase/service'

export interface UsageCheckResult {
  allowed: boolean
  reason?: string
  current: number
  limit: number
}

function getYearMonth(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Check if an account has a specific plan feature enabled (e.g. 'ai_assistant', 'excel_export').
 */
export async function checkAccountFeature(
  accountId: string,
  featureKey: 'ai_assistant' | 'excel_export' | 'telegram_bot' | string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createServiceClient()

  // Fetch active subscription & plan features
  const { data: sub, error } = await supabase
    .from('subscriptions')
    .select('status, plans(is_active, features)')
    .eq('account_id', accountId)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  if (error || !sub || !sub.plans) {
    return { allowed: false, reason: 'لا يوجد اشتراك نشط لهذا الحساب' }
  }

  const plan = Array.isArray(sub.plans) ? sub.plans[0] : sub.plans
  if (!plan || !plan.is_active) {
    return { allowed: false, reason: 'خطة الحساب الحالية غير مفعّلة' }
  }

  const features = (plan.features || {}) as Record<string, boolean>
  const isEnabled = Boolean(features[featureKey])

  if (!isEnabled) {
    return {
      allowed: false,
      reason: `هذه الميزة (${featureKey}) غير متوفرة في خطتك الحالية. يرجى الترقية للاستفادة منها.`,
    }
  }

  return { allowed: true }
}

/**
 * Check if sending 'incrementBy' units of type ('messages' | 'broadcasts') would exceed the plan's monthly limit.
 */
export async function checkAccountUsageLimit(
  accountId: string,
  type: 'messages' | 'broadcasts',
  incrementBy: number = 1
): Promise<UsageCheckResult> {
  const supabase = createServiceClient()
  const yearMonth = getYearMonth()

  // 1. Fetch active subscription & plan limits
  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .select('status, plans(is_active, max_messages_monthly, max_broadcasts_monthly)')
    .eq('account_id', accountId)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  if (subError || !sub || !sub.plans) {
    return {
      allowed: false,
      reason: 'لا يوجد اشتراك نشط لهذا الحساب',
      current: 0,
      limit: 0,
    }
  }

  const plan = Array.isArray(sub.plans) ? sub.plans[0] : sub.plans
  if (!plan || !plan.is_active) {
    return {
      allowed: false,
      reason: 'خطة الحساب الحالية غير مفعّلة',
      current: 0,
      limit: 0,
    }
  }

  const limit =
    type === 'messages'
      ? plan.max_messages_monthly ?? 1000
      : plan.max_broadcasts_monthly ?? 10

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 }
  }

  // 2. Fetch current month usage counter
  const { data: counter } = await supabase
    .from('account_usage_counters')
    .select('messages_count, broadcasts_count')
    .eq('account_id', accountId)
    .eq('year_month', yearMonth)
    .maybeSingle()

  const currentCount =
    type === 'messages'
      ? counter?.messages_count || 0
      : counter?.broadcasts_count || 0

  if (currentCount + incrementBy > limit) {
    const typeLabel = type === 'messages' ? 'الرسائل الشهرية' : 'الحملات الشهرية'
    return {
      allowed: false,
      reason: `تم الوصول للحد الأقصى المسموح لـ ${typeLabel} (${currentCount}/${limit}). يرجى ترقية الخطة لمتابعة الإرسال.`,
      current: currentCount,
      limit,
    }
  }

  return {
    allowed: true,
    current: currentCount,
    limit,
  }
}

/**
 * Increment the account usage counter atomically using Postgres RPC function `increment_usage_counter`.
 */
export async function incrementAccountUsageCounter(
  accountId: string,
  messagesDelta: number = 0,
  broadcastsDelta: number = 0
): Promise<void> {
  if (messagesDelta <= 0 && broadcastsDelta <= 0) return

  const supabase = createServiceClient()
  const yearMonth = getYearMonth()

  const { error } = await supabase.rpc('increment_usage_counter', {
    p_account_id: accountId,
    p_year_month: yearMonth,
    p_messages_delta: messagesDelta,
    p_broadcasts_delta: broadcastsDelta,
  })

  if (error) {
    console.error('[incrementAccountUsageCounter] Atomic increment error:', error)
  }
}
