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
  Zap,
  Bot,
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
  features: {
    ai_assistant?: boolean;
    automations?: boolean;
    custom_webhooks?: boolean;
  };
  is_active: boolean;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PlanRow | null>(null);
  const [saving, setSaving] = useState(false);

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

  async function handleSavePlan() {
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
          features: editingPlan.features,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPlan.id);

      if (error) throw error;

      toast.success('تم تحديث الباقة بنجاح ✅');
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      console.error('[handleSavePlan] Error:', err);
      toast.error('فشل حفظ التعديلات على الباقة');
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
            إدارة باقات المنصة والاشتراكات (SaaS Pricing)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            تعديل خطط الاشتراكات، أسعار الباقات، حدود الرسائل والمستخدمين، ومميزات الباقة
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchPlans}
          disabled={loading}
          className="border-border text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ms-1.5 ${loading ? 'animate-spin' : ''}`} />
          تحديث الباقات
        </Button>
      </div>

      {/* Plans Cards Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          <span className="text-xs font-medium">جاري تحميل الباقات...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isPro = plan.slug === 'pro';
            const isEnterprise = plan.slug === 'enterprise';

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between border bg-card p-6 shadow-md transition-all ${
                  isPro
                    ? 'border-amber-500/50 shadow-amber-500/5'
                    : isEnterprise
                      ? 'border-violet-500/50 shadow-violet-500/5'
                      : 'border-border'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-0.5 text-[10px] font-black text-amber-500">
                    🔥 الأكثر شعبية
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
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
                      <span className="text-muted-foreground">سقف المستخدمين (Agents):</span>
                      <span className="font-bold text-foreground">
                        {plan.max_users === -1 ? 'غير محدود' : plan.max_users}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">سقف جهات الاتصال:</span>
                      <span className="font-bold text-foreground">
                        {plan.max_contacts.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">أرقام واتساب (Instances):</span>
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

                <div className="mt-6 pt-4 border-t border-border/60">
                  <Button
                    variant="outline"
                    className="w-full text-xs font-bold border-border"
                    onClick={() => setEditingPlan(plan)}
                  >
                    <Edit className="h-3.5 w-3.5 ms-1.5 text-amber-500" />
                    تعديل أسعار وحدود الباقة
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Modal Drawer inline */}
      {editingPlan && (
        <div className="rounded-2xl border border-amber-500/40 bg-card p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground">
              تعديل خصائص الباقة: <span className="text-amber-500">{editingPlan.name}</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setEditingPlan(null)} className="text-xs">
              إلغاء
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
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
              <label className="font-semibold text-foreground">سقف جهات الاتصال</label>
              <Input
                type="number"
                value={editingPlan.max_contacts}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, max_contacts: parseInt(e.target.value) || 0 })
                }
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" size="sm" onClick={() => setEditingPlan(null)}>
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleSavePlan}
              disabled={saving}
              className="bg-amber-500 font-bold text-slate-950 hover:bg-amber-400"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : null}
              حفظ التعديلات
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
