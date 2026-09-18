'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import {
  Network,
  Sparkles,
  Building2,
  Globe,
  DollarSign,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ShieldBan,
  Layers,
  Palette,
  CreditCard,
  Users,
  Settings,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Star,
  Info,
  Landmark,
  Upload,
  QrCode,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function UserResellerPortalPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'clients' | 'payments'>('branding');
  const [saving, setSaving] = useState(false);

  // Reseller Checkout & Upgrade Modal State
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'plisio' | 'offline'>('offline');
  const [siteGateways, setSiteGateways] = useState({ stripe_enabled: false, plisio_enabled: false });
  const [offlineMethods, setOfflineMethods] = useState<any[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [submittingCheckout, setSubmittingCheckout] = useState(false);
  const [applyForm, setApplyForm] = useState({
    brand_name: '',
    subdomain: '',
    whatsapp_number: '',
    notes: '',
  });

  // Branding Form State (for active resellers)
  const [brandForm, setBrandForm] = useState({
    display_name: '',
    display_name_ar: '',
    primary_color: '#10b981',
    logo_url: '',
    favicon_url: '',
    support_email: '',
    support_whatsapp: '',
    custom_domain: '',
    platform_name: '',
    platform_name_ar: '',
    telegram_handle: '',
    stripe_enabled: false,
    stripe_publishable_key: '',
    stripe_secret_key: '',
    plisio_enabled: false,
    plisio_api_key: '',
    offline_payment_enabled: false,
    offline_payment_instructions: '',
    offline_payment_instructions_ar: '',
  });

  const fetchPortalData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reseller/portal');
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.isReseller && json.reseller) {
          const r = json.reseller;
          const s = json.settings || {};
          setBrandForm({
            display_name: r.display_name || '',
            display_name_ar: r.display_name_ar || '',
            primary_color: r.primary_color || '#10b981',
            logo_url: r.logo_url || s.logo_url || '',
            favicon_url: r.favicon_url || s.favicon_url || '',
            support_email: r.support_email || s.support_email || '',
            support_whatsapp: r.support_whatsapp || s.support_whatsapp || '',
            custom_domain: r.custom_domain || '',
            platform_name: s.platform_name || r.display_name || '',
            platform_name_ar: s.platform_name_ar || r.display_name_ar || '',
            telegram_handle: s.telegram_handle || '',
            stripe_enabled: Boolean(s.stripe_enabled),
            stripe_publishable_key: s.stripe_publishable_key || '',
            stripe_secret_key: s.stripe_secret_key || '',
            plisio_enabled: Boolean(s.plisio_enabled),
            plisio_api_key: s.plisio_api_key || '',
            offline_payment_enabled: Boolean(s.offline_payment_enabled),
            offline_payment_instructions: s.offline_payment_instructions || '',
            offline_payment_instructions_ar: s.offline_payment_instructions_ar || '',
          });
        }
      } else {
        toast.error(json.error || 'Failed to load reseller portal');
      }
    } catch {
      toast.error('Network error loading portal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(isAr ? 'تم نسخ الرابط بنجاح' : 'URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch site payment gateways and offline methods
  useEffect(() => {
    fetch('/api/site-settings')
      .then((r) => r.json())
      .then((res) => {
        if (res.settings) {
          setSiteGateways({
            stripe_enabled: Boolean(res.settings.stripe_enabled),
            plisio_enabled: Boolean(res.settings.plisio_enabled),
          });
          if (res.settings.stripe_enabled) {
            setSelectedGateway('stripe');
          } else if (res.settings.plisio_enabled) {
            setSelectedGateway('plisio');
          } else {
            setSelectedGateway('offline');
          }
        }
      })
      .catch(() => {});

    fetch('/api/offline-methods')
      .then((r) => r.json())
      .then((res) => {
        const methods = res.methods || [];
        setOfflineMethods(methods);
        if (methods.length > 0) setSelectedMethodId(methods[0].id);
      })
      .catch(() => {});

    // Check if returning from Stripe checkout
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const paymentStatus = urlParams.get('payment');
      if (sessionId && paymentStatus === 'success') {
        fetch('/api/billing/stripe/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              toast.success(isAr ? 'تم التحقق من الدفع وتفعيل حساب الموزع بنجاح! 🎉' : 'Reseller activated successfully! 🎉');
              fetchPortalData();
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingReceipt(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-receipt', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to upload receipt');
      setProofImageUrl(data.url);
      toast.success(isAr ? 'تم رفع إشعار التحويل بنجاح' : 'Receipt uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Receipt upload error');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !applyForm.brand_name.trim() || !applyForm.subdomain.trim()) {
      toast.error(isAr ? 'يرجى إدخال اسم المنصة والساب دومين المطلوب' : 'Please provide brand name and subdomain');
      return;
    }

    if (selectedGateway === 'offline' && !transactionRef.trim() && !proofImageUrl) {
      toast.error(isAr ? 'يرجى كتابة رقم الحوالة أو رفع إشعار التحويل' : 'Please provide transaction ref or upload receipt');
      return;
    }

    setSubmittingCheckout(true);
    try {
      const res = await fetch('/api/reseller/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          brand_name: applyForm.brand_name,
          subdomain: applyForm.subdomain,
          whatsapp_number: applyForm.whatsapp_number,
          billing_cycle: billingCycle,
          gateway: selectedGateway,
          method_id: selectedMethodId,
          transaction_ref: transactionRef,
          proof_image_url: proofImageUrl,
          notes: applyForm.notes,
        }),
      });

      const resJson = await res.json();
      if (!res.ok || resJson.error) {
        toast.error(resJson.error || (isAr ? 'حدث خطأ أثناء معالجة الطلب' : 'Failed to process request'));
        return;
      }

      if (selectedGateway === 'stripe' && resJson.checkout_url) {
        window.location.href = resJson.checkout_url;
        return;
      }

      if (selectedGateway === 'plisio' && resJson.checkout_url) {
        window.open(resJson.checkout_url, '_blank');
        toast.success(isAr ? 'تم فتح فاتورة الدفع الرقمي عبر Plisio' : 'Crypto invoice opened');
        setIsApplyOpen(false);
        fetchPortalData();
        return;
      }

      toast.success(
        resJson.message ||
          (isAr
            ? 'تم استلام طلب ترقية الموزع وإشعار التحويل بنجاح! سيتم تفعيله فور مراجعة الإدارة.'
            : 'Application and payment submitted successfully!')
      );
      setIsApplyOpen(false);
      fetchPortalData();
    } catch {
      toast.error(isAr ? 'فشل الاتصال بالخادم' : 'Network error');
    } finally {
      setSubmittingCheckout(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.reseller?.id) return;

    setSaving(true);
    try {
      const res = await fetch('/api/reseller/portal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reseller_id: data.reseller.id,
          branding: {
            display_name: brandForm.display_name,
            display_name_ar: brandForm.display_name_ar,
            primary_color: brandForm.primary_color,
            logo_url: brandForm.logo_url,
            favicon_url: brandForm.favicon_url,
            support_email: brandForm.support_email,
            support_whatsapp: brandForm.support_whatsapp,
            custom_domain: brandForm.custom_domain,
          },
          settings: {
            platform_name: brandForm.platform_name,
            platform_name_ar: brandForm.platform_name_ar,
            logo_url: brandForm.logo_url,
            favicon_url: brandForm.favicon_url,
            primary_color: brandForm.primary_color,
            support_email: brandForm.support_email,
            support_whatsapp: brandForm.support_whatsapp,
            telegram_handle: brandForm.telegram_handle,
            stripe_enabled: brandForm.stripe_enabled,
            stripe_publishable_key: brandForm.stripe_publishable_key,
            stripe_secret_key: brandForm.stripe_secret_key,
            plisio_enabled: brandForm.plisio_enabled,
            plisio_api_key: brandForm.plisio_api_key,
            offline_payment_enabled: brandForm.offline_payment_enabled,
            offline_payment_instructions: brandForm.offline_payment_instructions,
            offline_payment_instructions_ar: brandForm.offline_payment_instructions_ar,
          },
        }),
      });
      const resJson = await res.json();
      if (res.ok) {
        toast.success(isAr ? 'تم حفظ التغييرات وتحديث إعدادات منصتك بنجاح!' : 'Settings updated successfully');
        fetchPortalData();
      } else {
        toast.error(resJson.error || 'Failed to save settings');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-xs text-muted-foreground">{isAr ? 'جاري تحميل بوابة الموزع...' : 'Loading reseller portal...'}</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CASE 1: USER IS NOT A RESELLER YET (Onboarding & Upgrade View)
  // ─────────────────────────────────────────────────────────────
  if (!data?.isReseller) {
    const availablePlans = data?.plans || [];

    return (
      <div className="space-y-10 pb-12">
        {/* Hero Banner */}
        <div className="rounded-3xl bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 end-0 -translate-y-12 translate-x-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-1 text-xs font-bold text-emerald-100 border border-white/20">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isAr ? 'برنامج الشركاء والموزعين (White-Label Partner)' : 'White-Label Partner Program'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {isAr
                ? 'أطلق منصتك الخاصة لواتساب CRM بعلامتك التجارية الكاملة'
                : 'Start Your Own WhatsApp CRM Business with 100% White-Label'}
            </h1>

            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed max-w-2xl">
              {isAr
                ? 'حوّل خبرتك أو وكالتك إلى شركة SaaS مربحة. نمنحك النظام بالكامل، وأنت تمتلك الهوية والدومين والعملاء وأرباح الاشتراكات بنسبة 100% دون أي عمولة لنا.'
                : 'Turn your agency into a recurring SaaS business. We provide the full cloud system; you own the brand, domain, clients, and keep 100% of the revenue.'}
            </p>
          </div>
        </div>

        {/* Reseller Plans Showcase */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {isAr ? 'اختر باقة الموزع المناسبة وابدأ الآن' : 'Choose Your Wholesale Partner Plan'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'جميع الباقات تمنحك وصولاً كاملاً بدون كود، وساب دومين فوري، وهوية مستقلة 100%.'
                : 'All plans include zero-code deployment, instant subdomain, and 100% white-label.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map((plan: any, idx: number) => {
              const isPopular = plan.is_popular || idx === 1;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl bg-card p-6 sm:p-8 flex flex-col justify-between relative transition-all border ${
                    isPopular
                      ? 'border-2 border-emerald-500 shadow-xl shadow-emerald-500/5'
                      : 'border-border'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 start-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-0.5 shadow-xs flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        {isAr ? 'الأكثر طلباً' : 'Best Value'}
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-black text-foreground">
                        {isAr ? (plan.name_ar || plan.name) : plan.name}
                      </h3>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-black font-mono text-foreground">${plan.price_monthly}</span>
                        <span className="text-xs text-muted-foreground">{isAr ? '/شهرياً' : '/month'}</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2.5 pt-4 border-t border-border text-xs">
                      <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                        <Building2 className="h-4 w-4 shrink-0" />
                        <span>
                          {isAr ? `حتى ${plan.max_accounts} عميل أو شركة مستقلة` : `Up to ${plan.max_accounts} client accounts`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500 shrink-0" />
                        <span>
                          {isAr ? `ربط حتى ${plan.max_custom_domains} دومين مخصص كامل` : `Up to ${plan.max_custom_domains} custom domains`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{isAr ? 'هوية مستقلة بدون أي ذكر لنا' : '100% White-label (no platform branding)'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{isAr ? 'تحصيل أرباحك مباشرة في حسابك' : 'Collect 100% of subscription revenue'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{isAr ? 'دعم الذكاء الاصطناعي وبوتات واتساب' : 'AI conversational bots for clients'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-border">
                    <Button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setIsApplyOpen(true);
                      }}
                      className={`w-full rounded-xl text-xs font-bold h-10 shadow-xs ${
                        isPopular
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-foreground text-background'
                      }`}
                    >
                      {isAr ? 'طلب الاشتراك في هذه الباقة' : 'Apply for This Plan'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comprehensive Reseller Checkout & Upgrade Modal */}
        <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
          <DialogContent className="max-w-xl rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full px-3 py-1 text-xs font-bold w-fit mb-1 border border-emerald-500/20">
                <Network className="h-3.5 w-3.5" />
                <span>{isAr ? 'ترقية حساب شريك ريسيلر (White-Label)' : 'Reseller Partner Checkout'}</span>
              </div>
              <DialogTitle className="text-xl font-black">
                {isAr ? 'إطلاق منصتك الخاصة المستقلة' : 'Launch Your White-Label Platform'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isAr
                  ? `اختر طريقة الدفع وأدخل بيانات علامتك التجارية للبدء فوراً مع باقة "${selectedPlan?.name}".`
                  : `Select payment method and brand details to deploy your platform on "${selectedPlan?.name}".`}
              </DialogDescription>
            </DialogHeader>

            {/* Selected Plan Summary Banner */}
            {selectedPlan && (
              <div className="p-4 rounded-2xl bg-muted/60 border border-border flex items-center justify-between gap-4 mt-2">
                <div>
                  <span className="text-xs font-bold text-foreground">
                    {isAr ? (selectedPlan.name_ar || selectedPlan.name) : selectedPlan.name}
                  </span>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {isAr ? `تتيح حتى ${selectedPlan.max_accounts} عميل أو شركة مستقلة` : `Up to ${selectedPlan.max_accounts} client accounts`}
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    ${billingCycle === 'yearly' ? selectedPlan.price_yearly : selectedPlan.price_monthly}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {billingCycle === 'yearly' ? (isAr ? '/سنوياً' : '/year') : (isAr ? '/شهرياً' : '/month')}
                  </span>
                </div>
              </div>
            )}

            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-center pt-1">
              <div className="inline-flex p-1 rounded-xl bg-muted border border-border text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-1.5 rounded-lg transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isAr ? 'اشتراك شهري' : 'Monthly'}
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    billingCycle === 'yearly'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{isAr ? 'اشتراك سنوي' : 'Yearly'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 text-white font-bold">
                    {isAr ? 'توفير شهرين' : 'Save 2 Mo'}
                  </span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-2">
              {/* Step 1: Platform Brand & Subdomain */}
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'اسم منصتك / علامتك التجارية *' : 'Platform Brand Name *'}</Label>
                    <Input
                      required
                      placeholder="Mita CRM"
                      value={applyForm.brand_name}
                      onChange={(e) => setApplyForm({ ...applyForm, brand_name: e.target.value })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'رقم واتساب للتواصل السريع' : 'WhatsApp Contact'}</Label>
                    <Input
                      placeholder="9647700000000"
                      value={applyForm.whatsapp_number}
                      onChange={(e) => setApplyForm({ ...applyForm, whatsapp_number: e.target.value })}
                      className="rounded-xl h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isAr ? 'الساب دومين السحابي المطلوب *' : 'Desired Cloud Subdomain *'}</Label>
                  <div className="flex items-center rounded-xl border border-border bg-muted/40 overflow-hidden focus-within:ring-1 focus-within:ring-emerald-500">
                    <Input
                      required
                      placeholder="mitacrm"
                      value={applyForm.subdomain}
                      onChange={(e) => setApplyForm({ ...applyForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="border-0 bg-transparent rounded-none h-9 text-xs font-mono font-semibold focus-visible:ring-0"
                    />
                    <span className="px-3 text-xs text-muted-foreground font-mono bg-muted/70 border-s border-border py-2 select-none">
                      .mstoviral.online
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {isAr ? 'يمكنك لاحقاً أيضاً ربط دومين مخصص كامل خاص بك مجاناً (CNAME).' : 'You can also connect a custom domain later for free.'}
                  </p>
                </div>
              </div>

              {/* Step 2: Payment Gateway Selection */}
              <div className="space-y-2.5 pt-2 border-t border-border">
                <Label className="text-xs font-bold">{isAr ? 'اختر طريقة الدفع:' : 'Choose Payment Gateway:'}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Stripe Gateway */}
                  {siteGateways.stripe_enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('stripe')}
                      className={`p-3 rounded-2xl border text-start transition-all flex flex-col justify-between gap-2 ${
                        selectedGateway === 'stripe'
                          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                          : 'border-border hover:border-emerald-500/40 bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <CreditCard className="h-5 w-5 text-indigo-500" />
                        {selectedGateway === 'stripe' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{isAr ? 'بطاقة بنكية' : 'Credit Card'}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">Stripe Visa/MC</div>
                      </div>
                    </button>
                  )}

                  {/* Plisio Gateway */}
                  {siteGateways.plisio_enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('plisio')}
                      className={`p-3 rounded-2xl border text-start transition-all flex flex-col justify-between gap-2 ${
                        selectedGateway === 'plisio'
                          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                          : 'border-border hover:border-emerald-500/40 bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <DollarSign className="h-5 w-5 text-amber-500" />
                        {selectedGateway === 'plisio' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{isAr ? 'عملات رقمية' : 'Crypto (USDT)'}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">Plisio Gateway</div>
                      </div>
                    </button>
                  )}

                  {/* Offline / Bank Transfer */}
                  {offlineMethods.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('offline')}
                      className={`p-3 rounded-2xl border text-start transition-all flex flex-col justify-between gap-2 ${
                        selectedGateway === 'offline'
                          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                          : 'border-border hover:border-emerald-500/40 bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Landmark className="h-5 w-5 text-emerald-600" />
                        {selectedGateway === 'offline' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{isAr ? 'تحويل بنكي / يدوي' : 'Offline Transfer'}</div>
                        <div className="text-[10px] text-muted-foreground">{isAr ? 'حوالة أو دفع محلي' : 'Bank / Mobile Pay'}</div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Step 3: If Offline Payment is Selected */}
              {selectedGateway === 'offline' && (
                <div className="space-y-3.5 p-4 rounded-2xl bg-muted/40 border border-border mt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">{isAr ? 'اختر حساب التحويل المعتمد:' : 'Select Transfer Account:'}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {offlineMethods.map((m: any) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMethodId(m.id)}
                          className={`p-2.5 rounded-xl border text-start text-xs transition-all ${
                            selectedMethodId === m.id
                              ? 'border-emerald-500 bg-emerald-500/10 font-bold'
                              : 'border-border bg-background hover:border-border/80'
                          }`}
                        >
                          <div className="font-semibold text-foreground">{m.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{m.account_number}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Method Details Display */}
                  {selectedMethodId && (() => {
                    const activeMethod = offlineMethods.find((m: any) => m.id === selectedMethodId);
                    if (!activeMethod) return null;
                    return (
                      <div className="p-3 rounded-xl bg-background border border-border text-xs space-y-1 font-mono">
                        {activeMethod.account_name && (
                          <div className="text-muted-foreground">
                            {isAr ? 'اسم المستفيد: ' : 'Account Name: '}
                            <span className="font-bold text-foreground">{activeMethod.account_name}</span>
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          {isAr ? 'رقم الحساب / الآيبان: ' : 'Account Number: '}
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 select-all">{activeMethod.account_number}</span>
                        </div>
                        {activeMethod.instructions && (
                          <p className="text-[11px] text-muted-foreground font-sans pt-1 border-t border-border mt-1">
                            {activeMethod.instructions}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">{isAr ? 'رقم الحوالة أو المرجع *' : 'Transaction Ref Number *'}</Label>
                      <Input
                        placeholder="TRX-12345678"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        className="rounded-xl h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">{isAr ? 'إشعار التحويل (صورة الوصل)' : 'Payment Receipt'}</Label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 border border-dashed border-border rounded-xl h-9 text-xs hover:bg-muted/50 transition-colors">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleReceiptUpload}
                            className="hidden"
                          />
                          {uploadingReceipt ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                          ) : (
                            <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className="text-[11px] text-muted-foreground truncate">
                            {proofImageUrl ? (isAr ? 'تم رفع الوصل ✓' : 'Receipt uploaded ✓') : (isAr ? 'رفع صورة الوصل' : 'Upload receipt')}
                          </span>
                        </label>
                        {proofImageUrl && (
                          <a
                            href={proofImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsApplyOpen(false)}
                  className="rounded-xl text-xs h-10"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={submittingCheckout || uploadingReceipt}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 shadow-sm px-6"
                >
                  {submittingCheckout ? (
                    <RefreshCw className="h-4 w-4 animate-spin ms-1" />
                  ) : selectedGateway === 'stripe' ? (
                    isAr ? 'الانتقال للدفع عبر Stripe 💳' : 'Proceed to Stripe Checkout 💳'
                  ) : selectedGateway === 'plisio' ? (
                    isAr ? 'الانتقال للدفع بالكريبتو عبر Plisio 🪙' : 'Proceed to Plisio Crypto 🪙'
                  ) : (
                    isAr ? 'تأكيد الاشتراك وإرسال إشعار التحويل 📤' : 'Confirm & Submit Receipt 📤'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CASE 2: USER IS ALREADY AN ACTIVE RESELLER PARTNER
  // ─────────────────────────────────────────────────────────────
  const reseller = data.reseller;
  const subAccounts = data.subAccounts || [];
  const stats = data.stats || { subCount: 0, maxAllowed: 10, usagePercent: 0 };
  const resellerUrl = `https://${reseller.subdomain}.mstoviral.online`;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Partner Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center font-bold text-white text-xl shrink-0 shadow-md"
            style={{ backgroundColor: brandForm.primary_color || '#10b981' }}
          >
            {brandForm.logo_url ? (
              <img src={brandForm.logo_url} alt="" className="h-10 w-10 object-contain rounded-lg" />
            ) : (
              (brandForm.display_name || 'R').charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                {brandForm.display_name || reseller.display_name}
              </h1>
              {reseller.status === 'active' && (
                <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 me-1" />
                  {isAr ? 'شريك نشط' : 'Active Partner'}
                </Badge>
              )}
              {reseller.status === 'grace_period' && (
                <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px]">
                  <Clock className="h-3 w-3 me-1" />
                  {isAr ? 'فترة سماح' : 'Grace Period'}
                </Badge>
              )}
              {reseller.status === 'pending_setup' && (
                <Badge variant="outline" className="text-[10px]">
                  <Clock className="h-3 w-3 me-1" />
                  {isAr ? 'قيد المراجعة والإعداد' : 'Pending Setup'}
                </Badge>
              )}
            </div>

            {/* Subdomain Link */}
            <div className="flex items-center gap-2 mt-2">
              <a
                href={resellerUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>{reseller.subdomain}.mstoviral.online</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <button
                type="button"
                onClick={() => handleCopyUrl(resellerUrl)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                title={isAr ? 'نسخ الرابط' : 'Copy link'}
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Quota & Plan Info */}
        <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-2xl border border-border shrink-0">
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground font-semibold">
              {isAr ? 'استهلاك حسابات الشركات' : 'Client Accounts Quota'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-foreground font-mono">{stats.subCount}</span>
              <span className="text-xs text-muted-foreground">/ {stats.maxAllowed}</span>
            </div>
            <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${stats.usagePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Portal Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'branding'
              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette className="h-4 w-4" />
          <span>{isAr ? 'الهوية والعلامة التجارية' : 'White-Label Branding'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clients')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'clients'
              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>{isAr ? 'الشركات والعملاء' : 'Client Accounts'}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {subAccounts.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'payments'
              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>{isAr ? 'بوابات الدفع المستقلة' : 'Payment Gateways'}</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveSettings} className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground">{isAr ? 'تخصيص الهوية البصرية لمنصتك' : 'Brand Customization'}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr ? 'تظهر هذه الإعدادات لجميع زوار وعملاء منصتك دون أي ذكر لمنصتنا.' : 'These branding settings will be visible to all your client tenants.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isAr ? 'اسم المنصة (English)' : 'Platform Name (EN)'}</Label>
              <Input
                value={brandForm.display_name}
                onChange={(e) => setBrandForm({ ...brandForm, display_name: e.target.value })}
                className="rounded-xl h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isAr ? 'اسم المنصة (العربية)' : 'Platform Name (AR)'}</Label>
              <Input
                value={brandForm.display_name_ar}
                onChange={(e) => setBrandForm({ ...brandForm, display_name_ar: e.target.value })}
                className="rounded-xl h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isAr ? 'رابط اللوجو (Logo URL)' : 'Logo URL'}</Label>
              <Input
                placeholder="https://domain.com/logo.png"
                value={brandForm.logo_url}
                onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })}
                className="rounded-xl h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isAr ? 'رابط الأيقونة (Favicon URL)' : 'Favicon URL'}</Label>
              <Input
                placeholder="https://domain.com/favicon.ico"
                value={brandForm.favicon_url}
                onChange={(e) => setBrandForm({ ...brandForm, favicon_url: e.target.value })}
                className="rounded-xl h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isAr ? 'لون الهوية الرئيسي' : 'Brand Color'}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandForm.primary_color}
                  onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })}
                  className="h-9 w-12 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
                />
                <Input
                  value={brandForm.primary_color}
                  onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })}
                  className="rounded-xl h-9 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isAr ? 'بريد الدعم الفني لعملائك' : 'Support Email'}</Label>
              <Input
                placeholder="support@yourbrand.com"
                value={brandForm.support_email}
                onChange={(e) => setBrandForm({ ...brandForm, support_email: e.target.value })}
                className="rounded-xl h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isAr ? 'واتساب الدعم الفني' : 'Support WhatsApp'}</Label>
              <Input
                placeholder="966500000000"
                value={brandForm.support_whatsapp}
                onChange={(e) => setBrandForm({ ...brandForm, support_whatsapp: e.target.value })}
                className="rounded-xl h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Custom Domain Section */}
          <div className="p-4 rounded-2xl border border-border bg-muted/30 space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <Label className="text-xs font-bold">{isAr ? 'ربط دومين مخصص كامل (Custom Domain)' : 'Custom CNAME Domain'}</Label>
            </div>
            <Input
              placeholder="crm.youragency.com"
              value={brandForm.custom_domain}
              onChange={(e) => setBrandForm({ ...brandForm, custom_domain: e.target.value })}
              className="rounded-xl h-9 text-xs font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              {isAr
                ? 'لربط دومينك الخاص، أنشئ سجل CNAME في مزود الدومين الخاص بك يوجه إلى: mstoviral.online'
                : 'To connect your custom domain, create a CNAME DNS record pointing to: mstoviral.online'}
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 shadow-xs"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin ms-1" /> : null}
              {isAr ? 'حفظ إعدادات الهوية' : 'Save Brand Settings'}
            </Button>
          </div>
        </form>
      )}

      {activeTab === 'clients' && (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="p-5 border-b border-border bg-muted/20">
            <h3 className="text-base font-bold text-foreground">{isAr ? 'الشركات والعملاء المسجلين' : 'Registered Client Accounts'}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr ? 'جميع الحسابات التي قامت بالتسجيل تحت منصتك وساب دومينك الخاص.' : 'All client companies deployed under your white-label platform.'}
            </p>
          </div>

          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-start font-bold">{isAr ? 'اسم الشركة' : 'Company'}</TableHead>
                <TableHead className="text-start font-bold">{isAr ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                <TableHead className="text-start font-bold">{isAr ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="text-start font-bold">{isAr ? 'تاريخ التسجيل' : 'Registered'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm font-semibold">{isAr ? 'لا يوجد عملاء مسجلين حالياً' : 'No client accounts yet'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr ? `شارك رابط منصتك (${reseller.subdomain}.mstoviral.online) لبدء تسجيل العملاء` : 'Share your platform URL to onboard clients'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                subAccounts.map((acc: any) => (
                  <TableRow key={acc.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-xs text-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        <span>{acc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {acc.profiles?.[0]?.email || '—'}
                    </TableCell>
                    <TableCell>
                      {acc.is_suspended ? (
                        <Badge className="bg-red-500/15 text-red-500 border border-red-500/30 text-[10px]">
                          {isAr ? 'معلق' : 'Suspended'}
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px]">
                          {isAr ? 'نشط' : 'Active'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {new Date(acc.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === 'payments' && (
        <form onSubmit={handleSaveSettings} className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground">{isAr ? 'بوابات الدفع المستقلة للريسيلر' : 'Reseller Payment Gateways'}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr ? 'اربط بوابات الدفع الخاصة بك لاستلام أموال اشتراكات عملائك في حسابك مباشرة 100% دون أي عمولة.' : 'Connect your own gateways to collect subscription fees directly.'}
            </p>
          </div>

          {/* Stripe Section */}
          <div className="p-5 rounded-2xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-500" />
                <Label className="text-xs font-bold">{isAr ? 'بوابة الدفع Stripe' : 'Stripe Payments'}</Label>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={brandForm.stripe_enabled}
                  onChange={(e) => setBrandForm({ ...brandForm, stripe_enabled: e.target.checked })}
                  className="rounded border-border text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span>{isAr ? 'تفعيل Stripe' : 'Enable Stripe'}</span>
              </label>
            </div>

            {brandForm.stripe_enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Stripe Publishable Key</Label>
                  <Input
                    type="password"
                    placeholder="pk_live_..."
                    value={brandForm.stripe_publishable_key}
                    onChange={(e) => setBrandForm({ ...brandForm, stripe_publishable_key: e.target.value })}
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Stripe Secret Key</Label>
                  <Input
                    type="password"
                    placeholder="sk_live_..."
                    value={brandForm.stripe_secret_key}
                    onChange={(e) => setBrandForm({ ...brandForm, stripe_secret_key: e.target.value })}
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Offline / Bank Transfer Section */}
          <div className="p-5 rounded-2xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <Label className="text-xs font-bold">{isAr ? 'الدفع المحلي والتحويل البنكي' : 'Offline / Bank Transfer'}</Label>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={brandForm.offline_payment_enabled}
                  onChange={(e) => setBrandForm({ ...brandForm, offline_payment_enabled: e.target.checked })}
                  className="rounded-xl border-border text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span>{isAr ? 'تفعيل الدفع المحلي' : 'Enable Offline'}</span>
              </label>
            </div>

            {brandForm.offline_payment_enabled && (
              <div className="space-y-2 pt-2">
                <Label className="text-[11px] font-semibold">{isAr ? 'تعليمات وبيانات التحويل (رقم الحساب، الآيبان، STC Pay)' : 'Bank Transfer Instructions'}</Label>
                <textarea
                  rows={3}
                  placeholder={isAr ? 'يرجى التحويل إلى بنك الراجحي آيبان: SA0000000000 ثم إرسال الإيصال عبر واتساب...' : 'Bank details...'}
                  value={brandForm.offline_payment_instructions}
                  onChange={(e) => setBrandForm({ ...brandForm, offline_payment_instructions: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:outline-hidden"
                />
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 shadow-xs"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin ms-1" /> : null}
              {isAr ? 'حفظ إعدادات بوابات الدفع' : 'Save Payment Settings'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
