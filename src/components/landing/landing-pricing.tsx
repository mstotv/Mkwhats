'use client'

import { useState, useEffect } from 'react'
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
  Network,
  Building2,
  Globe,
  Sparkles,
  Star,
} from 'lucide-react'
import { useLocale } from 'next-intl'

export interface PlanFeatureFlags {
  ai_assistant?: boolean
  voice_transcription?: boolean
  excel_export?: boolean
  telegram_bot?: boolean
  automations?: boolean
  flows_builder?: boolean
  woocommerce_integration?: boolean
  shopify_integration?: boolean
  bio_link?: boolean
}

export interface ResellerPlanItem {
  id: string
  name: string
  name_ar?: string
  slug: string
  price_monthly: number
  price_yearly: number
  max_accounts: number
  max_custom_domains: number
  features: Record<string, any>
  is_popular?: boolean
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
  max_subdomain_changes?: number
  features?: PlanFeatureFlags
  is_popular?: boolean
}

interface LandingPricingProps {
  plans: Plan[]
  resellerPlans?: ResellerPlanItem[]
  userLoggedIn: boolean
  primaryColor?: string
  initialTab?: 'business' | 'reseller'
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

export function LandingPricing({
  plans,
  resellerPlans = [],
  userLoggedIn,
  initialTab = 'business',
}: LandingPricingProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [pricingTab, setPricingTab] = useState<'business' | 'reseller'>(initialTab)
  const [isYearly, setIsYearly] = useState(false)

  useEffect(() => {
    if (initialTab) {
      setPricingTab(initialTab)
    }
  }, [initialTab])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('tab') === 'reseller') {
        setPricingTab('reseller')
      } else if (params.get('tab') === 'business') {
        setPricingTab('business')
      }
    }
  }, [])

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* ── 0. Category Switcher: Business SaaS vs Reseller Partner ── */}
      {resellerPlans && resellerPlans.length > 0 && (
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#E6E2DD]/80 dark:bg-zinc-800/80 border border-neutral-200 dark:border-zinc-700 shadow-xs">
            <button
              type="button"
              onClick={() => setPricingTab('business')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                pricingTab === 'business'
                  ? 'bg-white dark:bg-zinc-900 text-[#1B1C1C] dark:text-white shadow-sm'
                  : 'text-[#605E5B] dark:text-[#C9C6C1] hover:text-[#1B1C1C]'
              }`}
            >
              {isAr ? 'باقات الشركات والمتاجر' : 'Business SaaS Plans'}
            </button>
            <button
              type="button"
              onClick={() => setPricingTab('reseller')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                pricingTab === 'reseller'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#605E5B] dark:text-[#C9C6C1] hover:text-[#1B1C1C]'
              }`}
            >
              <Network className="h-4 w-4" />
              <span>{isAr ? 'باقات الموزعين (White-Label)' : 'Reseller Partner Plans'}</span>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-100 px-2 py-0.5 rounded-full font-bold">
                {isAr ? 'أرباحك 100%' : '100% Profit'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── 1. Billing Cycle Switcher ── */}
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

      {/* ── 2. Pricing Cards Grid ── */}
      {pricingTab === 'reseller' ? (
        /* RESELLER PLANS GRID */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {resellerPlans.map((rp, idx) => {
            const isPopular = rp.is_popular || idx === 1
            const price = isYearly ? Math.round(rp.price_yearly / 12) : rp.price_monthly

            return (
              <div
                key={rp.id}
                className={`rounded-2xl bg-white dark:bg-[#242424] p-8 sm:p-9 flex flex-col justify-between relative transition-all duration-200 ${
                  isPopular
                    ? 'border-2 border-emerald-500 shadow-xl shadow-emerald-500/10'
                    : 'border border-[#EFEDED] dark:border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)]'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 start-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1 text-xs font-bold text-white shadow-md">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {isAr ? 'الأكثر طلباً للوكالات' : 'Best Value for Agencies'}
                    </span>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1B1C1C] dark:text-white">
                      {isAr ? (rp.name_ar || rp.name) : rp.name}
                    </h3>
                    <p className="text-xs text-[#605E5B] dark:text-[#C9C6C1] mt-1.5">
                      {isAr
                        ? 'أطلق منصتك الخاصة لعملائك واكسب 100% من إيرادات الاشتراكات.'
                        : 'Launch your own branded CRM and keep 100% of customer subscriptions.'}
                    </p>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-1 font-serif text-4xl sm:text-5xl font-extrabold text-[#1B1C1C] dark:text-white">
                      <span>${price}</span>
                      <span className="text-xs sm:text-sm font-sans font-normal text-[#605E5B] dark:text-[#C9C6C1]">
                        {isAr ? '/شهرياً' : '/month'}
                      </span>
                    </div>
                    {isYearly && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        {isAr ? `$${rp.price_yearly} تُدفع سنوياً` : `$${rp.price_yearly} billed annually`}
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <div>
                    <Link href="/reseller" className="block w-full">
                      <button
                        type="button"
                        className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                          isPopular
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                            : 'bg-foreground text-background hover:opacity-90'
                        }`}
                      >
                        {isAr ? 'ابدأ كشريك موزع الآن' : 'Become a Partner'}
                      </button>
                    </Link>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 pt-6 border-t border-[#BCC9C6]/30 dark:border-white/10 text-xs text-[#1B1C1C] dark:text-[#F2F0F0]">
                    <div className="flex items-center gap-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span>
                        {isAr
                          ? `إنشاء حتى ${rp.max_accounts} شركة أو عميل مستقل`
                          : `Create up to ${rp.max_accounts} client sub-accounts`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 font-semibold">
                      <Globe className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>
                        {isAr
                          ? `ربط حتى ${rp.max_custom_domains} دومين مخصص كامل (CNAME)`
                          : `Up to ${rp.max_custom_domains} custom domains (CNAME)`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isAr ? 'علامة تجارية مستقلة 100% بدون أي ذكر لنا' : '100% White-label (no platform branding)'}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isAr ? 'ساب دومين مجاني فوري (.mstoviral.online)' : 'Instant free subdomain'}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isAr ? 'تحصيل أرباحك مباشرة في بوابات دفعك الخاصة' : 'Collect payments directly in your gateway'}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isAr ? 'دعم كامل للذكاء الاصطناعي وبوتات الرد لعملائك' : 'AI bots & auto-reply for all clients'}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isAr ? 'ربط واتساب QR ومتاجر شوبيفاي وووكومرس' : 'WhatsApp QR & WooCommerce/Shopify sync'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* STANDARD BUSINESS PLANS GRID */
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
            ? isAr ? 'ابدأ الآن مع الخطة' : 'Get Started Now'
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
                        {isAr ? 'مساعد الذكاء الاصطناعي (AI Assistant)' : 'AI Assistant'}
                      </span>
                    </div>

                    {/* Voice Transcription STT */}
                    <div className="flex items-center gap-2.5">
                      {p.features?.voice_transcription ? (
                        isPopular ? (
                          <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-[#605E5B] dark:text-[#C9C6C1] shrink-0 stroke-[2.5]" />
                        )
                      ) : (
                        <XCircle className="h-4 w-4 text-neutral-300 dark:text-zinc-700 shrink-0" />
                      )}
                      <span className={p.features?.voice_transcription ? 'font-medium text-[#1B1C1C] dark:text-white' : 'text-neutral-400 line-through'}>
                        {isAr ? 'فهم وتفريغ الرسائل الصوتية (Voice STT)' : 'Voice Message Transcription (STT)'}
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

                    {/* WooCommerce Integration */}
                    <div className="flex items-center gap-2.5">
                      {p.features?.woocommerce_integration ? (
                        isPopular ? (
                          <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-[#605E5B] dark:text-[#C9C6C1] shrink-0 stroke-[2.5]" />
                        )
                      ) : (
                        <XCircle className="h-4 w-4 text-neutral-300 dark:text-zinc-700 shrink-0" />
                      )}
                      <span className={p.features?.woocommerce_integration ? 'font-medium text-[#1B1C1C] dark:text-white' : 'text-neutral-400 line-through'}>
                        {isAr ? 'ربط متجر ووكومرس (WooCommerce)' : 'WooCommerce Store Integration'}
                      </span>
                    </div>

                    {/* Shopify Integration */}
                    <div className="flex items-center gap-2.5">
                      {p.features?.shopify_integration ? (
                        isPopular ? (
                          <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-[#605E5B] dark:text-[#C9C6C1] shrink-0 stroke-[2.5]" />
                        )
                      ) : (
                        <XCircle className="h-4 w-4 text-neutral-300 dark:text-zinc-700 shrink-0" />
                      )}
                      <span className={p.features?.shopify_integration ? 'font-medium text-[#1B1C1C] dark:text-white' : 'text-neutral-400 line-through'}>
                        {isAr ? 'ربط متجر شوبيفاي (Shopify)' : 'Shopify Store Integration'}
                      </span>
                    </div>

                    {/* Bio Link Studio */}
                    <div className="flex items-center gap-2.5">
                      {p.features?.bio_link ? (
                        isPopular ? (
                          <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-[#605E5B] dark:text-[#C9C6C1] shrink-0 stroke-[2.5]" />
                        )
                      ) : (
                        <XCircle className="h-4 w-4 text-neutral-300 dark:text-zinc-700 shrink-0" />
                      )}
                      <span className={p.features?.bio_link ? 'font-medium text-[#1B1C1C] dark:text-white' : 'text-neutral-400 line-through'}>
                        {isAr ? 'منشئ البايو لينك (Bio Link Studio)' : 'Bio Link Studio'}
                        {p.features?.bio_link && (
                          <span className="text-[11px] text-[#605E5B] dark:text-[#C9C6C1] mx-1">
                            ({p.max_subdomain_changes === -1
                              ? (isAr ? 'تغيير غير محدود' : 'Unlimited changes')
                              : p.max_subdomain_changes === 0
                              ? (isAr ? 'دون تغيير' : '0 changes')
                              : (isAr ? `${p.max_subdomain_changes} تغييرات` : `${p.max_subdomain_changes} changes`)})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}
