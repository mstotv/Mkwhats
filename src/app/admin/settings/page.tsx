'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Globe,
  Mail,
  DollarSign,
  AlertTriangle,
  Save,
  Loader2,
  RefreshCw,
  CreditCard,
  Building2,
  Plus,
  Trash2,
  MessageSquare,
  Send,
  Palette,
  ShieldCheck,
  Coins,
  Pencil,
  Check,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface Partner {
  id: string;
  name: string;
  logo_url: string;
}

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState('wacrm');
  const [supportEmail, setSupportEmail] = useState('support@wacrm.com');
  const [supportWhatsapp, setSupportWhatsapp] = useState('+966500000000');
  const [supportTelegram, setSupportTelegram] = useState('@wacrm_support');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Plisio Gateway State
  const [plisioEnabled, setPlisioEnabled] = useState(false);
  const [plisioSecretKey, setPlisioSecretKey] = useState('');
  const [plisioMerchantId, setPlisioMerchantId] = useState('');

  // Stripe Gateway State
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');
  const [showStripeSecret, setShowStripeSecret] = useState(false);

  // Partners State
  const [partners, setPartners] = useState<Partner[]>([]);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerLogo, setNewPartnerLogo] = useState('');
  const [addingPartner, setAddingPartner] = useState(false);

  // Edit Partner State
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [updatingPartner, setUpdatingPartner] = useState(false);

  function startEditingPartner(partner: Partner) {
    setEditingPartnerId(partner.id);
    setEditName(partner.name);
    setEditLogoUrl(partner.logo_url || '');
  }

  async function handleUpdatePartner(partnerId: string) {
    if (!editName.trim()) {
      toast.error('اسم الشريك لا يمكن أن يكون فارغاً');
      return;
    }

    try {
      setUpdatingPartner(true);
      const res = await fetch('/api/admin/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: partnerId,
          name: editName,
          logo_url: editLogoUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تعديل بيانات الشريك');

      toast.success('تم تعديل بيانات الشريك ورابط الصورة بنجاح ✏️');
      setPartners((prev) =>
        prev.map((p) => (p.id === partnerId ? { ...p, name: editName, logo_url: editLogoUrl } : p))
      );
      setEditingPartnerId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل تعديل بيانات الشريك';
      toast.error(msg);
    } finally {
      setUpdatingPartner(false);
    }
  }


  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchSettingsAndPartners() {
    try {
      setLoading(true);
      const [settingsRes, partnersRes] = await Promise.all([
        fetch('/api/admin/site-settings')
          .then((r) => (r.ok ? r.json() : { settings: {} }))
          .catch(() => ({ settings: {} })),
        fetch('/api/admin/partners')
          .then((r) => (r.ok ? r.json() : { partners: [] }))
          .catch(() => ({ partners: [] })),
      ]);

      const s = settingsRes.settings || {};
      setPlatformName(s.platform_name || 'wacrm');
      setSupportEmail(s.support_email || 'support@wacrm.com');
      setSupportWhatsapp(s.support_whatsapp || '+966500000000');
      setSupportTelegram(s.support_telegram || '@wacrm_support');
      setCurrencySymbol(s.currency_symbol || '$');
      setPrimaryColor(s.primary_color || '#10b981');
      setMaintenanceMode(Boolean(s.maintenance_mode));

      setPlisioEnabled(Boolean(s.plisio_enabled));
      setPlisioSecretKey(s.plisio_secret_key || '');
      setPlisioMerchantId(s.plisio_merchant_id || '');

      setStripeEnabled(Boolean(s.stripe_enabled));
      setStripePublishableKey(s.stripe_publishable_key || '');
      setStripeSecretKey(s.stripe_secret_key || '');
      setStripeWebhookSecret(s.stripe_webhook_secret || '');

      setPartners((partnersRes.partners as Partner[]) ?? []);
    } catch (err) {
      console.error('[AdminSettings] Error fetching settings:', err);
      toast.error('تعذر تحميل إعدادات النظام');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettingsAndPartners();
  }, []);

  async function handleSaveSettings() {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform_name: platformName,
          support_email: supportEmail,
          support_whatsapp: supportWhatsapp,
          support_telegram: supportTelegram,
          currency_symbol: currencySymbol,
          primary_color: primaryColor,
          maintenance_mode: maintenanceMode,
          plisio_enabled: plisioEnabled,
          plisio_secret_key: plisioSecretKey,
          plisio_merchant_id: plisioMerchantId,
          stripe_enabled: stripeEnabled,
          stripe_publishable_key: stripePublishableKey,
          stripe_secret_key: stripeSecretKey,
          stripe_webhook_secret: stripeWebhookSecret,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ الإعدادات');

      toast.success(data.message || 'تم حفظ إعدادات النظام العامة وبوابات الدفع (Stripe & Plisio) بنجاح ✅');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل حفظ الإعدادات العامة';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPartner() {
    if (!newPartnerName) {
      toast.error('يرجى كتابة اسم الشريك أو الشركة');
      return;
    }

    try {
      setAddingPartner(true);
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPartnerName,
          logo_url: newPartnerLogo,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إضافة الشريك');

      toast.success('تمت إضافة الشريك إلى الشريط المتحرك في الـ Landing Page 🎉');
      setPartners((prev) => [...prev, data.partner]);
      setNewPartnerName('');
      setNewPartnerLogo('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل إضافة الشريك';
      toast.error(msg);
    } finally {
      setAddingPartner(false);
    }
  }

  async function handleDeletePartner(partnerId: string) {
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_id: partnerId }),
      });

      if (!res.ok) throw new Error('فشل حذف الشريك');

      toast.success('تم حذف الشريك بنجاح 🗑️');
      setPartners((prev) => prev.filter((p) => p.id !== partnerId));
    } catch (err) {
      toast.error('فشل حذف الشريك');
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            إعدادات النظام العامة وبوابات الدفع (System Configuration)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            التحكم بهوية اسم المنصة، بوابة دفع Plisio للكريبتو، معلومات التواصل، وإدارة شريط الشركاء المتحرك
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettingsAndPartners}
            disabled={loading}
            className="border-border text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ms-1.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>

          <Button
            size="sm"
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 text-xs"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Save className="h-4 w-4 ms-1.5" />}
            حفظ إعدادات النظام العامة
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          <span className="text-xs font-medium">جاري تحميل إعدادات النظام...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Global Brand & Contact Information Card */}
          <Card className="border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Globe className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-bold text-foreground">هوية المنصة وروابط الدعم والتواصل</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">اسم المنصة (تغييره ينعكس على النظام كاملاً)</label>
                <div className="relative">
                  <Globe className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    className="ps-9 bg-background border-border font-bold text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">رقم الواتساب للدعم والتواصل</label>
                <div className="relative">
                  <MessageSquare className="absolute start-3 top-2.5 h-4 w-4 text-emerald-400" />
                  <Input
                    type="text"
                    placeholder="+966500000000"
                    value={supportWhatsapp}
                    onChange={(e) => setSupportWhatsapp(e.target.value)}
                    className="ps-9 bg-background border-border dir-ltr"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">معرّف التلغرام للدعم والتواصل</label>
                <div className="relative">
                  <Send className="absolute start-3 top-2.5 h-4 w-4 text-blue-400" />
                  <Input
                    type="text"
                    placeholder="@wacrm_support"
                    value={supportTelegram}
                    onChange={(e) => setSupportTelegram(e.target.value)}
                    className="ps-9 bg-background border-border dir-ltr"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">بريد الدعم الفني (Support Email)</label>
                <div className="relative">
                  <Mail className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="ps-9 bg-background border-border dir-ltr"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">رمز العملة الرئيسي (Currency Symbol)</label>
                <div className="relative">
                  <DollarSign className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="ps-9 bg-background border-border"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">اللون الرئيسي للهوية (Brand Primary Color)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-14 p-1 bg-background border-border cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="bg-background border-border font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* 2. Plisio Crypto Payment Gateway Settings Card */}
          <Card className="border border-amber-500/40 bg-card p-6 space-y-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-500" />
                <div>
                  <h2 className="text-base font-bold text-foreground">بوابة دفع العملات الرقمية Plisio (Crypto Payment Gateway)</h2>
                  <p className="text-xs text-muted-foreground">تتطلب الـ Secret Key من حسابك في Plisio (account/api) لإنشاء فواتير الكريبتو وتأكيد الدفع</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {plisioSecretKey ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                    🟢 مفعلة ومستعدة تلقائياً
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                    🛑 معطلة (يرجى إدخال الـ Secret Key)
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5 max-w-xl">
                <label className="font-bold text-foreground flex items-center justify-between">
                  <span>Plisio API Secret Key</span>
                  <span className="text-[11px] text-muted-foreground font-normal">احصل عليه من (plisio.net → account/api)</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute start-3 top-2.5 h-4 w-4 text-amber-500" />
                  <Input
                    type="password"
                    placeholder="الصق الـ SECRET_KEY الخفي الخاص بك هنا..."
                    value={plisioSecretKey}
                    onChange={(e) => {
                      setPlisioSecretKey(e.target.value);
                      setPlisioEnabled(Boolean(e.target.value));
                    }}
                    className="ps-9 bg-background border-border font-mono text-xs"
                  />
                </div>
              </div>

              {!plisioSecretKey && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300 text-xs">
                  ⚠️ <strong>ملاحظة هامة:</strong> بوابة الدفع بالكريبتو معطلة حالياً لأنك لم تدخل الـ <strong>Secret Key</strong>. بمجرد لصق المفتاح والضغط على "حفظ"، سيتمكن العملاء فوراً من سداد الاشتراكات بالعملات الرقمية (USDT / Bitcoin).
                </div>
              )}
            </div>
          </Card>

          {/* 3. Stripe Credit/Debit Card Payment Gateway Settings Card */}
          <Card className="border border-indigo-500/40 bg-card p-6 space-y-6 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-400" />
                <div>
                  <h2 className="text-base font-bold text-foreground">بوابة دفع بطاقات الائتمان Stripe (Credit / Debit Card Gateway)</h2>
                  <p className="text-xs text-muted-foreground">تتيح للعملاء سداد الاشتراكات عبر Visa / MasterCard / Apple Pay مباشرة من حسابك في Stripe (dashboard.stripe.com/apikeys)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {stripePublishableKey && stripeSecretKey ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                    🟢 مفعلة ومستعدة لتلقي الدفع
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300">
                    🛑 معطلة (تتطلب تفعيل الـ Secret & Publishable Key)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground flex items-center justify-between">
                  <span>Stripe Publishable Key (الببليش كي)</span>
                  <span className="text-[10px] text-muted-foreground font-mono">pk_test_... أو pk_live_...</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute start-3 top-2.5 h-4 w-4 text-indigo-400" />
                  <Input
                    type="text"
                    placeholder="pk_test_..."
                    value={stripePublishableKey}
                    onChange={(e) => {
                      setStripePublishableKey(e.target.value);
                      setStripeEnabled(Boolean(e.target.value && stripeSecretKey));
                    }}
                    className="ps-9 bg-background border-border font-mono text-xs dir-ltr"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground flex items-center justify-between">
                  <span>Stripe Secret Key (السكاي السري)</span>
                  <span className="text-[10px] text-muted-foreground font-mono">sk_test_... أو sk_live_...</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute start-3 top-2.5 h-4 w-4 text-indigo-400" />
                  <Input
                    type={showStripeSecret ? 'text' : 'password'}
                    placeholder="sk_test_..."
                    value={stripeSecretKey}
                    onChange={(e) => {
                      setStripeSecretKey(e.target.value);
                      setStripeEnabled(Boolean(stripePublishableKey && e.target.value));
                    }}
                    className="ps-9 pe-9 bg-background border-border font-mono text-xs dir-ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStripeSecret(!showStripeSecret)}
                    className="absolute end-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showStripeSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-foreground flex items-center justify-between">
                  <span>Stripe Webhook Secret (مفتاح الويب هوك - اختياري للتأكيد التلقائي)</span>
                  <span className="text-[10px] text-muted-foreground font-mono">whsec_...</span>
                </label>
                <Input
                  type="text"
                  placeholder="whsec_..."
                  value={stripeWebhookSecret}
                  onChange={(e) => setStripeWebhookSecret(e.target.value)}
                  className="bg-background border-border font-mono text-xs dir-ltr"
                />
              </div>
            </div>

            {(!stripePublishableKey || !stripeSecretKey) && (
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-indigo-200 text-xs">
                💳 <strong>تنبيه Stripe:</strong> بمجرد إدخال الـ <strong>Publishable Key</strong> والـ <strong>Secret Key</strong> والضغط على "حفظ"، سيظهر زر الدفع الفوري بالبطاقات البنكية لدى جميع المستخدمين عند اختيار خطط الاشتراك!
              </div>
            )}
          </Card>

          {/* 3. Partners & Sponsors Manager Card */}
          <Card className="border border-border bg-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-500" />
                <div>
                  <h2 className="text-base font-bold text-foreground">إدارة شريط الشركاء والشركات (Landing Page Partners Ticker)</h2>
                  <p className="text-xs text-muted-foreground">إضافة شركاء ورعاة ليظهروا بشريط متحرك سلس من اليمين إلى اليسار في الصفحة الرئيسية</p>
                </div>
              </div>
            </div>

            {/* Add New Partner Form */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 items-end text-xs rounded-xl border border-border bg-muted/20 p-4">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">اسم الشريك / الشركة</label>
                <Input
                  type="text"
                  placeholder="مثلاً: Salesforce"
                  value={newPartnerName}
                  onChange={(e) => setNewPartnerName(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">رابط اللوجو / الصورة (اختياري)</label>
                <Input
                  type="text"
                  placeholder="https://..."
                  value={newPartnerLogo}
                  onChange={(e) => setNewPartnerLogo(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <Button
                size="sm"
                onClick={handleAddPartner}
                disabled={addingPartner || !newPartnerName}
                className="bg-amber-500 font-bold text-slate-950 hover:bg-amber-400"
              >
                {addingPartner ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Plus className="h-4 w-4 ms-1" />}
                إضافة شريك جديد ➕
              </Button>
            </div>

            {/* Partners List */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {partners.map((p) =>
                editingPartnerId === p.id ? (
                  <div
                    key={p.id}
                    className="col-span-1 sm:col-span-2 rounded-xl border border-amber-500/50 bg-amber-500/5 p-3 space-y-2 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">تعديل الشريك: {p.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPartnerId(null)}
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <label className="font-semibold text-foreground text-[11px]">اسم الشريك / الشركة</label>
                        <Input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 bg-background border-border text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-foreground text-[11px]">رابط اللوجو / الصورة</label>
                        <Input
                          type="text"
                          value={editLogoUrl}
                          onChange={(e) => setEditLogoUrl(e.target.value)}
                          className="h-8 bg-background border-border text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingPartnerId(null)}
                        className="h-7 text-xs"
                      >
                        إلغاء
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdatePartner(p.id)}
                        disabled={updatingPartner || !editName.trim()}
                        className="h-7 bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 text-xs"
                      >
                        {updatingPartner ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin me-1" />
                        ) : (
                          <Check className="h-3.5 w-3.5 ms-1" />
                        )}
                        حفظ التعديلات
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-3 shadow-sm hover:border-amber-500/30 transition-all"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {p.logo_url ? (
                        <img src={p.logo_url} alt={p.name} className="h-6 w-6 object-contain shrink-0" />
                      ) : (
                        <div className="h-6 w-6 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-bold text-foreground truncate">{p.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditingPartner(p)}
                        className="h-7 w-7 text-muted-foreground hover:text-amber-400"
                        title="تعديل الاسم أو رابط اللوجو"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePartner(p.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-red-400"
                        title="حذف الشريك"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>

          </Card>

          {/* Maintenance Mode Card */}
          <Card className="border border-amber-500/30 bg-amber-500/5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">وضع الصيانة الكلي (System Maintenance Mode)</h3>
                  <p className="text-xs text-muted-foreground">
                    إغلاق المنصة مؤقتاً أمام جميع العملاء والمستشارين وإظهار رسالة صيانة جارية.
                  </p>
                </div>
              </div>

              <Button
                variant={maintenanceMode ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className="text-xs font-bold"
              >
                {maintenanceMode ? 'إيقاف وضع الصيانة 🟢' : 'تفعيل وضع الصيانة 🛑'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
