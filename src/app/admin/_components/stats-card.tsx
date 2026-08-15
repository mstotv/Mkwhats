'use client'

import type { LucideIcon } from 'lucide-react'
import { useLocale } from 'next-intl'

interface StatsCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: string
    isPositive?: boolean
  }
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: StatsCardProps) {
  const locale = useLocale()

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/50 p-5 shadow-sm transition-all hover:border-slate-700/60 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">
          {title}
        </span>
        {Icon && <Icon className="h-4 w-4 text-slate-500" />}
      </div>

      <div className="mt-3">
        <h3 className="text-3xl font-semibold text-slate-50 tracking-tight">
          {typeof value === 'number' ? value.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US') : value}
        </h3>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        {subtitle && <span className="text-slate-400 font-normal">{subtitle}</span>}

        {trend && (
          <span className="font-mono text-slate-400 text-xs dir-ltr">
            {trend.isPositive !== false ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
