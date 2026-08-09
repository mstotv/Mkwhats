'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  CreditCard,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Users,
  Smartphone,
  Contact,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export interface AccountSubscriptionItem {
  id: string
  account_id: string
  plan_id: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired'
  billing_cycle: 'monthly' | 'yearly'
  current_period_start: string
  current_period_end: string
  trial_ends_at?: string | null
  plans?: {
    id: string
    name: string
    slug: string
    price_monthly: number
    price_yearly: number
    max_users: number
    max_whatsapp_instances: number
    max_contacts: number
  } | null
}

export interface AvailablePlan {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
  max_users: number
  max_whatsapp_instances: number
  max_contacts: number
  is_active: boolean
}

interface AccountSubscriptionCardProps {
  accountId: string
  subscription: AccountSubscriptionItem | null
  availablePlans: AvailablePlan[]
}

export function AccountSubscriptionCard({
  accountId,
  subscription,
  availablePlans,
}: AccountSubscriptionCardProps) {
  const router = useRouter()
  const [openModal, setOpenModal] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    subscription?.plan_id || availablePlans[0]?.id || ''
  )
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentPlan = subscription?.plans

  const handlePlanChange = async () => {
    if (!selectedPlanId) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/subscriptions/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: accountId,
          plan_id: selectedPlanId,
          billing_cycle: billingCycle,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'فشل تغيير الخطة')
        return
      }

      setOpenModal(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'trialing':
        return (
          <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-xs">
            فترة تجريبية (Trialing)
          </Badge>
        )
      case 'active':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
            نشط (Active)
          </Badge>
        )
      case 'canceled':
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-xs">
            ملغى (Canceled)
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/20 text-xs">
            منتهي (Expired)
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
            معلق
          </Badge>
        )
    }
  }

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 tracking-tight">
              تفاصيل الاشتراك والخطة
            </h2>
            <p className="text-xs text-slate-400">
              الخطة الحالية المربوطة بهذا الحساب وحدود استخدام الخدمات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(subscription?.status)}

          <Button
            onClick={() => {
              setSelectedPlanId(subscription?.plan_id || availablePlans[0]?.id || '')
              setOpenModal(true)
            }}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs gap-1.5 h-8 px-3"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            تغيير الخطة
          </Button>
        </div>
      </div>

      {subscription && currentPlan ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg bg-slate-950/60 border border-slate-800/60 p-4 space-y-1">
            <span className="text-xs text-slate-400">الخطة الحالية</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-100">{currentPlan.name}</span>
              <span className="text-[11px] font-mono text-slate-500">({currentPlan.slug})</span>
            </div>
            <p className="text-xs text-indigo-400 font-medium">
              ${subscription.billing_cycle === 'yearly' ? currentPlan.price_yearly : currentPlan.price_monthly} /{' '}
              {subscription.billing_cycle === 'yearly' ? 'سنة' : 'شهر'}
            </p>
          </div>

          <div className="rounded-lg bg-slate-950/60 border border-slate-800/60 p-4 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-500" /> تاريخ التجديد / الانتهاء
            </span>
            <p className="text-sm font-semibold text-slate-200">
              {new Date(subscription.current_period_end).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            {subscription.trial_ends_at && subscription.status === 'trialing' && (
              <p className="text-[11px] text-sky-400">
                تنتهي التجربة:{' '}
                {new Date(subscription.trial_ends_at).toLocaleDateString('ar-SA')}
              </p>
            )}
          </div>

          <div className="rounded-lg bg-slate-950/60 border border-slate-800/60 p-4 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-slate-500" /> حد الأعضاء
            </span>
            <p className="text-sm font-semibold text-slate-200">
              {currentPlan.max_users === -1 ? 'غير محدود' : `${currentPlan.max_users} مستخدم`}
            </p>
          </div>

          <div className="rounded-lg bg-slate-950/60 border border-slate-800/60 p-4 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Smartphone className="h-3.5 w-3.5 text-slate-500" /> أجهزة الواتساب
            </span>
            <p className="text-sm font-semibold text-slate-200">
              {currentPlan.max_whatsapp_instances} جهاز متصل
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-amber-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>لا يوجد اشتراك نشط حالياً لهذا الحساب. اضغط "تغيير الخطة" لتعيين خطة جديدة.</span>
        </div>
      )}

      {/* Change Plan Dialog Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-slate-100 dir-rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              تغيير خطة الحساب
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                {error}
              </div>
            )}

            {/* Cycle Selector */}
            <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 p-1.5 rounded-lg text-xs">
              <span className="text-slate-300 px-2 font-medium">دورة الفوترة:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1 rounded-md transition-all text-xs font-medium ${
                    billingCycle === 'monthly'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  شهرياً
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-3 py-1 rounded-md transition-all text-xs font-medium ${
                    billingCycle === 'yearly'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  سنوياً
                </button>
              </div>
            </div>

            {/* Plans List Options */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {availablePlans
                .filter((p) => p.is_active)
                .map((plan) => {
                  const isSelected = selectedPlanId === plan.id
                  const price =
                    billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`cursor-pointer rounded-lg border p-3.5 transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-600/10 border-indigo-500 text-slate-100 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700/80'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">{plan.name}</span>
                          {plan.id === subscription?.plan_id && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                            >
                              الخطة الحالية
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>
                            {plan.max_users === -1 ? 'أعضاء غير محدود' : `${plan.max_users} مستخدم`}
                          </span>
                          <span>•</span>
                          <span>{plan.max_whatsapp_instances} جهاز واتساب</span>
                          <span>•</span>
                          <span>{plan.max_contacts.toLocaleString()} جهة اتصال</span>
                        </div>
                      </div>

                      <div className="text-left font-bold text-slate-100 text-sm">
                        ${price}
                        <span className="text-[10px] font-normal text-slate-400 block">
                          /{billingCycle === 'yearly' ? 'سنة' : 'شهر'}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-800 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpenModal(false)}
              className="border border-slate-800 text-slate-400 hover:bg-slate-800 text-xs"
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handlePlanChange}
              disabled={loading || !selectedPlanId}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              تأكيد وتطبيق الخطة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
