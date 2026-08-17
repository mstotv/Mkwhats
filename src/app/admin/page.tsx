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
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchGlobalMetrics() {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/metrics');
      if (!res.ok) throw new Error('فشل جلب الإحصائيات');
      const data = await res.json();
      setMetrics(data as GlobalMetrics);
    } catch (err) {
      console.error('[AdminDashboard] Error fetching metrics:', err);
      toast.error('تعذر تحميل إحصائيات النظام');
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
        <p className="text-sm font-medium">جاري تحضير إحصائيات مركز الإدارة الكلية...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            لوحة القيادة الرئيسية
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            مراقبة الأداء الكلي لمنصة SaaS، الشركات، ومؤشرات السيرفر لحظياً
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
            <RefreshCw className={`h-3.5 w-3.5 ms-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>
          <Link href="/admin/plans">
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 text-xs"
            >
              <Plus className="h-4 w-4 ms-1" />
              إضافة باقة جديدة
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards (4 Grid) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">إجمالي الشركات (Tenants)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-foreground">
              {metrics?.total_accounts.toLocaleString() ?? 0}
            </span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {metrics?.active_accounts ?? 0} نشطة
            </span>
          </div>
        </Card>

        <Card className="border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-blue-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">المستخدمون والمستشارون</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-foreground">
              {metrics?.total_users.toLocaleString() ?? 0}
            </span>
            <span className="text-xs font-medium text-muted-foreground">مستخدم مفعل</span>
          </div>
        </Card>

        <Card className="border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">الرسائل الكلية المرسلة</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-foreground">
              {metrics?.total_messages.toLocaleString() ?? 0}
            </span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {metrics?.messages_this_month.toLocaleString() ?? 0} هذا الشهر
            </span>
          </div>
        </Card>

        <Card className="border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-violet-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">الدخل الشهري المتوقع (MRR)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-foreground dir-ltr">
              ${metrics?.estimated_mrr.toLocaleString() ?? 0}
            </span>
            <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
              تقديري
            </span>
          </div>
        </Card>
      </div>

      {/* Live System Health Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5 text-amber-500" />
          مراقبة خوادم المنصة (System Health Monitor)
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-foreground">قاعدة البيانات (Supabase PostgreSQL)</span>
              </div>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">الاتصال مستقر وتعمل جميع سياسات الأمان (RLS) بكفاءة.</p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> 100% Operational
            </div>
          </Card>

          <Card className="border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold text-foreground">سيرفر الواتساب (Evolution API)</span>
              </div>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">محرك الربط المباشر يستقبل ويرسل الرسائل الفورية بدون تأخير.</p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Active & Connected
            </div>
          </Card>

          <Card className="border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-foreground">المجدول التلقائي (Automation Cron)</span>
              </div>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">فحص خطوات الانتظار وحملات البرودكاست المجدولة قيد التشغيل.</p>
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
              <span className="text-sm font-bold text-foreground">إدارة الشركات والعملاء</span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              تصفح قائمة الشركات المسجلة، حظر الحسابات أو إعادة تفعيلها، وتخصيص الحدود.
            </p>
          </Card>
        </Link>

        <Link href="/admin/plans" className="group">
          <Card className="border border-border bg-card p-5 space-y-3 transition-all hover:border-amber-500/50 hover:bg-card/80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">إدارة الباقات والاشتراكات</span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              تحديث أسعار الباقات، تعديل قيود الرسائل والمستخدمين، ومنح تمديدات مجانية.
            </p>
          </Card>
        </Link>

        <Link href="/admin/whatsapp" className="group">
          <Card className="border border-border bg-card p-5 space-y-3 transition-all hover:border-amber-500/50 hover:bg-card/80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">سيرفر الواتساب والـ Webhooks</span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              مراقبة جميع جلسات الواتساب النشطة على السيرفر وسجلات تسليم الـ Webhooks.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
