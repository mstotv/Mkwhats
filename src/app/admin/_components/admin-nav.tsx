'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  CreditCard,
  Landmark,
  Globe,
  LogOut,
  FileText,
  Headphones,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations, useLocale } from 'next-intl'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface AdminNavProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AdminNav({ isOpen = false, onClose }: AdminNavProps) {
  const t = useTranslations('Admin.nav')
  const locale = useLocale()
  const isAr = locale === 'ar'
  const pathname = usePathname()

  const [siteSettings, setSiteSettings] = useState<{
    logo_url?: string;
    platform_name?: string;
    platform_name_ar?: string;
    platform_name_en?: string;
  }>({});

  useEffect(() => {
    try {
      const cached = localStorage.getItem("mk_site_settings");
      if (cached) setSiteSettings(JSON.parse(cached));
    } catch {}

    fetch('/api/site-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSiteSettings(data.settings);
          try {
            localStorage.setItem("mk_site_settings", JSON.stringify(data.settings));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const adminPlatformName = isAr
    ? (siteSettings.platform_name_ar || '')
    : (siteSettings.platform_name_en || '');

  const navItems = [
    {
      label: isAr ? 'لوحة المراقبة (Overview)' : 'Overview',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      badge: 'إحصائيات',
      badgeEn: 'Stats',
    },
    {
      label: isAr ? 'الحسابات (Accounts)' : 'Accounts',
      href: '/admin/accounts',
      icon: Users,
    },
    {
      label: isAr ? 'الباقات والأسعار (Plans)' : 'Plans',
      href: '/admin/plans',
      icon: CreditCard,
    },
    {
      label: isAr ? 'الدفع المحلي (Offline)' : 'Offline Payments',
      href: '/admin/offline-payments',
      icon: Landmark,
      badge: 'جديد',
      badgeEn: 'New',
    },
    {
      label: isAr ? 'تذاكر الدعم والبرودكاست' : 'Support Tickets',
      href: '/admin/tickets',
      icon: Headphones,
    },
    {
      label: isAr ? 'الصفحات والمعلومات' : 'Pages & Info',
      href: '/admin/pages',
      icon: FileText,
    },
    {
      label: isAr ? 'إعدادات صفحة الهبوط' : 'Landing Page',
      href: '/admin/landing-settings',
      icon: Sparkles,
    },
    {
      label: isAr ? 'إعدادات الموقع العامة' : 'Site Settings',
      href: '/admin/site-settings',
      icon: Globe,
    },
  ]

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch {
      // Ignore error
    } finally {
      window.location.href = '/admin/login'
    }
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Admin Sidebar Container */}
      <aside
        className={`
          fixed inset-y-0 start-0 z-50 w-72 bg-card border-e border-border flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out
          md:static md:w-64 md:shrink-0 md:border-b-0 md:min-h-screen md:sticky md:top-0 md:h-screen md:translate-x-0 md:shadow-lg md:z-30
          ${isOpen ? 'translate-x-0' : isAr ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <Link href="/admin/dashboard" onClick={onClose} className="flex items-center gap-3 group">
            {siteSettings.logo_url ? (
              <img
                src={siteSettings.logo_url}
                alt={adminPlatformName}
                className="h-9 w-auto max-w-[120px] object-contain shrink-0 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-6 w-6 text-slate-950" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span
                className="font-black text-foreground text-sm tracking-tight flex items-center gap-1.5 truncate max-w-[130px]"
                title={adminPlatformName}
                suppressHydrationWarning
              >
                {adminPlatformName}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-500">
                <Sparkles className="h-3 w-3 shrink-0" /> Super Admin v1.0
              </span>
            </div>
          </Link>

          {/* Close button for mobile screens */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted md:hidden"
            aria-label="Close admin menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            {isAr ? 'قائمة الإدارة الرئيسية' : 'MAIN MENU'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/admin/dashboard'
                ? pathname === '/admin' || pathname === '/admin/dashboard'
                : pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition-all group ${
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono bg-primary/20 text-primary border border-primary/30">
                    {isAr ? item.badge : item.badgeEn}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border space-y-3 bg-muted/30">
          <Link href="/dashboard" onClick={onClose} className="block">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-bold gap-2 text-foreground border-border hover:bg-muted"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              {isAr ? 'العودة للمنصة الرئيسية' : 'Return to Main App'}
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 text-xs gap-1.5 h-8 justify-start"
          >
            <LogOut className="h-3.5 w-3.5" />
            {isAr ? 'تسجيل الخروج' : 'Logout'}
          </Button>
        </div>
      </aside>
    </>
  )
}
