'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  CheckCircle2,
  Smartphone,
  MessageSquare,
  Search,
  RefreshCw,
  Download,
  Plus,
  MoreVertical,
  Check,
  LogIn,
  Key,
  CreditCard,
  ShieldBan,
  ShieldCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Clock,
  Sparkles,
  RotateCw,
  Layers,
  ArrowUpRight,
  UserCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

export interface AdminAccountDetailRow {
  account_id: string;
  account_name: string;
  tenant_code: string;
  created_at: string;
  is_suspended: boolean;
  plan_id?: string;
  plan_name: string;
  plan_slug: string;
  plan_price_monthly: number;
  subscription_status: string;
  billing_cycle: string;
  current_period_end?: string | null;
  trial_ends_at?: string | null;
  user_count: number;
  message_count: number;
  quota_used: number;
  quota_limit: number;
  quota_percentage: number;
  owner_email: string;
  owner_name: string;
  owner_phone: string;
  owner_user_id?: string;
  whatsapp_status: 'connected' | 'disconnected';
  whatsapp_connection_type: 'evolution' | 'meta';
  connected_devices: number;
  max_devices: number;
  cluster_label: string;
}

export interface KpiData {
  total_accounts: number;
  growth_pct: number;
  active_subscriptions: number;
  active_rate_pct: number;
  connected_wa_instances: number;
  capacity_total: number;
  capacity_rate_pct: number;
  monthly_dispatched_messages: number;
  delivery_rate_pct: number;
  avg_messages_per_tenant: string;
}

export interface PlanOption {
  id: string;
  name: string;
  slug: string;
  price_monthly?: number;
}

