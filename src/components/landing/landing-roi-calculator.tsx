'use client'

import { useState } from 'react'
import { Calculator, TrendingUp, Clock, DollarSign, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { HomeRoiCalculatorContent, DEFAULT_HOME_CONTENT } from '@/lib/types/home-cms'

interface LandingRoiCalculatorProps {
  isAr: boolean
  content?: HomeRoiCalculatorContent
}

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function LandingRoiCalculator({ isAr, content: rawContent }: LandingRoiCalculatorProps) {
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight
  const data = rawContent || DEFAULT_HOME_CONTENT.roi_calculator

  // Monthly incoming messages / inquiries slider state
  const [monthlyMessages, setMonthlyMessages] = useState<number>(data.default_messages || 3000)

  // Average order value in USD
  const [avgOrderValue, setAvgOrderValue] = useState<number>(data.default_aov || 35)

  // Calculations:
  // 1. Hours saved: each message manual response takes ~1.5 min. AI saves ~70% of routine traffic
  const hoursSaved = Math.round((monthlyMessages * 0.7 * 1.5) / 60)

  // 2. Abandoned Carts / Drop-offs recovered: ~8% of inquiries drop off; MK Whats recovers ~25% of them
  const recoveredOrders = Math.round((monthlyMessages * 0.08) * 0.25)

  // 3. Additional Revenue per month
  const additionalRevenue = Math.round(recoveredOrders * avgOrderValue)

  // 4. ROI Multiplier: compared to an average subscription cost (~$50)
  const estimatedRoi = Math.max(1, Math.round(additionalRevenue / 49))

  return (
    <section className="py-20 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 space-y-12">
      <div className="rounded-3xl bg-gradient-to-b from-[#14171B] to-[#1E2228] border border-zinc-800 p-8 sm:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.5)] text-white space-y-10 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00685F]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 z-10 relative">
          <div className="inline-flex items-center gap-2 bg-[#00685F]/20 border border-[#00685F]/40 rounded-full px-4 py-1.5 shadow-sm text-[#6BD8CB]">
            <Calculator className="h-4 w-4" />
            <span className="text-[12px] sm:text-[13px] font-semibold tracking-wide uppercase">
              {isAr ? (data.badge_ar || 'حاسبة العائد الاستثماري التفاعلية') : (data.badge_en || 'INTERACTIVE ROI CALCULATOR')}
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white leading-tight">
            {isAr ? data.title_ar : data.title_en}{' '}
            <span className="text-[#6BD8CB]">MK Whats</span>{isAr ? '؟' : '?'}
          </h2>

          <p className="text-sm sm:text-base text-zinc-400">
            {isAr ? data.subtitle_ar : data.subtitle_en}
          </p>
        </div>

        {/* Interactive Calculator Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 relative">
          {/* Sliders Input Column (6 cols) */}
          <div className="lg:col-span-6 rounded-2xl bg-white/5 border border-white/10 p-6 sm:p-8 space-y-8 backdrop-blur-sm">
            {/* Slider 1: Monthly Messages */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-zinc-300">
                  {isAr ? 'عدد رسائل ومحادثات واتساب شهرياً:' : 'Monthly WhatsApp Inquiries:'}
                </label>
                <span suppressHydrationWarning className="text-lg sm:text-xl font-mono font-bold text-[#6BD8CB]">
                  {formatNumber(monthlyMessages)} {isAr ? 'رسالة' : 'chats'}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="25000"
                step="500"
                value={monthlyMessages}
                onChange={(e) => setMonthlyMessages(Number(e.target.value))}
                className="w-full h-2.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#6BD8CB]"
              />
              <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                <span>500</span>
                <span>5,000</span>
                <span>15,000</span>
                <span>25,000+</span>
              </div>
            </div>

            {/* Slider 2: Average Order Value */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-zinc-300">
                  {isAr ? 'متوسط قيمة الطلب الواحد (تقريباً):' : 'Average Order Value (Approx):'}
                </label>
                <span suppressHydrationWarning className="text-lg sm:text-xl font-mono font-bold text-amber-400">
                  ${formatNumber(avgOrderValue)}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                step="5"
                value={avgOrderValue}
                onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                className="w-full h-2.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                <span>$10</span>
                <span>$75</span>
                <span>$150</span>
                <span>$300+</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed border-t border-white/5 pt-4">
              {isAr
                ? '💡 تستند الحسابات التقديرية إلى معايير قطاع التجارة الإلكترونية ومعدل تحويل وأتمتة 70% للردود الروتينية واسترجاع 25% من السلات المتروكة.'
                : '💡 Calculations are based on e-commerce averages: 70% routine chat deflection and 25% abandoned checkout recovery rate.'}
            </p>
          </div>

          {/* Results Display Column (6 cols) */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Metric 1: Hours Saved */}
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">
                  {isAr ? 'ساعات عمل موفرة شهرياً' : 'Hours Saved Monthly'}
                </span>
                <Clock className="h-4 w-4 text-emerald-400" />
              </div>
              <p suppressHydrationWarning className="text-3xl sm:text-4xl font-black font-mono text-white">
                ~{hoursSaved} <span className="text-sm font-normal text-zinc-400">{isAr ? 'ساعة' : 'hrs'}</span>
              </p>
              <p className="text-[11px] text-zinc-400">
                {isAr ? 'ما يعادل عمل موظف دوام كامل' : 'Equivalent to 1 full-time rep'}
              </p>
            </div>

            {/* Metric 2: Additional Revenue */}
            <div className="rounded-2xl bg-gradient-to-br from-[#00685F]/30 to-emerald-900/20 border border-[#00685F]/40 p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-300 font-medium">
                  {isAr ? 'مبيعات مستردة إضافية' : 'Estimated New Revenue'}
                </span>
                <DollarSign className="h-4 w-4 text-[#6BD8CB]" />
              </div>
              <p suppressHydrationWarning className="text-3xl sm:text-4xl font-black font-mono text-[#6BD8CB]">
                +${formatNumber(additionalRevenue)}
              </p>
              <p suppressHydrationWarning className="text-[11px] text-emerald-200/80">
                ~{recoveredOrders} {isAr ? 'طلب مسترجع من السلات' : 'recovered orders'}
              </p>
            </div>

            {/* Metric 3: Estimated ROI */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-900/10 border border-purple-500/30 p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-300 font-medium">
                  {isAr ? 'مضاعف العائد الاستثماري' : 'Estimated ROI Multiplier'}
                </span>
                <TrendingUp className="h-4 w-4 text-purple-400" />
              </div>
              <p suppressHydrationWarning className="text-3xl sm:text-4xl font-black font-mono text-purple-300">
                {estimatedRoi}x
              </p>
              <p className="text-[11px] text-purple-300/80">
                {isAr ? 'عائد مقابل كل دولار اشتراك' : 'Return per $1 invested'}
              </p>
            </div>

            {/* Metric 4: Response Speed */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-900/10 border border-amber-500/30 p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-300 font-medium">
                  {isAr ? 'سرعة التفاعل مع العميل' : 'Response Speed'}
                </span>
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-3xl sm:text-4xl font-black font-mono text-amber-300">
                &lt; 3s
              </p>
              <p className="text-[11px] text-amber-300/80">
                {isAr ? 'لحظياً دون نوم أو تأخير' : 'Instant 24/7 engagement'}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10 z-10 relative">
          <p className="text-xs sm:text-sm text-zinc-300">
            {isAr
              ? 'هل ترغب في البدء الفعلي واختبار هذه الأرقام على متجرك؟'
              : 'Ready to realize these numbers on your actual WhatsApp store?'}
          </p>
          <Link
            href={data.cta_url || '/signup'}
            className="inline-flex items-center gap-2 rounded-[4px] bg-[#6BD8CB] hover:bg-[#52cabb] text-slate-950 font-bold px-6 py-3 text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 hover:scale-[1.02] transition-all"
          >
            <span>{isAr ? (data.cta_text_ar || 'ابدأ توفير وقتك ومضاعفة مبيعاتك الآن') : (data.cta_text_en || 'Start Saving Time & Scaling Sales Today')}</span>
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
