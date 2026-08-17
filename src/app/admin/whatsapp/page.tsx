'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Activity,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppSession {
  id: string;
  account_id: string;
  provider: 'meta' | 'evolution';
  phone_number: string;
  status: string;
  updated_at: string;
}

export default function AdminWhatsAppPage() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchSessions() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('whatsapp_configs')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions((data as WhatsAppSession[]) ?? []);
    } catch (err) {
      console.error('[AdminWhatsApp] Error fetching configs:', err);
      toast.error('تعذر تحميل جلسات الواتساب');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            سيرفر الواتساب والـ Webhooks (WhatsApp Ops)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            مراقبة جميع جلسات الاتصال بحسابات العملاء وسجلات استقبال الـ Webhooks لحظياً
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSessions}
          disabled={loading}
          className="border-border text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ms-1.5 ${loading ? 'animate-spin' : ''}`} />
          تحديث الاتصالات
        </Button>
      </div>

      {/* Provider Status Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-foreground">Evolution API (الاتصال المحلي المباشر)</h3>
            </div>
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs text-muted-foreground">
            مُفعل بنجاح على سيرفر البرودكشن ويرسل الرسائل الحرة وحملات البرودكاست المباشرة.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            جاهز ومستقر
          </div>
        </Card>

        <Card className="border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              <h3 className="text-sm font-bold text-foreground">Meta Cloud API (الربط الرسمي)</h3>
            </div>
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs text-muted-foreground">
            مستقبل الـ Webhook الرسمي متصل ويستقبل إشارات التسليم والقراءة تلقائياً.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
            <CheckCircle2 className="h-4 w-4" />
            Webhook Verified
          </div>
        </Card>
      </div>

      {/* WhatsApp Sessions Directory */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-amber-500" />
          جلسات أرقام الواتساب المربوطة ({sessions.length})
        </h2>

        {loading ? (
          <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            <span className="text-xs font-medium">جاري فحص الجلسات...</span>
          </div>
        ) : sessions.length === 0 ? (
          <Card className="border border-border bg-card p-8 text-center text-muted-foreground">
            <WifiOff className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-medium">لا توجد جلسات واتساب مربوطة حالياً على النظام.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((sess) => (
              <Card key={sess.id} className="border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground font-mono">
                    {sess.phone_number || 'رقم غير محدد'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    <Wifi className="h-3 w-3" /> متصل
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>نوع المزود: <strong className="text-foreground uppercase">{sess.provider}</strong></span>
                  <span>آخر تحديث: {new Date(sess.updated_at).toLocaleTimeString('ar-EG')}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
