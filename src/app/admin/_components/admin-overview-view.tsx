'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DollarSign,
  RotateCw,
  Clock,
  MessageSquare,
  Building2,
  CheckCircle2,
  UserPlus,
  RefreshCw,
  Plus,
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Smartphone,
  Cpu,
  Bot,
  UserCheck,
  Users,
  ShieldCheck,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import Link from 'next/link';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

export interface OverviewMetricsData {
  financials: {
    total_revenue: number;
    estimated_mrr: number;
    pending_offline_count: number;
    pending_offline_amount: number;
    approved_offline_count: number;
    approved_offline_amount: number;
    revenue_growth_pct: number;
    mrr_growth_pct: number;
  };
  accounts: {
    total_accounts: number;
    active_accounts: number;
    suspended_accounts: number;
    active_rate_pct: number;
    signups_last_7_days: number;
    signups_prev_7_days: number;
    signups_growth_pct: number;
    paid_subscribers_count: number;
    free_subscribers_count: number;
  };
  whatsapp: {
    evolution_connected_count: number;
    meta_connected_count: number;
    disconnected_count: number;
    active_instances: number;
    capacity_total: number;
    capacity_rate_pct: number;
  };
  messaging: {
    total_messages: number;
    messages_last_30_days: number;
    incoming_customer_messages: number;
    bot_replies: number;
    agent_replies: number;
    total_replied_messages: number;
    delivery_rate_pct: number;
    total_contacts: number;
    contacts_added_last_7_days: number;
  };
  plans_distribution: Array<{
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    subscribers_count: number;
    percentage: number;
  }>;
  growth_timeline: Array<{
    date: string;
    label: string;
    signups: number;
    messages: number;
  }>;
}

function formatLargeNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2).replace(/\.00$/, '') + 'M';
  }
  if (num >= 10_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}

