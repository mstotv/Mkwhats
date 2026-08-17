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
  Star,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface PlanRow {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_whatsapp_instances: number;
  max_contacts: number;
  max_messages_monthly: number;
  max_broadcasts_monthly: number;
  is_popular: boolean;
  features: {
    ai_assistant?: boolean;
    automations?: boolean;
    excel_export?: boolean;
    telegram_bot?: boolean;
    custom_webhooks?: boolean;
  };
  is_active: boolean;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PlanRow | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Plan Draft State
  const [newPlan, setNewPlan] = useState<Partial<PlanRow>>({
    name: '',
    slug: '',
    price_monthly: 19,
    price_yearly: 190,
    max_users: 3,
    max_whatsapp_instances: 1,
    max_contacts: 5000,
    max_messages_monthly: 5000,
    max_broadcasts_monthly: 50,
    is_popular: false,
    is_active: true,
    features: {
      ai_assistant: true,
      automations: true,
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
      const supabase = createClient();
      const { error } = await supabase.rpc('set_popular_plan', { target_plan_id: planId });
      if (error) throw error;

      toast.success('تم تعيين هذه الباقة كـ "الأكثر شيوعاً" 🔥');
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
          price_yearly: editingPlan.price_yearly,
          max_users: editingPlan.max_users,
          max_contacts: editingPlan.max_contacts,
          max_whatsapp_instances: editingPlan.max_whatsapp_instances,
          max_messages_monthly: editingPlan.max_messages_monthly,
          max_broadcasts_monthly: editingPlan.max_broadcasts_monthly,
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
        price_yearly: newPlan.price_yearly ?? 0,
        max_users: newPlan.max_users ?? 1,
        max_contacts: newPlan.max_contacts ?? 1000,
        max_whatsapp_instances: newPlan.max_whatsapp_instances ?? 1,
        max_messages_monthly: newPlan.max_messages_monthly ?? 1000,
        max_broadcasts_monthly: newPlan.max_broadcasts_monthly ?? 10,
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
            إدارة باقات المنصة والاشتراكات (SaaS Pricing Manager)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            إضافة خطط جديدة، تحديد الباقة الأكثر رواجاً، وتعديل حدود استخدام الرسائل والمستشارين
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
            <RefreshCw className={`h-3.5 w-3.5 ms-1.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث القائمة
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreatingNew(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 text-xs"
          >
            <Plus className="h-4 w-4 ms-1" />
            إضافة باقة جديدة ➕
          </Button>
        </div>
      </div>

      {/* Modal / Drawer for Creating New Plan */}
      {isCreatingNew && (
        <Card className="border-2 border-amber-500/50 bg-card p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              إضافة باقة جديدة إلى المنصة
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setIsCreatingNew(false)} className="text-xs">
              إلغاء
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">اسم الباقة (مثلاً: باقة الشركات)</label>
              <Input
                type="text"
                placeholder="مثلاً: المحترف Pro"
                value={newPlan.name || ''}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">معرّف الباقة الإنجليزي (Slug)</label>
              <Input
                type="text"
                placeholder="مثلاً: agency"
                value={newPlan.slug || ''}
                onChange={(e) => setNewPlan({ ...newPlan, slug: e.target.value })}
                className="bg-background border-border font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">السعر الشهري ($)</label>
              <Input
                type="number"
                value={newPlan.price_monthly || 0}
                onChange={(e) => setNewPlan({ ...newPlan, price_monthly: parseFloat(e.target.value) || 0 })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">السعر السنوي ($)</label>
              <Input
                type="number"
                value={newPlan.price_yearly || 0}
                onChange={(e) => setNewPlan({ ...newPlan, price_yearly: parseFloat(e.target.value) || 0 })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">سقف المستشارين (Agents)</label>
              <Input
                type="number"
                placeholder="-1 لغير محدود"
                value={newPlan.max_users || 0}
                onChange={(e) => setNewPlan({ ...newPlan, max_users: parseInt(e.target.value) || 0 })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">سقف جهات الاتصال</label>
              <Input
                type="number"
                value={newPlan.max_contacts || 0}
                onChange={(e) => setNewPlan({ ...newPlan, max_contacts: parseInt(e.target.value) || 0 })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">الرسائل الشهرية</label>
              <Input
                type="number"
                placeholder="-1 لغير محدود"
                value={newPlan.max_messages_monthly || 0}
                onChange={(e) => setNewPlan({ ...newPlan, max_messages_monthly: parseInt(e.target.value) || 0 })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">أرقام واتساب (Instances)</label>
              <Input
                type="number"
                value={newPlan.max_whatsapp_instances || 1}
                onChange={(e) => setNewPlan({ ...newPlan, max_whatsapp_instances: parseInt(e.target.value) || 1 })}
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* Feature Checkboxes */}
          <div className="space-y-2 border-t border-border pt-4">
            <h4 className="text-xs font-bold text-foreground">تفعيل المميزات المتاحة بالباقة:</h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
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
                <span>مساعد الذكاء الاصطناعي (AI)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
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
                <span>منشئ الأتمتة الشجرية</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
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
                <span>تصدير Excel/CSV</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!newPlan.features?.custom_webhooks}
                  onChange={(e) =>
                    setNewPlan({
                      ...newPlan,
                      features: { ...newPlan.features, custom_webhooks: e.target.checked },
                    })
                  }
                  className="rounded border-border text-amber-500 focus:ring-amber-500"
                />
                <span>ربط Webhooks الخارجية</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsCreatingNew(false)}>
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleCreateNewPlan}
              disabled={saving}
              className="bg-amber-500 font-bold text-slate-950 hover:bg-amber-400"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : null}
              إنشاء الباقة وتفعيلها
            </Button>
          </div>
        </Card>
      )}

      {/* Plans Cards Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          <span className="text-xs font-medium">جاري تحميل الباقات...</span>
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
                  <div className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full border border-amber-500/50 bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-0.5 text-[10px] font-black text-slate-950 shadow-md">
                    🔥 الأكثر رواجا ومبيعا (Most Popular)
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-foreground">{plan.name}</h3>
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {plan.slug}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-foreground dir-ltr">
                      ${plan.price_monthly}
                    </span>
                    <span className="text-xs text-muted-foreground">/ شهر</span>
                    <span className="ms-auto text-xs text-muted-foreground dir-ltr font-mono">
                      (${plan.price_yearly}/سنة)
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-border/60 pt-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">سقف المستشارين:</span>
                      <span className="font-bold text-foreground">
                        {plan.max_users === -1 ? 'غير محدود' : plan.max_users}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">سقف جهات الاتصال:</span>
                      <span className="font-bold text-foreground">
                        {plan.max_contacts === -1 ? 'غير محدود' : plan.max_contacts.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">الرسائل الشهرية:</span>
                      <span className="font-bold text-foreground">
                        {plan.max_messages_monthly === -1 ? 'غير محدود' : (plan.max_messages_monthly ?? 1000).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">أرقام واتساب:</span>
                      <span className="font-bold text-foreground">
                        {plan.max_whatsapp_instances}
                      </span>
                    </div>
                  </div>

                  {/* Features checklist */}
                  <div className="space-y-2 border-t border-border/60 pt-4 text-xs">
                    <div className="flex items-center gap-2">
                      {plan.features?.ai_assistant ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40" />
                      )}
                      <span className={plan.features?.ai_assistant ? 'font-medium text-foreground' : 'text-muted-foreground line-through'}>
                        مساعد الذكاء الاصطناعي (AI)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {plan.features?.automations ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40" />
                      )}
                      <span className={plan.features?.automations ? 'font-medium text-foreground' : 'text-muted-foreground line-through'}>
                        منشئ الأتمتة الشجرية
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {plan.features?.excel_export ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40" />
                      )}
                      <span className={plan.features?.excel_export ? 'font-medium text-foreground' : 'text-muted-foreground line-through'}>
                        تصدير Excel/CSV
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {plan.features?.custom_webhooks ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40" />
                      )}
                      <span className={plan.features?.custom_webhooks ? 'font-medium text-foreground' : 'text-muted-foreground line-through'}>
                        ربط الـ Webhooks الخارجية
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
                    <Flame className="h-3.5 w-3.5 ms-1 text-orange-500" />
                    {plan.is_popular ? 'الباقة الأكثر رواجاً ومبيعاً ✓' : 'تعيين كـ "الأكثر رواجاً" 🔥'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold border-border"
                    onClick={() => setEditingPlan(plan)}
                  >
                    <Edit className="h-3.5 w-3.5 ms-1 text-amber-500" />
                    تعديل خصائص الباقة بالكامل
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
              تعديل الباقة: <span className="text-amber-500">{editingPlan.name}</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setEditingPlan(null)} className="text-xs">
              إلغاء
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">اسم الباقة</label>
              <Input
                type="text"
                value={editingPlan.name}
                onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">السعر الشهري ($)</label>
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
              <label className="font-semibold text-foreground">السعر السنوي ($)</label>
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
              <label className="font-semibold text-foreground">سقف المستشارين (-1 لغير محدود)</label>
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
              <label className="font-semibold text-foreground">سقف جهات الاتصال (-1 لغير محدود)</label>
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
              <label className="font-semibold text-foreground">الرسائل الشهرية (-1 لغير محدود)</label>
              <Input
                type="number"
                value={editingPlan.max_messages_monthly}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, max_messages_monthly: parseInt(e.target.value) || 0 })
                }
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <h4 className="text-xs font-bold text-foreground">تعديل مميزات الباقة المفعلة:</h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
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
                <span>مساعد الذكاء الاصطناعي (AI)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
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
                <span>منشئ الأتمتة الشجرية</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
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
                <span>تصدير Excel/CSV</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!editingPlan.features?.custom_webhooks}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features: { ...editingPlan.features, custom_webhooks: e.target.checked },
                    })
                  }
                  className="rounded border-border text-amber-500"
                />
                <span>ربط Webhooks الخارجية</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" size="sm" onClick={() => setEditingPlan(null)}>
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEditingPlan}
              disabled={saving}
              className="bg-amber-500 font-bold text-slate-950 hover:bg-amber-400"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : null}
              حفظ التعديلات
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
