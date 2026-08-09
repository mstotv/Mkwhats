'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EditPlanModal, type Plan } from '../_components/edit-plan-modal'
import {
  CreditCard,
  Edit2,
  Users,
  Smartphone,
  Contact,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react'

interface PlansClientProps {
  initialPlans: Plan[]
}

export function PlansClient({ initialPlans }: PlansClientProps) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshPlans = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/plans')
      const data = await res.json()
      if (data.plans) {
        setPlans(data.plans)
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <CreditCard className="h-4 w-4" />
            </div>
            إدارة الخطط والاشتراكات
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            التحكم في أسعار الخطط والحدود المتاحة وتفعيل أو تعطيل الخطط
          </p>
        </div>

        <Button
          onClick={refreshPlans}
          disabled={loading}
          variant="outline"
          size="sm"
          className="border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 text-xs gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-xl border p-5 transition-all flex flex-col justify-between ${
              plan.is_active
                ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
                : 'bg-slate-950/40 border-slate-900 opacity-70'
            }`}
          >
            <div>
              {/* Badge & Name */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-100 text-base">{plan.name}</h3>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                    {plan.slug}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-normal px-2 py-0.5 gap-1 ${
                    plan.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {plan.is_active ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> مفعّلة
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" /> معطّلة
                    </>
                  )}
                </Badge>
              </div>

              {/* Pricing */}
              <div className="my-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 flex justify-between items-baseline">
                <div>
                  <span className="text-2xl font-extrabold text-slate-100">${plan.price_monthly}</span>
                  <span className="text-xs text-slate-400 mr-1">/ شهرياً</span>
                </div>
                <div className="text-left dir-ltr">
                  <span className="text-sm font-semibold text-slate-300">${plan.price_yearly}</span>
                  <span className="text-[10px] text-slate-400">/ سنوي</span>
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/60 pt-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Users className="h-3.5 w-3.5 text-slate-500" /> أعضاء الحساب
                  </span>
                  <span className="font-medium">
                    {plan.max_users === -1 ? 'غير محدود' : `${plan.max_users} مستخدم`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Smartphone className="h-3.5 w-3.5 text-slate-500" /> أجهزة الواتساب
                  </span>
                  <span className="font-medium">{plan.max_whatsapp_instances} جهاز</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Contact className="h-3.5 w-3.5 text-slate-500" /> جهات الاتصال
                  </span>
                  <span className="font-medium">{plan.max_contacts.toLocaleString()} جهة</span>
                </div>
              </div>
            </div>

            {/* Footer / Subscriber count & edit button */}
            <div className="mt-5 border-t border-slate-800/60 pt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                المشتركون: <strong className="text-indigo-400">{plan.subscriber_count ?? 0}</strong>
              </span>

              <Button
                onClick={() => setEditingPlan(plan)}
                size="sm"
                variant="ghost"
                className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20 gap-1.5 h-7 px-3"
              >
                <Edit2 className="h-3 w-3" />
                تعديل الخطة
              </Button>
            </div>
          </div>
        ))}
      </div>

      <EditPlanModal
        plan={editingPlan}
        open={Boolean(editingPlan)}
        onOpenChange={(open) => !open && setEditingPlan(null)}
        onSuccess={refreshPlans}
      />
    </div>
  )
}
