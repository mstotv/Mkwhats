'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Check,
  CheckCircle2,
  XCircle,
  Users,
  UsersRound,
  MessageSquare,
  ShoppingBag,
  Radio,
} from 'lucide-react'
import { useLocale } from 'next-intl'

export interface PlanFeatureFlags {
  ai_assistant?: boolean
  excel_export?: boolean
  telegram_bot?: boolean
  automations?: boolean
  flows_builder?: boolean
}

export interface Plan {
  id: string
  name: string
  name_en?: string
  name_ar?: string
  slug: string
  description?: string
  description_ar?: string
  description_en?: string
  price_monthly: number
  price_yearly?: number
  price_monthly_discounted?: number
  price_yearly_discounted?: number
  max_messages_monthly: number
  max_broadcasts_monthly: number
  max_contacts?: number
  max_orders_monthly?: number
  max_users: number
  features?: PlanFeatureFlags
  is_popular?: boolean
}

interface LandingPricingProps {
  plans: Plan[]
  userLoggedIn: boolean
  primaryColor?: string
}

function getLocalizedPlanName(planInput: any, locale: string): string {
  if (!planInput) return ''
  if (locale === 'en' && typeof planInput === 'object' && planInput?.name_en) {
    return planInput.name_en
  }
  if (locale === 'ar' && typeof planInput === 'object' && planInput?.name_ar) {
    return planInput.name_ar
  }
  const name = typeof planInput === 'string' ? planInput : planInput?.name || ''
  if (!name || typeof name !== 'string') return ''
  if (name.includes('/')) {
    const parts = name.split('/').map((s) => s.trim())
    const hasArabicFirst = /[\u0600-\u06FF]/.test(parts[0])
    if (locale === 'ar') {
      return hasArabicFirst ? parts[0] : parts[1] || parts[0]
    } else {
      return hasArabicFirst ? parts[1] || parts[0] : parts[0]
    }
  }

  const lower = name.toLowerCase()
  if (locale === 'ar') {
    if (lower === 'free') return 'المجانية'
    if (lower === 'pro') return 'المحترف'
    if (lower === 'enterprise') return 'المؤسسات'
  } else {
    if (lower === 'المجانية') return 'Free'
    if (lower === 'المحترف') return 'Pro'
    if (lower === 'المؤسسات') return 'Enterprise'
  }
  return name
}