function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="rounded-xl bg-slate-950/95 border border-slate-800 text-slate-100 p-2.5 shadow-2xl backdrop-blur-md text-xs font-sans">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-200">{label}:</span>
          <span className="font-mono text-emerald-400 font-extrabold">
            {val} {val === 1 ? 'New Account' : 'New Accounts'}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function AdminOverviewView() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [data, setData] = useState<OverviewMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'7' | '14' | '30' | '90'>('14');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Add Account Modal State
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [isSubmitting, startSubmitting] = useTransition();
  const [newAccName, setNewAccName] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccPassword, setNewAccPassword] = useState('');
  const [newAccPlanId, setNewAccPlanId] = useState('');

  async function fetchMetrics(range = selectedRange) {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/admin/metrics?range=${range}`);
      if (!res.ok) throw new Error('Failed to fetch overview metrics');
      const json = await res.json();
      setData(json as OverviewMetricsData);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('[AdminOverview] Error fetching data:', err);
      toast.error(isAr ? 'تعذر تحميل إحصائيات لوحة التحكم' : 'Could not fetch overview metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchMetrics(selectedRange);
  }, [selectedRange]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim() || !newAccEmail.trim()) {
      toast.error(isAr ? 'يرجى إدخال اسم الشركة والبريد الإلكتروني' : 'Please provide account name and email');
      return;
    }

    startSubmitting(async () => {
      try {
        const res = await fetch('/api/admin/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newAccName.trim(),
            email: newAccEmail.trim(),
            password: newAccPassword.trim() || 'MkWhats12345!',
            plan_id: newAccPlanId || undefined,
          }),
        });

        const resJson = await res.json();
        if (!res.ok) {
          throw new Error(resJson.error || 'Failed to create account');
        }

        toast.success(isAr ? `تم إنشاء حساب ${newAccName} بنجاح!` : `Account ${newAccName} created successfully!`);
        setAddAccountOpen(false);
        setNewAccName('');
        setNewAccEmail('');
        setNewAccPassword('');
        setNewAccPlanId('');
        fetchMetrics(selectedRange);
      } catch (err: any) {
        toast.error(err.message || 'Failed to create account');
      }
    });
  };

  if (loading && !data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-muted-foreground">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute h-12 w-12 rounded-full border-2 border-amber-500/20 animate-ping" />
          <RotateCw className="h-6 w-6 animate-spin text-amber-500" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-foreground">
          {isAr ? 'جاري تجهيز مقاييس لوحة القيادة الشاملة...' : 'Loading comprehensive overview metrics...'}
        </p>
      </div>
    );
  }

  const fin = data?.financials || {
    total_revenue: 0,
    estimated_mrr: 0,
    pending_offline_count: 0,
    pending_offline_amount: 0,
    approved_offline_count: 0,
    approved_offline_amount: 0,
    revenue_growth_pct: 0,
    mrr_growth_pct: 0,
  };

  const acc = data?.accounts || {
    total_accounts: 0,
    active_accounts: 0,
    suspended_accounts: 0,
    active_rate_pct: 0,
    signups_last_7_days: 0,
    signups_prev_7_days: 0,
    signups_growth_pct: 0,
    paid_subscribers_count: 0,
    free_subscribers_count: 0,
  };

  const wa = data?.whatsapp || {
    evolution_connected_count: 0,
    meta_connected_count: 0,
    disconnected_count: 0,
    active_instances: 0,
    capacity_total: 250,
    capacity_rate_pct: 0,
  };

  const msg = data?.messaging || {
    total_messages: 0,
    messages_last_30_days: 0,
    incoming_customer_messages: 0,
    bot_replies: 0,
    agent_replies: 0,
    total_replied_messages: 0,
    delivery_rate_pct: 100,
    total_contacts: 0,
    contacts_added_last_7_days: 0,
  };

  const plans = data?.plans_distribution || [];
  const chartData = data?.growth_timeline || [];

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* 1. Header Section (Pixel Perfect to Image) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {isAr ? 'نظرة عامة' : 'Overview'}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm font-medium">
            {isAr
              ? 'مراقبة أداء المنصة الكلي، نمو الإيرادات، ومؤشرات خدمة خوادم الواتساب'
              : 'Track platform performance summary, revenue growth and WhatsApp service health'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMetrics(selectedRange)}
            disabled={refreshing}
            className="h-10 border-border bg-card px-3.5 text-xs font-semibold hover:bg-muted/80 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 me-2 ${refreshing ? 'animate-spin text-amber-500' : 'text-muted-foreground'}`} />
            {isAr ? 'تحديث' : 'Refresh'}
            {lastUpdated && <span className="ms-1.5 text-[10px] text-muted-foreground hidden sm:inline">({lastUpdated})</span>}
          </Button>

          {/* + Add Account Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddAccountOpen(true)}
            className="h-10 border-border/80 bg-card px-4 text-xs font-bold text-foreground hover:bg-muted/80 shadow-xs gap-1.5"
          >
            <Plus className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />
            <span>{isAr ? 'إضافة حساب' : 'Add Account'}</span>
          </Button>

          {/* Manage Accounts Button (Orange/Amber in image) */}
          <Link href="/admin/accounts">
            <Button
              size="sm"
              className="h-10 bg-[#f59e0b] hover:bg-[#d97706] font-bold text-slate-950 px-5 text-xs shadow-md shadow-amber-500/20 gap-2 transition-all"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{isAr ? 'إدارة الحسابات' : 'Manage Accounts'}</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Actionable Banner for Pending Transfers */}
      {fin.pending_offline_count > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground sm:text-sm">
                {isAr
                  ? `يوجد ${fin.pending_offline_count} طلب تحويل بنكي معلق بانتظار المراجعة والاعتماد بمبلغ إجمالي $${fin.pending_offline_amount.toLocaleString()}`
                  : `You have ${fin.pending_offline_count} pending bank transfer receipt(s) totaling $${fin.pending_offline_amount.toLocaleString()} awaiting approval.`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isAr ? 'قم بمراجعة إيصالات الدفع لتفعيل باقات المشتركين فورياً' : 'Review uploaded proof receipts to activate subscribers subscriptions promptly.'}
              </p>
            </div>
          </div>
          <Link href="/admin/offline-payments">
            <Button size="sm" className="bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-bold shrink-0">
              {isAr ? 'مراجعة الحوالات الآن' : 'Review Receipts Now'}
              <ArrowRight className="h-3.5 w-3.5 ms-1 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. KPI Cards Row 1 (Financials & WhatsApp Messages) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Revenue */}
        <Card className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <DollarSign className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              ${fin.total_revenue.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-bold text-emerald-500 border border-emerald-500/20">
              <TrendingUp className="h-3 w-3" />
              <span>{fin.revenue_growth_pct >= 0 ? `+${fin.revenue_growth_pct}%` : `${fin.revenue_growth_pct}%`}</span>
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            {isAr ? 'إجمالي دخل المنصة المحصل' : 'All-time platform revenue'}
          </p>
        </Card>

        {/* Card 2: Monthly Recurring (MRR) */}
        <Card className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-blue-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'الدخل الشهري المتكرر (MRR)' : 'Monthly Recurring (MRR)'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
              <RotateCw className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              ${fin.estimated_mrr.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-bold text-emerald-500 border border-emerald-500/20">
              <TrendingUp className="h-3 w-3" />
              <span>{fin.mrr_growth_pct >= 0 ? `+${fin.mrr_growth_pct}%` : `${fin.mrr_growth_pct}%`}</span>
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            {isAr ? 'دورة الفوترة الشهرية الحالية' : 'Current billing cycle'}
          </p>
        </Card>

        {/* Card 3: Pending Offline Transfers (Distinct Amber Style) */}
        <Card className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-card p-5 shadow-xs transition-all hover:border-amber-500 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'الحوالات المعلقة (أوفلاين)' : 'Pending Offline Transfers'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-amber-500 font-mono">
              ${fin.pending_offline_amount.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              ({fin.pending_offline_count} {isAr ? 'طلبات' : 'reqs'})
            </span>
            <Link
              href="/admin/offline-payments"
              className="text-xs font-bold text-amber-500 hover:text-amber-400 hover:underline flex items-center gap-1 ms-auto"
            >
              <span>{isAr ? 'مراجعة الطلبات' : 'Review reqs'}</span>
              <span className="text-[13px]">⇒</span>
            </Link>
          </div>
          <p className="mt-2 text-xs text-amber-500/90 font-medium">
            {isAr ? 'إيصالات بنكية بانتظار الاعتماد' : 'Bank receipts requiring approval'}
          </p>
        </Card>

        {/* Card 4: WhatsApp Messages */}
        <Card className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-teal-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'رسائل الواتساب الكلية' : 'WhatsApp Messages'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/10 text-teal-500">
              <MessageSquare className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              {formatLargeNumber(msg.total_messages)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-bold text-emerald-500 border border-emerald-500/20">
              <span>{msg.delivery_rate_pct}%</span>
              <span className="text-[10px]">ok</span>
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            {isAr ? 'المرسلة في آخر 30 يوماً' : 'Dispatched in past 30 days'}
          </p>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* 3. KPI Cards Row 2 (Accounts, Instances, Signups) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 5: Total Accounts */}
        <Card className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-slate-400/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'إجمالي الحسابات والشركات' : 'Total Accounts'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <Building2 className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              {acc.total_accounts.toLocaleString()}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            {isAr
              ? `كافة الحسابات المسجلة (+${acc.signups_last_7_days} هذا الأسبوع)`
              : `All registered accounts (+${acc.signups_last_7_days} this week)`}
          </p>
        </Card>

        {/* Card 6: Active Accounts */}
        <Card className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'الحسابات النشطة' : 'Active Accounts'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              {acc.active_accounts.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-500">
              {acc.active_rate_pct}% {isAr ? 'نسبة' : 'rate'}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            {isAr ? 'الاشتراكات الفعالة والتجريبية الحالية' : 'Currently active paid & trial subscriptions'}
          </p>
        </Card>

        {/* Card 7: Active WhatsApp Instances (with Progress Bar) */}
        <Card className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'سيرفرات الواتساب النشطة' : 'Active WhatsApp Instances'}
            </span>
            <span className="text-xs font-mono font-bold text-muted-foreground">
              {wa.active_instances} / {wa.capacity_total}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              {wa.capacity_rate_pct}%
            </span>
          </div>
          {/* Progress Bar (Matching Image) */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, wa.capacity_rate_pct)}%` }}
            />
          </div>
        </Card>

        {/* Card 8: Signups (Last 7 Days) */}
        <Card className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'التسجيلات (آخر 7 أيام)' : 'Signups (Last 7 Days)'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <UserPlus className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
              {acc.signups_last_7_days}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-bold text-emerald-500 border border-emerald-500/20">
              <TrendingUp className="h-3 w-3" />
              <span>{acc.signups_growth_pct >= 0 ? `+${acc.signups_growth_pct}%` : `${acc.signups_growth_pct}%`}</span>
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            {isAr ? 'مقارنة بالأسبوع السابق' : 'Compared to previous week'}
          </p>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* 4. Main Chart & Plan Subscriptions Section (Matching Image) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Account Registration & Growth Chart (8 Cols) */}
        <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/40">
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                  {isAr
                    ? `نمو وتسجيل الحسابات (آخر ${selectedRange} يوماً)`
                    : `Account Registration & Growth (Last ${selectedRange} Days)`}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {isAr
                    ? 'وتيرة تسجيل الحسابات اليومية وتفعيل قنوات الواتساب'
                    : 'Daily registered accounts versus WhatsApp activation velocity'}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* Period Switcher [7D, 14D, 30D, 90D] */}
                <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5 text-xs font-bold">
                  {(['7', '14', '30', '90'] as const).map((rng) => (
                    <button
                      key={rng}
                      type="button"
                      onClick={() => setSelectedRange(rng)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        selectedRange === rng
                          ? 'bg-card text-foreground shadow-xs font-extrabold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {rng}D
                    </button>
                  ))}
                </div>

                {/* Badge: Daily Signups */}
                <Badge variant="outline" className="text-[11px] font-bold border-border/80 bg-muted/20 px-2.5 py-1">
                  {isAr ? 'التسجيلات اليومية' : 'Daily Signups'}
                </Badge>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="mt-6 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-border/50"
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    className="text-muted-foreground font-medium"
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    className="text-muted-foreground font-medium"
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="signups"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#growthAreaGradient)"
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#020617', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/40 text-xs text-muted-foreground font-medium">
            <span>{isAr ? 'البيانات محدثة لحظياً من قاعدة البيانات' : 'Real-time telemetry aggregated directly from Supabase'}</span>
            <span className="font-bold text-foreground font-mono">
              {acc.signups_last_7_days} {isAr ? 'حساب جديد هذا الأسبوع' : 'New accounts this week'}
            </span>
          </div>
        </Card>

        {/* Right Column: Plan Subscriptions (4 Cols) */}
        <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                {isAr ? 'اشتراكات الباقات' : 'Plan Subscriptions'}
              </h3>
              <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20 text-[11px] font-bold">
                {isAr ? 'توزيع حي' : 'Live Distribution'}
              </Badge>
            </div>

            {/* Plan Rows */}
            <div className="mt-6 space-y-6">
              {plans.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  {isAr ? 'لا توجد بيانات باقات حالياً' : 'No subscription data available yet'}
                </div>
              ) : (
                plans.map((p, idx) => {
                  const colors = [
                    { bar: 'bg-emerald-500', text: 'text-emerald-500' },
                    { bar: 'bg-blue-500', text: 'text-blue-500' },
                    { bar: 'bg-amber-500', text: 'text-amber-500' },
                    { bar: 'bg-purple-500', text: 'text-purple-500' },
                  ];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={p.id} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">
                          {p.name} {p.price_monthly > 0 ? `($${p.price_monthly}/mo)` : '($0 Free)'}
                        </span>
                        <span className="font-mono font-bold text-muted-foreground">
                          <span className="text-foreground font-black">{p.percentage}%</span> ({p.subscribers_count} {isAr ? 'مستخدم' : 'users'})
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${color.bar} transition-all duration-500`}
                          style={{ width: `${Math.min(100, p.percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Paid vs Free Summary Pill at Bottom */}
          <div className="mt-6 rounded-xl border border-border/80 bg-muted/30 p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-muted-foreground">{isAr ? 'المشتركون بالدفع:' : 'Paid Subscribers:'}</span>
              <span className="font-bold text-foreground font-mono">{acc.paid_subscribers_count}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span className="font-semibold text-muted-foreground">{isAr ? 'الخطة المجانية:' : 'Free Tier:'}</span>
              <span className="font-bold text-foreground font-mono">{acc.free_subscribers_count}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* 5. Deep-Dive Section: Dual WhatsApp Connection & CRM Stats */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Card: Dual WhatsApp Connection Engine Breakdown */}
        <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {isAr ? 'محرك الربط المزدوج بالواتساب' : 'Dual WhatsApp Connection Engine'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'توزيع طرق الاتصال بين Evolution API و Meta Cloud API' : 'Connection method split between Evolution API and Meta Cloud API'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-border text-xs font-bold">
              {wa.active_instances} {isAr ? 'متصل' : 'Connected'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Evolution API Box */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2 text-center">
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Cpu className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-foreground">Evolution API</p>
              <p className="text-2xl font-black text-emerald-500 font-mono">{wa.evolution_connected_count}</p>
              <p className="text-[11px] text-muted-foreground">{isAr ? 'ربط QR Code مباشر' : 'Direct QR Session'}</p>
            </div>

            {/* Meta Cloud API Box */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2 text-center">
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-foreground">Meta Cloud API</p>
              <p className="text-2xl font-black text-blue-500 font-mono">{wa.meta_connected_count}</p>
              <p className="text-[11px] text-muted-foreground">{isAr ? 'رسمي من ميتا' : 'Official Cloud API'}</p>
            </div>

            {/* Disconnected / Pending Box */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-2 text-center">
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-foreground">{isAr ? 'غير متصل' : 'Disconnected'}</p>
              <p className="text-2xl font-black text-foreground font-mono">{wa.disconnected_count}</p>
              <p className="text-[11px] text-muted-foreground">{isAr ? 'لم يربط بعد' : 'Pending WhatsApp'}</p>
            </div>
          </div>
        </Card>

        {/* Right Card: CRM & Inbound vs Outbound Messages */}
        <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {isAr ? 'نشاط المراسلة وجهات الاتصال (CRM Activity)' : 'CRM & Messaging Activity'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'تحليل الرسائل الواردة وردود البوت والموظفين' : 'Incoming customer messages vs AI bot and agent replies'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-border text-xs font-bold">
              {msg.total_contacts.toLocaleString()} {isAr ? 'جهة اتصال' : 'Contacts'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Customer Inbound */}
            <div className="rounded-xl border border-border/80 bg-card p-3.5 text-center space-y-1">
              <p className="text-[11px] font-bold text-muted-foreground">{isAr ? 'وارد العملاء' : 'Customer Inbound'}</p>
              <p className="text-xl font-black text-foreground font-mono">{msg.incoming_customer_messages.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? 'رسائل زبائن' : 'Inbound Msgs'}</p>
            </div>

            {/* AI / Bot Replies */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-center space-y-1">
              <p className="text-[11px] font-bold text-amber-500">{isAr ? 'ردود الذكاء الآلي' : 'AI / Bot Replies'}</p>
              <p className="text-xl font-black text-amber-500 font-mono">{msg.bot_replies.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? 'رد آلي 24/7' : 'Auto-pilot'}</p>
            </div>

            {/* Agent Human Replies */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-center space-y-1">
              <p className="text-[11px] font-bold text-blue-500">{isAr ? 'ردود الموظفين' : 'Agent Replies'}</p>
              <p className="text-xl font-black text-blue-500 font-mono">{msg.agent_replies.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? 'تدخل بشري' : 'Human support'}</p>
            </div>

            {/* Total CRM Contacts */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-center space-y-1">
              <p className="text-[11px] font-bold text-emerald-500">{isAr ? 'جهات الاتصال' : 'Total Contacts'}</p>
              <p className="text-xl font-black text-emerald-500 font-mono">{msg.total_contacts.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">+{msg.contacts_added_last_7_days} {isAr ? 'هذا الأسبوع' : 'this week'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* 6. Add Account Modal Dialog */}
      {/* ============================================================ */}
      <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              {isAr ? 'إضافة حساب / شركة جديدة' : 'Add New Account / Tenant'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isAr
                ? 'إنشاء مستأجر جديد في المنصة مع تعيين المالك والباقة المبدئية مباشرة.'
                : 'Create a new tenant account and assign the owner email and initial plan directly.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAccount} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {isAr ? 'اسم الشركة / الحساب' : 'Account / Company Name'} <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                placeholder={isAr ? 'مثال: شركة النخبة للتجارة' : 'e.g. Acme Corp'}
                value={newAccName}
                onChange={(e) => setNewAccName(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {isAr ? 'بريد مالك الحساب' : 'Owner Email'} <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                required
                placeholder="owner@company.com"
                value={newAccEmail}
                onChange={(e) => setNewAccEmail(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {isAr ? 'كلمة المرور المبدئية (اختياري)' : 'Initial Password (Optional)'}
              </Label>
              <Input
                type="text"
                placeholder={isAr ? 'افتراضي: MkWhats12345!' : 'Default: MkWhats12345!'}
                value={newAccPassword}
                onChange={(e) => setNewAccPassword(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {isAr ? 'خطة الاشتراك المبدئية' : 'Initial Subscription Plan'}
              </Label>
              <select
                value={newAccPlanId}
                onChange={(e) => setNewAccPlanId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{isAr ? 'الباقة المجانية الافتراضية (Free)' : 'Default Free Plan'}</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.price_monthly > 0 ? `($${p.price_monthly}/mo)` : '($0)'}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddAccountOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 text-xs"
              >
                {isSubmitting ? (
                  <RotateCw className="h-3.5 w-3.5 animate-spin me-1.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5 me-1.5" />
                )}
                {isAr ? 'إنشاء الحساب الآن' : 'Create Account Now'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
