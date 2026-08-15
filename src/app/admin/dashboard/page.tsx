import { createServiceClient } from '@/lib/supabase/service'
import { DashboardClient } from './dashboard-client'
import type { GrowthDataPoint } from '../_components/accounts-growth-chart'

export const revalidate = 0

export default async function AdminDashboardPage() {
  const supabase = createServiceClient()

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Total Accounts
  const { count: totalAccounts } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true })

  // 2. Active Accounts
  const { count: activeAccounts } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // 3. Last 7 Days vs Previous 7 Days
  const { count: newAccountsLast7Days } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo)

  const { count: newAccountsPrev7Days } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', fourteenDaysAgo)
    .lt('created_at', sevenDaysAgo)

  // 4. Last 30 Days vs Previous 30 Days
  const { count: newAccountsLast30Days } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo)

  const { count: newAccountsPrev30Days } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sixtyDaysAgo)
    .lt('created_at', thirtyDaysAgo)

  // Calculate percentage growths
  const last7Count = newAccountsLast7Days ?? 0
  const prev7Count = newAccountsPrev7Days ?? 0
  const growth7dPct =
    prev7Count > 0
      ? Math.round(((last7Count - prev7Count) / prev7Count) * 100)
      : last7Count > 0
      ? 100
      : 0

  const last30Count = newAccountsLast30Days ?? 0
  const prev30Count = newAccountsPrev30Days ?? 0
  const growth30dPct =
    prev30Count > 0
      ? Math.round(((last30Count - prev30Count) / prev30Count) * 100)
      : last30Count > 0
      ? 100
      : 0

  // 5. Chart Data: Fetch created_at timestamps for last 30 days
  const { data: chartAccounts } = await supabase
    .from('accounts')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true })

  const daysMap: Record<string, number> = {}
  
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = `${d.getDate()}/${d.getMonth() + 1}`
    daysMap[key] = 0
  }

  if (chartAccounts) {
    chartAccounts.forEach((acc) => {
      const d = new Date(acc.created_at)
      const key = `${d.getDate()}/${d.getMonth() + 1}`
      if (daysMap[key] !== undefined) {
        daysMap[key] += 1
      } else {
        daysMap[key] = 1
      }
    })
  }

  const chartData: GrowthDataPoint[] = Object.entries(daysMap).map(([date, count]) => ({
    date,
    count,
  }))

  // 6. Recent 6 accounts
  const { data: recentAccounts } = await supabase
    .from('accounts')
    .select('id, name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <DashboardClient
      totalAccounts={totalAccounts ?? 0}
      activeAccounts={activeAccounts ?? (totalAccounts ?? 0)}
      last7Count={last7Count}
      growth7dPct={growth7dPct}
      last30Count={last30Count}
      growth30dPct={growth30dPct}
      chartData={chartData}
      recentAccounts={(recentAccounts || []).map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status || 'active',
        created_at: a.created_at,
      }))}
    />
  )
}
