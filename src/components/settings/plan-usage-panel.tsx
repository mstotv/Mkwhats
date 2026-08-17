'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    async function fetchSubscriptionInfo() {
      try {
        setLoading(true)
        const res = await fetch('/api/account/subscription')
        const data = await res.json()

        if (!res.ok || data.error) {
          setError(data.error || t('fetchFailed'))
          return
        }

        setPlan(data.plan)
        setSubscription(data.subscription)
        setUsage(data.usage)
        setLimitsExceeded(Boolean(data.limits_exceeded))
        setAvailablePlans(data.available_plans || [])
      } catch (err: any) {
        setError(err.message || t('unexpectedError'))
      } finally {
        setLoading(false)
      }
    }

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

            <Button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              {t('upgradeOrViewAll')}
              <ArrowUpRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Usage Meters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Messages Progress */}
            <div className="rounded-xl border p-4 bg-accent/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-500" /> {t('monthlyMessages')}
                </span>
                <span className="font-mono font-bold text-foreground">
                  {plan.max_messages_monthly === -1
                    ? `${usage?.messages_count.toLocaleString()} (${t('unlimited')})`
                    : `${usage?.messages_count.toLocaleString()} / ${plan.max_messages_monthly.toLocaleString()}`}
                </span>
              </div>

              {plan.max_messages_monthly !== -1 ? (
                <div className="space-y-1.5">
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getProgressColorClass(
                        usage?.messages_percentage || 0
                      )}`}
                      style={{ width: `${usage?.messages_percentage || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{t('usageRate')}</span>
                    <span className="font-mono">{usage?.messages_percentage}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-500 font-medium">{t('unlimitedMessagesText')}</p>
              )}
            </div>

            {/* Broadcasts Progress */}
            <div className="rounded-xl border p-4 bg-accent/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-2">
                  <Radio className="h-4 w-4 text-indigo-500" /> {t('broadcasts')}
                </span>
                <span className="font-mono font-bold text-foreground">
                  {plan.max_broadcasts_monthly === -1
                    ? `${usage?.broadcasts_count.toLocaleString()} (${t('unlimited')})`
                    : `${usage?.broadcasts_count.toLocaleString()} / ${plan.max_broadcasts_monthly.toLocaleString()}`}
                </span>
              </div>

              {plan.max_broadcasts_monthly !== -1 ? (
                <div className="space-y-1.5">
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getProgressColorClass(
                        usage?.broadcasts_percentage || 0
                      )}`}
                      style={{ width: `${usage?.broadcasts_percentage || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{t('usageRate')}</span>
                    <span className="font-mono">{usage?.broadcasts_percentage}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-500 font-medium">{t('unlimitedBroadcastsText')}</p>
              )}
            </div>

            {/* Team Members Progress */}
            <div className="rounded-xl border p-4 bg-accent/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" /> {t('teamMembers')}
                </span>
                <span className="font-mono font-bold text-foreground">
                  {plan.max_users === -1
                    ? `${usage?.members_count.toLocaleString()} (${t('unlimited')})`
                    : `${usage?.members_count.toLocaleString()} / ${plan.max_users.toLocaleString()}`}
                </span>
              </div>

              {plan.max_users !== -1 ? (
                <div className="space-y-1.5">
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getProgressColorClass(
                        usage?.members_percentage || 0
                      )}`}
                      style={{ width: `${usage?.members_percentage || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{t('fullnessRate')}</span>
                    <span className="font-mono">{usage?.members_percentage}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-500 font-medium">{t('unlimitedMembersText')}</p>
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
          <div className="rounded-lg bg-muted/60 p-3 text-[11px] text-muted-foreground flex items-center justify-between border">
            <span>
              {t('cycleNote', { period: usage?.year_month || '' })}
            </span>
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="font-bold text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <span>{t('switchOrUpgrade')}</span>
              <ArrowUpRight className="h-3 w-3 rtl:rotate-180" />
            </button>
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
                  <div className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full border border-amber-500/50 bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-0.5 text-[10px] font-black text-slate-950 shadow-md">
                    🔥 الأكثر شيوعاً (Popular)
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

                <div className="mt-6 pt-4 border-t border-border/60">
                  <Button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    disabled={isCurrent}
                    className={`w-full text-xs font-bold ${
                      isCurrent
                        ? 'bg-muted text-muted-foreground border-border'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md'
                    }`}
                  >
                    {isCurrent ? 'باقتك الحالية' : 'اختيار هذه الباقة / الترقية 🚀'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradePlanModal
        open={isUpgradeModalOpen}
        onOpenChange={setIsUpgradeModalOpen}
        currentPlanId={plan?.id}
        availablePlans={availablePlans}
      />
    </div>
  );
}
