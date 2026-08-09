'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  CreditCard,
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
} from 'lucide-react'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<PlanData | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [limitsExceeded, setLimitsExceeded] = useState(false)

  useEffect(() => {
    async function fetchSubscriptionInfo() {
      try {
        setLoading(true)
        const res = await fetch('/api/account/subscription')
        const data = await res.json()

        if (!res.ok || data.error) {
          setError(data.error || 'فشل جلب بيانات الخطة')
          return
        }

        setPlan(data.plan)
        setSubscription(data.subscription)
        setUsage(data.usage)
        setLimitsExceeded(Boolean(data.limits_exceeded))
      } catch (err: any) {
        setError(err.message || 'حدث خطأ غير متوقع')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptionInfo()
  }, [])

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
          {error || 'لم يتم العثور على خطة مفعّلة لهذا الحساب'}
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
      label: 'مساعد الردود الذكي (AI Assistant)',
      icon: Bot,
      enabled: Boolean(plan.features?.ai_assistant),
    },
    {
      key: 'excel_export',
      label: 'تصدير التقارير بـ Excel',
      icon: FileSpreadsheet,
      enabled: Boolean(plan.features?.excel_export),
    },
    {
      key: 'telegram_bot',
      label: 'ربط وتوسيع البوت بـ Telegram',
      icon: Send,
      enabled: Boolean(plan.features?.telegram_bot),
    },
  ]

  return (
    <div className="space-y-6 dir-rtl">
      {/* Limit Exceeded Alert Banner */}
      {limitsExceeded && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-500 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">وصلت للحد الأقصى المسموح به لخطة {plan.name}</h4>
            <p className="text-xs text-rose-400/90 leading-relaxed">
              لقد استهلكت كامل الرصيد المتاح من الرسائل أو البرودكاست لهذا الشهر. يرجى التواصل مع إدارة المنصة لترقية خطتك ومتابعة العمل بدون انقطاع.
            </p>
          </div>
        </div>
      )}

      {/* Main Plan Overview Card */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
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
                {subscription?.status === 'trialing' ? 'فترة تجريبية (Trialing)' : 'نشط (Active)'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              الخطة والحدود التشغيلية المفعلة لحسابك حالياً
            </CardDescription>
          </div>

          <div className="text-left dir-ltr">
            <span className="text-2xl font-black text-foreground">
              ${subscription?.billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly}
            </span>
            <span className="text-xs text-muted-foreground mr-1">
              /{subscription?.billing_cycle === 'yearly' ? 'سنة' : 'شهر'}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Usage Meters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Messages Progress */}
            <div className="rounded-xl border p-4 bg-accent/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-500" /> الرسائل الشهرية
                </span>
                <span className="font-mono font-bold text-foreground">
                  {plan.max_messages_monthly === -1
                    ? `${usage?.messages_count.toLocaleString()} (بدون حدود)`
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
                    <span>نسبة الاستهلاك</span>
                    <span className="font-mono">{usage?.messages_percentage}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-500 font-medium">إرسال غير محدود للرسائل</p>
              )}
            </div>

            {/* Broadcasts Progress */}
            <div className="rounded-xl border p-4 bg-accent/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-2">
                  <Radio className="h-4 w-4 text-indigo-500" /> الحملات (Broadcasts)
                </span>
                <span className="font-mono font-bold text-foreground">
                  {plan.max_broadcasts_monthly === -1
                    ? `${usage?.broadcasts_count.toLocaleString()} (بدون حدود)`
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
                    <span>نسبة الاستهلاك</span>
                    <span className="font-mono">{usage?.broadcasts_percentage}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-500 font-medium">حملات غير محدودة</p>
              )}
            </div>

            {/* Team Members Progress */}
            <div className="rounded-xl border p-4 bg-accent/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" /> أعضاء الفريق (Team)
                </span>
                <span className="font-mono font-bold text-foreground">
                  {plan.max_users === -1
                    ? `${usage?.members_count.toLocaleString()} (بدون حدود)`
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
                    <span>نسبة الامتلاء</span>
                    <span className="font-mono">{usage?.members_percentage}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-500 font-medium">عدد أعضاء غير محدود</p>
              )}
            </div>
          </div>

          {/* Features Checklist */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              الميزات المتوفرة بالخطة
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
              دورة الاستهلاك تتجدد تلقائياً بداية كل شهر ميلادي ({usage?.year_month}).
            </span>
            <span className="font-medium text-indigo-500">
              الدفع والترقية المباشرة تتاح قريباً
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
