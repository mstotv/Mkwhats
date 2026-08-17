'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert,
  LayoutDashboard,
  Building2,
  CreditCard,
  MessageSquare,
  Bot,
  ShieldCheck,
  Settings,
  ArrowRight,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface AdminShellProps {
  children: React.ReactNode;
  userEmail?: string;
}

const NAV_ITEMS = [
  {
    href: '/admin',
    label: 'لوحة القيادة',
    labelEn: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/accounts',
    label: 'الشركات والحسابات',
    labelEn: 'Tenants & Accounts',
    icon: Building2,
  },
  {
    href: '/admin/plans',
    label: 'الباقات والاشتراكات',
    labelEn: 'Plans & Billing',
    icon: CreditCard,
  },
  {
    href: '/admin/settings',
    label: 'إعدادات النظام العامة',
    labelEn: 'System Settings',
    icon: Settings,
  },
];

export function AdminShell({ children, userEmail }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('تم تسجيل الخروج بنجاح');
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col">
      {/* Top Super Admin Banner Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-black shadow-md shadow-amber-500/20">
                <ShieldAlert className="h-5 w-5 text-slate-950" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  مركز الإدارة الكلية
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-500">
                    <Sparkles className="h-3 w-3" /> SUPER ADMIN
                  </span>
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              <ArrowRight className="h-4 w-4 ms-1" />
              العودة للمنصة الرئيسية
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4 ms-1" />
              خروج
            </Button>
          </div>
        </div>

        {/* Secondary Subnav Bar */}
        <div className="border-t border-border/50 bg-muted/40">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 scrollbar-none">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-border/60 bg-card py-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 flex flex-wrap justify-between items-center gap-2">
          <span>wacrm SaaS Engine &copy; 2026 — جميع الحقوق محفوظة لمدير النظام</span>
          {userEmail && <span className="font-mono text-[11px]">المستخدم الحالي: {userEmail}</span>}
        </div>
      </footer>
    </div>
  );
}
