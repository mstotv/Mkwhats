import { createServiceClient } from '@/lib/supabase/service'
import { AdminNav } from '../_components/admin-nav'
import { PlansClient } from './plans-client'
import type { Plan } from '../_components/edit-plan-modal'

export const revalidate = 0

export default async function AdminPlansPage() {
  const supabase = createServiceClient()

  // 1. Fetch plans
  const { data: plansData } = await supabase
    .from('plans')
    .select('*')
    .order('price_monthly', { ascending: true })

  // 2. Fetch subscriber counts
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .in('status', ['active', 'trialing'])

  const countsMap: Record<string, number> = {}
  if (subscriptions) {
    subscriptions.forEach((sub) => {
      countsMap[sub.plan_id] = (countsMap[sub.plan_id] || 0) + 1
    })
  }

  const initialPlans: Plan[] = (plansData || []).map((plan) => ({
    ...plan,
    price_monthly: Number(plan.price_monthly),
    price_yearly: Number(plan.price_yearly),
    subscriber_count: countsMap[plan.id] || 0,
  }))

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 dir-rtl">
      <AdminNav />

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <PlansClient initialPlans={initialPlans} />
      </main>
    </div>
  )
}
