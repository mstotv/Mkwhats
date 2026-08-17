import { createClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'مركز الإدارة الكلية — Super Admin',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not signed in at all -> redirect to /admin/login
  if (!user) {
    redirect('/admin/login');
  }

  // Check if user is in platform_admins using service client (bypasses RLS)
  let isAdmin = false;
  try {
    const { createServiceClient } = await import('@/lib/supabase/service');
    const serviceClient = createServiceClient();
    const { data: adminRow } = await serviceClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminRow) isAdmin = true;
  } catch (err) {
    console.error('[AdminLayout] Service client admin check error:', err);
  }

  // If signed in but not a super admin, show friendly Access Denied screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background font-sans text-foreground flex items-center justify-center p-4">
        <div className="w-full max-w-xl space-y-6 rounded-2xl border border-red-500/30 bg-card p-6 sm:p-8 shadow-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">عذراً، لا تملك صلاحية Super Admin</h1>
            <p className="text-xs text-muted-foreground">
              الحساب الحالي ({user.email}) غير مضاف في قائمة مدراء المنصة (<code className="text-amber-400 font-mono">platform_admins</code>).
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/60 p-4 text-start space-y-2">
            <p className="text-xs font-semibold text-foreground">💡 لإضافة حسابك كـ Super Admin محلياً، نفّذ الأمر التالي في SQL Editor بـ Supabase:</p>
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-emerald-400">
              {`INSERT INTO public.platform_admins (user_id)\nVALUES ('${user.id}')\nON CONFLICT (user_id) DO NOTHING;`}
            </pre>
          </div>

          <div className="flex justify-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowRight className="h-4 w-4 ms-1" />
                العودة للمنصة الرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <AdminShell userEmail={user.email}>{children}</AdminShell>;
}
