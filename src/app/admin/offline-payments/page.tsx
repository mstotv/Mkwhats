'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import {
  Landmark,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit,
  ExternalLink,
  ShieldCheck,
  Building2,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Zap,
  CreditCard,
  DollarSign,
  TrendingUp,
  Check,
  X,
  Eye,
  SlidersHorizontal,
  Wallet,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

export interface OfflineMethod {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  account_name?: string;
  account_number: string;
  logo_url?: string;
  instructions?: string;
  is_active: boolean;
  display_order: number;
}

export interface OfflineSubmission {
  id: string;
  account_id: string;
  accounts?: { id: string; name: string };
  owner_name?: string;
  owner_email?: string;
  plan_id: string;
  plans?: { id: string; name: string; slug: string; max_messages_monthly?: number };
  offline_payment_methods?: { id: string; name: string; account_name?: string; account_number: string; logo_url?: string };
  billing_cycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  transaction_ref?: string;
  proof_image_url?: string;
  user_notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
}

export interface OfflineKpi {
  pending_amount: number;
  pending_count: number;
  approved_this_month_amount: number;
  approved_this_month_count: number;
  approved_growth_pct: number;
  configured_gateways_count: number;
  configured_gateways_summary: string;
  avg_review_time: string;
}

function getAvatarColor(name: string): { bg: string; text: string } {
  const colors = [
    { bg: 'bg-slate-950 dark:bg-slate-900 border-slate-800', text: 'text-white' },
    { bg: 'bg-purple-600/90 border-purple-500', text: 'text-white' },
    { bg: 'bg-amber-600/90 border-amber-500', text: 'text-white' },
    { bg: 'bg-emerald-600/90 border-emerald-500', text: 'text-white' },
    { bg: 'bg-blue-600/90 border-blue-500', text: 'text-white' },
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
}

function getInitials(name: string): string {
  if (!name) return 'TR';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatRelativeTime(dateStr: string, isAr: boolean): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));

  if (diffHours < 1) return isAr ? 'الآن' : 'Just now';
  if (diffHours === 1) return isAr ? 'منذ ساعة' : '1h ago';
  if (diffHours < 24) return isAr ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return isAr ? 'أمس' : 'Yesterday';
  return isAr ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
}

