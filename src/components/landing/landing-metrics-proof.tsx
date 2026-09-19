'use client'

import { BarChart3, Clock, Zap, TrendingUp, ShieldCheck } from 'lucide-react'
import { HomeMetricsProofContent, DEFAULT_HOME_CONTENT } from '@/lib/types/home-cms'

interface LandingMetricsProofProps {
  isAr: boolean
  content?: HomeMetricsProofContent
}

function resolveMetricIcon(idx: number) {
  switch (idx % 4) {
    case 0:
      return TrendingUp
    case 1:
      return Zap
    case 2:
      return BarChart3
    case 3:
      return ShieldCheck
    default:
      return TrendingUp
  }
}

function resolveMetricColor(colorName?: string, idx?: number) {
  switch (colorName) {
    case 'emerald':
      return 'text-emerald-500'
    case 'amber':
      return 'text-amber-500'
    case 'teal':
      return 'text-[#00685F] dark:text-[#6BD8CB]'
    case 'purple':
      return 'text-purple-500'
    case 'blue':
      return 'text-blue-500'
    default:
      if (idx === 0) return 'text-emerald-500'
      if (idx === 1) return 'text-amber-500'
      if (idx === 2) return 'text-[#00685F] dark:text-[#6BD8CB]'
      return 'text-purple-500'
  }
}

export function LandingMetricsProof({ isAr, content: rawContent }: LandingMetricsProofProps) {
  const data = rawContent || DEFAULT_HOME_CONTENT.metrics_proof

  const metrics = data.metrics && data.metrics.length > 0
    ? data.metrics.filter((m) => m.visible !== false)
    : DEFAULT_HOME_CONTENT.metrics_proof.metrics.filter((m) => m.visible !== false)

  return (
    <section className="relative z-10 py-16 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 space-y-8">
      <div className="rounded-2xl border border-[#EFEDED] dark:border-zinc-800 bg-white dark:bg-[#242424] p-8 sm:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#00685F] dark:text-[#6BD8CB]">
            {isAr ? (data.badge_ar || 'أرقام وإحصائيات تتحدث عن نفسها') : (data.badge_en || 'PROVEN IMPACT BY THE NUMBERS')}
          </p>
          <h3 className="font-serif text-2xl sm:text-4xl font-bold text-[#1B1C1C] dark:text-white">
            {isAr ? data.title_ar : data.title_en}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {metrics.map((m, idx) => {
            const Icon = resolveMetricIcon(idx)
            const colorClass = resolveMetricColor(m.color, idx)
            return (
              <div
                key={m.id || idx}
                className="rounded-xl border border-[#EFEDED] dark:border-zinc-800/80 bg-[#F9F5F0]/60 dark:bg-zinc-800/40 p-6 space-y-3 text-center sm:text-start"
              >
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Icon className={`h-5 w-5 ${colorClass}`} />
                  <span className="text-3xl sm:text-4xl font-mono font-black text-[#1B1C1C] dark:text-white">
                    {m.value}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#1B1C1C] dark:text-white">
                  {isAr ? m.title_ar : m.title_en}
                </h4>
                <p className="text-xs text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
                  {isAr ? m.desc_ar : m.desc_en}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