export function LandingPricing({ plans, userLoggedIn }: LandingPricingProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [isYearly, setIsYearly] = useState(false)

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* ── 1. Billing Cycle Switcher (Matching Screenshot Design) ── */}
      <div className="flex items-center justify-center gap-3 text-xs sm:text-sm font-medium text-[#1B1C1C] dark:text-[#F2F0F0]">
        <span className={!isYearly ? 'font-bold text-[#1B1C1C] dark:text-white' : 'text-[#605E5B] dark:text-[#C9C6C1]'}>
          {isAr ? 'الفوترة الشهرية' : 'Monthly Billing'}
        </span>

        {/* Toggle Slider Switch */}
        <button
          type="button"
          onClick={() => setIsYearly(!isYearly)}
          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-[#00685F]"
          role="switch"
          aria-checked={isYearly}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              isYearly ? (isAr ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
            }`}
          />
        </button>

        <span className={isYearly ? 'font-bold text-[#1B1C1C] dark:text-white' : 'text-[#605E5B] dark:text-[#C9C6C1]'}>
          {isAr ? 'الفوترة السنوية' : 'Yearly Billing'}
        </span>

        {/* Discount Pill Badge */}
        <span className="rounded-full bg-[#E6E2DD] dark:bg-zinc-800 text-[#1C1C19] dark:text-[#F2F0F0] px-2.5 py-0.5 text-[11px] font-semibold tracking-tight">
          {isAr ? 'وفر 20% + شهرين مجاناً' : 'Save 20% + 2 Months Free'}
        </span>
      </div>

      {/* ── 2. Pricing Cards Grid (Live DB Data with Screenshot Typography & Design) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((p, idx) => {
          const isPopular = p.is_popular || p.slug === 'pro' || p.name.toLowerCase().includes('pro') || idx === 1
          const isEnterprise = p.slug === 'enterprise' || p.name.toLowerCase().includes('enterprise') || idx === 2
          const localizedName = getLocalizedPlanName(p, locale)

          const priceActive = isYearly
            ? p.price_yearly_discounted && p.price_yearly_discounted > 0
              ? p.price_yearly_discounted
              : p.price_yearly || p.price_monthly * 10
            : p.price_monthly_discounted && p.price_monthly_discounted > 0
            ? p.price_monthly_discounted
            : p.price_monthly

          const displayPrice = priceActive === 0 ? '0' : priceActive.toFixed(2)

          const planDescription = isAr
            ? (p.description_ar || p.description || (isPopular ? 'الأفضل للشركات النامية ومتاجر الملابس وحجز المواعيد.' : isEnterprise ? 'مصممة لفرق المبيعات الكبيرة والعيادات والعلامات متعددة الفروع.' : 'مثالية لتجربة مسارات العمل والمتاجر الفردية في بدايتها.'))
            : (p.description_en || p.description || (isPopular ? 'Best for growing businesses, apparel shops, and appointment booking.' : isEnterprise ? 'Designed for high-volume sales teams, clinics, and multi-branch brands.' : 'Ideal for testing workflows and solo stores just getting started.'))

          const btnText = userLoggedIn
            ? isAr ? 'الانتقال للوحة التحكم' : 'Go to Dashboard'
            : isPopular
            ? isAr ? 'ابدأ تجربة مجانية 14 يوم' : 'Start 14-Day Free Trial'
            : isEnterprise
            ? isAr ? 'الترقية للمؤسسات' : 'Upgrade to Enterprise'
            : isAr ? 'ابدأ مجاناً' : 'Get Started Free'

          const btnStyle = isPopular
            ? 'bg-[#00685F] hover:bg-[#005049] text-white shadow-sm'
            : isEnterprise
            ? 'bg-[#1E1E1E] dark:bg-black hover:bg-neutral-800 text-white shadow-sm'
            : 'border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#1B1C1C] dark:text-white hover:bg-neutral-50'

          return (
            <div
              key={p.id}
              className={`rounded-lg bg-white dark:bg-[#242424] p-8 sm:p-9 flex flex-col justify-between relative transition-all duration-200 ${
                isPopular
                  ? 'border-2 border-[#00685F] shadow-lg shadow-[#00685F]/5'
                  : 'border border-[#EFEDED] dark:border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)]'
              }`}
            >
              {/* Floating "MOST POPULAR CHOICE" Badge on Pro card */}
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#004D40] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-sm whitespace-nowrap">
                  {isAr ? 'الخيار الأكثر طلباً' : 'MOST POPULAR CHOICE'}
                </div>
              )}

              <div className="space-y-6">
                {/* Plan Header: Name & Price */}
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B1C1C] dark:text-white">
                    {localizedName}
                  </h3>

                  <div className="flex items-baseline gap-1 mt-3 font-serif">
                    <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1B1C1C] dark:text-white">
                      ${displayPrice}
                    </span>
                    <span className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] font-sans">
                      /{isYearly ? (isAr ? 'سنوياً' : 'yr') : (isAr ? 'شهرياً' : 'mo')}
                    </span>
                  </div>

                  <p className="text-xs text-[#605E5B] dark:text-[#C9C6C1] mt-3 leading-relaxed min-h-[36px]">
                    {planDescription}
                  </p>
                </div>

                {/* Plan CTA Button */}
                <Link
                  href={userLoggedIn ? '/dashboard' : '/signup'}
                  className={`w-full inline-flex items-center justify-center rounded-[4px] py-2.5 sm:py-3 text-[13px] font-bold uppercase tracking-wider transition-all duration-200 text-center ${btnStyle}`}
                >
                  {btnText}
                </Link>

                {/* Dynamic DB Quotas & Limits List */}
                <div className="space-y-2.5 border-t border-[#EFEDED] dark:border-zinc-800/80 pt-4 text-xs">
                  {/* Account / Users Limit */}
                  <div className="flex items-center justify-between text-[#605E5B] dark:text-[#C9C6C1]">
                    <span className="flex items-center gap-2">
                      {isPopular ? (
                        <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-[#605E5B] dark:text-[#C9C6C1] shrink-0 stroke-[2.5]" />
                      )}
                      <span>{isAr ? 'أعضاء الفريق' : 'Team Members'}</span>
                    </span>
                    <span className="font-bold text-[#1B1C1C] dark:text-white">
                      {p.max_users === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : `${p.max_users} ${isAr ? 'أعضاء' : 'Members'}`}
                    </span>
                  </div>

                  {/* Broadcasts Limit */}
                  <div className="flex items-center justify-between text-[#605E5B] dark:text-[#C9C6C1]">
                    <span className="flex items-center gap-2">
                      {isPopular ? (
                        <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-[#605E5B] dark:text-[#C9C6C1] shrink-0 stroke-[2.5]" />
                      )}
                      <span>{isAr ? 'حملات البرودكاست' : 'Monthly Broadcasts'}</span>
                    </span>
                    <span className="font-bold text-[#1B1C1C] dark:text-white">
                      {p.max_broadcasts_monthly === -1
                        ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️')
                        : (p.max_broadcasts_monthly || 500).toLocaleString('en-US')}
                    </span>
                  </div>

                  {/* Messages Limit */}
                  <div className="flex items-center justify-between text-[#605E5B] dark:text-[#C9C6C1]">
                    <span className="flex items-center gap-2">
                      {isPopular ? (
                        <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-[#605E5B] dark:text-[#C9C6C1] shrink-0 stroke-[2.5]" />
                      )}
                      <span>{isAr ? 'الرسائل الشهرية' : 'Monthly Messages'}</span>
                    </span>
                    <span className="font-bold text-[#1B1C1C] dark:text-white">
                      {p.max_messages_monthly === -1
                        ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️')
                        : (p.max_messages_monthly || 1000).toLocaleString('en-US')}
                    </span>
                  </div>

                  {/* Max Contacts */}
                  <div className="flex items-center justify-between text-[#605E5B] dark:text-[#C9C6C1]">
                    <span className="flex items-center gap-2">
                      {isPopular ? (
                        <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-[#605E5B] dark:text-[#C9C6C1] shrink-0 stroke-[2.5]" />
                      )}
                      <span>{isAr ? 'سقف جهات الاتصال' : 'Max Contacts'}</span>
                    </span>
                    <span className="font-bold text-[#1B1C1C] dark:text-white">
                      {p.max_contacts === -1 || p.max_contacts === undefined
                        ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️')
                        : (p.max_contacts || 1000).toLocaleString('en-US')}
                    </span>
                  </div>

                  {/* Feature Checklists from DB */}
                  <div className="pt-2 space-y-2 border-t border-[#EFEDED]/60 dark:border-zinc-800/40">
                    {/* AI Assistant */}
                    <div className="flex items-center gap-2.5">
                      {p.features?.ai_assistant ? (
                        isPopular ? (
                          <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-[#605E5B] dark:text-[#C9C6C1] shrink-0 stroke-[2.5]" />
                        )
                      ) : (
                        <XCircle className="h-4 w-4 text-neutral-300 dark:text-zinc-700 shrink-0" />
                      )}
                      <span className={p.features?.ai_assistant ? 'font-medium text-[#1B1C1C] dark:text-white' : 'text-neutral-400 line-through'}>
                        {isAr ? 'مساعد الذكاء الاصطناعي (Gemini AI)' : 'Gemini AI Assistant'}
                      </span>
                    </div>

                    {/* Automations */}
                    <div className="flex items-center gap-2.5">
                      {p.features?.automations ? (
                        isPopular ? (
                          <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-[#605E5B] dark:text-[#C9C6C1] shrink-0 stroke-[2.5]" />
                        )
                      ) : (
                        <XCircle className="h-4 w-4 text-neutral-300 dark:text-zinc-700 shrink-0" />
                      )}
                      <span className={p.features?.automations ? 'font-medium text-[#1B1C1C] dark:text-white' : 'text-neutral-400 line-through'}>
                        {isAr ? 'الأتمتة والردود الذكية' : 'Smart Automations'}
                      </span>
                    </div>

                    {/* Flow Builder */}
                    <div className="flex items-center gap-2.5">
                      {p.features?.flows_builder ? (
                        isPopular ? (
                          <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-[#605E5B] dark:text-[#C9C6C1] shrink-0 stroke-[2.5]" />
                        )
                      ) : (
                        <XCircle className="h-4 w-4 text-neutral-300 dark:text-zinc-700 shrink-0" />
                      )}
                      <span className={p.features?.flows_builder ? 'font-medium text-[#1B1C1C] dark:text-white' : 'text-neutral-400 line-through'}>
                        {isAr ? 'منشئ مسارات العمل التفاعلي' : 'Visual Workflow Builder'}
                      </span>
                    </div>

                    {/* Telegram Bot */}
                    <div className="flex items-center gap-2.5">
                      {p.features?.telegram_bot ? (
                        isPopular ? (
                          <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-[#605E5B] dark:text-[#C9C6C1] shrink-0 stroke-[2.5]" />
                        )
                      ) : (
                        <XCircle className="h-4 w-4 text-neutral-300 dark:text-zinc-700 shrink-0" />
                      )}
                      <span className={p.features?.telegram_bot ? 'font-medium text-[#1B1C1C] dark:text-white' : 'text-neutral-400 line-through'}>
                        {isAr ? 'إشعارات بوت تيليجرام' : 'Telegram Bot Alerts'}
                      </span>
                    </div>

                    {/* Excel Export */}
                    <div className="flex items-center gap-2.5">
                      {p.features?.excel_export ? (
                        isPopular ? (
                          <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-[#605E5B] dark:text-[#C9C6C1] shrink-0 stroke-[2.5]" />
                        )
                      ) : (
                        <XCircle className="h-4 w-4 text-neutral-300 dark:text-zinc-700 shrink-0" />
                      )}
                      <span className={p.features?.excel_export ? 'font-medium text-[#1B1C1C] dark:text-white' : 'text-neutral-400 line-through'}>
                        {isAr ? 'تصدير البيانات إلى Excel' : 'Excel Data Export'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
