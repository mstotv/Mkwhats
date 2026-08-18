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
  Zap,
  UsersRound,
  ShoppingBag,
} from 'lucide-react'
import { UpgradePlanModal, type PlanItem } from './upgrade-plan-modal'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'

interface PlanData {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_monthly_discounted?: number
  price_yearly: number
  price_yearly_discounted?: number
  max_users: number
  max_whatsapp_instances: number
  max_contacts: number
  max_messages_monthly: number
  max_broadcasts_monthly: number
  max_orders_monthly?: number
  is_popular?: boolean
  features: {
    ai_assistant?: boolean
    automations?: boolean
    flows_builder?: boolean
    excel_export?: boolean
    telegram_bot?: boolean
    custom_webhooks?: boolean
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
  messages_remaining?: number
  contacts_count?: number
  max_contacts?: number
  contacts_percentage?: number
  contacts_remaining?: number
  broadcasts_count: number
  max_broadcasts: number
  broadcasts_percentage: number
  members_count: number
  max_users: number
  members_percentage: number
  members_remaining?: number
  orders_count?: number
  max_orders_monthly?: number
  orders_percentage?: number
  orders_remaining?: number
}

export function PlanUsagePanel() {
  const t = useTranslations('Settings.plan')
  const locale = useLocale()
  const isAr = locale === 'ar'
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

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const verifiedSessionRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    const sessionId = urlParams.get('session_id')

    if (paymentStatus === 'success' && sessionId && verifiedSessionRef.current !== sessionId) {
      verifiedSessionRef.current = sessionId

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
            toast.success(isAr ? 'تم التأكد من عملية الدفع وترقية باقة اشتراكك بنجاح! 🎉' : 'Payment verified and plan upgraded successfully! 🎉')
            fetchSubscriptionInfo()
          }
        } catch (err) {
          console.error('Failed to verify Stripe session:', err)
        }
      }
      verifyStripe()
    }
  }, [isAr])

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

  const handleStripeCheckout = async (targetPlan: any) => {
    try {
      setUpgradingPlanId(targetPlan.id)
      setUpgradingGateway('stripe')
      const res = await fetch('/api/billing/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: targetPlan.id,
          billing_cycle: billingCycle,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error || (isAr ? 'فشل إنشاء جلسة الدفع' : 'Failed to create payment session'))
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'))
    } finally {
      setUpgradingPlanId(null)
      setUpgradingGateway(null)
    }
  }

  const handlePlisioUpgrade = async (targetPlan: any) => {
    try {
      setUpgradingPlanId(targetPlan.id)
      setUpgradingGateway('plisio')
      const res = await fetch('/api/account/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_plan_id: targetPlan.id,
          billing_cycle: billingCycle,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error || (isAr ? 'فشل إرسال طلب الترقية' : 'Upgrade request failed'))
        return
      }

      const targetUrl = data.checkout_url || data.whatsapp_url
      if (targetUrl) {
        window.open(targetUrl, '_blank')
        toast.success(isAr ? 'تم فتح صفحة الدفع بنجاح! 🪙' : 'Payment page opened successfully! 🪙')
      } else {
        toast.success(isAr ? 'تم تسجيل طلبك بنجاح! 🎉' : 'Request submitted successfully! 🎉')
      }
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'حدث خطأ في الاتصال' : 'Connection error'))
    } finally {
      setUpgradingPlanId(null)
      setUpgradingGateway(null)
    }
  }

  const handleFreeActivate = async (targetPlan: any) => {
    try {
      setUpgradingPlanId(targetPlan.id)
      const res = await fetch('/api/account/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_plan_id: targetPlan.id,
          billing_cycle: 'monthly',
        }),
      })
      const data = await res.json()
      if (data.success || res.ok) {
        toast.success(isAr ? 'تم تفعيل الخطة المجانية بنجاح!' : 'Free plan activated successfully!')
        fetchSubscriptionInfo()
      } else {
        toast.error(data.error || (isAr ? 'فشل تفعيل الخطة' : 'Plan activation failed'))
      }
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'حدث خطأ' : 'An error occurred'))
    } finally {
      setUpgradingPlanId(null)
    }
  }

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
      label: isAr ? 'مساعد الذكاء الاصطناعي (AI Assistant)' : 'Gemini AI Assistant',
      icon: Bot,
      enabled: Boolean(plan.features?.ai_assistant),
    },
    {
      key: 'automations',
      label: isAr ? 'الأتمتة والردود الآلية' : 'Automations & Auto-Replies',
      icon: Zap,
      enabled: Boolean(plan.features?.automations),
    },
    {
      key: 'flows_builder',
      label: isAr ? 'منشئ الأتمتة ومسارات العمل (Flows)' : 'Flows & Workflow Builder',
      icon: Sparkles,
      enabled: Boolean(plan.features?.flows_builder),
    },
    {
      key: 'excel_export',
      label: isAr ? 'تصدير البيانات إلى Excel' : 'Excel Data Export',
      icon: FileSpreadsheet,
      enabled: Boolean(plan.features?.excel_export),
    },
    {
      key: 'telegram_bot',
      label: isAr ? 'ربط بوت التلغرام للإشعارات' : 'Telegram Bot Notifications',
      icon: Send,
      enabled: Boolean(plan.features?.telegram_bot),
    },
  ]

  return (
    <div className="space-y-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 shadow-sm hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <MessageSquare className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> {isAr ? 'الرسائل الشهرية' : 'Monthly Messages'}
                </span>
                {plan.max_messages_monthly === -1 ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0">
                    {isAr ? 'غير محدود ♾️' : 'Unlimited ♾️'}
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
                    {plan.max_messages_monthly === -1 ? (isAr ? 'رسائل مرسلة' : 'Messages Sent') : (isAr ? `من ${(plan.max_messages_monthly || 0).toLocaleString()}` : `of ${(plan.max_messages_monthly || 0).toLocaleString()}`)}
                  </span>
                </div>

                {plan.max_messages_monthly !== -1 && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block font-mono">
                      {(usage?.messages_remaining ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{isAr ? 'متبقي' : 'Remaining'}</span>
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
                  <span className="truncate">{isAr ? 'إرسال غير محدود 🟢' : 'Unlimited Sending 🟢'}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 shadow-sm hover:border-emerald-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <Users className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {isAr ? 'جهات الاتصال والعملاء' : 'Contacts & Customers'}
                </span>
                {plan.max_contacts === -1 ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0">
                    {isAr ? 'غير محدود ♾️' : 'Unlimited ♾️'}
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
                    {plan.max_contacts === -1 ? (isAr ? 'عملاء محفوظين' : 'Saved Contacts') : (isAr ? `من ${(plan.max_contacts || 1000).toLocaleString()}` : `of ${(plan.max_contacts || 1000).toLocaleString()}`)}
                  </span>
                </div>

                {plan.max_contacts !== -1 && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block font-mono">
                      {(usage?.contacts_remaining ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{isAr ? 'متبقي' : 'Remaining'}</span>
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
                  <span className="truncate">{isAr ? 'حفظ عملاء غير محدود 🟢' : 'Unlimited Storage 🟢'}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 shadow-sm hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> {isAr ? 'أعضاء الفريق (TEAM)' : 'Team Members'}
                </span>
                {plan.max_users === -1 ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0">
                    {isAr ? 'غير محدود ♾️' : 'Unlimited ♾️'}
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
                    {plan.max_users === -1 ? (isAr ? 'موظفين بالحساب' : 'Account Members') : (isAr ? `من ${plan.max_users} مقاعد` : `of ${plan.max_users} seats`)}
                  </span>
                </div>

                {plan.max_users !== -1 && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block font-mono">
                      {usage?.members_remaining ?? 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{isAr ? 'متبقي' : 'Remaining'}</span>
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
                  <span className="truncate">{isAr ? 'أعضاء غير محدود 🟢' : 'Unlimited Seats 🟢'}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 shadow-sm hover:border-amber-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-amber-500 shrink-0" /> {isAr ? 'الطلبات والمبيعات' : 'Orders & Sales'}
                </span>
                {plan.max_orders_monthly === -1 ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0">
                    {isAr ? 'غير محدود ♾️' : 'Unlimited ♾️'}
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
                    {plan.max_orders_monthly === -1 ? (isAr ? 'طلبات مضافة' : 'Added Orders') : (isAr ? `من ${(plan.max_orders_monthly || 500).toLocaleString()}` : `of ${(plan.max_orders_monthly || 500).toLocaleString()}`)}
                  </span>
                </div>

                {plan.max_orders_monthly !== -1 && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block font-mono">
                      {(usage?.orders_remaining ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{isAr ? 'متبقي' : 'Remaining'}</span>
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
                  <span className="truncate">{isAr ? 'مبيعات غير محدودة 🟢' : 'Unlimited Sales 🟢'}</span>
                </div>
              )}
            </div>
          </div>

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

          <div className="rounded-lg bg-muted/60 p-3 text-[11px] text-muted-foreground border">
            <span>
              {t('cycleNote', { period: usage?.year_month || '' })}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              {isAr ? 'باقات العضوية المتاحة والترقية (Available Plans)' : 'Available Subscription Plans & Upgrades'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr ? 'اختر الباقة المناسبة لاحتياجات فريقك ودورة الفوترة (شهرياً أو سنوياً)' : 'Choose the best plan for your team size and billing cycle (Monthly or Yearly)'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-1 p-1 bg-muted rounded-xl border border-border w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all text-center justify-center ${
                billingCycle === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? '📅 فوترة شهرية' : '📅 Monthly Billing'}
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <span>{isAr ? '🎁 فوترة سنوية' : '🎁 Yearly Billing'}</span>
              <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-mono hidden xs:inline">
                {isAr ? 'توفير' : 'Save'}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {availablePlans.map((p: any) => {
            const isCurrent = p.id === plan.id;
            const isYearly = billingCycle === 'yearly';
            const priceActive = isYearly
              ? p.price_yearly_discounted && p.price_yearly_discounted > 0
                ? p.price_yearly_discounted
                : p.price_yearly
              : p.price_monthly_discounted && p.price_monthly_discounted > 0
                ? p.price_monthly_discounted
                : p.price_monthly;

            const priceOriginal = isYearly ? p.price_yearly : p.price_monthly;
            const hasDiscount = isYearly
              ? Boolean(p.price_yearly_discounted && p.price_yearly_discounted > 0)
              : Boolean(p.price_monthly_discounted && p.price_monthly_discounted > 0);

            return (
              <Card
                key={p.id}
                className={`relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl transition-all duration-300 ${
                  isCurrent
                    ? 'border-2 border-emerald-500/80 bg-emerald-950/10 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : p.is_popular
                      ? 'border-2 border-amber-500/80 bg-amber-950/10 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30 scale-100 md:scale-[1.02] z-10'
                      : 'border border-border/80 bg-card hover:border-muted-foreground/30 hover:shadow-lg'
                }`}
              >
                {p.is_popular && (
                  <div className="-mt-2 mb-4 flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 px-3 py-1.5 text-xs font-black text-amber-300 shadow-sm backdrop-blur-sm">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                    <span>{isAr ? 'الباقة الأكثر رواجاً ومبيعاً (Most Popular)' : 'Most Popular Plan 🔥'}</span>
                  </div>
                )}

                <div className="space-y-4 sm:space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg sm:text-xl font-black text-foreground tracking-tight">{p.name}</h4>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 font-mono">
                        {p.slug?.toUpperCase()}
                      </p>
                    </div>
                    {isCurrent && (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1">
                        {isAr ? 'باقتك الحالية ✓' : 'Current Active Plan ✓'}
                      </Badge>
                    )}
                  </div>

                  <div className="rounded-xl bg-muted/40 p-3 sm:p-3.5 border border-border/50">
                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <div className="flex items-baseline gap-1.5 sm:gap-2 dir-ltr">
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
                        <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">
                          {isYearly ? (isAr ? '/سنوياً' : '/year') : (isAr ? '/شهرياً' : '/month')}
                        </span>
                      </div>
                      {hasDiscount && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          {isAr ? 'خصم خاص 🏷️' : 'Special Offer 🏷️'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-border/50 pt-4 text-xs">
                    <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 border border-border/40">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground/70" />
                        {isAr ? 'أعضاء الفريق:' : 'Team Members:'}
                      </span>
                      <span className="font-bold text-foreground">
                        {p.max_users === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : p.max_users}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 border border-border/40">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <UsersRound className="h-3.5 w-3.5 text-muted-foreground/70" />
                        {isAr ? 'سقف جهات الاتصال:' : 'Contacts Limit:'}
                      </span>
                      <span className="font-bold text-foreground">
                        {p.max_contacts === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : (p.max_contacts || 1000).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 border border-border/40">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/70" />
                        {isAr ? 'الرسائل الشهرية:' : 'Monthly Messages:'}
                      </span>
                      <span className="font-bold text-foreground">
                        {p.max_messages_monthly === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : (p.max_messages_monthly || 1000).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 border border-border/40">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground/70" />
                        {isAr ? 'الطلبات والمبيعات:' : 'Orders & Sales:'}
                      </span>
                      <span className="font-bold text-foreground">
                        {p.max_orders_monthly === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : (p.max_orders_monthly || 500).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 border border-border/40">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Radio className="h-3.5 w-3.5 text-muted-foreground/70" />
                        {isAr ? 'حملات البرودكاست:' : 'Broadcast Campaigns:'}
                      </span>
                      <span className="font-bold text-foreground">
                        {p.max_broadcasts_monthly === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : (p.max_broadcasts_monthly || 50).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-border/50 pt-4 text-xs">
                    <div className="flex items-center gap-2.5">
                      {p.features?.ai_assistant ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={p.features?.ai_assistant ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'}>
                        {isAr ? 'مساعد الذكاء الاصطناعي (AI)' : 'Gemini AI Assistant'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {p.features?.automations ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={p.features?.automations ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'}>
                        {isAr ? 'الأتمتة والردود الآلية' : 'Automations & Auto-Replies'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {p.features?.flows_builder ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={p.features?.flows_builder ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'}>
                        {isAr ? 'منشئ مسارات العمل (Flows)' : 'Flows Builder'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {p.features?.telegram_bot ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={p.features?.telegram_bot ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'}>
                        {isAr ? 'ربط بوت التلغرام للإشعارات' : 'Telegram Bot Notifications'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {p.features?.excel_export ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={p.features?.excel_export ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'}>
                        {isAr ? 'تصدير البيانات إلى Excel' : 'Excel Export'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 space-y-2">
                  {isCurrent ? (
                    <Button
                      disabled
                      className="w-full text-xs font-bold bg-muted/60 text-muted-foreground border border-border/50 py-3 rounded-xl cursor-not-allowed"
                    >
                      {isAr ? 'باقتك الحالية المفعلة ✓' : 'Current Active Plan ✓'}
                    </Button>
                  ) : p.price_monthly === 0 || p.slug === 'free' ? (
                    <Button
                      onClick={() => handleFreeActivate(p)}
                      disabled={upgradingPlanId === p.id}
                      className="w-full text-xs font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:opacity-95 py-3 rounded-xl transition-all"
                    >
                      {upgradingPlanId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      ) : (
                        isAr ? 'الانتقال للخطة المجانية (تفعيل مجاني) 🎁' : 'Switch to Free Plan 🎁'
                      )}
                    </Button>
                  ) : (
                    <>
                      {stripeEnabled && (
                        <Button
                          onClick={() => handleStripeCheckout(p)}
                          disabled={upgradingPlanId === p.id}
                          className="w-full text-xs font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white hover:opacity-95 shadow-lg shadow-indigo-500/20 py-3 rounded-xl transition-all"
                        >
                          {upgradingPlanId === p.id && upgradingGateway === 'stripe' ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          ) : (
                            isAr ? '💳 الدفع بطاقة بنكية (Visa / MasterCard)' : '💳 Pay with Card (Visa / MasterCard)'
                          )}
                        </Button>
                      )}

                      {plisioEnabled && (
                        <Button
                          onClick={() => handlePlisioUpgrade(p)}
                          disabled={upgradingPlanId === p.id}
                          className="w-full text-xs font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 hover:opacity-95 shadow-lg shadow-amber-500/20 py-3 rounded-xl transition-all"
                        >
                          {upgradingPlanId === p.id && upgradingGateway === 'plisio' ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          ) : (
                            isAr ? '🪙 الدفع كريبتو (USDT / Bitcoin)' : '🪙 Pay with Crypto (USDT / Bitcoin)'
                          )}
                        </Button>
                      )}

                      {!stripeEnabled && !plisioEnabled && (
                        <Button
                          onClick={() => handlePlisioUpgrade(p)}
                          disabled={upgradingPlanId === p.id}
                          className="w-full text-xs font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 hover:opacity-95 shadow-lg shadow-amber-500/20 py-3 rounded-xl transition-all"
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
