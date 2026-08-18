'use client'

import Link from 'next/link'
import {
  Building2,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  ArrowLeft,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations, useLocale } from 'next-intl'
import { StatsCard } from '../_components/stats-card'
import { AccountsGrowthChart, type GrowthDataPoint } from '../_components/accounts-growth-chart'

export interface RecentAccount {
  id: string
  name: string
  status: string
  created_at: string
}

interface DashboardClientProps {
  totalAccounts: number
  activeAccounts: number
  last7Count: number
  growth7dPct: number
  last30Count: number
  growth30dPct: number
  chartData: GrowthDataPoint[]
  recentAccounts: RecentAccount[]
}

export function DashboardClient({
  totalAccounts,
  activeAccounts,
  last7Count,
  growth7dPct,
  last30Count,
  growth30dPct,
  chartData,
  recentAccounts,
}: DashboardClientProps) {
  const t = useTranslations('Admin.dashboard')
  const locale = useLocale()

  return (
    <div className="space-y-8">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {t('title')}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {t('description')}
            </p>
          </div>
          <Link href="/admin/accounts">
            <Button
              size="sm"
              className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 gap-1.5 text-xs h-9 px-4 shadow-sm"
            >
              <Users className="h-3.5 w-3.5" />
              {t('manageAccounts')}
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Stats Grid - Stripe Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={t('totalAccounts')}
            value={totalAccounts}
            subtitle={t('totalAccountsSub')}
            icon={Building2}
          />

          <StatsCard
            title={t('activeAccounts')}
            value={activeAccounts}
            subtitle={t('activeAccountsSub')}
            icon={CheckCircle2}
          />

          <StatsCard
            title={t('signupsLast7')}
            value={last7Count}
            subtitle={t('signupsLast7Sub')}
            icon={UserPlus}
            trend={{
              value: `${growth7dPct >= 0 ? '+' : ''}${growth7dPct}%`,
              isPositive: growth7dPct >= 0,
            }}
          />

          <StatsCard
            title={t('signupsLast30')}
            value={last30Count}
            subtitle={t('signupsLast30Sub')}
            icon={TrendingUp}
            trend={{
              value: `${growth30dPct >= 0 ? '+' : ''}${growth30dPct}%`,
              isPositive: growth30dPct >= 0,
            }}
          />
        </div>

        {/* Chart Section - Stripe Style Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">
                {t('growthChartTitle')}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('growthChartSub')}
              </p>
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
              {t('dailySignups')}
            </span>
          </div>
          <AccountsGrowthChart data={chartData} />
        </div>

        {/* Recent Accounts Table Card - Stripe Style */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">
                {t('recentAccountsTitle')}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('recentAccountsSub')}
              </p>
            </div>
            <Link
              href="/admin/accounts"
              className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              {t('viewAllAccounts', { count: totalAccounts })}
              <ArrowLeft className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-foreground">
              <thead className="border-b border-border bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">{t('thAccountName')}</th>
                  <th className="py-3 px-5">{t('thStatus')}</th>
                  <th className="py-3 px-5">{t('thCreated')}</th>
                  <th className="py-3 px-5 font-mono">{t('thId')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentAccounts && recentAccounts.length > 0 ? (
                  recentAccounts.map((acc) => (
                    <tr
                      key={acc.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="py-3.5 px-5 font-bold text-foreground">
                        {acc.name}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                            acc.status === 'suspended'
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}
                        >
                          {acc.status === 'suspended' ? t('suspended') : t('active')}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-muted-foreground font-medium" suppressHydrationWarning>
                        {new Date(acc.created_at).toLocaleDateString(
                          locale === 'ar' ? 'ar-EG' : 'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-muted-foreground font-mono text-[11px]">
                        {acc.id}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground text-xs"
                    >
                      {t('noAccounts')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }
