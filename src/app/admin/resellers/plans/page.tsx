'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import {
  CreditCard,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Building2,
  Globe,
  Bot,
  QrCode,
  Store,
  Sparkles,
  Edit2,
  Trash2,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ResellerTabs } from '../_components/reseller-tabs';

interface ResellerPlan {
  id: string;
  name: string;
  name_ar?: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  max_accounts: number;
  max_custom_domains: number;
  features: Record<string, boolean | string>;
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
}

export default function ResellerPlansPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<ResellerPlan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ResellerPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    slug: '',
    price_monthly: 49,
    price_yearly: 490,
    max_accounts: 20,
    max_custom_domains: 1,
    is_popular: false,
    is_active: true,
    sort_order: 0,
    features: {
      custom_branding: true,
      subdomain: true,
      custom_domain: false,
      ai_bots: true,
      whatsapp_qr: true,
      biolink: true,
      storefronts: true,
      payment_gateways: false,
      custom_css: false,
    },
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resellers/plans');
      const data = await res.json();
      if (res.ok) {
        setPlans(data.plans || []);
      } else {
        toast.error(data.error || 'Failed to load plans');
      }
    } catch {
      toast.error('Network error loading plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      name_ar: '',
      slug: '',
      price_monthly: 49,
      price_yearly: 490,
      max_accounts: 20,
      max_custom_domains: 1,
      is_popular: false,
      is_active: true,
      sort_order: plans.length + 1,
      features: {
        custom_branding: true,
        subdomain: true,
        custom_domain: false,
        ai_bots: true,
        whatsapp_qr: true,
        biolink: true,
        storefronts: true,
        payment_gateways: false,
        custom_css: false,
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: ResellerPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      name_ar: plan.name_ar || '',
      slug: plan.slug,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_accounts: plan.max_accounts,
      max_custom_domains: plan.max_custom_domains,
      is_popular: plan.is_popular,
      is_active: plan.is_active,
      sort_order: plan.sort_order,
      features: {
        custom_branding: Boolean(plan.features?.custom_branding),
        subdomain: Boolean(plan.features?.subdomain),
        custom_domain: Boolean(plan.features?.custom_domain),
        ai_bots: Boolean(plan.features?.ai_bots),
        whatsapp_qr: Boolean(plan.features?.whatsapp_qr),
        biolink: Boolean(plan.features?.biolink),
        storefronts: Boolean(plan.features?.storefronts),
        payment_gateways: Boolean(plan.features?.payment_gateways),
        custom_css: Boolean(plan.features?.custom_css),
      },
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast.error(isAr ? 'يرجى إدخال اسم الخطة والرمز (Slug)' : 'Name and slug required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingPlan) {
        // Update
        const res = await fetch('/api/admin/resellers/plans', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPlan.id, ...formData }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(isAr ? 'تم تحديث خطة الريسيلر بنجاح' : 'Reseller plan updated');
          setIsModalOpen(false);
          fetchPlans();
        } else {
          toast.error(data.error || 'Failed to update plan');
        }
      } else {
        // Create
        const res = await fetch('/api/admin/resellers/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(isAr ? 'تم إنشاء باقة الريسيلر الجديدة بنجاح' : 'Reseller plan created');
          setIsModalOpen(false);
          fetchPlans();
        } else {
          toast.error(data.error || 'Failed to create plan');
        }
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (plan: ResellerPlan) => {
    if (!confirm(isAr ? `هل أنت متأكد من حذف الباقة "${plan.name}"؟` : `Delete plan "${plan.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/resellers/plans?id=${plan.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(isAr ? 'تم حذف الخطة بنجاح' : 'Plan deleted');
        fetchPlans();
      } else {
        toast.error(data.error || 'Failed to delete plan');
      }
    } catch {
      toast.error('Network error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-emerald-500" />
            <span>{isAr ? 'باقات واشتراكات الريسيلر' : 'Reseller SaaS Plans & Quotas'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isAr
              ? 'حدد الخطط والباقات التي تقدمها للموزعين، مع تحديد حصص الحسابات والمميزات المسموحة لكل فئة.'
              : 'Configure wholesale plans sold to white-label partners with account quotas and feature bundles.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={fetchPlans}
            variant="outline"
            size="sm"
            className="rounded-xl border-border h-9"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 shadow-sm"
          >
            <Plus className="h-4 w-4 ms-1.5" />
            {isAr ? 'إضافة باقة ريسيلر جديدة' : 'Add Reseller Plan'}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ResellerTabs />

      {/* 2. Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 h-48 flex items-center justify-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500 ms-2" />
            <span className="text-xs">{isAr ? 'جاري تحميل الباقات...' : 'Loading plans...'}</span>
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-3 text-center py-12 border border-dashed border-border rounded-2xl">
            <CreditCard className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold">{isAr ? 'لا توجد باقات ريسيلر حالياً' : 'No reseller plans found'}</p>
          </div>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between relative transition-all bg-card shadow-xs ${
                plan.is_popular
                  ? 'border-emerald-500/50 shadow-emerald-500/5'
                  : 'border-border'
              }`}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 start-6">
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 shadow-sm flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {isAr ? 'الأكثر طلباً' : 'Most Popular'}
                  </Badge>
                </div>
              )}

              <div className="space-y-4">
                {/* Plan Title & Price */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {isAr ? (plan.name_ar || plan.name) : plan.name}
                    </h2>
                    <span className="text-[11px] font-mono text-muted-foreground">{plan.slug}</span>
                  </div>

                  <div className="text-end">
                    <div className="text-2xl font-black text-foreground font-mono">
                      ${plan.price_monthly}
                      <span className="text-xs text-muted-foreground font-normal">/mo</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      ${plan.price_yearly}/yr
                    </div>
                  </div>
                </div>

                {/* Quotas */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-blue-500" />
                      {isAr ? 'الحد الأقصى للشركات:' : 'Max Accounts:'}
                    </span>
                    <span className="font-bold text-foreground font-mono">{plan.max_accounts}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-emerald-500" />
                      {isAr ? 'الدومينات المخصصة:' : 'Custom Domains:'}
                    </span>
                    <span className="font-bold text-foreground font-mono">{plan.max_custom_domains}</span>
                  </div>
                </div>

                {/* Features Checklist */}
                <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                  <div className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                    {isAr ? 'المميزات المتضمنة:' : 'Included Features:'}
                  </div>

                  <div className="space-y-1.5">
                    {plan.features?.custom_branding && (
                      <div className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{isAr ? 'علامة تجارية مستقلة وهوية خاصة' : 'Full White-Label Branding'}</span>
                      </div>
                    )}
                    {plan.features?.subdomain && (
                      <div className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{isAr ? 'ساب دومين خاص مجاني' : 'Free Subdomain Routing'}</span>
                      </div>
                    )}
                    {plan.features?.custom_domain && (
                      <div className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{isAr ? 'ربط دومين مخصص (CNAME)' : 'Custom CNAME Domain'}</span>
                      </div>
                    )}
                    {plan.features?.ai_bots && (
                      <div className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{isAr ? 'ردود وبوتات الذكاء الاصطناعي' : 'AI Automation Bots'}</span>
                      </div>
                    )}
                    {plan.features?.whatsapp_qr && (
                      <div className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{isAr ? 'ربط واتساب عبر Evolution QR' : 'WhatsApp QR Scanning'}</span>
                      </div>
                    )}
                    {plan.features?.biolink && (
                      <div className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{isAr ? 'صفحات البايولينك والمتاجر' : 'BioLink & Storefronts'}</span>
                      </div>
                    )}
                    {plan.features?.payment_gateways && (
                      <div className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{isAr ? 'بوابات دفع مستقلة للريسيلر' : 'Reseller Payment Gateways'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <Badge variant={plan.is_active ? 'default' : 'secondary'} className="text-[10px]">
                  {plan.is_active ? (isAr ? 'نشطة' : 'Active') : (isAr ? 'معطلة' : 'Disabled')}
                </Badge>

                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => handleOpenEdit(plan)}
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 rounded-lg text-xs"
                  >
                    <Edit2 className="h-3.5 w-3.5 ms-1" />
                    {isAr ? 'تعديل' : 'Edit'}
                  </Button>

                  <Button
                    onClick={() => handleDelete(plan)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Create / Edit Plan Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              <span>
                {editingPlan
                  ? (isAr ? 'تعديل باقة الريسيلر' : 'Edit Reseller Plan')
                  : (isAr ? 'إنشاء باقة ريسيلر جديدة' : 'Create New Reseller Plan')}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isAr ? 'حدد الأسعار، الحصص، والمميزات التابعة لهذه الباقة.' : 'Configure pricing, account quota, and feature permissions.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'اسم الباقة (English) *' : 'Plan Name (EN) *'}</Label>
                <Input
                  required
                  placeholder="Reseller Pro"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'اسم الباقة (العربية)' : 'Plan Name (AR)'}</Label>
                <Input
                  placeholder="ريسيلر المتقدم"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  className="rounded-xl h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isAr ? 'الرمز التعريفي (Slug) *' : 'Slug Identifier *'}</Label>
              <Input
                required
                placeholder="reseller-pro"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                className="rounded-xl h-9 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'السعر الشهري ($)' : 'Monthly Price ($)'}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: Number(e.target.value) })}
                  className="rounded-xl h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'السعر السنوي ($)' : 'Yearly Price ($)'}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({ ...formData, price_yearly: Number(e.target.value) })}
                  className="rounded-xl h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'أقصى عدد شركات (Accounts)' : 'Max Accounts'}</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.max_accounts}
                  onChange={(e) => setFormData({ ...formData, max_accounts: Number(e.target.value) })}
                  className="rounded-xl h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'أقصى عدد دومينات مخصصة' : 'Max Custom Domains'}</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.max_custom_domains}
                  onChange={(e) => setFormData({ ...formData, max_custom_domains: Number(e.target.value) })}
                  className="rounded-xl h-9 text-xs font-mono"
                />
              </div>
            </div>

            {/* Features Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs font-semibold">{isAr ? 'المميزات المفعلة في هذه الخطة:' : 'Feature Permissions:'}</Label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'custom_branding', label: isAr ? 'هوية ولوجو مستقل' : 'White-Label Branding' },
                  { key: 'subdomain', label: isAr ? 'ساب دومين مخصص' : 'Custom Subdomain' },
                  { key: 'custom_domain', label: isAr ? 'دومين خارجي كامل' : 'Full Custom Domain' },
                  { key: 'ai_bots', label: isAr ? 'ذكاء اصطناعي وبوتات' : 'AI Automation' },
                  { key: 'whatsapp_qr', label: isAr ? 'واتساب QR' : 'WhatsApp QR' },
                  { key: 'biolink', label: isAr ? 'بايولينك ومتاجر' : 'BioLink & Store' },
                  { key: 'payment_gateways', label: isAr ? 'بوابات دفع مستقلة' : 'Payment Gateways' },
                  { key: 'custom_css', label: isAr ? 'تخصيص CSS متقدم' : 'Custom CSS' },
                ].map((feat) => (
                  <label key={feat.key} className="flex items-center gap-2 p-2 rounded-lg border border-border/70 hover:bg-muted/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.features[feat.key as keyof typeof formData.features])}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          features: {
                            ...formData.features,
                            [feat.key]: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-border text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-[11px] font-medium">{feat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_popular}
                  onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                  className="rounded border-border text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs font-semibold">{isAr ? 'تمييز كخطة مفضلة (Popular)' : 'Mark as Popular'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-border text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs font-semibold">{isAr ? 'متاحة ونشطة' : 'Active'}</span>
              </label>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl text-xs h-9"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 shadow-sm"
              >
                {submitting ? <RefreshCw className="h-4 w-4 animate-spin ms-1" /> : null}
                {editingPlan ? (isAr ? 'حفظ التغييرات' : 'Save Changes') : (isAr ? 'إنشاء الخطة' : 'Create Plan')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
