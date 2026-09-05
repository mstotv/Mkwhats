'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  Eye,
  Users,
  Calendar,
  TrendingUp,
  MousePointerClick,
  RefreshCw,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import type { StorefrontAnalyticsSummary } from '@/lib/storefront/types'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'

export function AnalyticsPanel() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [data, setData] = useState<StorefrontAnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/storefront/analytics')
      const json = await res.json()
      if (json.analytics) {
        setData(json.analytics)
      } else {
        toast.error(isAr ? 'تعذر تحميل إحصائيات الصفحة' : 'Failed to load page analytics')
      }
    } catch {
      toast.error(isAr ? 'حدث خطأ أثناء تحميل بيانات التحليلات' : 'Error loading analytics data')
    } finally {
      setLoading(false)
    }
  }, [isAr])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const totalClicks = (data?.top_links || []).reduce((sum, l) => sum + l.clicks, 0)

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card">
        <div className="space-y-0.5">
          <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span>{isAr ? 'تحليلات وإحصائيات البايو لينك (Traffic & Clicks)' : 'Bio Link Analytics & Clicks'}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? 'تتبع عدد الزوار، المشاهدات الفريدة، والنقرات الدقيقة على كل زر ورابط في صفحتك'
              : 'Track visitor counts, unique views, and detailed clicks on every link and button'}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold transition-all w-fit disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{isAr ? 'تحديث الأرقام' : 'Refresh'}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Visits */}
        <div className="p-4 rounded-2xl border border-border bg-card space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{isAr ? 'إجمالي الزيارات' : 'Total Visits'}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">
            {loading ? '...' : (data?.total_visits || 0).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
          </div>
          <p className="text-[10px] text-muted-foreground">{isAr ? 'عدد مرات فتح صفحتك بالكامل' : 'Total page views'}</p>
        </div>

        {/* Unique Visitors */}
        <div className="p-4 rounded-2xl border border-border bg-card space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{isAr ? 'الزوار الفريدون' : 'Unique Visitors'}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">
            {loading ? '...' : (data?.unique_visits || 0).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
          </div>
          <p className="text-[10px] text-muted-foreground">{isAr ? 'زوار فريدون عبر أجهزة مختلفة' : 'Unique people from devices'}</p>
        </div>

        {/* Last 7 Days */}
        <div className="p-4 rounded-2xl border border-border bg-card space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{isAr ? 'آخر 7 أيام' : 'Last 7 Days'}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">
            {loading ? '...' : (data?.last_7_days || 0).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
          </div>
          <p className="text-[10px] text-muted-foreground">{isAr ? 'حجم التفاعل خلال الأسبوع الأخير' : 'Visits over past week'}</p>
        </div>

        {/* Last 30 Days */}
        <div className="p-4 rounded-2xl border border-border bg-card space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{isAr ? 'آخر 30 يوماً' : 'Last 30 Days'}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">
            {loading ? '...' : (data?.last_30_days || 0).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
          </div>
          <p className="text-[10px] text-muted-foreground">{isAr ? 'إجمالي الزيارات خلال الشهر الحالي' : 'Visits over past month'}</p>
        </div>
      </div>

      {/* Button & Link Click Breakdown */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
              <MousePointerClick className="w-4 h-4 text-purple-600" />
              <span>{isAr ? 'نقرات الأزرار والروابط (Click Analytics)' : 'Button & Link Click Analytics'}</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAr ? 'أي الروابط والأزرار نالت أكبر تفاعل من الزوار' : 'Which buttons and links received the most visitor interactions'}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            {isAr ? `إجمالي النقرات: ${totalClicks}` : `Total Clicks: ${totalClicks}`}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-500" />
            <div>{isAr ? 'جاري جلب بيانات النقرات...' : 'Loading click data...'}</div>
          </div>
        ) : !data?.top_links || data.top_links.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-border/80 text-center space-y-2 bg-muted/10">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 mx-auto flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-foreground">
              {isAr ? 'لا توجد نقرات مسجلة حتى الآن' : 'No recorded clicks yet'}
            </div>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              {isAr
                ? 'عندما يزور الأشخاص رابط صفحتك ويضغطون على أزرارك، ستظهر إحصائيات كل زر بدقة هنا.'
                : 'When visitors browse your bio link and click buttons, detailed stats will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {data.top_links.map((link, idx) => {
              const percentage = totalClicks > 0 ? Math.round((link.clicks / totalClicks) * 100) : 0
              return (
                <div
                  key={link.link_id}
                  className="p-3 rounded-xl border border-border/70 bg-background/50 hover:bg-background transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-foreground truncate">{link.title}</span>
                      {link.url && link.url !== '#' && (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-purple-600 transition-colors shrink-0"
                          title={isAr ? 'زيارة الرابط' : 'Visit link'}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-muted-foreground text-[11px] font-medium">{percentage}%</span>
                      <span className="font-bold text-foreground font-mono bg-muted px-2 py-0.5 rounded-md text-[11px]">
                        {link.clicks} {isAr ? 'نقرة' : 'clicks'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-purple-600 to-indigo-500 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
