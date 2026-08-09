'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, LayoutDashboard, Users, CreditCard, Globe, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AdminNav() {
  const pathname = usePathname()

  const navItems = [
    {
      label: 'نظرة عامة',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'إدارة الحسابات',
      href: '/admin/accounts',
      icon: Users,
    },
    {
      label: 'إدارة الخطط',
      href: '/admin/plans',
      icon: CreditCard,
    },
    {
      label: 'إعدادات الموقع',
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
    <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-200 group-hover:border-slate-600 transition-all">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 text-sm tracking-tight">
                Super Admin
              </span>
              <span className="rounded bg-slate-800/80 border border-slate-700/50 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                v1.0
              </span>
            </div>
          </Link>

          <div className="h-4 w-px bg-slate-800/80 hidden md:block" />

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-slate-100 font-semibold bg-slate-800/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:bg-slate-900 hover:text-rose-400 gap-1.5 border border-slate-800/80 hover:border-rose-500/30 text-xs h-8 px-3"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </Button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="flex md:hidden border-t border-slate-800/60 bg-slate-950 px-4 py-1.5 justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium ${
                isActive ? 'bg-slate-800 text-slate-100' : 'text-slate-400'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
