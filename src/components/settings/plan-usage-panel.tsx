'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Clock,
  Landmark,
  CreditCard,
  Coins,
  MessageCircle,
  Upload,
  Copy,
  Check,
  ChevronRight,
  Building2,
  Mic,
  ShieldAlert,
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
    voice_transcription?: boolean
    automations?: boolean
    flows_builder?: boolean
    excel_export?: boolean
    telegram_bot?: boolean
    custom_webhooks?: boolean
    woocommerce_integration?: boolean
    shopify_integration?: boolean
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
  const [supportWhatsapp, setSupportWhatsapp] = useState('')

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

  const [pendingOfflineSubmission, setPendingOfflineSubmission] = useState<any | null>(null)

  // Checkout & Payment Modals State
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanData | null>(null)
  const [selectedPlanForOffline, setSelectedPlanForOffline] = useState<PlanData | null>(null)
  const [offlineMethods, setOfflineMethods] = useState<any[]>([])
  const [selectedOfflineMethodId, setSelectedOfflineMethodId] = useState<string>('')
  const [offlineTransactionRef, setOfflineTransactionRef] = useState('')
  const [offlineProofImageUrl, setOfflineProofImageUrl] = useState('')
  const [offlineUserNotes, setOfflineUserNotes] = useState('')
  const [uploadingOfflineReceipt, setUploadingOfflineReceipt] = useState(false)
  const [submittingOfflineProof, setSubmittingOfflineProof] = useState(false)
  const [offlineError, setOfflineError] = useState<string | null>(null)
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false)

  async function fetchSubscriptionInfo() {
    try {
      setLoading(true)
      const [subRes, settingsRes, offlineRes, methodsRes] = await Promise.all([
        fetch('/api/account/subscription', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/site-settings', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { settings: {} })),
        fetch('/api/account/offline-payment', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { submissions: [] })),
        fetch('/api/offline-methods', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { methods: [] })),
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

      const pendingSub = (offlineRes.submissions || []).find((s: any) => s.status === 'pending')
      setPendingOfflineSubmission(pendingSub || null)

      const methodsList = methodsRes.methods || []
      setOfflineMethods(methodsList)
      if (methodsList.length > 0 && !selectedOfflineMethodId) {
        setSelectedOfflineMethodId(methodsList[0].id)
      }

      const st = settingsRes.settings || {}
      setStripeEnabled(Boolean(st.stripe_enabled))
      setPlisioEnabled(Boolean(st.plisio_enabled))
      setSupportWhatsapp(st.support_whatsapp || '')
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

  const handleCopyAccountNumber = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAccountNumber(true)
    toast.success(isAr ? 'تم نسخ رقم الحساب/IBAN بنجاح 📋' : 'Account number copied 📋')
    setTimeout(() => setCopiedAccountNumber(false), 2000)
  }

  const handleOfflineReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingOfflineReceipt(true)
      setOfflineError(null)
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload-receipt', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed')

      setOfflineProofImageUrl(data.url)
      toast.success(isAr ? 'تم رفع صورة الوصل بنجاح 🖼️' : 'Receipt uploaded 🖼️')
    } catch (err: any) {
      setOfflineError(err.message || (isAr ? 'فشل رفع صورة الوصل' : 'Receipt upload failed'))
    } finally {
      setUploadingOfflineReceipt(false)
    }
  }

  const handleSubmitOfflinePaymentProof = async () => {
    if (!selectedPlanForOffline) return
    if (!offlineTransactionRef.trim() && !offlineProofImageUrl) {
      setOfflineError(
        isAr
          ? 'يرجى تقديم إما رقم الحوالة/المرجع أو رفع صورة الوصل'
          : 'Please provide reference code or upload receipt screenshot'
      )
      return
    }

    try {
      setSubmittingOfflineProof(true)
      setOfflineError(null)

      const res = await fetch('/api/account/offline-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlanForOffline.id,
          billing_cycle: billingCycle,
          method_id: selectedOfflineMethodId || null,
          transaction_ref: offlineTransactionRef,
          proof_image_url: offlineProofImageUrl,
          user_notes: offlineUserNotes,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Submission failed')

      toast.success(
        data.message || (isAr ? 'تم إرسال إثبات الدفع بنجاح! جاري المراجعة 🚀' : 'Payment proof submitted successfully!')
      )

      setSelectedPlanForOffline(null)
      fetchSubscriptionInfo()
    } catch (err: any) {
      setOfflineError(err.message || (isAr ? 'حدث خطأ عند إرسال إثبات الدفع' : 'Submission error'))
    } finally {
      setSubmittingOfflineProof(false)
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
      label: isAr ? 'مساعد الذكاء الاصطناعي (AI Assistant)' : 'AI Assistant Auto-Reply',
      icon: Bot,
      enabled: Boolean(plan.features?.ai_assistant),
    },
    {
      key: 'voice_transcription',
      label: isAr
        ? 'فهم الرسائل الصوتية (Voice STT)'
        : 'Voice Message Transcription (STT)',
      icon: Mic,
      enabled: Boolean(plan.features?.voice_transcription),
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
    {
      key: 'woocommerce_integration',
      label: isAr ? 'ربط متجر ووكومرس (WooCommerce)' : 'WooCommerce Store Integration',
      icon: ShoppingBag,
      enabled: Boolean(plan.features?.woocommerce_integration),
    },
    {
      key: 'shopify_integration',
      label: isAr ? 'ربط متجر شوبيفاي (Shopify)' : 'Shopify Store Integration',
      icon: ShoppingBag,
      enabled: Boolean(plan.features?.shopify_integration),
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

      {pendingOfflineSubmission && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-amber-600 dark:text-amber-400 space-y-2 shadow-sm">
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <Clock className="h-5 w-5 shrink-0 text-amber-500" />
            <span>{isAr ? 'جاري مراجعة إثبات الدفع من قبل الإدارة (طلب معلق) ⏳' : 'Payment Proof Verification Pending ⏳'}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAr
              ? `لقد قمت بإرسال إثبات دفع لباقة (${pendingOfflineSubmission.plans?.name || 'الباقة جديدة'}). جاري مطابقة الحوالة من قبل الإدارة وتفعيل اشتراكك فوراً.`
              : `You submitted a payment proof for (${pendingOfflineSubmission.plans?.name}). Admin review in progress.`}
          </p>
          {pendingOfflineSubmission.transaction_ref && (
            <div className="text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 dir-ltr pt-1">
              Transaction Ref: {pendingOfflineSubmission.transaction_ref}
            </div>
          )}
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

      <div className="space-y-6 pt-6 border-t border-border">
        {/* Section Header & Billing Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              {isAr ? 'باقات الاشتراك والترقية المتاحة' : 'Available Subscription Plans & Upgrades'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr
                ? 'اختر الباقة المناسبة لتوسيع نشاطك التجاري، مع مرونة الترقية والإلغاء في أي وقت'
                : 'Choose the ideal plan to scale your business. Upgrade or cancel anytime.'}
            </p>
          </div>

          {/* Sleek Pill Switcher */}
          <div className="inline-flex items-center gap-1.5 p-1 bg-muted/80 backdrop-blur-sm rounded-xl border border-border self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'فوترة شهرية' : 'Monthly'}
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{isAr ? 'فوترة سنوية' : 'Yearly'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                billingCycle === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}>
                {isAr ? 'وفر 20%' : 'Save 20%'}
              </span>
            </button>
          </div>
        </div>

        {/* Modern Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
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
              <div
                key={p.id}
                className={`relative flex flex-col justify-between p-6 rounded-2xl transition-all duration-300 ${
                  isCurrent
                    ? 'border-2 border-emerald-500 bg-emerald-500/[0.03] shadow-lg ring-1 ring-emerald-500/20'
                    : p.is_popular
                      ? 'border-2 border-amber-500 bg-amber-500/[0.03] shadow-lg ring-1 ring-amber-500/20 md:scale-[1.02] z-10'
                      : 'border border-border/80 bg-card hover:border-border hover:shadow-md'
                }`}
              >
                {/* Popular Pill Floating Badge */}
                {p.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-md whitespace-nowrap">
                    {isAr ? '⭐ الأكثر طلباً' : '⭐ MOST POPULAR'}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Card Header: Title & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xl font-black text-foreground tracking-tight">{p.name}</h4>
                      <p className="text-[11px] text-muted-foreground font-mono uppercase mt-0.5">
                        {p.slug}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                        <Check className="h-3 w-3" />
                        {isAr ? 'باقتك الحالية' : 'Current Plan'}
                      </span>
                    )}
                  </div>

                  {/* Price Block (Clean & Sleek without chunky boxes) */}
                  <div className="py-3 border-y border-border/50">
                    <div className="flex items-baseline gap-1.5 dir-ltr">
                      <span className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
                        ${priceActive === 0 ? '0' : priceActive}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm font-semibold text-muted-foreground/60 line-through">
                          ${priceOriginal}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-muted-foreground">
                        /{isYearly ? (isAr ? 'سنة' : 'yr') : (isAr ? 'شهر' : 'mo')}
                      </span>
                    </div>
                    {hasDiscount && (
                      <div className="mt-1">
                        <span className="inline-block text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          {isAr ? 'وفر 20% مع الفوترة السنوية 🎉' : 'Save 20% on Yearly 🎉'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Compact Operational Limits Spec Grid */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {isAr ? 'الحدود التشغيلية' : 'Operational Limits'}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-muted/40 p-2.5 border border-border/40">
                        <span className="text-[10px] text-muted-foreground block flex items-center gap-1">
                          <Users className="h-3 w-3 text-indigo-400 shrink-0" />
                          {isAr ? 'أعضاء الفريق' : 'Team Members'}
                        </span>
                        <span className="font-bold text-foreground mt-0.5 block text-xs">
                          {p.max_users === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : (isAr ? `${p.max_users} أعضاء` : `${p.max_users} Seats`)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-2.5 border border-border/40">
                        <span className="text-[10px] text-muted-foreground block flex items-center gap-1">
                          <UsersRound className="h-3 w-3 text-indigo-400 shrink-0" />
                          {isAr ? 'جهات الاتصال' : 'Contacts'}
                        </span>
                        <span className="font-bold text-foreground mt-0.5 block text-xs">
                          {p.max_contacts === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : (p.max_contacts || 1000).toLocaleString()}
                        </span>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-2.5 border border-border/40">
                        <span className="text-[10px] text-muted-foreground block flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-indigo-400 shrink-0" />
                          {isAr ? 'الرسائل' : 'Messages'}
                        </span>
                        <span className="font-bold text-foreground mt-0.5 block text-xs">
                          {p.max_messages_monthly === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : `${(p.max_messages_monthly || 1000).toLocaleString()}${isAr ? ' /ش' : ' /mo'}`}
                        </span>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-2.5 border border-border/40">
                        <span className="text-[10px] text-muted-foreground block flex items-center gap-1">
                          <Radio className="h-3 w-3 text-indigo-400 shrink-0" />
                          {isAr ? 'البرودكاست' : 'Broadcasts'}
                        </span>
                        <span className="font-bold text-foreground mt-0.5 block text-xs">
                          {p.max_broadcasts_monthly === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : `${(p.max_broadcasts_monthly || 10).toLocaleString()}${isAr ? ' /ش' : ' /mo'}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Included Features Checklist (All 7 Platform Features) */}
                  <div className="space-y-2 border-t border-border/50 pt-3 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {isAr ? 'الميزات المتوفرة في الخطة' : 'Included Features'}
                    </div>

                    {/* AI Assistant */}
                    <div className="flex items-center gap-2">
                      {p.features?.ai_assistant ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={p.features?.ai_assistant ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'}>
                        {isAr ? 'مساعد الذكاء الاصطناعي (AI Assistant)' : 'AI Assistant Auto-Reply'}
                      </span>
                    </div>

                    {/* Voice Transcription STT */}
                    <div className="flex items-center gap-2">
                      {p.features?.voice_transcription ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={p.features?.voice_transcription ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'}>
                        {isAr ? 'فهم الرسائل الصوتية (Voice STT)' : 'Voice Message Transcription (STT)'}
                      </span>
                    </div>

                    {/* Automations */}
                    <div className="flex items-center gap-2">
                      {p.features?.automations ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={p.features?.automations ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'}>
                        {isAr ? 'الأتمتة والردود الذكية' : 'Smart Automations'}
                      </span>
                    </div>

                    {/* Flows Builder */}
                    <div className="flex items-center gap-2">
                      {p.features?.flows_builder ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={p.features?.flows_builder ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'}>
                        {isAr ? 'منشئ مسارات العمل (Flows)' : 'Visual Flows Builder'}
                      </span>
                    </div>

                    {/* Telegram Bot */}
                    <div className="flex items-center gap-2">
                      {p.features?.telegram_bot ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={p.features?.telegram_bot ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'}>
                        {isAr ? 'إشعارات بوت تيليجرام' : 'Telegram Bot Alerts'}
                      </span>
                    </div>

                    {/* Excel Export */}
                    <div className="flex items-center gap-2">
                      {p.features?.excel_export ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={p.features?.excel_export ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'}>
                        {isAr ? 'تصدير التقارير إلى Excel' : 'Excel Report Export'}
                      </span>
                    </div>

                    {/* WooCommerce Integration */}
                    <div className="flex items-center gap-2">
                      {p.features?.woocommerce_integration ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={p.features?.woocommerce_integration ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'}>
                        {isAr ? 'ربط متجر ووكومرس (WooCommerce)' : 'WooCommerce Integration'}
                      </span>
                    </div>

                    {/* Shopify Integration */}
                    <div className="flex items-center gap-2">
                      {p.features?.shopify_integration ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={p.features?.shopify_integration ? 'font-medium text-foreground' : 'text-muted-foreground/40 line-through'}>
                        {isAr ? 'ربط متجر شوبيفاي (Shopify)' : 'Shopify Integration'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sleek CTA Button */}
                <div className="mt-6 pt-4 border-t border-border/50">
                  {isCurrent ? (
                    <Button
                      disabled
                      className="w-full text-xs font-bold bg-muted/60 text-muted-foreground border border-border/60 h-11 rounded-xl cursor-default"
                    >
                      <Check className="h-3.5 w-3.5 me-1.5 text-emerald-500" />
                      {isAr ? 'خطتك الحالية المفعلة' : 'Current Active Plan'}
                    </Button>
                  ) : p.price_monthly === 0 || p.slug === 'free' ? (
                    <Button
                      onClick={() => handleFreeActivate(p)}
                      disabled={upgradingPlanId === p.id}
                      className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 h-11 rounded-xl transition-all"
                    >
                      {upgradingPlanId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      ) : (
                        isAr ? 'تفعيل الخطة المجانية 🎁' : 'Switch to Free Plan 🎁'
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedPlanForCheckout(p)
                        setOfflineError(null)
                      }}
                      className="w-full text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/25 hover:shadow-lg h-11 rounded-xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-emerald-200 group-hover:scale-125 transition-transform" />
                      <span>{isAr ? 'ترقية واشتراك الآن 🚀' : 'Pay Now & Upgrade 🚀'}</span>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 1. CHECKOUT PAYMENT METHOD SELECTION MODAL */}
      {selectedPlanForCheckout && (
        <Dialog open={Boolean(selectedPlanForCheckout)} onOpenChange={() => setSelectedPlanForCheckout(null)}>
          <DialogContent className="sm:max-w-xl w-full rounded-3xl bg-card border-border p-6 shadow-2xl">
            <DialogHeader className="text-start space-y-1.5 pb-4 border-b border-border">
              <DialogTitle className="text-xl font-black flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-emerald-500 shrink-0" />
                {isAr ? 'بماذا تريد أن تدفع؟ (اختر وسيلة الدفع المناسبة)' : 'Select Payment Method'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? `أنت على وشك الترقية إلى خطة (${selectedPlanForCheckout.name}). يرجى اختيار وسيلة الدفع المفضلة لديك لإتمام العملية.`
                  : `Select your preferred checkout method to upgrade to ${selectedPlanForCheckout.name}.`}
              </DialogDescription>

              {/* Price Banner */}
              <div className="pt-2">
                <div className="flex items-center justify-between p-3 bg-muted/60 rounded-2xl border border-border">
                  <span className="text-xs font-bold text-muted-foreground">{isAr ? 'قيمة الاشتراك المطلوب:' : 'Selected Plan Cost:'}</span>
                  <span className="text-sm font-mono font-black text-emerald-500">
                    ${billingCycle === 'yearly'
                      ? (selectedPlanForCheckout.price_yearly_discounted && selectedPlanForCheckout.price_yearly_discounted > 0 ? selectedPlanForCheckout.price_yearly_discounted : selectedPlanForCheckout.price_yearly)
                      : (selectedPlanForCheckout.price_monthly_discounted && selectedPlanForCheckout.price_monthly_discounted > 0 ? selectedPlanForCheckout.price_monthly_discounted : selectedPlanForCheckout.price_monthly)} USD ({billingCycle === 'yearly' ? (isAr ? 'اشتراك سنوي' : 'Yearly') : (isAr ? 'اشتراك شهري' : 'Monthly')})
                  </span>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 py-3">
              {/* Fallback if no payment gateways configured or active */}
              {offlineMethods.length === 0 && !stripeEnabled && !plisioEnabled && (
                <div className="p-6 rounded-2xl border border-dashed border-border bg-muted/30 text-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto border border-amber-500/20">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-foreground">
                      {isAr ? 'بوابات الدفع قيد الصيانة والتحديث حالياً' : 'Payment Gateways Temporarily Unavailable'}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-sm mx-auto">
                      {isAr
                        ? 'لم يتم تفعيل أي وسيلة دفع إلكترونية أو حساب بنكي حالياً. يرجى التواصل مع فريق الدعم الفني لمساعدتك في ترقية وتفعيل اشتراكك.'
                        : 'No active payment gateways are currently configured. Please contact support to assist you with upgrading your subscription.'}
                    </p>
                  </div>
                  <div className="pt-2">
                    <a
                      href={supportWhatsapp ? `https://wa.me/${supportWhatsapp.replace(/[^0-9]/g, '')}` : '/settings?tab=tickets'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 shadow-xs transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{isAr ? 'تواصل مع الدعم الفني للترقية 💬' : 'Contact Support to Upgrade 💬'}</span>
                    </a>
                  </div>
                </div>
              )}

              {/* OPTION 1: OFFLINE LOCAL PAYMENT (Only if offline methods exist) */}
              {offlineMethods.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const targetPlan = selectedPlanForCheckout
                    setSelectedPlanForCheckout(null)
                    setSelectedPlanForOffline(targetPlan)
                    if (offlineMethods.length > 0) setSelectedOfflineMethodId(offlineMethods[0].id)
                    setOfflineTransactionRef('')
                    setOfflineProofImageUrl('')
                    setOfflineUserNotes('')
                    setOfflineError(null)
                  }}
                  className="w-full p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500 transition-all text-start flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="p-3 bg-emerald-500/15 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-foreground flex items-center gap-2">
                        {isAr ? '🏦 الدفع المحلي والأوفلاين' : '🏦 Local & Offline Payment'}
                      </span>
                      <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold border-0">
                        {isAr ? 'تحويل بنكي / محفظة ⚡' : 'Bank & Wallets ⚡'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {isAr
                        ? 'الدفع عبر التحويل البنكي المحلي أو محافظ الكاش (زين كاش / STC Pay / فودافون كاش) وإرسال الوصل'
                        : 'Pay via local bank transfer, ZainCash, STC Pay, or Mobile Wallets with proof submission'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground me-1 my-auto group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {/* OPTION 2: CARD PAYMENT (STRIPE) (Only if Stripe is enabled) */}
              {stripeEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    const targetPlan = selectedPlanForCheckout
                    setSelectedPlanForCheckout(null)
                    handleStripeCheckout(targetPlan)
                  }}
                  className="w-full p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500 transition-all text-start flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="p-3 bg-indigo-500/15 text-indigo-500 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {isAr ? '💳 بطاقة بنكية (Visa / MasterCard)' : '💳 Card Payment (Visa / MasterCard)'}
                      </span>
                      <Badge className="bg-indigo-500/20 text-indigo-400 text-[10px] font-bold border-0">
                        {isAr ? 'دفع إلكتروني آمن ⚡' : 'Instant Online ⚡'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {isAr
                        ? 'الدفع الإلكتروني المباشر بالسداد الفوري عبر الفيزا أو الماستركارد (Stripe Checkout)'
                        : 'Instant automated checkout via credit or debit card'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground me-1 my-auto group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {/* OPTION 3: CRYPTO (PLISIO) (Only if Plisio Crypto is enabled) */}
              {plisioEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    const targetPlan = selectedPlanForCheckout
                    setSelectedPlanForCheckout(null)
                    handlePlisioUpgrade(targetPlan)
                  }}
                  className="w-full p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500 transition-all text-start flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="p-3 bg-amber-500/15 text-amber-500 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                    <Coins className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {isAr ? '🪙 عملات رقمية / كريبتو (USDT / Bitcoin)' : '🪙 Crypto Payment (USDT / Bitcoin)'}
                      </span>
                      <Badge className="bg-amber-500/20 text-amber-400 text-[10px] font-bold border-0">
                        {isAr ? 'USDT & Crypto 🪙' : 'USDT & Crypto 🪙'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {isAr
                        ? 'دفع مشفر دولي وآمن عبر العملات الرقمية USDT (TRC20/ERC20) والبيتكوين (Plisio Invoice)'
                        : 'Pay with USDT, Bitcoin, or Ethereum via Plisio Crypto Gateway'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground me-1 my-auto group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setSelectedPlanForCheckout(null)} className="w-full rounded-2xl font-bold">
                {isAr ? 'إلغاء النافذة' : 'Close Window'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 2. OFFLINE PAYMENT PROOF SUBMISSION DIALOG */}
      {selectedPlanForOffline && (
        <Dialog open={Boolean(selectedPlanForOffline)} onOpenChange={() => setSelectedPlanForOffline(null)}>
          <DialogContent className="sm:max-w-xl w-full rounded-3xl bg-card border-border p-6 shadow-2xl">
            <DialogHeader className="text-start space-y-1 pb-3 border-b border-border">
              <DialogTitle className="text-lg font-black flex items-center gap-2 text-foreground">
                <Landmark className="h-5 w-5 text-emerald-500 shrink-0" />
                {isAr ? `إتمام الترقية عبر الدفع المحلي: خطة ${selectedPlanForOffline.name}` : `Offline Payment: ${selectedPlanForOffline.name}`}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isAr ? 'يرجى تحويل المبلغ المطلوب لإحدى وسائل الدفع المتاحة أدناه، ثم كتابة رقم الحوالة وإرفاق الوصل.' : 'Please transfer the amount to one of the payment methods below and submit your receipt.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Required Price Tag */}
              <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{isAr ? 'المبلغ المطلوب تحويله:' : 'Amount to Transfer:'}</span>
                <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                  ${billingCycle === 'yearly'
                    ? (selectedPlanForOffline.price_yearly_discounted && selectedPlanForOffline.price_yearly_discounted > 0 ? selectedPlanForOffline.price_yearly_discounted : selectedPlanForOffline.price_yearly)
                    : (selectedPlanForOffline.price_monthly_discounted && selectedPlanForOffline.price_monthly_discounted > 0 ? selectedPlanForOffline.price_monthly_discounted : selectedPlanForOffline.price_monthly)} USD ({billingCycle === 'yearly' ? (isAr ? 'سنوي' : 'Yearly') : (isAr ? 'شهري' : 'Monthly')})
                </span>
              </div>

              {/* Payment Methods Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">{isAr ? 'اختر طريقة الدفع / البنك / المحفظة المتاحة:' : 'Select Payment Method:'}</Label>
                {offlineMethods.length === 0 ? (
                  <div className="p-4 bg-muted rounded-2xl text-center text-xs text-muted-foreground font-bold">
                    {isAr ? 'لا يوجد وسائل دفع محددة حالياً من الإدارة، يرجى التواصل عبر الواتساب' : 'No offline payment methods available yet'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {offlineMethods.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedOfflineMethodId(m.id)}
                        className={`p-3 rounded-2xl border text-start flex items-center gap-3 transition-all cursor-pointer ${
                          selectedOfflineMethodId === m.id
                            ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20 font-bold'
                            : 'border-border hover:bg-muted/60'
                        }`}
                      >
                        {m.logo_url ? (
                          <img src={m.logo_url} alt={m.name} className="h-8 w-8 object-contain rounded-lg shrink-0 border border-border bg-white p-0.5" />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">
                            <Landmark className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate text-foreground">{m.name}</div>
                          {m.account_name && <div className="text-[10px] text-muted-foreground truncate">{m.account_name}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Method Display Details */}
              {offlineMethods.find((m) => m.id === selectedOfflineMethodId) && (
                <div className="p-4 bg-muted/70 rounded-2xl border border-border space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-bold">{isAr ? 'رقم الحساب / IBAN / المحفظة:' : 'Account # / IBAN:'}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-black text-xs dir-ltr select-all text-emerald-500">
                        {offlineMethods.find((m) => m.id === selectedOfflineMethodId)?.account_number}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyAccountNumber(offlineMethods.find((m) => m.id === selectedOfflineMethodId)?.account_number || '')}
                        className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {copiedAccountNumber ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {offlineMethods.find((m) => m.id === selectedOfflineMethodId)?.account_name && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{isAr ? 'اسم المستفيد:' : 'Holder Name:'}</span>
                      <span className="font-bold text-foreground">{offlineMethods.find((m) => m.id === selectedOfflineMethodId)?.account_name}</span>
                    </div>
                  )}

                  {offlineMethods.find((m) => m.id === selectedOfflineMethodId)?.instructions && (
                    <p className="text-[11px] text-muted-foreground pt-1.5 border-t border-border/80 leading-relaxed">
                      {offlineMethods.find((m) => m.id === selectedOfflineMethodId)?.instructions}
                    </p>
                  )}
                </div>
              )}

              {/* Form Input: Transaction Ref */}
              <div className="space-y-1">
                <Label className="text-xs font-bold">{isAr ? 'رقم الحوالة / المرجع / Transaction Ref Code *' : 'Reference / Transaction Ref *'}</Label>
                <Input
                  placeholder={isAr ? 'مثال: #REF-98765432' : 'e.g. #REF-98765432'}
                  value={offlineTransactionRef}
                  onChange={(e) => setOfflineTransactionRef(e.target.value)}
                  className="h-10 text-xs rounded-xl font-mono dir-ltr"
                />
              </div>

              {/* Form Input: Receipt Screenshot */}
              <div className="space-y-1">
                <Label className="text-xs font-bold">{isAr ? 'صورة وصل/إثبات الدفع (اختياري ولكن يُفضل إرفاقها)' : 'Proof of Payment Receipt Screenshot'}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://... receipt.png"
                    value={offlineProofImageUrl}
                    onChange={(e) => setOfflineProofImageUrl(e.target.value)}
                    className="h-10 text-xs rounded-xl flex-1 dir-ltr"
                  />
                  <label className="cursor-pointer">
                    <span className="h-10 px-3 bg-muted border border-border rounded-xl flex items-center justify-center text-xs font-bold text-foreground hover:bg-accent transition-colors">
                      {uploadingOfflineReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </span>
                    <input type="file" accept="image/*" onChange={handleOfflineReceiptUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Form Input: User Notes */}
              <div className="space-y-1">
                <Label className="text-xs font-bold">{isAr ? 'ملاحظة إضافية للإدارة (اختياري)' : 'Additional Note (Optional)'}</Label>
                <Input
                  placeholder={isAr ? 'اكتب اسم المحول منه أو تفاصيل أُخرى' : 'Enter sender name or note'}
                  value={offlineUserNotes}
                  onChange={(e) => setOfflineUserNotes(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              {offlineError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-bold">
                  ⚠️ {offlineError}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2 flex gap-2">
              <Button variant="outline" onClick={() => setSelectedPlanForOffline(null)} className="rounded-2xl h-11 font-bold flex-1">
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleSubmitOfflinePaymentProof}
                disabled={submittingOfflineProof}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl h-11 px-5 flex-1 shadow-lg shadow-emerald-600/20"
              >
                {submittingOfflineProof ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  isAr ? 'إرسال إثبات الدفع للمراجعة 🚀' : 'Submit Receipt Proof'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
