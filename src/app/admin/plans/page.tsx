'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Users,
  CheckCircle2,
  XCircle,
  Edit,
  Loader2,
  RefreshCw,
  Sparkles,
  Plus,
  Flame,
  Bot,
  Send,
  FileSpreadsheet,
  Zap,
  Check,
  X,
  Layers,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

export interface PlanRow {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_monthly_discounted?: number;
  price_yearly: number;
  price_yearly_discounted?: number;
  max_users: number;
  max_whatsapp_instances: number;
  max_contacts: number;
  max_messages_monthly: number;
  max_broadcasts_monthly: number;
  max_orders_monthly: number;
  is_popular: boolean;
  features: {
    ai_assistant?: boolean;
    voice_transcription?: boolean;
    automations?: boolean;
    flows_builder?: boolean;
    excel_export?: boolean;
    telegram_bot?: boolean;
    custom_webhooks?: boolean;
    woocommerce_integration?: boolean;
    shopify_integration?: boolean;
  };
  is_active: boolean;
  subscriber_count?: number;
}

export interface PlansKpi {
  active_tiers_count: number;
  active_tiers_summary: string;
  paying_subscribers: number;
  total_registered: number;
  active_rate_pct: number;
  leading_plan_name: string;
  leading_plan_price: number;
  leading_plan_share_pct: number;
  monthly_run_rate: number;
  mrr_growth_pct: number;
}

function formatQuotaVal(val: number | undefined): string {
  if (val === undefined || val === null) return '0';
  if (val === -1) return 'Unlimited ~';
  return val.toLocaleString();
}

