'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Network,
  CreditCard,
  Users,
  Sparkles,
} from 'lucide-react';

export function ResellerTabs() {
  const pathname = usePathname();
  const locale = useLocale();
  const isAr = locale === 'ar';

  const tabs = [
    {
      href: '/admin/resellers',
      label: isAr ? 'دليل الموزعين والريسيلر' : 'Resellers Directory',
      icon: Network,
      exact: true,
    },
    {
      href: '/admin/resellers/plans',
      label: isAr ? 'باقات وخطط الريسيلر' : 'Reseller Plans',
      icon: CreditCard,
    },
    {
      href: '/admin/resellers/users',
      label: isAr ? 'الحسابات والمستخدمين' : 'Sub-Accounts & Staff',
      icon: Users,
    },
    {
      href: '/admin/resellers/updates',
      label: isAr ? 'التحديثات والمميزات' : 'Broadcasts & Updates',
      icon: Sparkles,
    },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              isActive
                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-500' : 'text-muted-foreground'}`} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
