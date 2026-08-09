import { createServiceClient } from '@/lib/supabase/service'
import { AdminNav } from '../_components/admin-nav'
import { StatsCard } from '../_components/stats-card'
import { AccountsGrowthChart, type GrowthDataPoint } from '../_components/accounts-growth-chart'
import {
  Building2,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  ArrowLeft,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <AdminNav />

      <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50 tracking-tight">
              نظرة عامة
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              متابعة ملخص أداء المنصة ونمو الحسابات المسجلة
            </p>
          </div>
          <Link href="/admin/accounts">
            <Button
              size="sm"
              className="bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 gap-1.5 text-xs h-9 px-4 shadow-sm"
            >
              <Users className="h-3.5 w-3.5" />
              إدارة الحسابات
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Stats Grid - Stripe Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="إجمالي الحسابات"
            value={totalAccounts ?? 0}
            subtitle="جميع الحسابات المسجلة"
            icon={Building2}
          />

          <StatsCard
            title="الحسابات النشطة"
            value={activeAccounts ?? (totalAccounts ?? 0)}
            subtitle="حسابات تعمل حالياً"
            icon={CheckCircle2}
          />

          <StatsCard
            title="تسجيلات آخر ٧ أيام"
            value={last7Count}
            subtitle="مقارنة بالأسبوع السابق"
            icon={UserPlus}
            trend={{
              value: `${growth7dPct >= 0 ? '+' : ''}${growth7dPct}%`,
              isPositive: growth7dPct >= 0,
            }}
          />

          <StatsCard
            title="تسجيلات آخر ٣٠ يوم"
            value={last30Count}
            subtitle="مقارنة بالشهر السابق"
            icon={TrendingUp}
            trend={{
              value: `${growth30dPct >= 0 ? '+' : ''}${growth30dPct}%`,
              isPositive: growth30dPct >= 0,
            }}
          />
        </div>

        {/* Chart Section - Stripe Style Card */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
                نمو تسجيل الحسابات (آخر ١٤ يوماً)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                معدل إضافة الحسابات الجديدة يومياً
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-800/60">
              تسجيل يومي
            </span>
          </div>
          <AccountsGrowthChart data={chartData} />
        </div>

        {/* Recent Accounts Table Card - Stripe Style */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-800/60 bg-slate-950/20">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
                أحدث الحسابات المسجلة
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                آخر الحسابات الانضماماً إلى المنصة
              </p>
            </div>
            <Link
              href="/admin/accounts"
              className="text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              عرض جميع الحسابات ({totalAccounts ?? 0})
              <ArrowLeft className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="border-b border-slate-800/60 bg-slate-950/50 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">اسم الحساب</th>
                  <th className="py-3 px-5">الحالة</th>
                  <th className="py-3 px-5">تاريخ التسجيل</th>
                  <th className="py-3 px-5 font-mono">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {recentAccounts && recentAccounts.length > 0 ? (
                  recentAccounts.map((acc) => (
                    <tr
                      key={acc.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-5 font-medium text-slate-100">
                        {acc.name}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                            acc.status === 'suspended'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {acc.status === 'suspended' ? 'معلق' : 'نشط'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-400">
                        {new Date(acc.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                        {acc.id}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-slate-500 text-xs"
                    >
                      لا يوجد حسابات مسجلة بعد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
