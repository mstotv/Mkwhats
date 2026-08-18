'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface PlanRow {
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
    automations?: boolean;
    flows_builder?: boolean;
    excel_export?: boolean;
    telegram_bot?: boolean;
    custom_webhooks?: boolean;
  };
  is_active: boolean;
}

import { useLocale } from 'next-intl';

export default function AdminPlansPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PlanRow | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Plan Draft State
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
      automations: true,
      flows_builder: true,
      excel_export: true,
      telegram_bot: false,
      custom_webhooks: false,
    },
  });

  async function fetchPlans() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      setPlans((data as PlanRow[]) ?? []);
    } catch (err) {
      console.error('[AdminPlans] Error fetching plans:', err);
      toast.error('تعذر تحميل باقات النظام');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  async function handleTogglePopular(planId: string) {
    try {
      const res = await fetch('/api/admin/plans/popular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_plan_id: planId }),
      });

      if (!res.ok) throw new Error('فشل التعيين');

      toast.success('تم تعيين هذه الباقة كـ "الأكثر شيوعاً ومبيعاً" 🔥');
      setPlans((prev) => prev.map((p) => ({ ...p, is_popular: p.id === planId })));
    } catch (err) {
      console.error('[handleTogglePopular] Error:', err);
      toast.error('فشل تعيين الباقة كالأكثر رواجاً');
    }
  }

  async function handleSaveEditingPlan() {
    if (!editingPlan) return;
    try {
      setSaving(true);
      const supabase = createClient();

      const { error } = await supabase
        .from('plans')
        .update({
          name: editingPlan.name,
          price_monthly: editingPlan.price_monthly,
          price_monthly_discounted: editingPlan.price_monthly_discounted || 0,
          price_yearly: editingPlan.price_yearly,
          price_yearly_discounted: editingPlan.price_yearly_discounted || 0,
          max_users: editingPlan.max_users,
          max_contacts: editingPlan.max_contacts,
          max_whatsapp_instances: editingPlan.max_whatsapp_instances,
          max_messages_monthly: editingPlan.max_messages_monthly,
          max_broadcasts_monthly: editingPlan.max_broadcasts_monthly,
          max_orders_monthly: editingPlan.max_orders_monthly || 500,
          features: editingPlan.features,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPlan.id);

      if (error) throw error;

      toast.success('تم حفظ تعديلات الباقة بنجاح ✅');
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      console.error('[handleSaveEditingPlan] Error:', err);
      toast.error('فشل حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateNewPlan() {
    if (!newPlan.name || !newPlan.slug) {
      toast.error('يرجى تحديد اسم الباقة ومعرّف الـ slug');
      return;
    }

    try {
      setSaving(true);
      const supabase = createClient();

      const { error } = await supabase.from('plans').insert({
        name: newPlan.name,
        slug: newPlan.slug.toLowerCase().trim(),
        price_monthly: newPlan.price_monthly ?? 0,
        price_monthly_discounted: newPlan.price_monthly_discounted ?? 0,
        price_yearly: newPlan.price_yearly ?? 0,
        price_yearly_discounted: newPlan.price_yearly_discounted ?? 0,
        max_users: newPlan.max_users ?? 1,
        max_contacts: newPlan.max_contacts ?? 1000,
        max_whatsapp_instances: newPlan.max_whatsapp_instances ?? 1,
        max_messages_monthly: newPlan.max_messages_monthly ?? 1000,
        max_broadcasts_monthly: newPlan.max_broadcasts_monthly ?? 10,
        max_orders_monthly: newPlan.max_orders_monthly ?? 500,
        is_popular: newPlan.is_popular ?? false,
        is_active: true,
        features: newPlan.features ?? {},
      });

      if (error) throw error;

      toast.success('تمت إضافة الباقة الجديدة بنجاح 🎉');
      setIsCreatingNew(false);
      fetchPlans();
    } catch (err) {
      console.error('[handleCreateNewPlan] Error:', err);
      toast.error('فشل إضافة الباقة الجديدة');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {isAr ? 'إدارة باقات المنصة والاشتراكات (SaaS Pricing Manager)' : 'SaaS Pricing & Plans Manager'}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {isAr
              ? 'تحديد الأسعار والخصومات، سقف الرسائل وأعضاء الفريق (-1 لغير محدود)، وتفعيل مميزات الذكاء الاصطناعي والتليغرام والتصدير'
              : 'Set prices & discounts, member and message quotas (-1 for unlimited), and toggle AI, Telegram, and Excel features.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPlans}
            disabled={loading}
            className="border-border text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 me-1.5 ${loading ? 'animate-spin' : ''}`} />
            {isAr ? 'تحديث القائمة' : 'Refresh List'}
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreatingNew(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 text-xs"
          >
            <Plus className="h-4 w-4 me-1" />
            {isAr ? 'إضافة باقة جديدة ➕' : 'Add New Plan ➕'}
          </Button>
        </div>
      </div>

      {/* Modal / Drawer for Creating New Plan */}
      {isCreatingNew && (
        <Card className="border-2 border-amber-500/50 bg-card p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              {isAr ? 'إضافة باقة جديدة إلى المنصة' : 'Add New SaaS Subscription Plan'}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setIsCreatingNew(false)} className="text-xs">
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'اسم الباقة' : 'Plan Name'}</label>
              <Input
                type="text"
                placeholder={isAr ? 'مثلاً: المحترف Pro' : 'e.g. Pro Plan'}
                value={newPlan.name || ''}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'معرّف الباقة الإنجليزي (Slug)' : 'Plan Slug'}</label>
              <Input
                type="text"
                placeholder="e.g. pro"
                value={newPlan.slug || ''}
                onChange={(e) => setNewPlan({ ...newPlan, slug: e.target.value })}
                className="bg-background border-border font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'السعر الشهري الأصلي ($)' : 'Monthly Price ($)'}</label>
              <Input
                type="number"
                value={newPlan.price_monthly || 0}
                onChange={(e) => setNewPlan({ ...newPlan, price_monthly: parseFloat(e.target.value) || 0 })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground text-emerald-400">
                {isAr ? 'السعر الشهري مع الخصم ($)' : 'Discounted Monthly ($)'}
              </label>
              <Input
                type="number"
                value={newPlan.price_monthly_discounted || 0}
                onChange={(e) => setNewPlan({ ...newPlan, price_monthly_discounted: parseFloat(e.target.value) || 0 })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'السعر السنوي الأصلي ($)' : 'Yearly Price ($)'}</label>
              <Input
                type="number"
                value={newPlan.price_yearly || 0}
                onChange={(e) => setNewPlan({ ...newPlan, price_yearly: parseFloat(e.target.value) || 0 })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground text-emerald-400">
                {isAr ? 'السعر السنوي مع الخصم ($)' : 'Discounted Yearly ($)'}
              </label>
              <Input
                type="number"
                value={newPlan.price_yearly_discounted || 0}
                onChange={(e) => setNewPlan({ ...newPlan, price_yearly_discounted: parseFloat(e.target.value) || 0 })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'أعضاء الفريق (-1 = غير محدود)' : 'Team Members (-1 = unlim)'}</label>
              <Input
                type="number"
                placeholder="-1"
                value={newPlan.max_users || 0}
                onChange={(e) => setNewPlan({ ...newPlan, max_users: parseInt(e.target.value) || 0 })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'جهات الاتصال (-1 = غير محدود)' : 'Contacts Limit (-1 = unlim)'}</label>
              <Input
                type="number"
                placeholder="-1"
                value={newPlan.max_contacts || 0}
                onChange={(e) => setNewPlan({ ...newPlan, max_contacts: parseInt(e.target.value) || 0 })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'الرسائل الشهرية (-1 = غير محدود)' : 'Monthly Messages'}</label>
              <Input
                type="number"
                placeholder="-1"
                value={newPlan.max_messages_monthly || 0}
                onChange={(e) => setNewPlan({ ...newPlan, max_messages_monthly: parseInt(e.target.value) || 0 })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'الطلبات والمبيعات (-1 = غير محدود)' : 'Monthly Orders Limit'}</label>
              <Input
                type="number"
                placeholder="-1"
                value={newPlan.max_orders_monthly || 0}
                onChange={(e) => setNewPlan({ ...newPlan, max_orders_monthly: parseInt(e.target.value) || 0 })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'حملات البرودكاست (-1 = غير محدود)' : 'Broadcast Campaigns'}</label>
              <Input
                type="number"
                placeholder="-1"
                value={newPlan.max_broadcasts_monthly || 0}
                onChange={(e) => setNewPlan({ ...newPlan, max_broadcasts_monthly: parseInt(e.target.value) || 0 })}
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* Feature Checkboxes */}
          <div className="space-y-2 border-t border-border pt-4">
            <h4 className="text-xs font-bold text-foreground">{isAr ? 'تفعيل المميزات المتاحة بالباقة:' : 'Enabled Plan Features:'}</h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-border/60 hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={!!newPlan.features?.ai_assistant}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      features: { ...newPlan.features, ai_assistant: e.target.checked },
                    })
                  }
                  className="rounded border-border text-amber-500 focus:ring-amber-500"
                />
                <span className="font-semibold text-foreground">🤖 {isAr ? 'الذكاء الاصطناعي (AI)' : 'Gemini AI Assistant'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-border/60 hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={!!newPlan.features?.telegram_bot}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      features: { ...newPlan.features, telegram_bot: e.target.checked },
                    })
                  }
                  className="rounded border-border text-amber-500 focus:ring-amber-500"
                />
                <span className="font-semibold text-foreground">✈️ {isAr ? 'ربط بوت التلغرام' : 'Telegram Alerts Bot'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-border/60 hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={!!newPlan.features?.excel_export}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      features: { ...newPlan.features, excel_export: e.target.checked },
                    })
                  }
                  className="rounded border-border text-amber-500 focus:ring-amber-500"
                />
                <span className="font-semibold text-foreground">📊 {isAr ? 'تصدير الطلبات إلى Excel' : 'Excel & Sheets Export'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-border/60 hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={!!newPlan.features?.automations}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      features: { ...newPlan.features, automations: e.target.checked },
                    })
                  }
                  className="rounded border-border text-amber-500 focus:ring-amber-500"
                />
                <span className="font-semibold text-foreground">⚡ {isAr ? 'الأتمتة والردود الآلية' : 'Automations & Auto-Replies'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-border/60 hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={!!newPlan.features?.flows_builder}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      features: { ...newPlan.features, flows_builder: e.target.checked },
                    })
                  }
                  className="rounded border-border text-amber-500 focus:ring-amber-500"
                />
                <span className="font-semibold text-foreground">🔀 {isAr ? 'منشئ مسارات العمل (Flows)' : 'Visual Flow Builder'}</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsCreatingNew(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              onClick={handleCreateNewPlan}
              disabled={saving}
              className="bg-amber-500 font-bold text-slate-950 hover:bg-amber-400"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : null}
              {isAr ? 'إنشاء الباقة وتفعيلها' : 'Create & Activate Plan'}
            </Button>
          </div>
        </Card>
      )}

      {/* Plans Cards Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          <span className="text-xs font-medium">{isAr ? 'جاري تحميل الباقات...' : 'Loading plans...'}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between border bg-card p-6 shadow-md transition-all ${
                  plan.is_popular
                    ? 'border-2 border-amber-500 shadow-amber-500/10'
                    : 'border-border'
                }`}
              >
                {/* Popular Badge */}
                {plan.is_popular && (
                  <div className="mb-2 flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 px-3 py-1.5 text-xs font-black text-amber-400 shadow-sm">
                    <span>🔥</span>
                    <span>{isAr ? 'الأكثر رواجاً ومبيعاً (Most Popular)' : 'Most Popular Plan 🔥'}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-foreground">{plan.name}</h3>
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {plan.slug}
                    </span>
                  </div>

                  {/* Prices & Discounts Display */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      {plan.price_monthly_discounted && plan.price_monthly_discounted > 0 ? (
                        <>
                          <span className="text-3xl font-black text-emerald-400 dir-ltr">
                            ${plan.price_monthly_discounted}
                          </span>
                          <span className="text-sm font-semibold text-muted-foreground line-through dir-ltr">
                            ${plan.price_monthly}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-black text-foreground dir-ltr">
                          ${plan.price_monthly}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{isAr ? '/ شهر' : '/ month'}</span>
                    </div>

                    {plan.price_yearly > 0 && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <span>{isAr ? 'السنوي:' : 'Yearly:'}</span>
                        {plan.price_yearly_discounted && plan.price_yearly_discounted > 0 ? (
                          <>
                            <strong className="text-emerald-400">${plan.price_yearly_discounted}</strong>
                            <span className="line-through text-muted-foreground">${plan.price_yearly}</span>
                          </>
                        ) : (
                          <strong className="text-foreground">${plan.price_yearly}</strong>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quotas & Limits checklist */}
                  <div className="space-y-2 border-t border-border/60 pt-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{isAr ? 'أعضاء الفريق (MEMBER):' : 'Team Members:'}</span>
                      <span className="font-bold text-foreground">
                        {plan.max_users === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : plan.max_users}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{isAr ? 'سقف جهات الاتصال:' : 'Contacts Limit:'}</span>
                      <span className="font-bold text-foreground">
                        {plan.max_contacts === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : plan.max_contacts.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{isAr ? 'الرسائل الشهرية:' : 'Monthly Messages:'}</span>
                      <span className="font-bold text-foreground">
                        {plan.max_messages_monthly === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : (plan.max_messages_monthly ?? 1000).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{isAr ? 'الطلبات والمبيعات:' : 'Monthly Orders:'}</span>
                      <span className="font-bold text-foreground">
                        {plan.max_orders_monthly === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : (plan.max_orders_monthly ?? 500).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{isAr ? 'حملات البرودكاست:' : 'Broadcast Campaigns:'}</span>
                      <span className="font-bold text-foreground">
                        {plan.max_broadcasts_monthly === -1 ? (isAr ? 'غير محدود ♾️' : 'Unlimited ♾️') : plan.max_broadcasts_monthly}
                      </span>
                    </div>
                  </div>

                  {/* Features checklist */}
                  <div className="space-y-2 border-t border-border/60 pt-4 text-xs">
                    <div className="flex items-center gap-2">
                      {plan.features?.ai_assistant ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={plan.features?.ai_assistant ? 'font-medium text-foreground' : 'text-muted-foreground line-through'}>
                        {isAr ? 'مساعد الذكاء الاصطناعي (AI)' : 'Gemini AI Assistant'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {plan.features?.telegram_bot ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={plan.features?.telegram_bot ? 'font-medium text-foreground' : 'text-muted-foreground line-through'}>
                        {isAr ? 'ربط بوت التلغرام للإشعارات' : 'Telegram Alerts Bot'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {plan.features?.excel_export ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={plan.features?.excel_export ? 'font-medium text-foreground' : 'text-muted-foreground line-through'}>
                        {isAr ? 'تصدير الطلبات والمعلومات إلى Excel' : 'Export Orders to Excel & Sheets'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {plan.features?.automations ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={plan.features?.automations ? 'font-medium text-foreground' : 'text-muted-foreground line-through'}>
                        {isAr ? 'الأتمتة والردود الآلية' : 'Automations & Auto-Replies'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {plan.features?.flows_builder ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={plan.features?.flows_builder ? 'font-medium text-foreground' : 'text-muted-foreground line-through'}>
                        {isAr ? 'منشئ الأتمتة ومسارات العمل (Flows)' : 'Visual Workflow Builder'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 flex flex-col gap-2">
                  <Button
                    variant={plan.is_popular ? 'default' : 'outline'}
                    size="sm"
                    className={`text-xs font-bold ${plan.is_popular ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'border-border'}`}
                    onClick={() => handleTogglePopular(plan.id)}
                  >
                    <Flame className="h-3.5 w-3.5 me-1 text-orange-500" />
                    {plan.is_popular
                      ? isAr ? 'الباقة الأكثر رواجاً ومبيعاً ✓' : 'Most Popular Plan ✓'
                      : isAr ? 'تعيين كـ "الأكثر رواجاً" 🔥' : 'Set as Most Popular 🔥'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold border-border"
                    onClick={() => setEditingPlan(plan)}
                  >
                    <Edit className="h-3.5 w-3.5 me-1 text-amber-500" />
                    {isAr ? 'تعديل الأسعار والحدود والمميزات' : 'Edit Prices, Quotas & Features'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Feature Editor Drawer Modal */}
      {editingPlan && (
        <Card className="border-2 border-amber-500/50 bg-card p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground">
              {isAr ? 'تعديل الباقة:' : 'Edit Plan:'} <span className="text-amber-500">{editingPlan.name}</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setEditingPlan(null)} className="text-xs">
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'اسم الباقة' : 'Plan Name'}</label>
              <Input
                type="text"
                value={editingPlan.name}
                onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'السعر الشهري الأصلي ($)' : 'Monthly Price ($)'}</label>
              <Input
                type="number"
                value={editingPlan.price_monthly}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, price_monthly: parseFloat(e.target.value) || 0 })
                }
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground text-emerald-400">
                {isAr ? 'السعر الشهري بعد الخصم ($)' : 'Discounted Monthly ($)'}
              </label>
              <Input
                type="number"
                value={editingPlan.price_monthly_discounted || 0}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, price_monthly_discounted: parseFloat(e.target.value) || 0 })
                }
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'السعر السنوي الأصلي ($)' : 'Yearly Price ($)'}</label>
              <Input
                type="number"
                value={editingPlan.price_yearly}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, price_yearly: parseFloat(e.target.value) || 0 })
                }
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground text-emerald-400">
                {isAr ? 'السعر السنوي بعد الخصم ($)' : 'Discounted Yearly ($)'}
              </label>
              <Input
                type="number"
                value={editingPlan.price_yearly_discounted || 0}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, price_yearly_discounted: parseFloat(e.target.value) || 0 })
                }
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'أعضاء الفريق (-1 = غير محدود)' : 'Team Members (-1 = unlim)'}</label>
              <Input
                type="number"
                value={editingPlan.max_users}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, max_users: parseInt(e.target.value) || 0 })
                }
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'سقف جهات الاتصال (-1 = غير محدود)' : 'Contacts Limit (-1 = unlim)'}</label>
              <Input
                type="number"
                value={editingPlan.max_contacts}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, max_contacts: parseInt(e.target.value) || 0 })
                }
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'الرسائل الشهرية (-1 = غير محدود)' : 'Monthly Messages'}</label>
              <Input
                type="number"
                value={editingPlan.max_messages_monthly}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, max_messages_monthly: parseInt(e.target.value) || 0 })
                }
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'الطلبات والمبيعات (-1 = غير محدود)' : 'Monthly Orders Limit'}</label>
              <Input
                type="number"
                value={editingPlan.max_orders_monthly || 500}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, max_orders_monthly: parseInt(e.target.value) || 0 })
                }
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{isAr ? 'حملات البرودكاست (-1 = غير محدود)' : 'Broadcast Campaigns'}</label>
              <Input
                type="number"
                value={editingPlan.max_broadcasts_monthly}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, max_broadcasts_monthly: parseInt(e.target.value) || 0 })
                }
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <h4 className="text-xs font-bold text-foreground">{isAr ? 'تعديل مميزات الباقة المفعلة:' : 'Modify Enabled Features:'}</h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-border/60 hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={!!editingPlan.features?.ai_assistant}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features: { ...editingPlan.features, ai_assistant: e.target.checked },
                    })
                  }
                  className="rounded border-border text-amber-500"
                />
                <span className="font-semibold text-foreground">🤖 {isAr ? 'الذكاء الاصطناعي (AI)' : 'Gemini AI Assistant'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-border/60 hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={!!editingPlan.features?.telegram_bot}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features: { ...editingPlan.features, telegram_bot: e.target.checked },
                    })
                  }
                  className="rounded border-border text-amber-500"
                />
                <span className="font-semibold text-foreground">✈️ {isAr ? 'ربط بوت التلغرام' : 'Telegram Alerts Bot'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-border/60 hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={!!editingPlan.features?.excel_export}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features: { ...editingPlan.features, excel_export: e.target.checked },
                    })
                  }
                  className="rounded border-border text-amber-500"
                />
                <span className="font-semibold text-foreground">📊 {isAr ? 'تصدير الطلبات إلى Excel' : 'Excel & Sheets Export'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-border/60 hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={!!editingPlan.features?.automations}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features: { ...editingPlan.features, automations: e.target.checked },
                    })
                  }
                  className="rounded border-border text-amber-500"
                />
                <span className="font-semibold text-foreground">⚡ {isAr ? 'الأتمتة والردود الآلية' : 'Automations & Auto-Replies'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-border/60 hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={!!editingPlan.features?.flows_builder}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features: { ...editingPlan.features, flows_builder: e.target.checked },
                    })
                  }
                  className="rounded border-border text-amber-500"
                />
                <span className="font-semibold text-foreground">🔀 {isAr ? 'منشئ مسارات العمل (Flows)' : 'Visual Flow Builder'}</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" size="sm" onClick={() => setEditingPlan(null)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEditingPlan}
              disabled={saving}
              className="bg-amber-500 font-bold text-slate-950 hover:bg-amber-400"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : null}
              {isAr ? 'حفظ التعديلات' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
