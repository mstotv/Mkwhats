'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
} from 'lucide-react'

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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<{
    planName: string
    paymentMethod: 'plisio' | 'whatsapp'
    checkoutUrl?: string
    whatsappUrl?: string
  } | null>(null)

  const handleRequestUpgrade = async (plan: PlanItem) => {
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
        setError(data.error || 'حدث خطأ أثناء إرسال طلب الترقية')
        return
      }

      setSuccessInfo({
        planName: plan.name,
        paymentMethod: data.payment_method || 'whatsapp',
        checkoutUrl: data.checkout_url,
        whatsappUrl: data.whatsapp_url,
      })

      // Try opening Plisio checkout or WhatsApp link in a new tab
      const targetUrl = data.checkout_url || data.whatsapp_url
      if (targetUrl) {
        window.open(targetUrl, '_blank')
      }

      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message || 'فشل الاتصال بالخادم')
    } finally {
      setSubmittingPlanId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl w-full max-w-[95vw] p-6 sm:p-8 dir-rtl max-h-[90vh] overflow-y-auto font-sans shadow-2xl border-border bg-card">
        <DialogHeader className="text-right space-y-2 pb-4 border-b">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <DialogTitle className="text-2xl sm:text-3xl font-black flex items-center gap-2 text-foreground">
              <Sparkles className="h-6 w-6 text-indigo-500 shrink-0" />
              اختر الخطة المناسبة لنشاطك التجاري
            </DialogTitle>
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 text-xs px-3 py-1 font-semibold">
              ترقية مباشرة ومضمونة ⚡
            </Badge>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            ترقية خطتك تمنحك حدوداً تشغيلية أعلى، ورصيداً شهرياً مضاعفاً، وتفعيلاً فورياً لكافة ميزات المنصة.
          </DialogDescription>
        </DialogHeader>

        {/* Success Alert Banner */}
        {successInfo && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-600 dark:text-emerald-400 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm">تم تسجيل طلب الترقية إلى خطة {successInfo.planName} بنجاح!</h4>
                <p className="text-xs opacity-90 leading-relaxed">
                  {successInfo.paymentMethod === 'plisio'
                    ? 'تم إنشاء فاتورة الدفع الرقمي بالكريبتو عبر Plisio. ينبغي أن تفتح صفحة الدفع تلقائياً، أو اضغط الزر أدناه لإكمال العملية.'
                    : 'تم حفظ طلبك بالنظام كطلب معلق (Pending). يرجى فتح محادثة الواتساب المباشرة لتأكيد التفعيل مع إدارة المنصة.'}
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
                  الانتقال لصفحة الدفع بالكريبتو (Plisio Checkout) 🪙
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-bold"
                  onClick={() => window.open(successInfo.whatsappUrl || '#', '_blank')}
                >
                  <Send className="h-3.5 w-3.5" />
                  فتح محادثة الواتساب للتأكيد
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
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
              إغلاق
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
              دفع شهري
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
              <span>دفع سنوي</span>
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 border-0 font-extrabold">
                توفير 20% 🎉
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
                      <span>خطتك الحالية المفعّلة</span>
                    </div>
                  )}

                  {!isCurrent && isPopular && (
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs px-3 py-1.5 text-center flex items-center justify-center gap-1.5 shadow-xs">
                      <Zap className="h-3.5 w-3.5 fill-amber-500" />
                      <span>الخطة الأكثر طلباً ⭐</span>
                    </div>
                  )}

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-black text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                      {plan.slug === 'enterprise'
                        ? 'للشركات الكبيرة والمؤسسات التي تتطلب حلولاً وحجم رسائل مفتوح'
                        : plan.slug === 'pro'
                        ? 'للأعمال المتنامية والفرق التي تحتاج أتمتة وذكاء اصطناعي'
                        : 'مناسبة للفرق الصغيرة والإنطلاقة الأولى'}
                    </p>
                  </div>

                  {/* Pricing Box */}
                  <div className="py-3 border-y border-border/80">
                    <div className="flex items-baseline gap-1.5 dir-ltr">
                      <span className="text-3xl sm:text-4xl font-black text-foreground">${price}</span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        /{billingCycle === 'yearly' ? 'سنة' : 'شهر'}
                      </span>
                    </div>
                  </div>

                  {/* Operational Limits */}
                  <div className="space-y-2.5 text-xs">
                    <span className="font-bold text-muted-foreground block text-[11px] uppercase tracking-wider">الحدود التشغيلية:</span>
                    <div className="space-y-2 bg-accent/40 rounded-xl p-3 border">
                      <div className="flex items-center justify-between text-foreground">
                        <span className="flex items-center gap-2 font-medium">
                          <MessageSquare className="h-4 w-4 text-indigo-500 shrink-0" />
                          الرسائل الشهرية:
                        </span>
                        <span className="font-mono font-bold">
                          {plan.max_messages_monthly === -1 ? 'غير محدودة' : plan.max_messages_monthly.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-foreground">
                        <span className="flex items-center gap-2 font-medium">
                          <Radio className="h-4 w-4 text-indigo-500 shrink-0" />
                          حملات البرودكاست:
                        </span>
                        <span className="font-mono font-bold">
                          {plan.max_broadcasts_monthly === -1 ? 'غير محدودة' : plan.max_broadcasts_monthly.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-foreground">
                        <span className="flex items-center gap-2 font-medium">
                          <Users className="h-4 w-4 text-indigo-500 shrink-0" />
                          أعضاء الفريق:
                        </span>
                        <span className="font-mono font-bold">
                          {plan.max_users === -1 ? 'غير محدود' : `${plan.max_users} أعضاء`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Features Checklist */}
                  <div className="space-y-2.5 pt-1 text-xs">
                    <span className="font-bold text-muted-foreground block text-[11px] uppercase tracking-wider">الميزات المتاحة:</span>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        {plan.features?.ai_assistant ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground shrink-0 opacity-60" />
                        )}
                        <span className={plan.features?.ai_assistant ? 'text-foreground font-semibold' : 'text-muted-foreground line-through opacity-70'}>
                          مساعد الردود الذكي (AI Assistant)
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {plan.features?.excel_export ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground shrink-0 opacity-60" />
                        )}
                        <span className={plan.features?.excel_export ? 'text-foreground font-semibold' : 'text-muted-foreground line-through opacity-70'}>
                          تصدير تقارير الطلبات بـ Excel
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {plan.features?.telegram_bot ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground shrink-0 opacity-60" />
                        )}
                        <span className={plan.features?.telegram_bot ? 'text-foreground font-semibold' : 'text-muted-foreground line-through opacity-70'}>
                          إشعارات بوت Telegram الفورية
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-6 border-t border-border/80">
                  {isCurrent ? (
                    <Button variant="outline" disabled className="w-full text-xs font-bold border-border bg-muted/50 py-5">
                      <Check className="h-4 w-4 ml-1.5" />
                      خطتك المفعلة حالياً
                    </Button>
                  ) : (
                    <Button
                      className="w-full text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md py-5"
                      disabled={isSubmitting || Boolean(submittingPlanId)}
                      onClick={() => handleRequestUpgrade(plan)}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin ml-1.5" />
                          جاري تسجيل الطلب...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          طلب الترقية إلى خطة {plan.name}
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
    </Dialog>
  )
}
