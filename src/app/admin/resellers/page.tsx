'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import {
  Network,
  Plus,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ShieldBan,
  Clock,
  Calendar,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  MoreVertical,
  CheckCircle2,
  Globe,
  Sliders,
  Sparkles,
  AlertTriangle,
  Layers,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { ResellerTabs } from './_components/reseller-tabs';

interface ResellerPlan {
  id: string;
  name: string;
  name_ar?: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  max_accounts: number;
  max_custom_domains: number;
  features: Record<string, any>;
}

interface ResellerAccount {
  id: string;
  name: string;
}

interface Reseller {
  id: string;
  subdomain: string;
  custom_domain?: string | null;
  display_name: string;
  display_name_ar?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
  primary_color: string;
  support_email?: string | null;
  support_whatsapp?: string | null;
  status: 'active' | 'grace_period' | 'suspended' | 'pending_setup';
  subscription_expires_at?: string | null;
  grace_period_ends_at?: string | null;
  custom_max_accounts?: number | null;
  custom_settings?: Record<string, any>;
  created_at: string;
  plan?: ResellerPlan | null;
  owner_account?: { id: string; name: string } | null;
  sub_accounts_count: number;
}

export default function ResellersOverviewPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [loading, setLoading] = useState(true);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [plans, setPlans] = useState<ResellerPlan[]>([]);
  const [accounts, setAccounts] = useState<ResellerAccount[]>([]);
  const [stats, setStats] = useState({
    totalResellers: 0,
    activeCount: 0,
    graceCount: 0,
    suspendedCount: 0,
    totalSubAccounts: 0,
    estimatedMrr: 0,
  });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    display_name: '',
    display_name_ar: '',
    subdomain: '',
    custom_domain: '',
    plan_id: '',
    owner_account_id: '',
    support_email: '',
    support_whatsapp: '',
    primary_color: '#10b981',
    subscription_months: 1,
    custom_max_accounts: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resellers');
      const data = await res.json();
      if (res.ok) {
        setResellers(data.resellers || []);
        setPlans(data.plans || []);
        setAccounts(data.accounts || []);
        if (data.stats) setStats(data.stats);
        if (data.plans?.length > 0 && !formData.plan_id) {
          setFormData((prev) => ({ ...prev, plan_id: data.plans[0].id }));
        }
      } else {
        toast.error(data.error || 'Failed to load resellers');
      }
    } catch (err: any) {
      toast.error('Network error loading resellers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredResellers = useMemo(() => {
    return resellers.filter((r) => {
      const matchesSearch =
        r.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.display_name_ar && r.display_name_ar.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.custom_domain && r.custom_domain.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [resellers, searchQuery, statusFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.display_name || !formData.subdomain || !formData.plan_id) {
      toast.error(isAr ? 'يرجى ملء جميع الحقول الإلزامية' : 'Please fill required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/resellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(isAr ? 'تم إنشاء موزع الخدمة بنجاح!' : 'Reseller created successfully!');
        setIsCreateOpen(false);
        setFormData({
          display_name: '',
          display_name_ar: '',
          subdomain: '',
          custom_domain: '',
          plan_id: plans[0]?.id || '',
          owner_account_id: '',
          support_email: '',
          support_whatsapp: '',
          primary_color: '#10b981',
          subscription_months: 1,
          custom_max_accounts: '',
        });
        fetchData();
      } else {
        toast.error(data.error || 'Error creating reseller');
      }
    } catch (err: any) {
      toast.error('Network error creating reseller');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (reseller: Reseller) => {
    const newStatus = reseller.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/resellers/${reseller.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(
          newStatus === 'active'
            ? isAr ? 'تم تنشيط الريسيلر بنجاح' : 'Reseller activated'
            : isAr ? 'تم إيقاف وتعليق الريسيلر' : 'Reseller suspended'
        );
        fetchData();
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleExtendSubscription = async () => {
    if (!selectedReseller) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/resellers/${selectedReseller.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extend_days: extendDays }),
      });
      if (res.ok) {
        toast.success(isAr ? `تم تمديد الاشتراك لمدة ${extendDays} يوم بنجاح` : `Subscription extended by ${extendDays} days`);
        setIsExtendOpen(false);
        setSelectedReseller(null);
        fetchData();
      } else {
        toast.error('Failed to extend subscription');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReseller = async (reseller: Reseller) => {
    if (!confirm(isAr ? `هل أنت متأكد من رغبتك في حذف الريسيلر "${reseller.display_name}"؟ سيتم فك ارتباط الشركات التابعة له.` : `Are you sure you want to delete "${reseller.display_name}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/resellers/${reseller.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success(isAr ? 'تم حذف الريسيلر بنجاح' : 'Reseller deleted');
        fetchData();
      } else {
        toast.error('Failed to delete reseller');
      }
    } catch {
      toast.error('Network error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
            <Network className="h-6 w-6 text-emerald-500" />
            <span>{isAr ? 'شبكة موزعي الخدمة (White-Label Resellers)' : 'White-Label Reseller Hub'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isAr
              ? 'إدارة موزعي الخدمة، العلامات التجارية المستقلة، دومينات الريسيلر، وتتبع الإيرادات والحصص.'
              : 'Manage white-label partners, isolated brands, subdomains, and monitor tenant quotas & MRR.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            className="rounded-xl border-border h-9"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 shadow-sm"
          >
            <Plus className="h-4 w-4 ms-1.5" />
            {isAr ? 'إنشاء موزع جديد' : 'New Reseller'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <ResellerTabs />

      {/* 2. Key Metrics & Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>{isAr ? 'إجمالي الموزعين' : 'Total Resellers'}</span>
            <Network className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground">{stats.totalResellers}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">{isAr ? 'شريك موزع مسجل' : 'Registered partners'}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>{isAr ? 'الموزعون النشطون' : 'Active Resellers'}</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-500">{stats.activeCount}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">{isAr ? 'اشتراكات سارية' : 'In good standing'}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>{isAr ? 'فترة سماح / معلق' : 'Grace / Suspended'}</span>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-amber-500">{stats.graceCount}</span>
              <span className="text-muted-foreground text-xs">/</span>
              <span className="text-2xl font-black text-red-500">{stats.suspendedCount}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{isAr ? 'سماح / متوقف' : 'Grace / Suspended'}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>{isAr ? 'الشركات الفرعية' : 'Sub-Accounts'}</span>
            <Building2 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-blue-500">{stats.totalSubAccounts}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">{isAr ? 'شركة منشأة تحتهم' : 'Tenants deployed'}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>{isAr ? 'العائد الشهري المتوقع' : 'Estimated MRR'}</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground font-mono">
              ${stats.estimatedMrr.toFixed(2)}
            </span>
            <p className="text-[11px] text-emerald-500 font-medium mt-0.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {isAr ? 'إيرادات الباقات النشطة' : 'From active plans'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search, Filter & Resellers Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20">
          <div className="relative w-full sm:w-80">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم، الساب دومين، الدومين...' : 'Search name, subdomain, domain...'}
              className="ps-9 rounded-xl border-border bg-background h-9 text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {['all', 'active', 'grace_period', 'suspended'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  statusFilter === status
                    ? 'bg-foreground text-background shadow-xs'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {status === 'all' && (isAr ? 'الكل' : 'All')}
                {status === 'active' && (isAr ? 'نشط' : 'Active')}
                {status === 'grace_period' && (isAr ? 'فترة سماح' : 'Grace Period')}
                {status === 'suspended' && (isAr ? 'معلق' : 'Suspended')}
              </button>
            ))}
          </div>
        </div>

        {/* Resellers Data Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-start font-bold">{isAr ? 'الموزع / العلامة التجارية' : 'Reseller / Brand'}</TableHead>
                <TableHead className="text-start font-bold">{isAr ? 'الدومين والروابط' : 'Domain & Links'}</TableHead>
                <TableHead className="text-start font-bold">{isAr ? 'الباقة المشترك بها' : 'Plan'}</TableHead>
                <TableHead className="text-start font-bold">{isAr ? 'استهلاك الحسابات' : 'Quota'}</TableHead>
                <TableHead className="text-start font-bold">{isAr ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="text-start font-bold">{isAr ? 'تاريخ الانتهاء' : 'Expiry'}</TableHead>
                <TableHead className="text-end font-bold">{isAr ? 'إجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-36 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <span className="text-xs">{isAr ? 'جاري تحميل بيانات الموزعين...' : 'Loading resellers...'}</span>
                  </TableCell>
                </TableRow>
              ) : filteredResellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-36 text-center text-muted-foreground">
                    <Network className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm font-semibold">{isAr ? 'لا يوجد موزعي خدمة مسجلين حالياً' : 'No resellers found'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr ? 'اضغط على زر "إنشاء موزع جديد" لإضافة أول شريك White-Label' : 'Click "New Reseller" to create the first partner'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredResellers.map((reseller) => {
                  const maxAllowed = reseller.custom_max_accounts || reseller.plan?.max_accounts || 10;
                  const usagePercent = Math.min(100, Math.round((reseller.sub_accounts_count / maxAllowed) * 100));

                  const isExpired = reseller.subscription_expires_at
                    ? new Date(reseller.subscription_expires_at).getTime() < Date.now()
                    : false;

                  return (
                    <TableRow key={reseller.id} className="hover:bg-muted/30 transition-colors">
                      {/* Brand Info */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-xs"
                            style={{ backgroundColor: reseller.primary_color || '#10b981' }}
                          >
                            {reseller.logo_url ? (
                              <img src={reseller.logo_url} alt="" className="h-8 w-8 object-contain rounded-lg" />
                            ) : (
                              (reseller.display_name || 'R').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                              {isAr ? (reseller.display_name_ar || reseller.display_name) : reseller.display_name}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              {reseller.owner_account ? (
                                <span>{isAr ? 'المالك:' : 'Owner:'} {reseller.owner_account.name}</span>
                              ) : (
                                <span className="text-amber-500 font-medium">{isAr ? 'بدون مالك مرتبط' : 'No owner attached'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Subdomain & Custom Domain */}
                      <TableCell>
                        <div className="space-y-1">
                          <a
                            href={`https://${reseller.subdomain}.mstoviral.online`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            <span>{reseller.subdomain}.mstoviral.online</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>

                          {reseller.custom_domain && (
                            <div className="flex items-center gap-1 text-[11px] text-blue-500 font-mono">
                              <Globe className="h-3 w-3" />
                              <span>{reseller.custom_domain}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Plan */}
                      <TableCell>
                        {reseller.plan ? (
                          <div>
                            <span className="font-semibold text-xs text-foreground">
                              {isAr ? (reseller.plan.name_ar || reseller.plan.name) : reseller.plan.name}
                            </span>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              ${reseller.plan.price_monthly}/mo
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {isAr ? 'خطة مخصصة' : 'Custom Plan'}
                          </Badge>
                        )}
                      </TableCell>

                      {/* Quota Progress */}
                      <TableCell>
                        <div className="w-32 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-foreground">{reseller.sub_accounts_count}</span>
                            <span className="text-muted-foreground">/ {maxAllowed}</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                usagePercent >= 90
                                  ? 'bg-red-500'
                                  : usagePercent >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {reseller.status === 'active' && (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px]">
                            <CheckCircle2 className="h-3 w-3 me-1" />
                            {isAr ? 'نشط' : 'Active'}
                          </Badge>
                        )}
                        {reseller.status === 'grace_period' && (
                          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px]">
                            <AlertTriangle className="h-3 w-3 me-1" />
                            {isAr ? 'فترة سماح' : 'Grace Period'}
                          </Badge>
                        )}
                        {reseller.status === 'suspended' && (
                          <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-[11px]">
                            <ShieldBan className="h-3 w-3 me-1" />
                            {isAr ? 'معلق ومحجوب' : 'Suspended'}
                          </Badge>
                        )}
                        {reseller.status === 'pending_setup' && (
                          <Badge variant="outline" className="text-[11px]">
                            <Clock className="h-3 w-3 me-1" />
                            {isAr ? 'قيد الإعداد' : 'Pending'}
                          </Badge>
                        )}
                      </TableCell>

                      {/* Expiry */}
                      <TableCell>
                        {reseller.subscription_expires_at ? (
                          <div className="text-xs">
                            <div className={`font-semibold ${isExpired ? 'text-red-500' : 'text-foreground'}`}>
                              {new Date(reseller.subscription_expires_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {isExpired ? (
                                <span className="text-red-500 font-medium">{isAr ? 'منتهي الصلاحية' : 'Expired'}</span>
                              ) : (
                                `${Math.ceil((new Date(reseller.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} ${isAr ? 'يوم متبقي' : 'days left'}`
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">{isAr ? 'غير محدد' : 'Lifetime'}</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Toggle Status */}
                          <Button
                            onClick={() => handleToggleStatus(reseller)}
                            size="sm"
                            variant="ghost"
                            className={`h-8 px-2.5 rounded-lg text-xs font-semibold ${
                              reseller.status === 'active'
                                ? 'text-red-500 hover:bg-red-500/10'
                                : 'text-emerald-500 hover:bg-emerald-500/10'
                            }`}
                            title={reseller.status === 'active' ? (isAr ? 'إيقاف وتعليق' : 'Suspend') : (isAr ? 'تنشيط' : 'Activate')}
                          >
                            {reseller.status === 'active' ? (
                              <ShieldBan className="h-4 w-4" />
                            ) : (
                              <ShieldCheck className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Dropdown Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 p-0 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedReseller(reseller);
                                  setIsExtendOpen(true);
                                }}
                                className="cursor-pointer gap-2"
                              >
                                <Calendar className="h-4 w-4 text-emerald-500" />
                                <span>{isAr ? 'تمديد الاشتراك' : 'Extend Subscription'}</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => window.open(`https://${reseller.subdomain}.mstoviral.online`, '_blank')}
                                className="cursor-pointer gap-2"
                              >
                                <ExternalLink className="h-4 w-4 text-blue-500" />
                                <span>{isAr ? 'فتح منصة الريسيلر' : 'Visit Storefront'}</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleDeleteReseller(reseller)}
                                className="cursor-pointer gap-2 text-red-500 focus:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>{isAr ? 'حذف الريسيلر' : 'Delete Reseller'}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 4. Create Reseller Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Network className="h-5 w-5 text-emerald-500" />
              <span>{isAr ? 'إنشاء موزع خدمة جديد (White-Label Partner)' : 'Create New Reseller Partner'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isAr
                ? 'أنشئ حساب ريسيلر كامل بعلامة تجارية مستقلة، ساب دومين مخصص، وخطة اشتراك محددة.'
                : 'Set up an isolated white-label partner with custom branding and domain routing.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'اسم العلامة التجارية (English) *' : 'Brand Name (EN) *'}</Label>
                <Input
                  required
                  placeholder="Acme WhatsApp CRM"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'اسم العلامة التجارية (العربية)' : 'Brand Name (AR)'}</Label>
                <Input
                  placeholder="منصة أكمي لواتساب"
                  value={formData.display_name_ar}
                  onChange={(e) => setFormData({ ...formData, display_name_ar: e.target.value })}
                  className="rounded-xl h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isAr ? 'الساب دومين الفريد *' : 'Subdomain Slug *'}</Label>
              <div className="flex items-center rounded-xl border border-border bg-muted/40 overflow-hidden">
                <Input
                  required
                  placeholder="acme"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="border-0 bg-transparent rounded-none h-9 text-xs font-mono font-semibold"
                />
                <span className="px-3 text-xs text-muted-foreground font-mono bg-muted/60 border-s border-border py-2">
                  .mstoviral.online
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isAr ? 'سيكون رابط المنصة للزوار:' : 'Visitors URL will be:'} <code className="text-emerald-500 font-mono">{formData.subdomain || 'name'}.mstoviral.online</code>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'باقة الريسيلر *' : 'Reseller Plan *'}</Label>
                <select
                  required
                  value={formData.plan_id}
                  onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-hidden"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {isAr ? (p.name_ar || p.name) : p.name} (${p.price_monthly}/mo - {p.max_accounts} accounts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'المدة الأولية للاشتراك' : 'Initial Subscription'}</Label>
                <select
                  value={formData.subscription_months}
                  onChange={(e) => setFormData({ ...formData, subscription_months: Number(e.target.value) })}
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-hidden"
                >
                  <option value={1}>{isAr ? 'شهر واحد (1 Month)' : '1 Month'}</option>
                  <option value={3}>{isAr ? '3 أشهر (3 Months)' : '3 Months'}</option>
                  <option value={6}>{isAr ? '6 أشهر (6 Months)' : '6 Months'}</option>
                  <option value={12}>{isAr ? 'سنة كاملة (1 Year)' : '1 Year'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'ربط بحساب مالك حالي (اختياري)' : 'Link Owner Account (Optional)'}</Label>
                <select
                  value={formData.owner_account_id}
                  onChange={(e) => setFormData({ ...formData, owner_account_id: e.target.value })}
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs focus:outline-hidden"
                >
                  <option value="">{isAr ? '— بدون ربط حالياً —' : '— None —'}</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'دومين مخصص اختياري (Custom Domain)' : 'Custom Domain (Optional)'}</Label>
                <Input
                  placeholder="crm.clientdomain.com"
                  value={formData.custom_domain}
                  onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                  className="rounded-xl h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'بريد الدعم' : 'Support Email'}</Label>
                <Input
                  placeholder="support@reseller.com"
                  value={formData.support_email}
                  onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'واتساب الدعم' : 'Support WhatsApp'}</Label>
                <Input
                  placeholder="966500000000"
                  value={formData.support_whatsapp}
                  onChange={(e) => setFormData({ ...formData, support_whatsapp: e.target.value })}
                  className="rounded-xl h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'لون الهوية الرئيسي' : 'Brand Color'}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="h-9 w-12 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl text-xs h-9"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 shadow-sm"
              >
                {submitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin ms-1" />
                ) : (
                  <Plus className="h-4 w-4 ms-1" />
                )}
                {isAr ? 'تأكيد وإنشاء الريسيلر' : 'Create Reseller'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Extend Subscription Modal */}
      <Dialog open={isExtendOpen} onOpenChange={setIsExtendOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              <span>{isAr ? 'تمديد اشتراك موزع الخدمة' : 'Extend Reseller Subscription'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isAr ? 'اختر عدد الأيام المراد إضافتها إلى فترة الاشتراك الحالية.' : 'Select days to add to current expiry date.'}
            </DialogDescription>
          </DialogHeader>

          {selectedReseller && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs space-y-1">
                <div className="font-semibold text-foreground">{selectedReseller.display_name}</div>
                <div className="text-muted-foreground font-mono text-[11px]">{selectedReseller.subdomain}.mstoviral.online</div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">{isAr ? 'فترة التمديد' : 'Extension Period'}</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 90, 365].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setExtendDays(days)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        extendDays === days
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500 shadow-xs'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {days === 365 ? (isAr ? 'سنة' : '1 Year') : `${days} ${isAr ? 'يوم' : 'Days'}`}
                    </button>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsExtendOpen(false)}
                  className="rounded-xl text-xs h-9"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="button"
                  onClick={handleExtendSubscription}
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9"
                >
                  {submitting ? <RefreshCw className="h-4 w-4 animate-spin ms-1" /> : null}
                  {isAr ? 'تأكيد التمديد' : 'Confirm Extension'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