export default function AdminOfflinePaymentsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [methods, setMethods] = useState<OfflineMethod[]>([]);
  const [submissions, setSubmissions] = useState<OfflineSubmission[]>([]);
  const [kpi, setKpi] = useState<OfflineKpi>({
    pending_amount: 450.0,
    pending_count: 3,
    approved_this_month_amount: 3890.0,
    approved_this_month_count: 38,
    approved_growth_pct: 24,
    configured_gateways_count: 4,
    configured_gateways_summary: 'Al-Rajhi, ZainCash, STC, Vodafone',
    avg_review_time: '18 mins',
  });

  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Main View Tab: 'receipts' | 'methods'
  const [activeMainTab, setActiveMainTab] = useState<'receipts' | 'methods'>('receipts');

  // Receipts Filter State
  const [receiptStatusFilter, setReceiptStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Add / Edit Method Modal
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<OfflineMethod | null>(null);
  const [methodName, setMethodName] = useState('');
  const [methodAccountName, setMethodAccountName] = useState('');
  const [methodAccountNumber, setMethodAccountNumber] = useState('');
  const [methodInstructions, setMethodInstructions] = useState('');
  const [methodIsActive, setMethodIsActive] = useState(true);
  const [savingMethod, setSavingMethod] = useState(false);

  // Review & Action Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [selectedSubmission, setSelectedSubmission] = useState<OfflineSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Image Proof Lightbox Modal
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  async function fetchOfflineData() {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/offline-payments');
      if (!res.ok) throw new Error('Failed to fetch offline payments data');
      const data = await res.json();

      setSubmissions(data.submissions || []);
      setMethods(data.methods || []);
      if (data.kpi) setKpi(data.kpi);
      if (data.status_counts) setStatusCounts(data.status_counts);
    } catch (err) {
      console.error('[AdminOfflinePayments] Fetch error:', err);
      toast.error(isAr ? 'تعذر جلب بيانات الحوالات البنكية' : 'Failed to fetch offline payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOfflineData();
  }, []);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    let list = [...submissions];

    // Status Filter
    if (receiptStatusFilter !== 'all') {
      list = list.filter((s) => s.status === receiptStatusFilter);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.accounts?.name?.toLowerCase().includes(q) ||
          s.owner_email?.toLowerCase().includes(q) ||
          s.transaction_ref?.toLowerCase().includes(q) ||
          s.offline_payment_methods?.name?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [submissions, receiptStatusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredSubmissions.length / pageSize) || 1;
  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSubmissions.slice(start, start + pageSize);
  }, [filteredSubmissions, currentPage]);

  // Handle Review Action (Approve / Reject)
  const handleConfirmReview = async () => {
    if (!selectedSubmission) return;
    setProcessingAction(true);
    try {
      const res = await fetch('/api/admin/offline-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: selectedSubmission.id,
          action: reviewAction,
          admin_notes: adminNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process submission');

      toast.success(
        reviewAction === 'approve'
          ? isAr
            ? 'تم اعتماد الحوالة وتفعيل اشتراك العميل بنجاح'
            : 'Payment approved & subscription activated'
          : isAr
          ? 'تم رفض الحوالة وإشعار العميل'
          : 'Payment rejected and customer notified'
      );

      setReviewModalOpen(false);
      setSelectedSubmission(null);
      setAdminNotes('');
      fetchOfflineData();
    } catch (err: any) {
      toast.error(err.message || 'Error processing action');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle Add/Edit Payment Method
  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodName.trim() || !methodAccountNumber.trim()) {
      toast.error(isAr ? 'يرجى إدخال اسم الطريقة ورقم الحساب' : 'Method name and account number required');
      return;
    }
    setSavingMethod(true);
    try {
      const isEdit = !!editingMethod;
      const url = isEdit
        ? `/api/admin/offline-methods/${editingMethod.id}`
        : '/api/admin/offline-methods';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: methodName.trim(),
          account_name: methodAccountName.trim() || undefined,
          account_number: methodAccountNumber.trim(),
          instructions: methodInstructions.trim() || undefined,
          is_active: methodIsActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save method');

      toast.success(
        isEdit
          ? isAr
            ? 'تم تعديل طريقة الدفع بنجاح'
            : 'Payment method updated'
          : isAr
          ? 'تمت إضافة طريقة الدفع الجديدة بنجاح'
          : 'Payment method added'
      );

      setMethodModalOpen(false);
      setEditingMethod(null);
      fetchOfflineData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save payment method');
    } finally {
      setSavingMethod(false);
    }
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm font-semibold tracking-wide text-foreground">
          {isAr ? 'جاري تحميل سجل الحوالات وبوابات الدفع...' : 'Loading Offline Payment Gateway & Hub...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* ============================================================ */}
      {/* 1. Header Box Section (Matching Image) */}
      {/* ============================================================ */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
            <Landmark className="h-7 w-7" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {isAr ? 'بوابة الحوالات البنكية والمحافظ' : 'Offline Payment Gateway & Hub'}
              </h1>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Direct Wire & Wallets
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm font-medium">
              {isAr
                ? 'إدارة الحسابات البنكية والمحافظ المحلية، مراجعة الإيصالات الواردة، وتفعيل اشتراكات العملاء فورياً.'
                : 'Manage local bank accounts & wallet details, review incoming receipts, and activate subscriptions instantly.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {/* Refresh List */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOfflineData}
            disabled={refreshing}
            className="h-10 border-border bg-card px-3.5 text-xs font-semibold hover:bg-muted/80 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 me-2 ${refreshing ? 'animate-spin text-emerald-500' : 'text-muted-foreground'}`} />
            <span>{isAr ? 'تحديث القائمة' : 'Refresh List'}</span>
          </Button>

          {/* + Add Payment Method (Emerald Button in Image) */}
          <Button
            size="sm"
            onClick={() => {
              setEditingMethod(null);
              setMethodName('');
              setMethodAccountName('');
              setMethodAccountNumber('');
              setMethodInstructions('');
              setMethodIsActive(true);
              setMethodModalOpen(true);
            }}
            className="h-10 bg-[#059669] hover:bg-[#047857] font-bold text-white px-5 text-xs shadow-md shadow-emerald-500/20 gap-1.5 transition-all"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span>{isAr ? 'إضافة طريقة دفع' : 'Add Payment Method'}</span>
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. Top 4 KPI Cards Row (Matching Image 100%) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: PENDING RECEIPTS */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-card p-5 shadow-xs transition-all hover:border-amber-500 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {isAr ? 'الطلبات المعلقة' : 'PENDING RECEIPTS'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              ${kpi.pending_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-500 border border-amber-500/20">
              <span>{kpi.pending_count} {isAr ? 'معلق' : 'pending'}</span>
            </span>
          </div>
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{isAr ? 'تتطلب التحقق والاعتماد' : 'Requires verification'}</span>
          </p>
        </div>

        {/* Card 2: APPROVED THIS MONTH */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {isAr ? 'المعتمد هذا الشهر' : 'APPROVED THIS MONTH'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <DollarSign className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              ${kpi.approved_this_month_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-bold text-emerald-500 border border-emerald-500/20">
              <span>↑ {kpi.approved_growth_pct}%</span>
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            {isAr
              ? `${kpi.approved_this_month_count} حوالة تم التحقق منها`
              : `${kpi.approved_this_month_count} verified offline transfers`}
          </p>
        </div>

        {/* Card 3: CONFIGURED GATEWAYS */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-blue-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {isAr ? 'البوابات المفعلة' : 'CONFIGURED GATEWAYS'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
              <CreditCard className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              {kpi.configured_gateways_count} {isAr ? 'طرق' : 'Methods'}
            </span>
            <span className="inline-flex items-center rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[11px] font-bold text-blue-500 border border-blue-500/20">
              All Enabled
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium truncate">
            {kpi.configured_gateways_summary}
          </p>
        </div>

        {/* Card 4: AVG. REVIEW TIME */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-purple-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {isAr ? 'متوسط وقت المراجعة' : 'AVG. REVIEW TIME'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
              <Zap className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              {kpi.avg_review_time}
            </span>
            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-bold text-emerald-500 border border-emerald-500/20">
              98% fast-track
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            {isAr ? 'إشعار واتساب تلقائي للعميل' : 'Automated WhatsApp notification'}
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. Primary View Switcher Tabs (Matching Image) */}
      {/* ============================================================ */}
      <div className="flex items-center justify-start border-b border-border/80 gap-2">
        <button
          type="button"
          onClick={() => setActiveMainTab('receipts')}
          className={`relative pb-3 pt-2 px-5 text-sm font-bold transition-all flex items-center gap-2 ${
            activeMainTab === 'receipts'
              ? 'text-foreground border-b-2 border-emerald-500'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="h-4 w-4 text-amber-500" />
          <span>
            {isAr ? 'إيصالات الدفع' : 'Payment Receipts'} ({kpi.pending_count} {isAr ? 'معلق' : 'pending'})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('methods')}
          className={`relative pb-3 pt-2 px-5 text-sm font-bold transition-all flex items-center gap-2 ${
            activeMainTab === 'methods'
              ? 'text-foreground border-b-2 border-emerald-500'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Landmark className="h-4 w-4 text-emerald-500" />
          <span>
            {isAr ? 'طرق وبوابات الدفع' : 'Payment Methods'} ({methods.length})
          </span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 4. Tab 1: Incoming Payment Receipts Content */}
      {/* ============================================================ */}
      {activeMainTab === 'receipts' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
            <div>
              <h3 className="text-lg font-black text-foreground">
                {isAr ? 'إيصالات الدفع الواردة' : 'Incoming Payment Receipts'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? 'مراجعة الحوالات البنكية وتفعيل اشتراكات المشتركين في الوقت الفعلي'
                  : 'Review bank transfers & activate user subscriptions in real-time'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Box */}
              <div className="relative min-w-[240px]">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={isAr ? 'ابحث بالحساب، البريد، أو المرجع...' : 'Search account or ref...'}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 ps-9 text-xs bg-muted/30 border-border/80 rounded-xl"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setReceiptStatusFilter('pending');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    receiptStatusFilter === 'pending'
                      ? 'bg-card text-amber-500 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isAr ? 'معلق' : 'Pending'} ({statusCounts.pending})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReceiptStatusFilter('approved');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    receiptStatusFilter === 'approved'
                      ? 'bg-card text-emerald-500 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isAr ? 'معتمد' : 'Approved'} ({statusCounts.approved})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReceiptStatusFilter('rejected');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    receiptStatusFilter === 'rejected'
                      ? 'bg-card text-red-500 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isAr ? 'مرفوض' : 'Rejected'} ({statusCounts.rejected})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReceiptStatusFilter('all');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    receiptStatusFilter === 'all'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isAr ? 'الكل' : 'All'} ({statusCounts.all})
                </button>
              </div>
            </div>
          </div>

          {/* Luxury Receipts Data Grid Table */}
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-b border-border/80 text-[11px] font-black uppercase text-muted-foreground">
                  <TableHead>{isAr ? 'المستخدم / الحساب' : 'USER / ACCOUNT'}</TableHead>
                  <TableHead>{isAr ? 'الباقة المطلوبة' : 'SUBSCRIBED PLAN'}</TableHead>
                  <TableHead>{isAr ? 'طريقة التحويل والمرجع' : 'TRANSFER METHOD & REF'}</TableHead>
                  <TableHead>{isAr ? 'المبلغ' : 'AMOUNT'}</TableHead>
                  <TableHead>{isAr ? 'تاريخ التقديم' : 'SUBMITTED AT'}</TableHead>
                  <TableHead>{isAr ? 'الإيصال / الإثبات' : 'PROOF / RECEIPT'}</TableHead>
                  <TableHead className="text-end">{isAr ? 'التحقق والإجراء' : 'VERIFICATION / ACTIONS'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-44 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
                        <p className="font-bold">
                          {isAr ? 'لا توجد أي حوالات مطابقة للمعايير المحددة' : 'No matching receipts found'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSubmissions.map((sub) => {
                    const avatar = getAvatarColor(sub.owner_name || sub.accounts?.name || 'User');
                    const initials = getInitials(sub.owner_name || sub.accounts?.name || 'US');
                    const planSlug = sub.plans?.slug || 'pro';
                    const isPending = sub.status === 'pending';
                    const isApproved = sub.status === 'approved';
                    const isRejected = sub.status === 'rejected';

                    // Mock local currency conversion for visual presentation
                    const localCurrency =
                      sub.currency === 'USD'
                        ? `${(sub.amount * 3.75).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR`
                        : `${sub.amount} ${sub.currency}`;

                    return (
                      <TableRow key={sub.id} className="hover:bg-muted/30 transition-colors border-b border-border/40">
                        {/* 1. USER / ACCOUNT */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-black shadow-xs ${avatar.bg} ${avatar.text}`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-xs truncate">
                                {sub.owner_name || sub.accounts?.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate max-w-[180px]">
                                {sub.owner_email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* 2. SUBSCRIBED PLAN */}
                        <TableCell>
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold border ${
                                planSlug === 'enterprise'
                                  ? 'border-purple-500/30 bg-purple-500/10 text-purple-500'
                                  : planSlug === 'pro'
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                                  : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                              }`}
                            >
                              {sub.plans?.name || 'Pro Plan'} ({sub.billing_cycle === 'yearly' ? 'Annual' : 'Monthly'})
                            </span>
                            <p className="text-[10px] text-muted-foreground font-medium">
                              {sub.plans?.max_messages_monthly === -1
                                ? 'Unlimited msgs/mo'
                                : `${(sub.plans?.max_messages_monthly || 1000).toLocaleString()} msgs/mo`}
                            </p>
                          </div>
                        </TableCell>

                        {/* 3. TRANSFER METHOD & REF */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                              <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                              <span>{sub.offline_payment_methods?.name || 'Bank Al-Rajhi'}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              Ref: #{sub.transaction_ref || sub.id.slice(0, 8)}
                            </p>
                          </div>
                        </TableCell>

                        {/* 4. AMOUNT */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-mono text-sm font-black text-foreground">
                              ${Number(sub.amount).toFixed(2)}
                            </p>
                            <p className="font-mono text-[10px] text-muted-foreground">
                              {localCurrency}
                            </p>
                          </div>
                        </TableCell>

                        {/* 5. SUBMITTED AT */}
                        <TableCell>
                          <div className="space-y-0.5 text-xs">
                            <p className="font-bold text-foreground">
                              {new Date(sub.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: '2-digit',
                                year: 'numeric',
                              })}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-medium">
                              {formatRelativeTime(sub.created_at, isAr)}
                            </p>
                          </div>
                        </TableCell>

                        {/* 6. PROOF / RECEIPT */}
                        <TableCell>
                          {sub.proof_image_url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLightboxUrl(sub.proof_image_url || null);
                                setLightboxOpen(true);
                              }}
                              className="h-8 border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold gap-1.5 shadow-xs"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>{isAr ? 'عرض الإيصال' : 'View Receipt'}</span>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground/60 text-xs">{isAr ? 'لا يوجد ملف' : 'No file'}</span>
                          )}
                        </TableCell>

                        {/* 7. VERIFICATION / ACTIONS */}
                        <TableCell className="text-end">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              {/* Approve Button (Solid Green in Image) */}
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedSubmission(sub);
                                  setReviewAction('approve');
                                  setAdminNotes('');
                                  setReviewModalOpen(true);
                                }}
                                className="h-9 bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-xs px-3.5 gap-1.5"
                              >
                                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                <span>{isAr ? 'اعتماد وتفعيل' : 'Approve & Activate'}</span>
                              </Button>

                              {/* Reject Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubmission(sub);
                                  setReviewAction('reject');
                                  setAdminNotes('');
                                  setReviewModalOpen(true);
                                }}
                                className="h-9 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500 text-xs font-bold px-2.5"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{isAr ? 'رفض' : 'Reject'}</span>
                              </Button>
                            </div>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-500 border border-emerald-500/20">
                              <Check className="h-3.5 w-3.5" />
                              <span>{isAr ? 'معتمد ونشط' : 'Approved & Active'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-500 border border-red-500/20">
                              <X className="h-3.5 w-3.5" />
                              <span>{isAr ? 'مرفوض' : 'Rejected'}</span>
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 border-t border-border/60 bg-card text-xs font-semibold text-muted-foreground">
              <span>
                {isAr
                  ? `عرض ${paginatedSubmissions.length} من أصل ${filteredSubmissions.length} حوالة`
                  : `Showing ${paginatedSubmissions.length} of ${filteredSubmissions.length} transfer verifications`}
              </span>
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
                      currentPage === num ? 'bg-emerald-600 text-white' : ''
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
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. Tab 2: Payment Methods Grid (Bank Gateways Manager) */}
      {/* ============================================================ */}
      {activeMainTab === 'methods' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-foreground">
                {isAr ? 'طرق وبوابات الدفع البنكية والمحافظ' : 'Configured Bank Accounts & Wallets'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? 'الحسابات المعروضة للعملاء عند اختيار الدفع اليدوي أثناء ترقية الباقة.'
                  : 'Payment options displayed to customers on the checkout page.'}
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setEditingMethod(null);
                setMethodName('');
                setMethodAccountName('');
                setMethodAccountNumber('');
                setMethodInstructions('');
                setMethodIsActive(true);
                setMethodModalOpen(true);
              }}
              className="bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>{isAr ? 'إضافة طريقة جديدة' : 'Add Method'}</span>
            </Button>
          </div>

          {methods.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
              <Wallet className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-bold text-foreground">
                {isAr ? 'لا توجد أي طرق دفع مضافة بعد' : 'No payment methods configured yet'}
              </p>
              <p className="text-xs text-muted-foreground max-w-md">
                {isAr
                  ? 'أضف حساباتك البنكية (مثل الراجحي، الأهلي) أو محافظك الإلكترونية (مثل زين كاش، STC Pay، فودافون كاش) لتمكين العملاء من التحويل.'
                  : 'Add bank accounts or local wallets to enable manual payments for your customers.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {methods.map((method) => (
                <div
                  key={method.id}
                  className="relative rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <Landmark className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-sm">{method.name}</h4>
                          <p className="text-[11px] text-muted-foreground font-medium">{method.account_name || 'Business Account'}</p>
                        </div>
                      </div>
                      <Badge variant={method.is_active ? 'default' : 'secondary'} className={method.is_active ? 'bg-emerald-600 text-white' : ''}>
                        {method.is_active ? (isAr ? 'مفعل' : 'Active') : (isAr ? 'معطل' : 'Disabled')}
                      </Badge>
                    </div>

                    <div className="rounded-xl bg-muted/40 p-3 text-xs font-mono border border-border/60">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">
                        {isAr ? 'رقم الحساب / الآيبان' : 'Account / IBAN:'}
                      </p>
                      <p className="font-black text-foreground select-all text-xs break-all">
                        {method.account_number}
                      </p>
                    </div>

                    {method.instructions && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {method.instructions}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingMethod(method);
                        setMethodName(method.name);
                        setMethodAccountName(method.account_name || '');
                        setMethodAccountNumber(method.account_number);
                        setMethodInstructions(method.instructions || '');
                        setMethodIsActive(method.is_active);
                        setMethodModalOpen(true);
                      }}
                      className="text-xs font-bold gap-1 text-muted-foreground hover:text-foreground h-8"
                    >
                      <Edit className="h-3.5 w-3.5 text-amber-500" />
                      <span>{isAr ? 'تعديل' : 'Edit'}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(isAr ? 'هل أنت متأكد من حذف طريقة الدفع هذه؟' : 'Delete this payment method?')) return;
                        try {
                          const res = await fetch(`/api/admin/offline-methods/${method.id}`, { method: 'DELETE' });
                          if (!res.ok) throw new Error('Failed to delete');
                          toast.success(isAr ? 'تم الحذف' : 'Method deleted');
                          fetchOfflineData();
                        } catch (err: any) {
                          toast.error(err.message || 'Failed');
                        }
                      }}
                      className="text-xs font-bold text-red-500 hover:bg-red-500/10 h-8"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. Review / Approve / Reject Dialog */}
      {/* ============================================================ */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              {reviewAction === 'approve' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span>{isAr ? 'اعتماد الحوالة وتفعيل الباقة' : 'Approve & Activate Subscription'}</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span>{isAr ? 'رفض إيصال الحوالة' : 'Reject Payment Receipt'}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedSubmission?.owner_name} ({selectedSubmission?.owner_email}) — ${selectedSubmission?.amount}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-muted/40 p-3 text-xs border border-border/60 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isAr ? 'الباقة:' : 'Plan:'}</span>
                <span className="font-bold text-foreground">{selectedSubmission?.plans?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isAr ? 'دورة الفوترة:' : 'Billing Cycle:'}</span>
                <span className="font-bold text-foreground">{selectedSubmission?.billing_cycle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isAr ? 'المبلغ:' : 'Amount:'}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">${selectedSubmission?.amount}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {isAr ? 'ملاحظات الإدارة (اختياري، تظهر للعميل)' : 'Admin Notes (Optional, visible to client)'}
              </Label>
              <Textarea
                placeholder={
                  reviewAction === 'approve'
                    ? isAr
                      ? 'تم تأكيد استلام الحوالة بنجاح وتفعيل الاشتراك...'
                      : 'Payment verified and subscription activated...'
                    : isAr
                    ? 'سبب الرفض: رقم الحوالة غير مطابق، يرجى إعادة إرسال إيصال واضح...'
                    : 'Rejection reason: receipt unreadable or reference mismatched...'
                }
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="text-xs h-20"
              />
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button variant="outline" onClick={() => setReviewModalOpen(false)} disabled={processingAction}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleConfirmReview}
              disabled={processingAction}
              className={
                reviewAction === 'approve'
                  ? 'bg-[#059669] hover:bg-[#047857] text-white font-bold'
                  : 'bg-red-600 hover:bg-red-500 text-white font-bold'
              }
            >
              {processingAction ? (
                <Loader2 className="h-4 w-4 animate-spin me-1.5" />
              ) : reviewAction === 'approve' ? (
                <Check className="h-4 w-4 me-1.5" strokeWidth={3} />
              ) : (
                <X className="h-4 w-4 me-1.5" strokeWidth={3} />
              )}
              {reviewAction === 'approve'
                ? isAr
                  ? 'تأكيد الاعتماد والتفعيل'
                  : 'Confirm & Activate'
                : isAr
                ? 'تأكيد الرفض'
                : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 7. Image Lightbox Modal */}
      {/* ============================================================ */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="sm:max-w-2xl p-4 bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center justify-between">
              <span>{isAr ? 'إثبات الحوالة / الإيصال البنكي' : 'Payment Receipt Proof'}</span>
              {lightboxUrl && (
                <a
                  href={lightboxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
                >
                  <span>{isAr ? 'فتح بالحجم الكامل' : 'Open Full Size'}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex items-center justify-center rounded-xl bg-muted/40 p-2 overflow-hidden max-h-[70vh]">
            {lightboxUrl ? (
              <img
                src={lightboxUrl}
                alt="Receipt Proof"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-sm"
              />
            ) : (
              <p className="text-xs text-muted-foreground">{isAr ? 'لا توجد صورة' : 'No image'}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 8. Add / Edit Payment Method Dialog */}
      {/* ============================================================ */}
      <Dialog open={methodModalOpen} onOpenChange={setMethodModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6 bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-500" />
              {editingMethod
                ? isAr
                  ? 'تعديل طريقة الدفع البنكية'
                  : 'Edit Payment Method'
                : isAr
                ? 'إضافة طريقة دفع / حساب بنكي جديد'
                : 'Add New Payment Method'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isAr
                ? 'الحسابات والمعلومات التي ستظهر للمشتركين عند اختيار الدفع اليدوي.'
                : 'Bank accounts and wallet details displayed to customers at checkout.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMethod} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {isAr ? 'اسم البنك / المحفظة' : 'Method / Bank Name'} <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                placeholder={isAr ? 'مثال: مصرف الراجحي، زين كاش، STC Pay' : 'e.g. Al-Rajhi Bank, ZainCash'}
                value={methodName}
                onChange={(e) => setMethodName(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {isAr ? 'اسم صاحب الحساب' : 'Account Holder Name'}
              </Label>
              <Input
                placeholder={isAr ? 'مثال: شركة الرافدين لتقنية المعلومات' : 'e.g. Acme Corp Ltd'}
                value={methodAccountName}
                onChange={(e) => setMethodAccountName(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {isAr ? 'رقم الحساب / الآيبان / رقم المحفظة' : 'Account Number / IBAN / Wallet #'} <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                placeholder="SA0000000000000000000000 / 07700000000"
                value={methodAccountNumber}
                onChange={(e) => setMethodAccountNumber(e.target.value)}
                className="h-10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {isAr ? 'تعليمات التحويل للعميل' : 'Transfer Instructions'}
              </Label>
              <Textarea
                placeholder={isAr ? 'يرجى كتابة اسم شركتك في خانة الملاحظات ورفع صورة الإشعار هنا...' : 'Include your company name in description and upload clear transfer proof...'}
                value={methodInstructions}
                onChange={(e) => setMethodInstructions(e.target.value)}
                className="text-xs h-20"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
              <div>
                <Label className="text-xs font-bold text-foreground">{isAr ? 'تفعيل الطريقة' : 'Enable Method'}</Label>
                <p className="text-[11px] text-muted-foreground">{isAr ? 'عرض الطريقة للعملاء في صفحة الدفع' : 'Make visible to customers'}</p>
              </div>
              <Switch checked={methodIsActive} onCheckedChange={setMethodIsActive} />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setMethodModalOpen(false)} disabled={savingMethod}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={savingMethod} className="bg-[#059669] hover:bg-[#047857] text-white font-bold">
                {savingMethod ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Check className="h-4 w-4 me-1.5" />}
                {isAr ? 'حفظ الطريقة' : 'Save Method'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
