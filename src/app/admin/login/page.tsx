'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldAlert, Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();

      // 1. Sign in with password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'بيانات الدخول غير صحيحة');
      }

      // 2. Verify platform_admins membership
      const { data: adminRow, error: adminErr } = await supabase
        .from('platform_admins')
        .select('user_id')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (adminErr || !adminRow) {
        // Sign out immediately if not a super admin
        await supabase.auth.signOut();
        throw new Error('عذراً، هذا الحساب لا يملك صلاحيات مدير النظام الكلي (Super Admin).');
      }

      toast.success('مرحباً بك في لوحة تحكم السوبر أدمن');
      router.push('/admin');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل تسجيل الدخول';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
            <ShieldAlert className="h-8 w-8 text-slate-950" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">تسجيل دخول السوبر أدمن</h1>
          <p className="text-xs text-muted-foreground">
            لوحة التحكم الكلية وإدارة منظمات السيرفر
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">البريد الإلكتروني للإدارة</label>
            <div className="relative">
              <Mail className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="admin@wacrm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ps-9 bg-background border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ps-9 bg-background border-border"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 py-2.5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
            دخول مركز الإدارة الكلية
          </Button>
        </form>

        <div className="pt-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 ms-1" />
            العودة لتسجيل الدخول العادي
          </Button>
        </div>
      </div>
    </div>
  );
}
