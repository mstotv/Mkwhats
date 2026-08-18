import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Radio,
  Users,
  Send,
  Loader2,
  ExternalLink,
  Check,
  Zap,
  Landmark,
  Upload,
  CreditCard,
  Building2,
} from 'lucide-react'

import { useLocale } from 'next-intl'

export interface PlanItem {
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

interface OfflineMethod {
  id: string
  name: string
  account_name?: string
  account_number: string
  logo_url?: string
  instructions?: string
}

interface UpgradePlanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlanId?: string | null
  availablePlans: PlanItem[]
  onSuccess?: () => void
}

export function UpgradePlanModal({
  open,
  onOpenChange,
  currentPlanId,
  availablePlans,
  onSuccess,
}: UpgradePlanModalProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<{
    planName: string
    paymentMethod: 'offline' | 'plisio' | 'whatsapp'
    checkoutUrl?: string
    whatsappUrl?: string
  } | null>(null)

  // Offline Payment Modal Step State
  const [selectedPlanForOffline, setSelectedPlanForOffline] = useState<PlanItem | null>(null)
  const [offlineMethods, setOfflineMethods] = useState<OfflineMethod[]>([])
  const [selectedMethodId, setSelectedMethodId] = useState<string>('')
  const [transactionRef, setTransactionRef] = useState('')
  const [proofImageUrl, setProofImageUrl] = useState('')
  const [userNotes, setUserNotes] = useState('')
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [submittingOffline, setSubmittingOffline] = useState(false)

  useEffect(() => {
    if (open) {
      fetch('/api/offline-methods')
        .then((r) => r.json())
        .then((data) => {
          const methods = data.methods || []
          setOfflineMethods(methods)
          if (methods.length > 0) setSelectedMethodId(methods[0].id)
        })
        .catch(() => {})
    }
  }, [open])

  const handleOpenOfflineModal = (plan: PlanItem) => {
    setSelectedPlanForOffline(plan)
    setTransactionRef('')
    setProofImageUrl('')
    setUserNotes('')
    setError(null)
  }

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingReceipt(true)
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload-receipt', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed')

      setProofImageUrl(data.url)
    } catch (err: any) {
      setError(err.message || (isAr ? 'فشل رفع صورة الوصل' : 'Receipt upload failed'))
    } finally {
      setUploadingReceipt(false)
    }
  }

  const handleSubmitOfflinePayment = async () => {
    if (!selectedPlanForOffline) return
    if (!transactionRef.trim() && !proofImageUrl) {
      setError(isAr ? 'يرجى تقديم إما رقم الحوالة/المرجع أو رفع صورة الوصل' : 'Please provide transaction ref code or upload receipt image')
      return
    }

    try {
      setSubmittingOffline(true)
      setError(null)

      const res = await fetch('/api/account/offline-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlanForOffline.id,
          billing_cycle: billingCycle,
          method_id: selectedMethodId || null,
          transaction_ref: transactionRef,
          proof_image_url: proofImageUrl,
          user_notes: userNotes,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to submit payment proof')
      }

      setSuccessInfo({
        planName: selectedPlanForOffline.name,
        paymentMethod: 'offline',
      })

      setSelectedPlanForOffline(null)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message || (isAr ? 'حدث خطأ عند إرسال إثبات الدفع' : 'Submission failed'))
    } finally {
      setSubmittingOffline(false)
    }
  }

  const handleRequestUpgrade = async (plan: PlanItem) => {
    // If offline payment methods are available, open offline payment modal directly
    if (offlineMethods.length > 0) {
      handleOpenOfflineModal(plan)
      return
    }

    try {
      setError(null)
      setSubmittingPlanId(plan.id)

      const res = await fetch('/api/account/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_plan_id: plan.id,
          billing_cycle: billingCycle,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || (isAr ? 'حدث خطأ أثناء إرسال طلب الترقية' : 'Error sending upgrade request'))
        return
      }

      setSuccessInfo({
        planName: plan.name,
        paymentMethod: data.payment_method || 'whatsapp',
        checkoutUrl: data.checkout_url,
        whatsappUrl: data.whatsapp_url,
      })

      const targetUrl = data.checkout_url || data.whatsapp_url
      if (targetUrl) {
        window.open(targetUrl, '_blank')
      }

      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message || (isAr ? 'فشل الاتصال بالخادم' : 'Connection failed'))
    } finally {
      setSubmittingPlanId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl w-full max-w-[95vw] p-6 sm:p-8 max-h-[90vh] overflow-y-auto font-sans shadow-2xl border-border bg-card">
        <DialogHeader className="text-start space-y-2 pb-4 border-b">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <DialogTitle className="text-2xl sm:text-3xl font-black flex items-center gap-2 text-foreground">
              <Sparkles className="h-6 w-6 text-indigo-500 shrink-0" />
              {isAr ? 'اختر الخطة المناسبة لنشاطك التجاري' : 'Choose the Ideal Plan for Your Business'}
            </DialogTitle>
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 text-xs px-3 py-1 font-semibold">
              {isAr ? 'ترقية مباشرة ومضمونة ⚡' : 'Instant Guaranteed Upgrade ⚡'}
            </Badge>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isAr
              ? 'ترقية خطتك تمنحك حدوداً تشغيلية أعلى، ورصيداً شهرياً مضاعفاً، وتفعيلاً فورياً لكافة ميزات المنصة.'
              : 'Upgrading your plan grants higher operational limits, expanded monthly quotas, and instant access to all platform features.'}
          </DialogDescription>
        </DialogHeader>

        {/* Success Alert Banner */}
        {successInfo && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-600 dark:text-emerald-400 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm">
                  {isAr ? `تم تسجيل طلب الترقية إلى خطة ${successInfo.planName} بنجاح!` : `Upgrade request to ${successInfo.planName} registered successfully!`}
                </h4>
                <p className="text-xs opacity-90 leading-relaxed">
                  {successInfo.paymentMethod === 'plisio'
                    ? (isAr ? 'تم إنشاء فاتورة الدفع الرقمي بالكريبتو عبر Plisio. ينبغي أن تفتح صفحة الدفع تلقائياً، أو اضغط الزر أدناه لإكمال العملية.' : 'Crypto checkout invoice created via Plisio. The checkout page should open automatically.')
                    : (isAr ? 'تم حفظ طلبك بالنظام كطلب معلق (Pending). يرجى فتح محادثة الواتساب المباشرة لتأكيد التفعيل مع إدارة المنصة.' : 'Your request was saved as pending. Please open live WhatsApp chat for manual verification.')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {successInfo.paymentMethod === 'plisio' && successInfo.checkoutUrl ? (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-bold"
                  onClick={() => window.open(successInfo.checkoutUrl, '_blank')}
                >
                  <Send className="h-3.5 w-3.5" />
                  {isAr ? 'الانتقال لصفحة الدفع بالكريبتو (Plisio Checkout) 🪙' : 'Proceed to Plisio Crypto Checkout 🪙'}
                  <ExternalLink className="h-3.5 w-3.5 ms-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-bold"
                  onClick={() => window.open(successInfo.whatsappUrl || '#', '_blank')}
                >
                  <Send className="h-3.5 w-3.5" />
                  {isAr ? 'فتح محادثة الواتساب للتأكيد' : 'Open WhatsApp Chat to Confirm'}
                  <ExternalLink className="h-3.5 w-3.5 ms-1" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-500 flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-6 text-xs px-2">
              {isAr ? 'إغلاق' : 'Dismiss'}
            </Button>
          </div>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center py-2">
          <div className="inline-flex items-center rounded-xl bg-accent p-1.5 border shadow-inner">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-lg px-5 py-2 text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'دفع شهري' : 'Monthly'}
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`rounded-lg px-5 py-2 text-xs font-bold transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{isAr ? 'دفع سنوي' : 'Yearly'}</span>
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 border-0 font-extrabold">
                {isAr ? 'توفير 20% 🎉' : 'Save 20% 🎉'}
              </Badge>
            </button>
          </div>
        </div>

        {/* Plans Cards Grid (Wide 3 Columns Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch py-4">
          {availablePlans.map((plan) => {
            const isCurrent = currentPlanId === plan.id
            const isSubmitting = submittingPlanId === plan.id
            const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly
            const isPopular = plan.slug === 'pro' || plan.slug === 'professional'

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all relative ${
                  isCurrent
                    ? 'bg-card border-indigo-500 shadow-xl ring-2 ring-indigo-500/20'
                    : isPopular
                    ? 'bg-card border-indigo-500/60 shadow-lg'
                    : 'bg-card border-border hover:border-indigo-500/40 hover:shadow-md'
                }`}
              >
                {/* Header section with Current Plan Badge (Clean Top Placement) */}
                <div className="space-y-5">
                  {isCurrent && (
                    <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs px-3 py-1.5 text-center flex items-center justify-center gap-1.5 shadow-xs">
                      <Check className="h-4 w-4" />
                      <span>{isAr ? 'خطتك الحالية المفعّلة' : 'Your Current Active Plan'}</span>
                    </div>
                  )}

                  {!isCurrent && isPopular && (
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs px-3 py-1.5 text-center flex items-center justify-center gap-1.5 shadow-xs">
                      <Zap className="h-3.5 w-3.5 fill-amber-500" />
                      <span>{isAr ? 'الخطة الأكثر طلباً ⭐' : 'Most Popular Plan ⭐'}</span>
                    </div>
                  )}

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-black text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                      {plan.slug === 'enterprise'
                        ? (isAr ? 'للشركات الكبيرة والمؤسسات التي تتطلب حلولاً وحجم رسائل مفتوح' : 'For enterprises needing custom solutions & unlimited quotas')
                        : plan.slug === 'pro'
                        ? (isAr ? 'للأعمال المتنامية والفرق التي تحتاج أتمتة وذكاء اصطناعي' : 'For growing teams requiring automations & AI tools')
                        : (isAr ? 'مناسبة للفرق الصغيرة والإنطلاقة الأولى' : 'Ideal for small teams and initial launch')}
                    </p>
                  </div>

                  {/* Pricing Box */}
                  <div className="py-3 border-y border-border/80">
                    <div className="flex items-baseline gap-1.5 dir-ltr">
                      <span className="text-3xl sm:text-4xl font-black text-foreground">${price}</span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        /{billingCycle === 'yearly' ? (isAr ? 'سنة' : 'year') : (isAr ? 'شهر' : 'month')}
                      </span>
                    </div>
                  </div>

                  {/* Operational Limits */}
                  <div className="space-y-2.5 text-xs">
                    <span className="font-bold text-muted-foreground block text-[11px] uppercase tracking-wider">{isAr ? 'الحدود التشغيلية:' : 'Operational Limits:'}</span>
                    <div className="space-y-2 bg-accent/40 rounded-xl p-3 border">
                      <div className="flex items-center justify-between text-foreground">
                        <span className="flex items-center gap-2 font-medium">
                          <MessageSquare className="h-4 w-4 text-indigo-500 shrink-0" />
                          {isAr ? 'الرسائل الشهرية:' : 'Monthly Messages:'}
                        </span>
                        <span className="font-mono font-bold">
                          {plan.max_messages_monthly === -1 ? (isAr ? 'غير محدودة' : 'Unlimited') : plan.max_messages_monthly.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-foreground">
                        <span className="flex items-center gap-2 font-medium">
                          <Radio className="h-4 w-4 text-indigo-500 shrink-0" />
                          {isAr ? 'حملات البرودكاست:' : 'Broadcast Campaigns:'}
                        </span>
                        <span className="font-mono font-bold">
                          {plan.max_broadcasts_monthly === -1 ? (isAr ? 'غير محدودة' : 'Unlimited') : plan.max_broadcasts_monthly.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-foreground">
                        <span className="flex items-center gap-2 font-medium">
                          <Users className="h-4 w-4 text-indigo-500 shrink-0" />
                          {isAr ? 'أعضاء الفريق:' : 'Team Members:'}
                        </span>
                        <span className="font-mono font-bold">
                          {plan.max_users === -1 ? (isAr ? 'غير محدود' : 'Unlimited') : (isAr ? `${plan.max_users} أعضاء` : `${plan.max_users} members`)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Features Checklist */}
                  <div className="space-y-2.5 pt-1 text-xs">
                    <span className="font-bold text-muted-foreground block text-[11px] uppercase tracking-wider">{isAr ? 'الميزات المتاحة:' : 'Included Features:'}</span>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        {plan.features?.ai_assistant ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground shrink-0 opacity-60" />
                        )}
                        <span className={plan.features?.ai_assistant ? 'text-foreground font-semibold' : 'text-muted-foreground line-through opacity-70'}>
                          {isAr ? 'مساعد الردود الذكي (AI Assistant)' : 'Gemini AI Assistant'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {plan.features?.excel_export ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground shrink-0 opacity-60" />
                        )}
                        <span className={plan.features?.excel_export ? 'text-foreground font-semibold' : 'text-muted-foreground line-through opacity-70'}>
                          {isAr ? 'تصدير تقارير الطلبات بـ Excel' : 'Excel Report Export'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {plan.features?.telegram_bot ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground shrink-0 opacity-60" />
                        )}
                        <span className={plan.features?.telegram_bot ? 'text-foreground font-semibold' : 'text-muted-foreground line-through opacity-70'}>
                          {isAr ? 'إشعارات بوت Telegram الفورية' : 'Instant Telegram Bot Notifications'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-6 border-t border-border/80">
                  {isCurrent ? (
                    <Button variant="outline" disabled className="w-full text-xs font-bold border-border bg-muted/50 py-5">
                      <Check className="h-4 w-4 me-1.5" />
                      {isAr ? 'خطتك المفعلة حالياً' : 'Your Current Plan'}
                    </Button>
                  ) : (
                    <Button
                      className="w-full text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md py-5"
                      disabled={isSubmitting || Boolean(submittingPlanId)}
                      onClick={() => handleRequestUpgrade(plan)}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin me-1.5" />
                          {isAr ? 'جاري تسجيل الطلب...' : 'Processing request...'}
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          {isAr ? `طلب الترقية إلى خطة ${plan.name}` : `Upgrade to ${plan.name}`}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>

      {/* Offline Payment Dialog Modal */}
      {selectedPlanForOffline && (
        <Dialog open={Boolean(selectedPlanForOffline)} onOpenChange={() => setSelectedPlanForOffline(null)}>
          <DialogContent className="sm:max-w-xl w-full rounded-3xl bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 p-6 shadow-2xl">
            <DialogHeader className="text-start space-y-1 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <DialogTitle className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                <Landmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                {isAr ? `إتمام الترقية عبر الدفع المحلي: خطة ${selectedPlanForOffline.name}` : `Offline Local Payment: ${selectedPlanForOffline.name}`}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isAr ? 'يرجى تحويل المبلغ المطلوب لإحدى وسائل الدفع أدناه، ثم إرفاق رقم الحوالة أو صورة الوصل.' : 'Please transfer the required amount to one of the payment methods below and submit your receipt.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Price Tag */}
              <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {isAr ? 'المبلغ المطلوب تحويله:' : 'Required Amount:'}
                </span>
                <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-300">
                  ${billingCycle === 'yearly' ? selectedPlanForOffline.price_yearly : selectedPlanForOffline.price_monthly} USD ({billingCycle === 'yearly' ? (isAr ? 'اشتراك سنوي' : 'Yearly') : (isAr ? 'اشتراك شهري' : 'Monthly')})
                </span>
              </div>

              {/* Payment Methods Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">{isAr ? 'اختر طريقة الدفع / البنك / المحفظة:' : 'Select Payment Method:'}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {offlineMethods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethodId(m.id)}
                      className={`p-3 rounded-2xl border text-start flex items-center gap-3 transition-all cursor-pointer ${
                        selectedMethodId === m.id
                          ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20 font-bold'
                          : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      {m.logo_url ? (
                        <img src={m.logo_url} alt={m.name} className="h-7 w-7 object-contain rounded-lg shrink-0" />
                      ) : (
                        <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                          <Landmark className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate">{m.name}</div>
                        {m.account_name && <div className="text-[10px] text-muted-foreground truncate">{m.account_name}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Method Details */}
              {offlineMethods.find((m) => m.id === selectedMethodId) && (
                <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-bold">{isAr ? 'رقم الحساب / IBAN / المحفظة:' : 'Account # / IBAN:'}</span>
                    <span className="font-mono font-black text-xs dir-ltr select-all text-emerald-600 dark:text-emerald-400">
                      {offlineMethods.find((m) => m.id === selectedMethodId)?.account_number}
                    </span>
                  </div>
                  {offlineMethods.find((m) => m.id === selectedMethodId)?.account_name && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{isAr ? 'اسم المستفيد:' : 'Holder Name:'}</span>
                      <span className="font-bold">{offlineMethods.find((m) => m.id === selectedMethodId)?.account_name}</span>
                    </div>
                  )}
                  {offlineMethods.find((m) => m.id === selectedMethodId)?.instructions && (
                    <p className="text-[11px] text-muted-foreground pt-1 border-t border-slate-200/60 dark:border-zinc-800 leading-relaxed">
                      {offlineMethods.find((m) => m.id === selectedMethodId)?.instructions}
                    </p>
                  )}
                </div>
              )}

              {/* Transaction Ref Input */}
              <div className="space-y-1">
                <Label className="text-xs font-bold">{isAr ? 'رقم الحوالة / المرجع / Transaction Code *' : 'Reference / Transaction Code *'}</Label>
                <Input
                  placeholder={isAr ? 'مثال: #REF-98765432' : 'e.g. #REF-98765432'}
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="h-10 text-xs rounded-xl font-mono dir-ltr"
                />
              </div>

              {/* Receipt Image Upload */}
              <div className="space-y-1">
                <Label className="text-xs font-bold">{isAr ? 'صورة وصل/إثبات الدفع (اختياري)' : 'Proof of Payment Receipt Screenshot'}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://... receipt.png"
                    value={proofImageUrl}
                    onChange={(e) => setProofImageUrl(e.target.value)}
                    className="h-10 text-xs rounded-xl flex-1 dir-ltr"
                  />
                  <label className="cursor-pointer">
                    <span className="h-10 px-3 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl flex items-center justify-center text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-200 transition-colors">
                      {uploadingReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </span>
                    <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* User Note */}
              <div className="space-y-1">
                <Label className="text-xs font-bold">{isAr ? 'ملاحظة إضافية للإدارة (اختياري)' : 'Additional Note (Optional)'}</Label>
                <Input
                  placeholder={isAr ? 'اكتب اسم الحساب المحول منه أو أي تفاصيل أخرى' : 'Enter sender name or notes'}
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              {/* Error banner inside dialog */}
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold">
                  ⚠️ {error}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedPlanForOffline(null)}
                className="rounded-2xl h-11 font-bold flex-1"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleSubmitOfflinePayment}
                disabled={submittingOffline}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl h-11 px-5 flex-1 shadow-lg shadow-emerald-600/20"
              >
                {submittingOffline ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  isAr ? 'إرسال إثبات الدفع للمراجعة 🚀' : 'Submit Receipt Proof'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
