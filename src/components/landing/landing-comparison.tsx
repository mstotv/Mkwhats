'use client'

import { XCircle, CheckCircle2, Zap, ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { HomeComparisonContent, DEFAULT_HOME_CONTENT } from '@/lib/types/home-cms'
import { LinearIconBadge } from '@/components/ui/linear-icon-badge'

interface LandingComparisonProps {
  isAr: boolean
  content?: HomeComparisonContent
}

export function LandingComparison({ isAr, content: rawContent }: LandingComparisonProps) {
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight
  const data = rawContent || DEFAULT_HOME_CONTENT.comparison

  const painPoints = data.pain_points && data.pain_points.length > 0
    ? data.pain_points
    : DEFAULT_HOME_CONTENT.comparison.pain_points

  const solutionPoints = data.solution_points && data.solution_points.length > 0
    ? data.solution_points
    : DEFAULT_HOME_CONTENT.comparison.solution_points

  return (
    <section className="relative z-10 py-20 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3.5">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-full px-4 py-1.5 shadow-sm text-amber-600 dark:text-amber-400">
          <Zap className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="text-[12px] sm:text-[13px] font-semibold tracking-wide uppercase">
            {isAr ? (data.badge_ar || 'التحول الحقيقي لمشروعك') : (data.badge_en || 'THE ULTIMATE TRANSFORMATION')}
          </span>
        </div>

        <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#1B1C1C] dark:text-white leading-tight">
          {isAr ? data.title_ar : data.title_en}{' '}
          <span className="italic text-[#00685F] dark:text-[#6BD8CB]">MK Whats</span>
        </h2>

        <p className="text-sm sm:text-base text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
          {isAr ? data.subtitle_ar : data.subtitle_en}
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* The Old Way (The Pain) */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] dark:bg-rose-950/10 p-6 sm:p-8 space-y-6 flex flex-col justify-between backdrop-blur-md">
          <div className="space-y-4">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-b border-rose-500/10 pb-4">
              <div className="flex items-center gap-3.5">
                <LinearIconBadge
                  icon={<XCircle className="h-5 w-5" />}
                  variant="rose"
                  size="md"
                  glow
                />
                <div>
                  <h3 className="text-lg font-bold text-[#1B1C1C] dark:text-white">
                    {isAr ? 'بدون MK Whats (المعاناة اليدوية)' : 'Without MK Whats (Manual Grind)'}
                  </h3>
                  <p className="text-xs text-rose-500 font-medium">
                    {isAr ? 'إهدار الوقت والفرص البيعية يومياً' : 'Hours wasted and lost sales opportunities'}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-bold px-3 py-1 shadow-sm shrink-0">
                ✕ {isAr ? 'جهد يدوي بطيء' : 'Manual & Slow'}
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {painPoints.map((item, idx) => (
                <div key={item.id || idx} className="flex items-start gap-3 text-xs sm:text-sm">
                  <div className="h-5 w-5 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[11px]">
                    ✕
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1B1C1C] dark:text-white">
                      {isAr ? item.title_ar : item.title_en}
                    </h4>
                    <p className="text-xs text-[#605E5B] dark:text-[#C9C6C1] mt-0.5 leading-relaxed">
                      {isAr ? item.desc_ar : item.desc_en}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-rose-500/10 text-xs text-rose-600/80 dark:text-rose-400 font-medium">
            {isAr
              ? '⚠️ النتيجة: عملاء غاضبون، سلات ضائعة، وفريق عمل مستنزف في مهام روتينية مكررة.'
              : '⚠️ Result: Missed revenue, frustrated customers, and exhausted customer support agents.'}
          </div>
        </div>

        {/* The New Way (MK Whats Solution) */}
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.04] to-transparent dark:from-emerald-950/20 p-6 sm:p-8 space-y-6 flex flex-col justify-between relative shadow-lg shadow-emerald-500/5 backdrop-blur-md">
          <div className="space-y-4">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-b border-emerald-500/10 pb-4">
              <div className="flex items-center gap-3.5">
                <LinearIconBadge
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  variant="emerald"
                  size="md"
                  glow
                />
                <div>
                  <h3 className="text-lg font-bold text-[#1B1C1C] dark:text-white">
                    {isAr ? 'مع MK Whats (التحول الشامل)' : 'With MK Whats (Full Automation)'}
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {isAr ? 'مبيعات مضاعفة وخدمة عملاء لحظية' : 'Higher conversion, instant replies, full peace of mind'}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 shadow-sm shrink-0">
                <Zap className="h-3 w-3" strokeWidth={1.5} />
                {isAr ? 'الأتمتة الذكية 24/7' : '24/7 Autopilot'}
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {solutionPoints.map((item, idx) => (
                <div key={item.id || idx} className="flex items-start gap-3 text-xs sm:text-sm">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[11px]">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1B1C1C] dark:text-white">
                      {isAr ? item.title_ar : item.title_en}
                    </h4>
                    <p className="text-xs text-[#605E5B] dark:text-[#C9C6C1] mt-0.5 leading-relaxed">
                      {isAr ? item.desc_ar : item.desc_en}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-500/10 flex items-center justify-between">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">
              {isAr ? '🚀 النتيجة: نمو حقيقي وتوفير 80% من الجهد البشري.' : '🚀 Result: +40% sales growth, 80% hours saved.'}
            </span>
            <Link
              href="/features"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#00685F] dark:text-[#6BD8CB] hover:underline"
            >
              <span>{isAr ? 'استكشف المميزات' : 'Explore Features'}</span>
              <ArrowIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