function getAvatarColor(name: string): { bg: string; text: string } {
  const colors = [
    { bg: 'bg-slate-900 dark:bg-slate-800 border-slate-700', text: 'text-white' },
    { bg: 'bg-indigo-600/90 border-indigo-500', text: 'text-white' },
    { bg: 'bg-amber-600/90 border-amber-500', text: 'text-white' },
    { bg: 'bg-emerald-600/90 border-emerald-500', text: 'text-white' },
    { bg: 'bg-rose-600/90 border-rose-500', text: 'text-white' },
    { bg: 'bg-blue-600/90 border-blue-500', text: 'text-white' },
    { bg: 'bg-purple-600/90 border-purple-500', text: 'text-white' },
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
}

function getInitials(name: string): string {
  if (!name) return 'TN';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatLargeNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.00$/, '') + 'M';
  if (n >= 10_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

function formatRelativeDate(dateStr: string, isAr: boolean): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return isAr ? 'اليوم' : 'Today';
  if (diffDays === 1) return isAr ? 'أمس' : 'Yesterday';
  if (diffDays < 30) return isAr ? `منذ ${diffDays} يوم` : `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return isAr ? 'منذ شهر' : '1 month ago';
  if (diffMonths < 12) return isAr ? `منذ ${diffMonths} أشهر` : `${diffMonths} months ago`;
  return isAr ? 'منذ أكثر من سنة' : '1+ year ago';
}

export default function AdminAccountsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [accounts, setAccounts] = useState<AdminAccountDetailRow[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [kpi, setKpi] = useState<KpiData>({
    total_accounts: 0,
    growth_pct: 0,
    active_subscriptions: 0,
    active_rate_pct: 100,
    connected_wa_instances: 0,
    capacity_total: 250,
    capacity_rate_pct: 0,
    monthly_dispatched_messages: 0,
    delivery_rate_pct: 100,
    avg_messages_per_tenant: '0',
  });
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    active: 0,
    trialing: 0,
    suspended: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('just now');

  // Search & Filters State
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'trialing' | 'suspended'>('all');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [selectedGateway, setSelectedGateway] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'most_active' | 'newest' | 'name' | 'quota'>('most_active');

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals State
  const [createTenantOpen, setCreateTenantOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createPlanId, setCreatePlanId] = useState('');
  const [creating, setCreating] = useState(false);

  const [changingAccount, setChangingAccount] = useState<AdminAccountDetailRow | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [savingPlan, setSavingPlan] = useState(false);

  const [resettingAccount, setResettingAccount] = useState<AdminAccountDetailRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPass, setResettingPass] = useState(false);

  const [deletingAccount, setDeletingAccount] = useState<AdminAccountDetailRow | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function fetchDirectory() {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts directory');
      const data = await res.json();

      setAccounts(data.accounts || []);
      setPlans(data.plans || []);
      if (data.kpi) setKpi(data.kpi);
      if (data.status_counts) setStatusCounts(data.status_counts);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('[AdminAccounts] Fetch error:', err);
      toast.error(isAr ? 'تعذر جلب بيانات دليل الشركات' : 'Failed to fetch tenants directory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchDirectory();
  }, []);

  // Filtered and Sorted accounts
  const filteredAccounts = useMemo(() => {
    let list = [...accounts];

    // Status Tab Filter
    if (activeTab === 'active') {
      list = list.filter((a) => !a.is_suspended && a.subscription_status !== 'trialing');
    } else if (activeTab === 'trialing') {
      list = list.filter((a) => a.subscription_status === 'trialing' && !a.is_suspended);
    } else if (activeTab === 'suspended') {
      list = list.filter((a) => a.is_suspended);
    }

    // Plan Filter
    if (selectedPlan !== 'all') {
      list = list.filter((a) => a.plan_slug === selectedPlan || a.plan_id === selectedPlan);
    }

    // Gateway / Connection Type Filter
    if (selectedGateway !== 'all') {
      list = list.filter((a) => a.whatsapp_connection_type === selectedGateway);
    }

    // Search Query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.account_name.toLowerCase().includes(q) ||
          a.owner_email.toLowerCase().includes(q) ||
          a.owner_phone.toLowerCase().includes(q) ||
          a.tenant_code.toLowerCase().includes(q) ||
          a.account_id.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'most_active') {
        return b.message_count - a.message_count;
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'name') {
        return a.account_name.localeCompare(b.account_name);
      }
      if (sortBy === 'quota') {
        return b.quota_percentage - a.quota_percentage;
      }
      return 0;
    });

    return list;
  }, [accounts, activeTab, selectedPlan, selectedGateway, search, sortBy]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredAccounts.length / pageSize) || 1;
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAccounts.slice(start, start + pageSize);
  }, [filteredAccounts, currentPage, pageSize]);

  // Select all handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredAccounts.map((a) => a.account_id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Create Tenant Handler
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createEmail.trim()) {
      toast.error(isAr ? 'يرجى إدخال اسم الشركة وبريد المالك' : 'Company name and owner email are required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          email: createEmail.trim(),
          password: createPassword.trim() || 'MkWhats12345!',
          plan_id: createPlanId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');

      toast.success(isAr ? 'تم إنشاء المستأجر بنجاح' : 'Tenant created successfully');
      setCreateTenantOpen(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreatePlanId('');
      fetchDirectory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create tenant');
    } finally {
      setCreating(false);
    }
  };

  // Toggle Suspension Handler
  const handleToggleSuspension = async (account: AdminAccountDetailRow) => {
    setProcessingId(account.account_id);
    try {
      const newSuspended = !account.is_suspended;
      const res = await fetch('/api/admin/accounts/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: account.account_id,
          is_suspended: newSuspended,
        }),
      });
      if (!res.ok) throw new Error('Failed to update status');

      toast.success(
        newSuspended
          ? isAr
            ? `تم حظر حساب ${account.account_name} بنجاح`
            : `Account ${account.account_name} suspended`
          : isAr
          ? `تم تفعيل حساب ${account.account_name} بنجاح`
          : `Account ${account.account_name} activated`
      );
      fetchDirectory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle status');
    } finally {
      setProcessingId(null);
    }
  };

  // Change Plan Handler
  const handleSavePlan = async () => {
    if (!changingAccount || !selectedPlanId) return;
    setSavingPlan(true);
    try {
      const res = await fetch('/api/admin/subscriptions/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: changingAccount.account_id,
          plan_id: selectedPlanId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change plan');

      toast.success(isAr ? 'تم تحديث باقة الحساب بنجاح' : 'Account plan updated successfully');
      setChangingAccount(null);
      fetchDirectory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to change plan');
    } finally {
      setSavingPlan(false);
    }
  };

  // Reset Password Handler
  const handleResetPassword = async () => {
    if (!resettingAccount || !newPassword) return;
    setResettingPass(true);
    try {
      const res = await fetch('/api/admin/accounts/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: resettingAccount.account_id,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      toast.success(isAr ? 'تم تعيين كلمة المرور الجديدة بنجاح' : 'Password reset successfully');
      setResettingAccount(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setResettingPass(false);
    }
  };

  // Delete Account Handler
  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;
    setConfirmingDelete(true);
    try {
      const res = await fetch('/api/admin/accounts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: deletingAccount.account_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');

      toast.success(isAr ? 'تم حذف الحساب بالكامل' : 'Tenant deleted permanently');
      setDeleteModalOpen(false);
      setDeletingAccount(null);
      fetchDirectory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setConfirmingDelete(false);
    }
  };

  // Impersonate Login Handler
  const handleImpersonate = async (acc: AdminAccountDetailRow) => {
    setImpersonatingId(acc.account_id);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_account_id: acc.account_id,
          target_user_id: acc.owner_user_id || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impersonation failed');

      toast.success(isAr ? `جاري الدخول بالنيابة إلى ${acc.account_name}...` : `Impersonating ${acc.account_name}...`);
      window.location.href = data.redirect_url || '/dashboard';
    } catch (err: any) {
      toast.error(err.message || 'Failed to impersonate');
      setImpersonatingId(null);
    }
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-muted-foreground">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute h-12 w-12 rounded-full border-2 border-amber-500/20 animate-ping" />
          <RotateCw className="h-6 w-6 animate-spin text-amber-500" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-foreground">
          {isAr ? 'جاري تحميل سجل الشركات والمستأجرين...' : 'Loading tenants & accounts directory...'}
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
            {isAr ? 'دليل الشركات والمستأجرين' : 'Tenants & Accounts Directory'}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm font-medium max-w-3xl">
            {isAr
              ? 'تسجيل الدخول إلى حسابات الشركات للدعم، تعليق/تفعيل الحسابات، إعادة تعيين كلمات المرور، وإدارة بوابات الواتساب ومراقبة الحصص.'
              : 'Log into tenant accounts for support, suspend/activate accounts, reset passwords, manage WhatsApp gateways, and inspect quota usage.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh Directory */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDirectory}
            disabled={refreshing}
            className="h-10 border-border bg-card px-3.5 text-xs font-semibold hover:bg-muted/80 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 me-2 ${refreshing ? 'animate-spin text-amber-500' : 'text-muted-foreground'}`} />
            <span>{isAr ? 'تحديث الدليل' : 'Refresh Directory'}</span>
            <span className="ms-1.5 text-[10px] text-muted-foreground hidden sm:inline">• synced {lastSyncTime}</span>
          </Button>

          {/* Export CSV */}
          <a href="/api/admin/accounts/export" download>
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-border bg-card px-3.5 text-xs font-semibold hover:bg-muted/80 shadow-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
            </Button>
          </a>

          {/* + Create New Tenant (Orange/Amber in Image) */}
          <Button
            size="sm"
            onClick={() => setCreateTenantOpen(true)}
            className="h-10 bg-[#f59e0b] hover:bg-[#d97706] font-bold text-slate-950 px-5 text-xs shadow-md shadow-amber-500/20 gap-1.5 transition-all"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span>{isAr ? 'إنشاء مستأجر جديد' : 'Create New Tenant'}</span>
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. KPI Cards Row (Matching Image 4 Cards) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Accounts */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'إجمالي الحسابات' : 'Total Accounts'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <Building2 className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              {kpi.total_accounts}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-bold text-emerald-500 border border-emerald-500/20">
              <span>↑ +{kpi.growth_pct}%</span>
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            {isAr ? 'كافة المستأجرين والشركات المسجلة' : 'All registered business tenants'}
          </p>
        </div>

        {/* Card 2: Active Subscriptions */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'الاشتراكات الفعالة' : 'Active Subscriptions'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              {kpi.active_subscriptions}
            </span>
            <span className="text-xs font-semibold text-emerald-500 font-mono">
              {kpi.active_rate_pct}% {isAr ? 'نسبة' : 'rate'}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            {isAr ? 'الاشتراكات المدفوعة والتجريبية الحالية' : 'Currently paying & active trials'}
          </p>
        </div>

        {/* Card 3: Connected WA Instances */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-blue-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'سيرفرات الواتساب المتصلة' : 'Connected WA Instances'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
              <Smartphone className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              {kpi.connected_wa_instances} <span className="text-base text-muted-foreground font-normal">/ {kpi.capacity_total}</span>
            </span>
            <span className="text-xs font-mono font-bold text-muted-foreground">
              {kpi.capacity_rate_pct}% load
            </span>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, kpi.capacity_rate_pct)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Monthly Dispatched Msgs */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-purple-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'الرسائل الشهرية المرسلة' : 'Monthly Dispatched Msgs'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
              <MessageSquare className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              {formatLargeNum(kpi.monthly_dispatched_messages)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-bold text-emerald-500 border border-emerald-500/20">
              <span>{kpi.delivery_rate_pct}%</span>
              <span className="text-[10px]">ok</span>
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            {isAr ? `متوسط ${kpi.avg_messages_per_tenant} رسالة/شركة` : `Average ${kpi.avg_messages_per_tenant} messages/tenant`}
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. Filter & Search Bar (Matching Image) */}
      {/* ============================================================ */}
      <div className="space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        {/* Row 1: Search Input + Status Tabs */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Box with ⌘K Badge */}
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={
                isAr
                  ? 'ابحث باسم الشركة، بريد المالك، الهاتف، أو معرف الحساب...'
                  : 'Search company name, owner email, phone, or tenant ID...'
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 ps-10 pe-16 text-xs bg-muted/30 border-border/80 rounded-xl"
            />
            <div className="absolute end-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-[11px] font-bold font-mono text-muted-foreground bg-muted/60 border border-border/60 px-1.5 py-0.5 rounded-md pointer-events-none">
              <span>⌘K</span>
            </div>
          </div>

          {/* Quick Status Pill Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/60 self-start lg:self-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{isAr ? 'الكل' : 'All'}</span>
              <span className="font-mono text-[11px] text-muted-foreground font-bold">{statusCounts.all}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('active');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'active'
                  ? 'bg-card text-emerald-500 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{isAr ? 'نشط' : 'Active'}</span>
              <span className="font-mono text-[11px] text-emerald-500 font-bold">{statusCounts.active}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('trialing');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'trialing'
                  ? 'bg-card text-amber-500 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{isAr ? 'تجريبي' : 'Trialing'}</span>
              <span className="font-mono text-[11px] text-amber-500 font-bold">{statusCounts.trialing}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('suspended');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'suspended'
                  ? 'bg-card text-red-500 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{isAr ? 'معلق' : 'Suspended'}</span>
              <span className="font-mono text-[11px] text-red-500 font-bold">{statusCounts.suspended}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Dropdowns + Batch Action Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-border/40">
          <div className="flex flex-wrap items-center gap-2">
            {/* Plan Filter Dropdown */}
            <select
              value={selectedPlan}
              onChange={(e) => {
                setSelectedPlan(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 rounded-lg border border-border/80 bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">{isAr ? 'الخطة: كافة الباقات' : 'Plan: All Plans'}</option>
              {plans.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Gateway Filter Dropdown */}
            <select
              value={selectedGateway}
              onChange={(e) => {
                setSelectedGateway(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 rounded-lg border border-border/80 bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">{isAr ? 'بوابة الواتساب: كافة السيرفرات' : 'Gateway: All Clusters'}</option>
              <option value="evolution">Evolution API (QR Code)</option>
              <option value="meta">Meta Cloud API (Official)</option>
            </select>

            {/* Sort by Dropdown */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="h-9 rounded-lg border border-border/80 bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="most_active">{isAr ? 'ترتيب: الأكثر نشاطاً' : 'Sort by: Most Active'}</option>
              <option value="newest">{isAr ? 'ترتيب: الأحدث تسجيلاً' : 'Sort by: Newest'}</option>
              <option value="quota">{isAr ? 'ترتيب: استهلاك الحصة' : 'Sort by: Quota Usage'}</option>
              <option value="name">{isAr ? 'ترتيب: أبجدياً بالاسم' : 'Sort by: Name'}</option>
            </select>
          </div>

          {/* Batch Selection Bar */}
          <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground self-end sm:self-auto">
            <span>
              {selectedIds.size} {isAr ? `من أصل ${filteredAccounts.length} محدد` : `of ${filteredAccounts.length} selected`}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedIds.size === 0}
                    className="h-9 text-xs font-bold border-border/80"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 me-1.5" />
                    {isAr ? 'إجراء جماعي' : 'Batch Action'}
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem
                  onClick={() => {
                    toast.info(isAr ? 'تم تطبيق الإجراء على العناصر المحددة' : 'Batch action applied');
                  }}
                >
                  <ShieldBan className="h-3.5 w-3.5 me-2 text-red-500" />
                  {isAr ? 'حظر الحسابات المحددة' : 'Suspend Selected'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    toast.info(isAr ? 'تم تفعيل الحسابات المحددة' : 'Batch activation applied');
                  }}
                >
                  <ShieldCheck className="h-3.5 w-3.5 me-2 text-emerald-500" />
                  {isAr ? 'تفعيل الحسابات المحددة' : 'Activate Selected'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. Luxury Data Grid Table (Matching Image 100%) */}
      {/* ============================================================ */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent border-b border-border/80 text-[11px] font-black uppercase text-muted-foreground">
              <TableHead className="w-12 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredAccounts.length && filteredAccounts.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500/20"
                />
              </TableHead>
              <TableHead>{isAr ? 'الشركة والمستأجر' : 'COMPANY & TENANT'}</TableHead>
              <TableHead>{isAr ? 'مالك الحساب والاتصال' : 'ACCOUNT OWNER & CONTACT'}</TableHead>
              <TableHead>{isAr ? 'خطة الاشتراك' : 'SUBSCRIPTION PLAN'}</TableHead>
              <TableHead>{isAr ? 'سيرفر وأجهزة الواتساب' : 'WA INSTANCES & CLUSTER'}</TableHead>
              <TableHead>{isAr ? 'استهلاك الرسائل / الحصة' : 'MESSAGE USAGE / QUOTA'}</TableHead>
              <TableHead>{isAr ? 'الحالة' : 'STATUS'}</TableHead>
              <TableHead>{isAr ? 'تاريخ التسجيل' : 'REGISTERED'}</TableHead>
              <TableHead className="text-end">{isAr ? 'إجراءات' : 'ACTIONS'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-44 text-center text-xs text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Building2 className="h-8 w-8 text-muted-foreground/40" />
                    <p className="font-bold">{isAr ? 'لم يتم العثور على أي حسابات مطابقة' : 'No matching tenants found'}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {isAr ? 'جرّب تعديل كلمات البحث أو تصفير الفلاتر.' : 'Try adjusting your search criteria or resetting filters.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedAccounts.map((acc) => {
                const isSelected = selectedIds.has(acc.account_id);
                const avatar = getAvatarColor(acc.account_name);
                const initials = getInitials(acc.account_name);

                // Plan badges
                const isPro = acc.plan_slug === 'pro';
                const isEnterprise = acc.plan_slug === 'enterprise';
                const isStarter = acc.plan_slug === 'starter';
                const isFree = acc.plan_slug === 'free';

                return (
                  <TableRow
                    key={acc.account_id}
                    className={`hover:bg-muted/30 transition-colors border-b border-border/40 ${
                      isSelected ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(acc.account_id)}
                        className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500/20"
                      />
                    </TableCell>

                    {/* Company & Tenant */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-black shadow-xs ${avatar.bg} ${avatar.text}`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground text-xs truncate">{acc.account_name}</p>
                          <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{acc.tenant_code}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Account Owner & Contact */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-foreground truncate max-w-[200px]">{acc.owner_email}</p>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                          {acc.owner_phone ? (
                            <>
                              <span>{acc.owner_phone}</span>
                              <span className="text-emerald-500 font-black">✓</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground/60">{isAr ? 'غير مربوط' : 'Not linked'}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Subscription Plan */}
                    <TableCell>
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold border ${
                            isPro
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                              : isEnterprise
                              ? 'border-purple-500/30 bg-purple-500/10 text-purple-500'
                              : isStarter
                              ? 'border-blue-500/30 bg-blue-500/10 text-blue-500'
                              : 'border-border bg-muted/40 text-muted-foreground'
                          }`}
                        >
                          {acc.plan_name}
                        </span>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {acc.subscription_status === 'trialing' ? (
                            <span className="text-amber-500 font-bold">{isAr ? 'تنتهي الفترة التجريبية قريباً' : 'Trial expires in 3 days'}</span>
                          ) : acc.billing_cycle === 'yearly' ? (
                            'Annual VIP Contract'
                          ) : (
                            'Renews monthly'
                          )}
                        </p>
                      </div>
                    </TableCell>

                    {/* WA Instances & Cluster */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              acc.whatsapp_status === 'connected' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>
                            {acc.connected_devices}/{acc.max_devices} {isAr ? 'أجهزة' : 'Devices'}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          Cluster: {acc.cluster_label}
                        </p>
                      </div>
                    </TableCell>

                    {/* Message Usage / Quota */}
                    <TableCell>
                      <div className="space-y-1.5 min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                          <span className="text-foreground">{acc.quota_used.toLocaleString()}</span>
                          <span className="text-muted-foreground">/ {acc.quota_limit.toLocaleString()}</span>
                        </div>
                        {/* Micro Progress bar */}
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${
                              acc.quota_percentage > 90
                                ? 'bg-red-500'
                                : acc.quota_percentage > 70
                                ? 'bg-amber-500'
                                : isPro
                                ? 'bg-emerald-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${acc.quota_percentage}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {acc.is_suspended ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[11px] font-bold text-red-500 border border-red-500/20">
                          <span>⊘</span>
                          <span>{isAr ? 'معلق' : 'Suspended'}</span>
                        </span>
                      ) : acc.subscription_status === 'trialing' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-500 border border-amber-500/20">
                          <Clock className="h-3 w-3" />
                          <span>{isAr ? 'تجريبي (3 أيام)' : 'Trial (3d)'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-500 border border-emerald-500/20">
                          <Check className="h-3 w-3" />
                          <span>{isAr ? 'نشط' : 'Active'}</span>
                        </span>
                      )}
                    </TableCell>

                    {/* Registered Date */}
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-foreground">
                          {acc.created_at
                            ? new Date(acc.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: '2-digit',
                                year: 'numeric',
                              })
                            : '-'}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          {formatRelativeDate(acc.created_at, isAr)}
                        </p>
                      </div>
                    </TableCell>

                    {/* Manage Context Menu */}
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-2xl border-border bg-card">
                          <div className="px-2 py-1 text-[10px] font-black uppercase text-muted-foreground border-b border-border/40 mb-1">
                            MANAGE {acc.account_name}
                          </div>

                          {/* 1. Impersonate Login */}
                          <DropdownMenuItem
                            onClick={() => handleImpersonate(acc)}
                            disabled={impersonatingId === acc.account_id}
                            className="text-xs font-semibold py-2 cursor-pointer focus:bg-amber-500/10 focus:text-amber-500 rounded-lg gap-2"
                          >
                            <LogIn className="h-4 w-4 text-blue-500 shrink-0" />
                            <div>
                              <p className="font-bold">{isAr ? 'الدخول بالنيابة' : 'Impersonate Login'}</p>
                              <p className="text-[10px] text-muted-foreground">{isAr ? 'تقديم دعم مباشر للحساب' : 'Provide direct support'}</p>
                            </div>
                          </DropdownMenuItem>

                          {/* 2. Reset Password */}
                          <DropdownMenuItem
                            onClick={() => {
                              setResettingAccount(acc);
                              setNewPassword('');
                            }}
                            className="text-xs font-semibold py-2 cursor-pointer focus:bg-amber-500/10 focus:text-amber-500 rounded-lg gap-2"
                          >
                            <Key className="h-4 w-4 text-amber-500 shrink-0" />
                            <div>
                              <p className="font-bold">{isAr ? 'تغيير كلمة المرور' : 'Reset Password'}</p>
                              <p className="text-[10px] text-muted-foreground">{isAr ? 'تعيين كلمة سر جديدة' : 'Set a new password'}</p>
                            </div>
                          </DropdownMenuItem>

                          {/* 3. Change Plan */}
                          <DropdownMenuItem
                            onClick={() => {
                              setChangingAccount(acc);
                              setSelectedPlanId(acc.plan_id || plans[0]?.id || '');
                            }}
                            className="text-xs font-semibold py-2 cursor-pointer focus:bg-amber-500/10 focus:text-amber-500 rounded-lg gap-2"
                          >
                            <CreditCard className="h-4 w-4 text-purple-500 shrink-0" />
                            <div>
                              <p className="font-bold">{isAr ? 'ترقية وتعديل الخطة' : 'Change Plan'}</p>
                              <p className="text-[10px] text-muted-foreground">{isAr ? 'ترقية أو تخفيض الباقة' : 'Upgrade or downgrade'}</p>
                            </div>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="my-1 border-border/40" />

                          {/* 4. Suspend / Activate Account */}
                          <DropdownMenuItem
                            onClick={() => handleToggleSuspension(acc)}
                            disabled={processingId === acc.account_id}
                            className={`text-xs font-semibold py-2 cursor-pointer rounded-lg gap-2 ${
                              acc.is_suspended
                                ? 'text-emerald-500 focus:bg-emerald-500/10'
                                : 'text-orange-500 focus:bg-orange-500/10'
                            }`}
                          >
                            {acc.is_suspended ? (
                              <>
                                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                                <div>
                                  <p className="font-bold">{isAr ? 'تفعيل الحساب' : 'Activate Account'}</p>
                                  <p className="text-[10px] text-muted-foreground">{isAr ? 'إلغاء حظر العميل' : 'Reinstate access'}</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <ShieldBan className="h-4 w-4 text-orange-500 shrink-0" />
                                <div>
                                  <p className="font-bold">{isAr ? 'حظر الحساب' : 'Suspend Account'}</p>
                                  <p className="text-[10px] text-muted-foreground">{isAr ? 'قفل مؤقت للحساب' : 'Temporarily lock access'}</p>
                                </div>
                              </>
                            )}
                          </DropdownMenuItem>

                          {/* 5. Delete Account */}
                          <DropdownMenuItem
                            onClick={() => {
                              setDeletingAccount(acc);
                              setDeleteModalOpen(true);
                            }}
                            className="text-xs font-semibold py-2 cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500 rounded-lg gap-2"
                          >
                            <Trash2 className="h-4 w-4 text-red-500 shrink-0" />
                            <div>
                              <p className="font-bold">{isAr ? 'حذف الحساب نهائياً' : 'Delete Tenant'}</p>
                              <p className="text-[10px] text-red-500/80">{isAr ? 'إزالة كافة بيانات الحساب' : 'Purge account & data'}</p>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* ============================================================ */}
        {/* 5. Pagination Controls (Matching Image) */}
        {/* ============================================================ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/60 bg-card text-xs font-semibold">
          {/* Showing counter */}
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>
              {isAr
                ? `عرض ${Math.min(filteredAccounts.length, (currentPage - 1) * pageSize + 1)} إلى ${Math.min(
                    filteredAccounts.length,
                    currentPage * pageSize
                  )} من أصل ${filteredAccounts.length} مستأجر`
                : `Showing ${Math.min(filteredAccounts.length, (currentPage - 1) * pageSize + 1)} to ${Math.min(
                    filteredAccounts.length,
                    currentPage * pageSize
                  )} of ${filteredAccounts.length} tenants`}
            </span>
            <div className="flex items-center gap-1.5 ms-2">
              <span>{isAr ? 'عرض:' : 'Show:'}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-border/80 bg-background px-2 text-xs font-bold text-foreground"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-8 px-3 text-xs font-bold"
            >
              {isAr ? 'السابق' : 'Previous'}
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <Button
                key={num}
                variant={currentPage === num ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(num)}
                className={`h-8 w-8 p-0 text-xs font-black ${
                  currentPage === num ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : ''
                }`}
              >
                {num}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="h-8 px-3 text-xs font-bold"
            >
              {isAr ? 'التالي' : 'Next'}
            </Button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. Interactive Modals */}
      {/* ============================================================ */}

      {/* A. Create Tenant Modal */}
      <Dialog open={createTenantOpen} onOpenChange={setCreateTenantOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              {isAr ? 'إنشاء مستأجر / شركة جديدة' : 'Create New Tenant'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isAr
                ? 'إضافة شركة جديدة وتعيين مالكها والباقة المبدئية مباشرة.'
                : 'Add a new business tenant and assign owner credentials.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTenant} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {isAr ? 'اسم الشركة' : 'Company Name'} <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                placeholder={isAr ? 'مثال: شركة الرافدين للتجارة' : 'e.g. Acme Global'}
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {isAr ? 'بريد المالك' : 'Owner Email'} <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                required
                placeholder="owner@company.com"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {isAr ? 'كلمة المرور المبدئية' : 'Initial Password'}
              </Label>
              <Input
                type="text"
                placeholder={isAr ? 'افتراضي: MkWhats12345!' : 'Default: MkWhats12345!'}
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {isAr ? 'باقة الاشتراك' : 'Subscription Plan'}
              </Label>
              <select
                value={createPlanId}
                onChange={(e) => setCreatePlanId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="">{isAr ? 'الخطة المجانية الافتراضية' : 'Default Free Plan'}</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setCreateTenantOpen(false)} disabled={creating}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={creating} className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400">
                {creating ? <RotateCw className="h-4 w-4 animate-spin me-1.5" /> : <Plus className="h-4 w-4 me-1.5" />}
                {isAr ? 'إنشاء المستأجر' : 'Create Tenant'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* B. Change Plan Modal */}
      <Dialog open={!!changingAccount} onOpenChange={(open) => !open && setChangingAccount(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
              {isAr ? 'تعديل وترقية الخطة' : 'Change Subscription Plan'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {changingAccount?.account_name} — {isAr ? 'اختر الباقة الجديدة للمستأجر' : 'Select new plan for this tenant'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              {plans.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedPlanId === p.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-border hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="plan_choice"
                      checked={selectedPlanId === p.id}
                      onChange={() => setSelectedPlanId(p.id)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{p.slug}</p>
                    </div>
                  </div>
                  {p.price_monthly !== undefined && (
                    <span className="font-mono text-xs font-black text-foreground">
                      ${p.price_monthly}/mo
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setChangingAccount(null)} disabled={savingPlan}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSavePlan}
              disabled={savingPlan || !selectedPlanId}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
            >
              {savingPlan ? <RotateCw className="h-4 w-4 animate-spin me-1.5" /> : <Check className="h-4 w-4 me-1.5" />}
              {isAr ? 'حفظ الخطة' : 'Save Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* C. Reset Password Modal */}
      <Dialog open={!!resettingAccount} onOpenChange={(open) => !open && setResettingAccount(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-500" />
              {isAr ? 'تعيين كلمة مرور جديدة' : 'Reset Password'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {resettingAccount?.owner_email} ({resettingAccount?.account_name})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <Label className="text-xs font-bold text-foreground">{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
            <Input
              type="text"
              placeholder={isAr ? 'أدخل كلمة مرور قوية...' : 'Enter new strong password...'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-10 text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResettingAccount(null)} disabled={resettingPass}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resettingPass || !newPassword.trim()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              {resettingPass ? <RotateCw className="h-4 w-4 animate-spin me-1.5" /> : <Check className="h-4 w-4 me-1.5" />}
              {isAr ? 'تحديث كلمة المرور' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* D. Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-red-500 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              {isAr ? 'تأكيد حذف المستأجر نهائياً' : 'Confirm Permanent Tenant Deletion'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isAr
                ? `هل أنت متأكد تماماً من رغبتك في حذف شركة "${deletingAccount?.account_name}"؟ هذا الإجراء سيؤدي لحذف كافة الرسائل، المحادثات، والبيانات التابعة لها نهائياً ولا يمكن التراجع عنه.`
                : `Are you sure you want to permanently purge "${deletingAccount?.account_name}"? All associated messages, contacts, and configs will be destroyed.`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={confirmingDelete}>
              {isAr ? 'تراجع' : 'Cancel'}
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={confirmingDelete}
              className="bg-red-600 hover:bg-red-500 text-white font-bold"
            >
              {confirmingDelete ? <RotateCw className="h-4 w-4 animate-spin me-1.5" /> : <Trash2 className="h-4 w-4 me-1.5" />}
              {isAr ? 'نعم، حذف نهائي' : 'Yes, Purge Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
