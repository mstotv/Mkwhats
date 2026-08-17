'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  MessageSquare,
  Radio,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bot,
  FileSpreadsheet,
  Send,
  Loader2,
  ArrowUpRight,
} from 'lucide-react'
import { UpgradePlanModal, type PlanItem } from './upgrade-plan-modal'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

interface PlanData {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
  max_users: number
  max_whatsapp_instances: number
  max_contacts: number
  max_messages_monthly: number
  max_broadcasts_monthly: number
  features: {
    ai_assistant?: boolean
    excel_export?: boolean
    telegram_bot?: boolean
  }
}

interface SubscriptionData {
  status: 'active' | 'trialing' | 'canceled' | 'expired' | string
  billing_cycle: 'monthly' | 'yearly' | string
  current_period_end: string
  trial_ends_at?: string | null
}

interface UsageData {
  year_month: string
  messages_count: number
  max_messages: number
  messages_percentage: number
  broadcasts_count: number
  max_broadcasts: number
  broadcasts_percentage: number
  members_count: number
  max_users: number
  members_percentage: number
}

export function PlanUsagePanel() {
  const t = useTranslations('Settings.plan')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<PlanData | null>(null)
  const [availablePlans, setAvailablePlans] = useState<PlanItem[]>([])
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [limitsExceeded, setLimitsExceeded] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null)
  const [upgradingGateway, setUpgradingGateway] = useState<'stripe' | 'plisio' | null>(null)

  // Gateways settings
  const [stripeEnabled, setStripeEnabled] = useState(false)
  const [plisioEnabled, setPlisioEnabled] = useState(false)

  const handleStripeCheckout = async (planItem: any) => {
    try {
      setUpgradingPlanId(planItem.id)
      setUpgradingGateway('stripe')
      const res = await fetch('/api/billing/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planItem.id,
          billing_cycle: 'monthly',
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        toast.error(data.error || 'حدث خطأ أثناء الإنشاء عبر سترايب')
        return
      }

      if (data.url) {
        toast.success(`جاري التوجيه لبوابة الدفع الآمنة لـ Stripe (Visa / MasterCard)... 💳`)
        window.location.href = data.url
      }
    } catch (err) {
      toast.error('فشل التوجيه لـ Stripe')
    } finally {
      setUpgradingPlanId(null)
      setUpgradingGateway(null)
    }
  }

  const handlePlisioUpgrade = async (planItem: any) => {
    try {
      setUpgradingPlanId(planItem.id)
      setUpgradingGateway('plisio')
      const res = await fetch('/api/account/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_plan_id: planItem.id,
          billing_cycle: 'monthly',
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        toast.error(data.error || 'حدث خطأ أثناء الاتصال بالخادم')
        return
      }

      const targetUrl = data.checkout_url || data.whatsapp_url
      if (targetUrl) {
        toast.success(`جاري التوجيه لموجّه الدفع لخطة "${planItem.name}"... 🚀`)
        window.location.href = targetUrl
      } else {
        setIsUpgradeModalOpen(true)
      }
    } catch (err) {
      toast.error('فشل التوجيه لبوابة الدفع')
    } finally {
      setUpgradingPlanId(null)
      setUpgradingGateway(null)
    }
  }

  const handleFreeActivate = async (planItem: any) => {
    try {
      setUpgradingPlanId(planItem.id)
      const res = await fetch('/api/account/activate-free-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planItem.id }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error || 'فشل الانتقال للخطة المجانية')
        return
      }
      toast.success(data.message || 'تم الانتقال إلى الخطة المجانية بنجاح 🎁')
      fetchSubscriptionInfo()
    } catch (err) {
      toast.error('فشل التفعيل')
    } finally {
      setUpgradingPlanId(null)
    }
  }

  // Handle Stripe Payment Success Verification Return
  const verifiedSessionRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    const sessionId = urlParams.get('session_id')

    if (paymentStatus === 'success' && sessionId && verifiedSessionRef.current !== sessionId) {
      verifiedSessionRef.current = sessionId

      // Clean URL parameters immediately so reloading or re-rendering never re-triggers toasts or re-verifies old session IDs
      const cleanParams = new URLSearchParams(window.location.search)
      cleanParams.delete('payment')
      cleanParams.delete('session_id')
      cleanParams.delete('gateway')
      const cleanUrl = window.location.pathname + (cleanParams.toString() ? '?' + cleanParams.toString() : '')
      window.history.replaceState(null, '', cleanUrl)

      async function verifyStripe() {
        try {
          const res = await fetch('/api/billing/stripe/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          })
          const data = await res.json()
          if (data.success && data.paid) {
            toast.success('تم التأكد من عملية الدفع وترقية باقة اشتراكك بنجاح! 🎉')
            // Refresh subscription
            fetchSubscriptionInfo()
          }
        } catch (err) {
          console.error('Failed to verify Stripe session:', err)
        }
      }
      verifyStripe()
    }
  }, [])

  async function fetchSubscriptionInfo() {
    try {
      setLoading(true)
      const [subRes, settingsRes] = await Promise.all([
        fetch('/api/account/subscription').then((r) => r.json()),
        fetch('/api/site-settings').then((r) => (r.ok ? r.json() : { settings: {} })),
      ])

      if (!subRes || subRes.error) {
        setError(subRes?.error || t('fetchFailed'))
        return
      }

      setPlan(subRes.plan)
      setSubscription(subRes.subscription)
      setUsage(subRes.usage)
      setLimitsExceeded(Boolean(subRes.limits_exceeded))
      setAvailablePlans(subRes.available_plans || [])

      const st = settingsRes.settings || {}
      setStripeEnabled(Boolean(st.stripe_enabled))
      setPlisioEnabled(Boolean(st.plisio_enabled))
    } catch (err: any) {
      setError(err.message || t('unexpectedError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptionInfo()
  }, [t])


  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border bg-card text-card-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !plan) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-destructive">
          {error || t('noPlanFound')}
        </CardContent>
      </Card>
    )
  }

  const getProgressColorClass = (percentage: number) => {
    if (percentage >= 100) return 'bg-rose-500'
    if (percentage >= 80) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const featuresList = [
    {
      key: 'ai_assistant',
      label: t('featureAiAssistant'),
      icon: Bot,
      enabled: Boolean(plan.features?.ai_assistant),
    },
    {
      key: 'excel_export',
      label: t('featureExcelExport'),
      icon: FileSpreadsheet,
      enabled: Boolean(plan.features?.excel_export),
    },
    {
      key: 'telegram_bot',
      label: t('featureTelegramBot'),
      icon: Send,
      enabled: Boolean(plan.features?.telegram_bot),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Limit Exceeded Alert Banner */}
      {limitsExceeded && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-500 flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">{t('limitExceededTitle', { name: plan.name })}</h4>
              <p className="text-xs text-rose-400/90 leading-relaxed">
                {t('limitExceededDesc')}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 gap-1"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t('upgradeNow')}
          </Button>
        </div>
      )}

      {/* Main Plan Overview Card */}
      <Card className="border-border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                {plan.name}
              </CardTitle>
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-0.5 ${
                  subscription?.status === 'trialing'
                    ? 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                }`}
              >
                {subscription?.status === 'trialing' ? t('statusTrialing') : t('statusActive')}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {t('subTitle')}
            </CardDescription>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            <div className="text-left rtl:text-right">
              <span className="text-2xl font-black text-foreground">
                ${subscription?.billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly}
              </span>
              <span className="text-xs text-muted-foreground ml-1 rtl:ml-0 rtl:mr-1">
                /{subscription?.billing_cycle === 'yearly' ? t('perYear') : t('perMonth')}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-5">
          {/* Clean Compact 4-Quotas Dashboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Messages Quota Box */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 shadow-sm hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <MessageSquare className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> الرسائل الشهرية
                </span>
                {plan.max_messages_monthly === -1 ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0">
                    غير محدود ♾️
                  </Badge>
                ) : (
                  <span className="text-[11px] font-mono font-bold text-foreground">
                    {usage?.messages_percentage}%
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between pt-0.5">
                <div className="space-y-0">
                  <span className="text-xl font-black text-foreground font-mono">
                    {(usage?.messages_count || 0).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium block">
                    {plan.max_messages_monthly === -1 ? 'رسائل مرسلة' : `من ${(plan.max_messages_monthly || 0).toLocaleString()}`}
                  </span>
                </div>

                {plan.max_messages_monthly !== -1 && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block font-mono">
                      {(usage?.messages_remaining ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">متبقي</span>
                  </div>
                )}
              </div>

              {plan.max_messages_monthly !== -1 ? (
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getProgressColorClass(usage?.messages_percentage || 0)}`}
                    style={{ width: `${usage?.messages_percentage || 0}%` }}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold pt-0.5 truncate">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">إرسال غير محدود 🟢</span>
                </div>
              )}
            </div>

            {/* 2. Contacts Quota Box */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 shadow-sm hover:border-emerald-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <Users className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> جهات الاتصال والعملاء
                </span>
                {plan.max_contacts === -1 ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0">
                    غير محدود ♾️
                  </Badge>
                ) : (
                  <span className="text-[11px] font-mono font-bold text-foreground">
                    {usage?.contacts_percentage}%
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between pt-0.5">
                <div className="space-y-0">
                  <span className="text-xl font-black text-foreground font-mono">
                    {(usage?.contacts_count || 0).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium block">
                    {plan.max_contacts === -1 ? 'عملاء محفوظين' : `من ${(plan.max_contacts || 1000).toLocaleString()}`}
                  </span>
                </div>

                {plan.max_contacts !== -1 && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block font-mono">
                      {(usage?.contacts_remaining ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">متبقي</span>
                  </div>
                )}
              </div>

              {plan.max_contacts !== -1 ? (
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getProgressColorClass(usage?.contacts_percentage || 0)}`}
                    style={{ width: `${usage?.contacts_percentage || 0}%` }}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold pt-0.5 truncate">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">حفظ عملاء غير محدود 🟢</span>
                </div>
              )}
            </div>

            {/* 3. Team Members Quota Box */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 shadow-sm hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> أعضاء الفريق (Team)
                </span>
                {plan.max_users === -1 ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0">
                    غير محدود ♾️
                  </Badge>
                ) : (
                  <span className="text-[11px] font-mono font-bold text-foreground">
                    {usage?.members_percentage}%
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between pt-0.5">
                <div className="space-y-0">
                  <span className="text-xl font-black text-foreground font-mono">
                    {usage?.members_count || 1}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium block">
                    {plan.max_users === -1 ? 'موظفين بالحساب' : `من ${plan.max_users} مقاعد`}
                  </span>
                </div>

                {plan.max_users !== -1 && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block font-mono">
                      {usage?.members_remaining ?? 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground">متبقي</span>
                  </div>
                )}
              </div>

              {plan.max_users !== -1 ? (
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getProgressColorClass(usage?.members_percentage || 0)}`}
                    style={{ width: `${usage?.members_percentage || 0}%` }}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold pt-0.5 truncate">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">أعضاء غير محدود 🟢</span>
                </div>
              )}
            </div>

            {/* 4. Orders & Sales Quota Box */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 shadow-sm hover:border-amber-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-amber-500 shrink-0" /> الطلبات والمبيعات
                </span>
                {plan.max_orders_monthly === -1 ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0">
                    غير محدود ♾️
                  </Badge>
                ) : (
                  <span className="text-[11px] font-mono font-bold text-foreground">
                    {usage?.orders_percentage}%
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between pt-0.5">
                <div className="space-y-0">
                  <span className="text-xl font-black text-foreground font-mono">
                    {(usage?.orders_count || 0).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium block">
                    {plan.max_orders_monthly === -1 ? 'طلبات مضافة' : `من ${(plan.max_orders_monthly || 500).toLocaleString()}`}
                  </span>
                </div>

                {plan.max_orders_monthly !== -1 && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block font-mono">
                      {(usage?.orders_remaining ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">متبقي</span>
                  </div>
                )}
              </div>

              {plan.max_orders_monthly !== -1 ? (
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getProgressColorClass(usage?.orders_percentage || 0)}`}
                    style={{ width: `${usage?.orders_percentage || 0}%` }}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold pt-0.5 truncate">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">مبيعات غير محدودة 🟢</span>
                </div>
              )}
            </div>
          </div>

          {/* Features Checklist */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('planFeaturesTitle')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {featuresList.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.key}
                    className={`rounded-lg border p-3 flex items-center justify-between text-xs transition-colors ${
                      item.enabled ? 'bg-card border-border' : 'bg-muted/40 border-muted opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${item.enabled ? 'text-indigo-500' : 'text-muted-foreground'}`} />
                      <span className="font-medium text-foreground">{item.label}</span>
                    </div>
                    {item.enabled ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Info Note */}
          <div className="rounded-lg bg-muted/60 p-3 text-[11px] text-muted-foreground border">
            <span>
              {t('cycleNote', { period: usage?.year_month || '' })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              باقات العضوية المتاحة والترقية (Available Plans)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              اختر الباقة المناسبة لاحتياجات فريقك واستمتع بحدود أكبر ومميزات غير محدودة
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.map((p: any) => {
            const isCurrent = p.id === plan.id;
            return (
              <Card
                key={p.id}
                className={`relative flex flex-col justify-between p-6 border transition-all ${
                  isCurrent
                    ? 'border-2 border-emerald-500 bg-emerald-500/5 shadow-lg'
                    : p.is_popular
                      ? 'border-2 border-amber-500 bg-card shadow-amber-500/10'
                      : 'border-border bg-card'
                }`}
              >
                {p.is_popular && (
                  <div className="mb-2 flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 px-3 py-1.5 text-xs font-black text-amber-400 shadow-sm">
                    <span>🔥</span>
                    <span>الأكثر رواجاً ومبيعاً (Most Popular)</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-black text-foreground">{p.name}</h4>
                    {isCurrent && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                        باقتك الحالية ✓
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2 dir-ltr">
                      {p.price_monthly_discounted && p.price_monthly_discounted > 0 ? (
                        <>
                          <span className="text-3xl font-black text-emerald-400">
                            ${p.price_monthly_discounted}
                          </span>
                          <span className="text-sm font-semibold text-muted-foreground line-through">
                            ${p.price_monthly}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-black text-foreground">
                          ${p.price_monthly}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground dir-rtl">/ شهرياً</span>
                    </div>
                  </div>

                  {/* Limits checklist */}
                  <div className="space-y-2 border-t border-border/60 pt-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">أعضاء الفريق:</span>
                      <span className="font-bold text-foreground">
                        {p.max_users === -1 ? 'غير محدود ♾️' : p.max_users}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">جهات الاتصال:</span>
                      <span className="font-bold text-foreground">
                        {p.max_contacts === -1 ? 'غير محدود ♾️' : (p.max_contacts || 1000).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">الرسائل الشهرية:</span>
                      <span className="font-bold text-foreground">
                        {p.max_messages_monthly === -1 ? 'غير محدود ♾️' : (p.max_messages_monthly || 1000).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">الطلبات والمبيعات:</span>
                      <span className="font-bold text-foreground">
                        {p.max_orders_monthly === -1 ? 'غير محدود ♾️' : (p.max_orders_monthly || 500).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 border-t border-border/60 pt-3 text-xs">
                    <div className="flex items-center gap-2">
                      {p.features?.ai_assistant ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={p.features?.ai_assistant ? 'font-medium text-foreground' : 'text-muted-foreground line-through'}>
                        مساعد الذكاء الاصطناعي (AI)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.features?.telegram_bot ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={p.features?.telegram_bot ? 'font-medium text-foreground' : 'text-muted-foreground line-through'}>
                        ربط بوت التلغرام للإشعارات
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.features?.excel_export ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={p.features?.excel_export ? 'font-medium text-foreground' : 'text-muted-foreground line-through'}>
                        تصدير البيانات إلى Excel
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 space-y-2">
                  {isCurrent ? (
                    <Button
                      disabled
                      className="w-full text-xs font-bold bg-muted text-muted-foreground border-border"
                    >
                      باقتك الحالية ✓
                    </Button>
                  ) : p.price_monthly === 0 || p.slug === 'free' ? (
                    <Button
                      onClick={() => handleFreeActivate(p)}
                      disabled={upgradingPlanId === p.id}
                      className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                    >
                      {upgradingPlanId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      ) : (
                        'الانتقال للخطة المجانية (تفعيل مجاني) 🎁'
                      )}
                    </Button>
                  ) : (
                    <>
                      {stripeEnabled && (
                        <Button
                          onClick={() => handleStripeCheckout(p)}
                          disabled={upgradingPlanId === p.id}
                          className="w-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20"
                        >
                          {upgradingPlanId === p.id && upgradingGateway === 'stripe' ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          ) : (
                            '💳 الدفع بطاقة بنكية (Visa / MasterCard)'
                          )}
                        </Button>
                      )}

                      {plisioEnabled && (
                        <Button
                          onClick={() => handlePlisioUpgrade(p)}
                          disabled={upgradingPlanId === p.id}
                          className="w-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md"
                        >
                          {upgradingPlanId === p.id && upgradingGateway === 'plisio' ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          ) : (
                            '🪙 الدفع كريبتو (USDT / Bitcoin)'
                          )}
                        </Button>
                      )}

                      {!stripeEnabled && !plisioEnabled && (
                        <Button
                          onClick={() => handlePlisioUpgrade(p)}
                          disabled={upgradingPlanId === p.id}
                          className="w-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md"
                        >
                          {upgradingPlanId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          ) : (
                            'اختيار هذه الباقة / الترقية 🚀'
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>

              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
