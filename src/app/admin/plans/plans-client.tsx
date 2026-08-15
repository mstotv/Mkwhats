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
import { useTranslations, useLocale } from 'next-intl'

interface PlansClientProps {
  initialPlans: Plan[]
}

function getLocalizedPlanName(name: string, locale: string): string {
  if (!name.includes('/')) return name
  const parts = name.split('/').map((s) => s.trim())
  if (locale === 'ar') {
    return parts[1] || parts[0]
  }
  return parts[0]
}

export function PlansClient({ initialPlans }: PlansClientProps) {
  const t = useTranslations('Admin.plans')
  const locale = useLocale()
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
    <div className="space-y-6 font-sans">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <CreditCard className="h-4 w-4" />
            </div>
            {t('title')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('description')}
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
          {t('refreshData')}
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const localizedName = getLocalizedPlanName(plan.name, locale)
          return (
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
                    <h3 className="font-bold text-slate-100 text-base">{localizedName}</h3>
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
                        <CheckCircle2 className="h-3 w-3" /> {t('active')}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" /> {t('disabled')}
                      </>
                    )}
                  </Badge>
                </div>

                {/* Pricing */}
                <div className="my-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 flex justify-between items-baseline">
                  <div>
                    <span className="text-2xl font-extrabold text-slate-100">
                      ${plan.price_monthly.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </span>
                    <span className="text-xs text-slate-400 mx-1">/ {t('monthly')}</span>
                  </div>
                  <div className="text-left dir-ltr">
                    <span className="text-sm font-semibold text-slate-300">
                      ${plan.price_yearly.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </span>
                    <span className="text-[10px] text-slate-400">/ {t('yearly')}</span>
                  </div>
                </div>

                {/* Limits */}
                <div className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/60 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Users className="h-3.5 w-3.5 text-slate-500" /> {t('accountMembers')}
                    </span>
                    <span className="font-medium">
                      {plan.max_users === -1 ? t('unlimited') : `${plan.max_users}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Smartphone className="h-3.5 w-3.5 text-slate-500" /> {t('whatsappDevices')}
                    </span>
                    <span className="font-medium">
                      {t('devices', { count: plan.max_whatsapp_instances })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Contact className="h-3.5 w-3.5 text-slate-500" /> {t('contacts')}
                    </span>
                    <span className="font-medium">
                      {t('contactsCount', {
                        count: plan.max_contacts.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US'),
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer / Subscriber count & edit button */}
              <div className="mt-5 border-t border-slate-800/60 pt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  {t('subscribers', { count: plan.subscriber_count ?? 0 })}
                </span>

                <Button
                  onClick={() => setEditingPlan(plan)}
                  size="sm"
                  variant="ghost"
                  className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20 gap-1.5 h-7 px-3"
                >
                  <Edit2 className="h-3 w-3" />
                  {t('editPlan')}
                </Button>
              </div>
            </div>
          )
        })}
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
