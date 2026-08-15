'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher({
  className = '',
}: {
  variant?: 'outline' | 'ghost' | 'default';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations('Navigation');
  const [isPending, startTransition] = useTransition();

  function switchLocale(nextLocale: string) {
    if (nextLocale === locale) return;

    startTransition(() => {
      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      window.location.reload();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-muted/70 focus:outline-none ${className}`}
        title={t('language')}
      >
        <Globe className="h-4 w-4 text-emerald-500 shrink-0" />
        <span className="uppercase tracking-wider">
          {locale === 'ar' ? 'العربية' : 'EN'}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => switchLocale('ar')}
          className={`cursor-pointer justify-between ${locale === 'ar' ? 'font-bold text-emerald-500' : ''}`}
        >
          <span>العربية</span>
          <span className="text-xs text-muted-foreground font-mono">AR</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale('en')}
          className={`cursor-pointer justify-between ${locale === 'en' ? 'font-bold text-emerald-500' : ''}`}
        >
          <span>English</span>
          <span className="text-xs text-muted-foreground font-mono">EN</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
