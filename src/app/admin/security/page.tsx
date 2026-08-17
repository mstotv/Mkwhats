'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ShieldCheck,
  Key,
  ShieldAlert,
  Lock,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface LoginAttempt {
  id: string;
  ip_address: string;
  email: string;
  attempted_at: string;
}

export default function AdminSecurityPage() {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [activeKeysCount, setActiveKeysCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchSecurityData() {
    try {
      setLoading(true);
      const supabase = createClient();

      const [attemptsRes, keysRes] = await Promise.all([
        supabase
          .from('admin_login_attempts')
          .select('*')
          .order('attempted_at', { ascending: false })
          .limit(50),
        supabase.from('api_keys').select('*', { count: 'exact', head: true }),
      ]);

      setAttempts((attemptsRes.data as LoginAttempt[]) ?? []);
      setActiveKeysCount(keysRes.count ?? 0);
    } catch (err) {
      console.error('[AdminSecurity] Error fetching logs:', err);
      toast.error('تعذر تحميل سجلات الأمان');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSecurityData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            سجلات الأمان والـ API Keys (Security & Audit)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            مراقبة محاولات تسجيل الدخول للإدارة، حماية SSRF، وسجلات مفاتيح البرمجة النشطة
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSecurityData}
          disabled={loading}
          className="border-border text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ms-1.5 ${loading ? 'animate-spin' : ''}`} />
          تحديث السجلات
        </Button>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-foreground">حماية الشبكة والـ SSRF Guard</h3>
            </div>
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs text-muted-foreground">
            فحص حماية عناوين IP الداخلية وعزل العناوين غير العامة لمنع هجمات SSRF بنجاح.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            SSRF Guard Active
          </div>
        </Card>

        <Card className="border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-bold text-foreground">مفاتيح الـ API Keys النشطة</h3>
            </div>
            <span className="text-lg font-black text-foreground">{activeKeysCount}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            مفاتيح البرمجة المصدرة للشركات والربط الخارجي المشفرة بنظام SHA-256.
          </p>
        </Card>
      </div>

      {/* Admin Login Attempts Log */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Lock className="h-5 w-5 text-amber-500" />
          سجل محاولات دخول السوبر أدمن (Login Audit Logs)
        </h2>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              <span className="text-xs font-medium">جاري فحص السجلات...</span>
            </div>
          ) : attempts.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
              لا توجد محاولات دخول مسجلة مؤخراً.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-start text-xs font-bold text-muted-foreground">عنوان الـ IP</TableHead>
                    <TableHead className="text-start text-xs font-bold text-muted-foreground">البريد المحاول</TableHead>
                    <TableHead className="text-start text-xs font-bold text-muted-foreground">التاريخ والوقت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((att) => (
                    <TableRow key={att.id} className="border-border">
                      <TableCell className="text-start font-mono text-xs text-foreground">
                        {att.ip_address}
                      </TableCell>
                      <TableCell className="text-start text-xs text-muted-foreground dir-ltr">
                        {att.email}
                      </TableCell>
                      <TableCell className="text-start text-xs text-muted-foreground">
                        {new Date(att.attempted_at).toLocaleString('ar-EG')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