export default function AdminPlansPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [kpi, setKpi] = useState<PlansKpi>({
    active_tiers_count: 3,
    active_tiers_summary: 'Free, Pro, Enterprise',
    paying_subscribers: 0,
    total_registered: 0,
    active_rate_pct: 0,
    leading_plan_name: 'Pro',
    leading_plan_price: 9.99,
    leading_plan_share_pct: 52,
    monthly_run_rate: 0,
    mrr_growth_pct: 12,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanRow | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingPopularId, setSettingPopularId] = useState<string | null>(null);

  // New Plan Draft
  const [newPlan, setNewPlan] = useState<Partial<PlanRow>>({
    name: '',
    slug: '',
    price_monthly: 29,
    price_monthly_discounted: 19,
    price_yearly: 290,
    price_yearly_discounted: 190,
    max_users: 3,
    max_whatsapp_instances: 1,
    max_contacts: 5000,
    max_messages_monthly: 5000,
    max_broadcasts_monthly: 50,
    max_orders_monthly: 1000,
    is_popular: false,
    is_active: true,
    features: {
      ai_assistant: true,
      voice_transcription: false,
      automations: true,
      flows_builder: true,
      excel_export: true,
      telegram_bot: true,
      woocommerce_integration: false,
      shopify_integration: false,
    },
  });

  async function fetchPlans() {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/plans');
      if (!res.ok) throw new Error('Failed to fetch plans');
      const data = await res.json();
      setPlans(data.plans || []);
      if (data.kpi) setKpi(data.kpi);
    } catch (err) {
      console.error('[AdminPlans] Error fetching data:', err);
      toast.error(isAr ? 'تعذر تحميل بيانات الباقات' : 'Failed to load plans data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  // Set Most Popular Plan
  const handleSetMostPopular = async (plan: PlanRow) => {
    setSettingPopularId(plan.id);
    try {
      const res = await fetch('/api/admin/plans/popular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_plan_id: plan.id }),
      });
      if (!res.ok) throw new Error('Failed to update popular plan');

      toast.success(
        isAr
          ? `تم تعيين ${plan.name} كباقة أكثر شهرة وطلباً`
          : `${plan.name} is now set as the most popular plan`
      );
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update popular flag');
    } finally {
      setSettingPopularId(null);
    }
  };

  // Save Edited Plan
  const handleSaveEdit = async () => {
    if (!editingPlan) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingPlan.name,
          price_monthly: editingPlan.price_monthly,
          price_monthly_discounted: editingPlan.price_monthly_discounted,
          price_yearly: editingPlan.price_yearly,
          price_yearly_discounted: editingPlan.price_yearly_discounted,
          max_users: editingPlan.max_users,
          max_contacts: editingPlan.max_contacts,
          max_messages_monthly: editingPlan.max_messages_monthly,
          max_orders_monthly: editingPlan.max_orders_monthly,
          max_broadcasts_monthly: editingPlan.max_broadcasts_monthly,
          is_popular: editingPlan.is_popular,
          features: editingPlan.features,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save changes');

      toast.success(isAr ? 'تم حفظ تعديلات الباقة بنجاح' : 'Plan settings updated successfully');
      setEditingPlan(null);
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  // Create New Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.name?.trim() || !newPlan.slug?.trim()) {
      toast.error(isAr ? 'يرجى إدخال اسم ومعرف الباقة' : 'Plan name and slug are required');
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('plans').insert([
        {
          name: newPlan.name.trim(),
          slug: newPlan.slug.toLowerCase().trim(),
          price_monthly: Number(newPlan.price_monthly || 0),
          price_monthly_discounted: Number(newPlan.price_monthly_discounted || 0),
          price_yearly: Number(newPlan.price_yearly || 0),
          price_yearly_discounted: Number(newPlan.price_yearly_discounted || 0),
          max_users: Number(newPlan.max_users ?? 1),
          max_whatsapp_instances: Number(newPlan.max_whatsapp_instances ?? 1),
          max_contacts: Number(newPlan.max_contacts ?? 100),
          max_messages_monthly: Number(newPlan.max_messages_monthly ?? 500),
          max_orders_monthly: Number(newPlan.max_orders_monthly ?? 50),
          max_broadcasts_monthly: Number(newPlan.max_broadcasts_monthly ?? 5),
          is_popular: Boolean(newPlan.is_popular),
          is_active: true,
          features: newPlan.features,
        },
      ]);
      if (error) throw error;

      toast.success(isAr ? 'تم إنشاء الباقة الجديدة بنجاح' : 'New plan created successfully');
      setIsCreatingNew(false);
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading && plans.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm font-semibold tracking-wide text-foreground">
          {isAr ? 'جاري تحميل خطط وأسعار المنصة...' : 'Loading SaaS Pricing & Plans Manager...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* ============================================================ */}
      {/* 1. Header Section (Matching Image) */}
      {/* ============================================================ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {isAr ? 'إدارة أسعار وباقات المنصة' : 'SaaS Pricing & Plans Manager'}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm font-medium max-w-3xl">
            {isAr
              ? 'تحديد الأسعار والخصومات، حصص الأعضاء والرسائل (-1 لغير محدود)، والتحكم في ميزات الذكاء الاصطناعي والتيليجرام والإكسل.'
              : 'Set prices & discounts, member and message quotas (-1 for unlimited), and toggle AI, Telegram, and Excel features.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh List */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPlans}
            disabled={refreshing}
            className="h-10 border-border bg-card px-3.5 text-xs font-semibold hover:bg-muted/80 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 me-2 ${refreshing ? 'animate-spin text-amber-500' : 'text-muted-foreground'}`} />
            <span>{isAr ? 'تحديث القائمة' : 'Refresh List'}</span>
          </Button>

          {/* + Add New Plan (Amber Button in Image) */}
          <Button
            size="sm"
            onClick={() => setIsCreatingNew(true)}
            className="h-10 bg-[#f59e0b] hover:bg-[#d97706] font-bold text-slate-950 px-5 text-xs shadow-md shadow-amber-500/20 gap-1.5 transition-all"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span>{isAr ? 'إضافة باقة جديدة' : 'Add New Plan'}</span>
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. Top 4 KPI Cards (Matching Image) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: CONFIGURED PLANS */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-amber-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {isAr ? 'الباقات المفعلة' : 'CONFIGURED PLANS'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Layers className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              {kpi.active_tiers_count} {isAr ? 'باقات نشطة' : 'Active Tiers'}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium truncate">
            {kpi.active_tiers_summary}
          </p>
        </div>

        {/* Card 2: PAYING SUBSCRIBERS */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {isAr ? 'المشتركون بالدفع' : 'PAYING SUBSCRIBERS'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              {kpi.paying_subscribers}
            </span>
            <span className="text-xs font-semibold text-emerald-500 font-mono">
              {kpi.active_rate_pct}% {isAr ? 'نسبة' : 'rate'}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            {isAr ? `من أصل ${kpi.total_registered} شركة مسجلة` : `Of ${kpi.total_registered} total registered`}
          </p>
        </div>

        {/* Card 3: LEADING PLAN */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-card p-5 shadow-xs transition-all hover:border-amber-500 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {isAr ? 'الباقة الرائدة' : 'LEADING PLAN'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Flame className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-amber-500 font-mono">
              {kpi.leading_plan_name} (${kpi.leading_plan_price}/mo)
            </span>
            <Flame className="h-5 w-5 text-amber-500 animate-pulse inline" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            {isAr ? `${kpi.leading_plan_share_pct}% حصة المشتركين في السوق` : `${kpi.leading_plan_share_pct}% subscriber market share`}
          </p>
        </div>

        {/* Card 4: PLAN MONTHLY RUN-RATE */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {isAr ? 'معدل الدخل الشهري MRR' : 'PLAN MONTHLY RUN-RATE'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <DollarSign className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              ${kpi.monthly_run_rate.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-bold text-emerald-500 border border-emerald-500/20">
              <span>↑ +{kpi.mrr_growth_pct}%</span>
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            {isAr ? 'يتم التحديث تلقائياً' : 'Updated automatically'}
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. Pricing & Plan Tiers Grid (Matching Image 100%) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          const isPopular = Boolean(plan.is_popular);
          const isFree = plan.slug === 'free' || plan.price_monthly === 0;
          const isEnterprise = plan.slug === 'enterprise';

          // Price calculations
          const hasMonthlyDiscount =
            plan.price_monthly_discounted !== undefined &&
            plan.price_monthly_discounted > 0 &&
            plan.price_monthly_discounted < plan.price_monthly;

          const displayMonthlyPrice = hasMonthlyDiscount
            ? plan.price_monthly_discounted
            : plan.price_monthly;

          const hasYearlyDiscount =
            plan.price_yearly_discounted !== undefined &&
            plan.price_yearly_discounted > 0 &&
            plan.price_yearly_discounted < plan.price_yearly;

          const displayYearlyPrice = hasYearlyDiscount
            ? plan.price_yearly_discounted
            : plan.price_yearly;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl p-7 transition-all duration-300 ${
                isPopular
                  ? 'border-2 border-amber-500 bg-card shadow-xl shadow-amber-500/10 -translate-y-1'
                  : 'border border-border/80 bg-card shadow-xs hover:border-border hover:shadow-md'
              }`}
            >
              {/* Most Popular Top Pill (Matching Image) */}
              {isPopular && (
                <div className="mb-4 -mt-2 flex justify-center">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-4 py-1 text-xs font-black text-amber-500">
                    <Flame className="h-3.5 w-3.5 fill-amber-500" />
                    <span>{isAr ? 'الباقة الأكثر شهرة وطلباً' : 'Most Popular Plan'}</span>
                    <Flame className="h-3.5 w-3.5 fill-amber-500" />
                  </div>
                </div>
              )}

              <div>
                {/* Header: Name + Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-foreground">{plan.name}</h3>
                    {isPopular && <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />}
                  </div>
                  <span
                    className={`rounded-lg px-2.5 py-0.5 text-xs font-mono font-bold border ${
                      isPopular
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                        : isEnterprise
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                        : 'border-border bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    {plan.slug}
                  </span>
                </div>

                {/* Price Display (Matching Image) */}
                <div className="mt-5">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-4xl font-black font-mono tracking-tight ${
                        isEnterprise
                          ? 'text-emerald-500'
                          : isPopular
                          ? 'text-[#0d9488] dark:text-emerald-400'
                          : 'text-foreground'
                      }`}
                    >
                      ${displayMonthlyPrice}
                    </span>
                    {hasMonthlyDiscount && (
                      <span className="text-base font-bold text-muted-foreground line-through font-mono">
                        ${plan.price_monthly}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-muted-foreground">/ month</span>
                  </div>

                  {/* Yearly Subtitle */}
                  <p className="mt-1.5 text-xs text-muted-foreground font-medium">
                    {isFree ? (
                      'Yearly: $0 (Forever Free Sandbox)'
                    ) : (
                      <>
                        Yearly: <span className="font-mono font-bold text-foreground">${displayYearlyPrice}</span>{' '}
                        {hasYearlyDiscount && (
                          <span className="line-through font-mono text-muted-foreground">
                            ${plan.price_yearly}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>

                {/* Quotas List (Matching Image) */}
                <div className="mt-7 space-y-2.5 border-t border-border/50 pt-5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">{isAr ? 'أعضاء الفريق:' : 'Team Members:'}</span>
                    <span className="font-mono font-bold text-foreground">{formatQuotaVal(plan.max_users)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">{isAr ? 'حد جهات الاتصال:' : 'Contacts Limit:'}</span>
                    <span className="font-mono font-bold text-foreground">{formatQuotaVal(plan.max_contacts)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">{isAr ? 'الرسائل الشهرية:' : 'Monthly Messages:'}</span>
                    <span className="font-mono font-bold text-foreground">{formatQuotaVal(plan.max_messages_monthly)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">{isAr ? 'الطلبات الشهرية:' : 'Monthly Orders:'}</span>
                    <span className="font-mono font-bold text-foreground">{formatQuotaVal(plan.max_orders_monthly)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">{isAr ? 'حملات البرودكاست:' : 'Broadcast Campaigns:'}</span>
                    <span className="font-mono font-bold text-foreground">{formatQuotaVal(plan.max_broadcasts_monthly)}</span>
                  </div>
                </div>

                {/* Feature Toggles List (8 Features with Check / Cross) */}
                <div className="mt-6 space-y-2.5 border-t border-border/50 pt-5 text-xs font-semibold">
                  {/* 1. AI Assistant */}
                  <div className="flex items-center gap-2">
                    {plan.features?.ai_assistant ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={3} />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 shrink-0" strokeWidth={2.5} />
                    )}
                    <span className={plan.features?.ai_assistant ? 'text-foreground' : 'text-muted-foreground/60'}>
                      AI Assistant
                    </span>
                  </div>

                  {/* 2. Voice STT */}
                  <div className="flex items-center gap-2">
                    {plan.features?.voice_transcription ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={3} />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 shrink-0" strokeWidth={2.5} />
                    )}
                    <span className={plan.features?.voice_transcription ? 'text-foreground' : 'text-muted-foreground/60'}>
                      Voice STT
                    </span>
                  </div>

                  {/* 3. Telegram Alerts Bot */}
                  <div className="flex items-center gap-2">
                    {plan.features?.telegram_bot ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={3} />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 shrink-0" strokeWidth={2.5} />
                    )}
                    <span className={plan.features?.telegram_bot ? 'text-foreground' : 'text-muted-foreground/60'}>
                      Telegram Alerts Bot
                    </span>
                  </div>

                  {/* 4. Export Orders to Excel & Sheets */}
                  <div className="flex items-center gap-2">
                    {plan.features?.excel_export ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={3} />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 shrink-0" strokeWidth={2.5} />
                    )}
                    <span className={plan.features?.excel_export ? 'text-foreground' : 'text-muted-foreground/60'}>
                      Export Orders to Excel & Sheets
                    </span>
                  </div>

                  {/* 5. Automations & Auto-Replies */}
                  <div className="flex items-center gap-2">
                    {plan.features?.automations ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={3} />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 shrink-0" strokeWidth={2.5} />
                    )}
                    <span className={plan.features?.automations ? 'text-foreground' : 'text-muted-foreground/60'}>
                      Automations & Auto-Replies
                    </span>
                  </div>

                  {/* 6. Visual Workflow Builder */}
                  <div className="flex items-center gap-2">
                    {plan.features?.flows_builder ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={3} />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 shrink-0" strokeWidth={2.5} />
                    )}
                    <span className={plan.features?.flows_builder ? 'text-foreground' : 'text-muted-foreground/60'}>
                      Visual Workflow Builder
                    </span>
                  </div>

                  {/* 7. WooCommerce Integration */}
                  <div className="flex items-center gap-2">
                    {plan.features?.woocommerce_integration ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={3} />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 shrink-0" strokeWidth={2.5} />
                    )}
                    <span className={plan.features?.woocommerce_integration ? 'text-foreground' : 'text-muted-foreground/60'}>
                      WooCommerce Integration
                    </span>
                  </div>

                  {/* 8. Shopify Integration */}
                  <div className="flex items-center gap-2">
                    {plan.features?.shopify_integration ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={3} />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 shrink-0" strokeWidth={2.5} />
                    )}
                    <span className={plan.features?.shopify_integration ? 'text-foreground' : 'text-muted-foreground/60'}>
                      Shopify Integration
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions (Matching Image) */}
              <div className="mt-8 space-y-2.5">
                {/* Popular Toggle Button */}
                {isPopular ? (
                  <Button
                    disabled
                    className="w-full h-11 bg-[#f59e0b] text-slate-950 font-bold hover:bg-[#d97706] shadow-md shadow-amber-500/20 text-xs gap-1.5 cursor-default opacity-100"
                  >
                    <span>{isAr ? 'الباقة الأكثر طلباً' : 'Most Popular Plan'}</span>
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleSetMostPopular(plan)}
                    disabled={settingPopularId === plan.id}
                    className="w-full h-11 border-border/80 hover:border-amber-500/50 hover:bg-amber-500/5 text-xs font-bold text-foreground gap-1.5 shadow-xs"
                  >
                    {settingPopularId === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                    ) : (
                      <Flame className="h-4 w-4 text-amber-500" />
                    )}
                    <span>{isAr ? 'تعيين كأكثر شهرة' : 'Set as Most Popular'}</span>
                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                  </Button>
                )}

                {/* Edit Prices, Quotas & Features Button */}
                <Button
                  variant="outline"
                  onClick={() => setEditingPlan(JSON.parse(JSON.stringify(plan)))}
                  className={`w-full h-11 text-xs font-bold gap-1.5 shadow-xs ${
                    isPopular
                      ? 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                      : 'border-border/80 hover:bg-muted/80'
                  }`}
                >
                  <Edit className="h-3.5 w-3.5 text-amber-500" />
                  <span>{isAr ? 'تعديل الأسعار والحصص والميزات' : 'Edit Prices, Quotas & Features'}</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* 4. Edit Plan Modal (Comprehensive Dialog) */}
      {/* ============================================================ */}
      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-500" />
              {isAr ? `تعديل باقة: ${editingPlan?.name}` : `Edit Plan: ${editingPlan?.name}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isAr
                ? 'تعديل الأسعار، نسب الخصم، الحصص التشغيلية (-1 لغير محدود)، وتفعيل الميزات.'
                : 'Modify pricing, discounts, quotas (-1 for unlimited), and feature switches.'}
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-6 py-3">
              {/* Section 1: Basic Info & Prices */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider">
                  {isAr ? 'الأسعار والخصومات' : 'Pricing & Discounts'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">{isAr ? 'السعر الشهري الأساسي ($)' : 'Monthly Price ($)'}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingPlan.price_monthly}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, price_monthly: parseFloat(e.target.value) || 0 })
                      }
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">{isAr ? 'السعر الشهري بعد الخصم ($)' : 'Discounted Monthly Price ($)'}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 9.99"
                      value={editingPlan.price_monthly_discounted ?? ''}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          price_monthly_discounted: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">{isAr ? 'السعر السنوي الأساسي ($)' : 'Yearly Price ($)'}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingPlan.price_yearly}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, price_yearly: parseFloat(e.target.value) || 0 })
                      }
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">{isAr ? 'السعر السنوي بعد الخصم ($)' : 'Discounted Yearly Price ($)'}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 99.99"
                      value={editingPlan.price_yearly_discounted ?? ''}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          price_yearly_discounted: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      className="h-10 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Quotas (-1 for Unlimited) */}
              <div className="space-y-3 border-t border-border/60 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider">
                    {isAr ? 'الحصص والقيود التشغيلية' : 'Quotas & Limits'}
                  </h4>
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                    -1 = Unlimited ~
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">{isAr ? 'أعضاء الفريق' : 'Team Members'}</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_users}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, max_users: parseInt(e.target.value) || 0 })
                      }
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">{isAr ? 'حد جهات الاتصال' : 'Contacts Limit'}</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_contacts}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, max_contacts: parseInt(e.target.value) || 0 })
                      }
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">{isAr ? 'الرسائل الشهرية' : 'Monthly Messages'}</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_messages_monthly}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, max_messages_monthly: parseInt(e.target.value) || 0 })
                      }
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">{isAr ? 'الطلبات الشهرية' : 'Monthly Orders'}</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_orders_monthly}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, max_orders_monthly: parseInt(e.target.value) || 0 })
                      }
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">{isAr ? 'حملات البرودكاست' : 'Broadcast Campaigns'}</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_broadcasts_monthly}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, max_broadcasts_monthly: parseInt(e.target.value) || 0 })
                      }
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">{isAr ? 'أجهزة الواتساب' : 'WhatsApp Instances'}</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_whatsapp_instances}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, max_whatsapp_instances: parseInt(e.target.value) || 1 })
                      }
                      className="h-10 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Feature Toggles */}
              <div className="space-y-3 border-t border-border/60 pt-4">
                <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider">
                  {isAr ? 'ميزات النظام (Features)' : 'Feature Toggles'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'ai_assistant', label: 'AI Assistant (مساعد الذكاء الاصطناعي)' },
                    { key: 'voice_transcription', label: 'Voice STT (تفريغ الرسائل الصوتية)' },
                    { key: 'telegram_bot', label: 'Telegram Alerts Bot (بوت تنبيهات تيليجرام)' },
                    { key: 'excel_export', label: 'Export Orders to Excel & Sheets (تصدير إكسل)' },
                    { key: 'automations', label: 'Automations & Auto-Replies (الأتمتة والردود)' },
                    { key: 'flows_builder', label: 'Visual Workflow Builder (باني التدفقات المرئي)' },
                    { key: 'woocommerce_integration', label: 'WooCommerce Integration (ربط ووكومرس)' },
                    { key: 'shopify_integration', label: 'Shopify Integration (ربط شوبيفاي)' },
                  ].map((feat) => {
                    const isChecked = Boolean(editingPlan.features?.[feat.key as keyof typeof editingPlan.features]);
                    return (
                      <label
                        key={feat.key}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                          isChecked
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : 'border-border/60 hover:border-border'
                        }`}
                      >
                        <span className="text-xs font-semibold text-foreground">{feat.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              features: {
                                ...editingPlan.features,
                                [feat.key]: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500/20"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border/60 pt-4">
            <Button variant="outline" onClick={() => setEditingPlan(null)} disabled={saving}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Check className="h-4 w-4 me-1.5" />}
              {isAr ? 'حفظ التعديلات' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 5. Create Plan Modal */}
      {/* ============================================================ */}
      <Dialog open={isCreatingNew} onOpenChange={setIsCreatingNew}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-500" />
              {isAr ? 'إضافة باقة جديدة' : 'Add New Plan Tier'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isAr
                ? 'إنشاء باقة اشتراك جديدة وتحديد حصصها وأسعارها.'
                : 'Create a new subscription plan tier with custom quotas and features.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePlan} className="space-y-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">{isAr ? 'اسم الباقة' : 'Plan Name'} *</Label>
                <Input
                  required
                  placeholder="e.g. Starter"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">{isAr ? 'المعرف البرمجي (Slug)' : 'Slug'} *</Label>
                <Input
                  required
                  placeholder="e.g. starter"
                  value={newPlan.slug}
                  onChange={(e) => setNewPlan({ ...newPlan, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="h-10 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">{isAr ? 'السعر الشهري ($)' : 'Monthly Price ($)'} *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={newPlan.price_monthly}
                  onChange={(e) => setNewPlan({ ...newPlan, price_monthly: parseFloat(e.target.value) || 0 })}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">{isAr ? 'السعر السنوي ($)' : 'Yearly Price ($)'} *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={newPlan.price_yearly}
                  onChange={(e) => setNewPlan({ ...newPlan, price_yearly: parseFloat(e.target.value) || 0 })}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsCreatingNew(false)} disabled={saving}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                {saving ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Plus className="h-4 w-4 me-1.5" />}
                {isAr ? 'إنشاء الباقة' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
