'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
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
  slug: string
  description?: string
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

export function LandingPricing({ plans, userLoggedIn, primaryColor = '#10B981' }: LandingPricingProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className="space-y-12">
      {/* Billing Cycle Switcher Pills */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-card/90 p-1.5 shadow-2xl backdrop-blur-2xl">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-xl px-6 py-3 text-xs font-extrabold transition-all duration-200 ${
              billingCycle === 'monthly'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📅 {isAr ? 'الفوترة الشهرية' : 'Monthly Billing'}
          </button>

          <button
            onClick={() => setBillingCycle('yearly')}
            className={`relative flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-black transition-all duration-200 ${
              billingCycle === 'yearly'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🚀 {isAr ? 'الفوترة السنوية' : 'Yearly Billing'}
            <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-black text-emerald-400">
              {isAr ? 'خصم 20%' : 'Save 20%'}
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isPopular = p.is_popular || p.slug === 'pro' || p.name.toLowerCase().includes('pro')
          const localizedName = getLocalizedPlanName(p, locale)
          const isYearly = billingCycle === 'yearly'

          const priceActive = isYearly
            ? p.price_yearly_discounted && p.price_yearly_discounted > 0
              ? p.price_yearly_discounted
              : p.price_yearly || p.price_monthly * 10
            : p.price_monthly_discounted && p.price_monthly_discounted > 0
            ? p.price_monthly_discounted
            : p.price_monthly

          const priceOriginal = isYearly ? p.price_yearly || p.price_monthly * 12 : p.price_monthly
          const hasDiscount = isYearly
            ? Boolean(p.price_yearly_discounted && p.price_yearly_discounted > 0)
            : Boolean(p.price_monthly_discounted && p.price_monthly_discounted > 0)

          return (
            <div
              key={p.id}
              className={`relative flex flex-col justify-between p-6 rounded-3xl border transition-all duration-300 backdrop-blur-xl ${
                isPopular
                  ? 'border-2 border-amber-500/80 bg-card/95 shadow-2xl shadow-amber-500/10 scale-100 md:scale-[1.02] z-10'
                  : 'border border-border bg-card/70 hover:border-border/80'
              }`}
            >
              {/* Popular Badge Banner */}
              {isPopular && (
                <div className="-mt-3 mb-4 flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 px-3 py-1.5 text-xs font-black text-amber-400 shadow-sm backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                  <span>{isAr ? 'الباقة الأكثر رواجاً ومبيعاً (Most Popular)' : 'Most Popular Choice'}</span>
                </div>
              )}

              <div className="space-y-5">
                {/* Header & Title */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-foreground tracking-tight">{localizedName}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-mono uppercase">
                      {p.slug}
                    </p>
                  </div>
                </div>

                {/* Pricing Box */}
                <div className="rounded-2xl bg-muted/40 p-4 border border-border/50">
                  <div className="flex items-baseline justify-between flex-wrap gap-2">
                    <div className="flex items-baseline gap-2 dir-ltr">
                      {hasDiscount ? (
                        <>
                          <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                            ${priceActive}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-muted-foreground/60 line-through">
                            ${priceOriginal}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                          ${priceActive}
                        </span>
                      )}
                      <span className="text-xs font-medium text-muted-foreground dir-rtl">
                        /{isYearly ? (isAr ? 'سنوياً' : 'yearly') : (isAr ? 'شهرياً' : 'monthly')}
                      </span>
                    </div>
                    {hasDiscount && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                        {isAr ? 'خصم خاص 🏷️' : 'Special Discount 🏷️'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quotas & Limits Box */}
                <div className="space-y-2 border-t border-border/50 pt-4 text-xs font-medium">
                  <div className="flex items-center justify-between rounded-xl bg-background/60 px-3.5 py-2.5 border border-border/40">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground/70" />
                      {isAr ? 'أعضاء الفريق:' : 'Team Members:'}
                    </span>
                    <span className="font-bold text-foreground">
                      {p.max_users === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : p.max_users}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-background/60 px-3.5 py-2.5 border border-border/40">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <UsersRound className="h-4 w-4 text-muted-foreground/70" />
                      {isAr ? 'سقف جهات الاتصال:' : 'Max Contacts:'}
                    </span>
                    <span className="font-bold text-foreground">
                      {p.max_contacts === -1 || p.max_contacts === undefined
                        ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️')
                        : (p.max_contacts || 1000).toLocaleString('en-US')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-background/60 px-3.5 py-2.5 border border-border/40">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground/70" />
                      {isAr ? 'الرسائل الشهرية:' : 'Monthly Messages:'}
                    </span>
                    <span className="font-bold text-foreground">
                      {p.max_messages_monthly === -1
                        ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️')
                        : (p.max_messages_monthly || 1000).toLocaleString('en-US')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-background/60 px-3.5 py-2.5 border border-border/40">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground/70" />
                      {isAr ? 'الطلبات والمبيعات:' : 'Orders & Sales:'}
                    </span>
                    <span className="font-bold text-foreground">
                      {p.max_orders_monthly === -1 || p.max_orders_monthly === undefined
                        ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️')
                        : (p.max_orders_monthly || 500).toLocaleString('en-US')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-background/60 px-3.5 py-2.5 border border-border/40">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Radio className="h-4 w-4 text-muted-foreground/70" />
                      {isAr ? 'حملات البرودكاست:' : 'Broadcast Campaigns:'}
                    </span>
                    <span className="font-bold text-foreground">
                      {p.max_broadcasts_monthly === -1
                        ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️')
                        : (p.max_broadcasts_monthly || 50).toLocaleString('en-US')}
                    </span>
                  </div>
                </div>

                {/* Feature Checklist */}
                <div className="space-y-2 border-t border-border/50 pt-4 text-xs">
                  <div className="flex items-center gap-2.5">
                    {p.features?.ai_assistant ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                    )}
                    <span
                      className={
                        p.features?.ai_assistant ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'
                      }
                    >
                      {isAr ? 'مساعد الذكاء الاصطناعي (AI)' : 'AI Assistant (Gemini AI)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {p.features?.automations ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                    )}
                    <span
                      className={
                        p.features?.automations ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'
                      }
                    >
                      {isAr ? 'الأتمتة والردود الآلية' : 'Automations & Auto-Replies'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {p.features?.flows_builder ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                    )}
                    <span
                      className={
                        p.features?.flows_builder ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'
                      }
                    >
                      {isAr ? 'منشئ مسارات العمل (Flows)' : 'Visual Workflow Builder (Flows)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {p.features?.telegram_bot ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                    )}
                    <span
                      className={
                        p.features?.telegram_bot ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'
                      }
                    >
                      {isAr ? 'ربط بوت التلغرام للإشعارات' : 'Telegram Bot Notifications'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {p.features?.excel_export ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                    )}
                    <span
                      className={
                        p.features?.excel_export ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'
                      }
                    >
                      {isAr ? 'تصدير البيانات إلى Excel' : 'Data Export to Excel'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Action CTA Button */}
              <div className="pt-8">
                <Link
                  href={userLoggedIn ? '/dashboard' : '/signup'}
                  className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black transition-all duration-200 shadow-lg ${
                    isPopular
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                  }`}
                >
                  {userLoggedIn
                    ? isAr
                      ? 'الانتقال للوحة التحكم'
                      : 'Go to Dashboard'
                    : isAr
                    ? 'اشترك الآن وابدأ التجربة'
                    : 'Subscribe Now'}
                  {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
