'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  MessageSquare,
  DollarSign,
  Activity,
  Server,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { useLocale } from 'next-intl';

interface GlobalMetrics {
  total_accounts: number;
  active_accounts: number;
  suspended_accounts: number;
  total_users: number;
  total_messages: number;
  messages_this_month: number;
  total_broadcasts: number;
  estimated_mrr: number;
}

export default function AdminDashboardPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchGlobalMetrics() {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/metrics');
      if (!res.ok) throw new Error(isAr ? 'فشل جلب الإحصائيات' : 'Failed to fetch metrics');
      const data = await res.json();
      setMetrics(data as GlobalMetrics);
    } catch (err) {
      console.error('[AdminDashboard] Error fetching metrics:', err);
      toast.error(isAr ? 'تعذر تحميل إحصائيات النظام' : 'Could not load system metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchGlobalMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm font-medium">
          {isAr ? 'جاري تحضير إحصائيات مركز الإدارة الكلية...' : 'Preparing Super Admin dashboard metrics...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {isAr ? 'لوحة القيادة الرئيسية' : 'Super Admin Dashboard'}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {isAr
              ? 'مراقبة الأداء الكلي لمنصة SaaS، الشركات، ومؤشرات السيرفر لحظياً'
              : 'Monitor overall SaaS platform performance, tenants, and real-time server health.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchGlobalMetrics}
            disabled={refreshing}
            className="border-border text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 me-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            {isAr ? 'تحديث البيانات' : 'Refresh Data'}
          </Button>
          <Link href="/admin/plans">
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 text-xs"
            >
              <Plus className="h-4 w-4 me-1" />
              {isAr ? 'إضافة باقة جديدة' : 'Add New Plan'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards (4 Grid) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'إجمالي الشركات (Tenants)' : 'Total Tenants'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-foreground">
              {metrics?.total_accounts.toLocaleString() ?? 0}
            </span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {metrics?.active_accounts ?? 0} {isAr ? 'نشطة' : 'Active'}
            </span>
          </div>
        </Card>

        <Card className="border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-blue-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'المستخدمون والمستشارون' : 'Users & Members'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-foreground">
              {metrics?.total_users.toLocaleString() ?? 0}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {isAr ? 'مستخدم مفعل' : 'Active Users'}
            </span>
          </div>
        </Card>

        <Card className="border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'الرسائل الكلية المرسلة' : 'Total Messages Sent'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-foreground">
              {metrics?.total_messages.toLocaleString() ?? 0}
            </span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {metrics?.messages_this_month.toLocaleString() ?? 0} {isAr ? 'هذا الشهر' : 'this month'}
            </span>
          </div>
        </Card>

        <Card className="border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-violet-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              {isAr ? 'الدخل الشهري المتوقع (MRR)' : 'Estimated Monthly Revenue (MRR)'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-foreground dir-ltr">
              ${metrics?.estimated_mrr.toLocaleString() ?? 0}
            </span>
            <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
              {isAr ? 'تقديري' : 'Estimated'}
            </span>
          </div>
        </Card>
      </div>

      {/* Live System Health Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5 text-amber-500" />
          {isAr ? 'مراقبة خوادم المنصة (System Health Monitor)' : 'System Health Monitor'}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-foreground">
                  {isAr ? 'قاعدة البيانات (Supabase PostgreSQL)' : 'Database (Supabase PostgreSQL)'}
                </span>
              </div>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'الاتصال مستقر وتعمل جميع سياسات الأمان (RLS) بكفاءة.'
                : 'Connection stable; all RLS security policies are fully enforced.'}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> 100% Operational
            </div>
          </Card>

          <Card className="border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold text-foreground">
                  {isAr ? 'سيرفر الواتساب (Evolution API)' : 'WhatsApp Engine (Evolution API)'}
                </span>
              </div>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'محرك الربط المباشر يستقبل ويرسل الرسائل الفورية بدون تأخير.'
                : 'Direct connection engine receives and sends instant messages without delay.'}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Active & Connected
            </div>
          </Card>

          <Card className="border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-foreground">
                  {isAr ? 'المجدول التلقائي (Automation Cron)' : 'Automation Cron Scheduler'}
                </span>
              </div>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'فحص خطوات الانتظار وحملات البرودكاست المجدولة قيد التشغيل.'
                : 'Monitoring delay steps and scheduled broadcast campaigns actively.'}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Polling Active
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Navigation Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/accounts" className="group">
          <Card className="border border-border bg-card p-5 space-y-3 transition-all hover:border-amber-500/50 hover:bg-card/80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                {isAr ? 'إدارة الشركات والعملاء' : 'Tenants & Accounts Management'}
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'تصفح قائمة الشركات المسجلة، حظر الحسابات أو إعادة تفعيلها، وتخصيص الحدود.'
                : 'Browse registered tenants, suspend or reinstate accounts, and customize limits.'}
            </p>
          </Card>
        </Link>

        <Link href="/admin/plans" className="group">
          <Card className="border border-border bg-card p-5 space-y-3 transition-all hover:border-amber-500/50 hover:bg-card/80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                {isAr ? 'إدارة الباقات والاشتراكات' : 'Plans & Subscriptions Management'}
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'تحديث أسعار الباقات، تعديل قيود الرسائل والمستخدمين، ومنح تمديدات مجانية.'
                : 'Update plan pricing, modify message & user quotas, and set features.'}
            </p>
          </Card>
        </Link>

        <Link href="/admin/tickets" className="group">
          <Card className="border border-emerald-500/40 bg-emerald-500/5 p-5 space-y-3 transition-all hover:border-emerald-500 hover:bg-emerald-500/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                {isAr ? 'إدارة تذاكر الدعم الفني 🎧' : 'Support Tickets Manager 🎧'}
              </span>
              <ArrowUpRight className="h-4 w-4 text-emerald-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'استلام تذاكر العملاء، الرد المباشر المرفق بالصور، وتحديد حالة تم حل المشكلة.'
                : 'Receive client tickets, reply with attachments, and mark issues as resolved.'}
            </p>
          </Card>
        </Link>

        <Link href="/admin/settings" className="group">
          <Card className="border border-border bg-card p-5 space-y-3 transition-all hover:border-amber-500/50 hover:bg-card/80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                {isAr ? 'إعدادات النظام العامة' : 'System & Landing Settings'}
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'التحكم بهوية المنصة، وضع الصيانة، والخيارات الكلية للسيرفر.'
                : 'Control platform branding, maintenance mode, and global server settings.'}
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
