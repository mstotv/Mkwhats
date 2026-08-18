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
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-muted-foreground truncate">
          {title}
        </span>
        {Icon && <Icon className="h-4 w-4 text-emerald-500 shrink-0" />}
      </div>

      <div className="mt-3">
        <h3 className="text-3xl font-black text-foreground tracking-tight">
          {typeof value === 'number' ? value.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US') : value}
        </h3>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        {subtitle && <span className="font-medium">{subtitle}</span>}

        {trend && (
          <span className="font-mono text-emerald-500 font-bold text-xs dir-ltr">
            {trend.isPositive !== false ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
