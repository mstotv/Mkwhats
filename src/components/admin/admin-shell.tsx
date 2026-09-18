'use client';

import { useState } from 'react';
import { AdminNav } from '@/app/admin/_components/admin-nav';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ShieldCheck, Menu } from 'lucide-react';

interface AdminShellProps {
  children: React.ReactNode;
  userEmail?: string;
}

const pageTitles: Record<string, { ar: string; en: string }> = {
  '/admin': { ar: 'لوحة المراقبة الشاملة', en: 'Super Admin Overview' },
  '/admin/dashboard': { ar: 'لوحة المراقبة الشاملة', en: 'Super Admin Overview' },
  '/admin/accounts': { ar: 'إدارة الشركات والحسابات', en: 'Tenants & Accounts Directory' },
  '/admin/plans': { ar: 'إدارة الباقات والاشتراكات', en: 'SaaS Pricing & Plans Manager' },
  '/admin/offline-payments': { ar: 'إدارة الدفع المحلي والأوفلاين', en: 'Offline Payments Manager' },
  '/admin/tickets': { ar: 'مركز تذاكر الدعم والبرودكاست', en: 'Support & Broadcasts Manager' },
  '/admin/pages': { ar: 'إدارة الصفحات والمحتوى', en: 'Pages & Content Directory' },
  '/admin/landing-settings': { ar: 'إعدادات صفحة الهبوط الشاملة', en: 'Landing Page CMS & Theme Settings' },
  '/admin/site-settings': { ar: 'إعدادات المنصة وبوابات الدفع', en: 'Site & Payment Settings' },
};

export function AdminShell({ children, userEmail }: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const isAr = locale === 'ar';

  const currentPageTitle = pageTitles[pathname]?.[isAr ? 'ar' : 'en'] || (isAr ? 'لوحة التحكم الأدمن' : 'Super Admin Center');

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col md:flex-row antialiased transition-colors">
      {/* 1. Left/Right Sidebar Navigation */}
      <AdminNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* 2. Main Workspace Viewport */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Top Workspace Header Bar */}
        <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 transition-colors">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted md:hidden focus:outline-none"
              aria-label="Open admin menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="text-sm sm:text-base font-extrabold text-foreground truncate flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 shrink-0" />
              {currentPageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ModeToggle />
            <LanguageSwitcher className="border border-border rounded-lg bg-background" />
            {userEmail && (
              <span className="hidden lg:inline-flex text-[11px] font-mono font-bold text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-lg">
                {userEmail}
              </span>
            )}
          </div>
        </header>

        {/* Page Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card py-4 text-center text-xs text-muted-foreground transition-colors">
          <div className="max-w-[1440px] mx-auto px-4 flex flex-wrap justify-between items-center gap-2">
            <span>MK Whats Super Admin SaaS Engine &copy; 2026 — جميع الحقوق محفوظة لمدير المنصة</span>
            <span className="font-mono text-[11px] text-muted-foreground">v1.0.0 (Production)</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
