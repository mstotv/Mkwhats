"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Headphones, LogOut, Menu, Settings as SettingsIcon, User } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { isValidImageUrl } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/dashboard": "dashboard",
  "/inbox": "inbox",
  "/notifications": "notifications",
  "/contacts": "contacts",
  "/pipelines": "pipelines",
  "/broadcasts": "broadcasts",
  "/automations": "automations",
  "/settings": "settings",
};

function getPageTitleKey(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const match = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path),
  );
  return match ? match[1] : "dashboard";
}

interface HeaderProps {
  /** Wired to the shell's drawer state. Used only on mobile — the
   *  hamburger button is hidden on lg+. */
  onOpenSidebar?: () => void;
}

import { useTranslations } from "next-intl";
import { isImpersonatingClient } from "@/lib/admin-impersonation";

import { useEffect, useState } from "react";
import { Sparkles, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function Header({ onOpenSidebar }: HeaderProps) {
  const t = useTranslations("Header");
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const titleKey = getPageTitleKey(pathname);

  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [latestSupportTicket, setLatestSupportTicket] = useState<{ id: string; subject: string } | null>(null);

  async function checkUnreadSupport() {
    try {
      const res = await fetch('/api/support/unread-count');
      if (res.ok) {
        const data = await res.json();
        setUnreadSupportCount(data.unreadCount || 0);
        setLatestSupportTicket(data.latestTicket || null);
      }
    } catch {
      // Ignore background errors
    }
  }

  useEffect(() => {
    checkUnreadSupport();
    const interval = setInterval(checkUnreadSupport, 5000);

    const supabase = createClient();
    const channel = supabase
      .channel('header_support_unread')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
        },
        () => {
          checkUnreadSupport();
        }
      )
      .subscribe();

    window.addEventListener('unread-tickets-updated', checkUnreadSupport);

    return () => {
      clearInterval(interval);
      window.removeEventListener('unread-tickets-updated', checkUnreadSupport);
      supabase.removeChannel(channel);
    };
  }, []);

  function handleClearUnreadSupport() {
    setUnreadSupportCount(0);
    setLatestSupportTicket(null);
    fetch('/api/support/tickets/read-all', { method: 'POST' }).catch(() => {});
  }

  const handleSignOut = () => {
    if (isImpersonatingClient()) {
      alert(
        "أنت تتصفح حالياً في وضع الدخول كمستخدم. يرجى استخدام زر 'الخروج من وضع الدخول كمستخدم' بالشريط العلوي بدلاً من تسجيل الخروج العادي."
      );
      return;
    }
    signOut();
  };

  const initial =
    profile?.full_name?.charAt(0)?.toUpperCase() ??
    profile?.email?.charAt(0)?.toUpperCase() ??
    "U";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {/* Hamburger — mobile only. 44×44 hit target per Apple HIG. */}
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label={t("openMenu")}
          className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
          {t(titleKey as string)}
        </h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <LanguageSwitcher variant="ghost" size="sm" />
        <ModeToggle />

        <DropdownMenu>
        <DropdownMenuTrigger
          className="relative flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-muted/70 focus:bg-muted/70 focus:outline-none data-popup-open:bg-muted/70 sm:gap-3 sm:pl-1 sm:pr-3"
          aria-label={t("openAccountMenu")}
        >
          <div className="relative">
            <Avatar className="size-8">
              {profile?.avatar_url && isValidImageUrl(profile.avatar_url) ? (
                <AvatarImage
                  src={profile.avatar_url}
                  alt={profile.full_name ?? t("defaultAvatar")}
                />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                {initial}
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="hidden text-sm font-medium text-foreground sm:inline">
            {profile?.full_name ?? t("defaultUser")}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="min-w-56 bg-popover text-popover-foreground ring-border"
        >
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-medium text-foreground">
              {profile?.full_name ?? t("defaultUser")}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.email ?? ""}
            </p>
          </div>
          <DropdownMenuSeparator className="bg-border" />

          <DropdownMenuItem
            render={
              <Link
                href="/settings?tab=profile"
                className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
              />
            }
          >
            <User className="size-4" />
            {t("menuProfile")}
          </DropdownMenuItem>
          <DropdownMenuItem
            render={
              <Link
                href="/settings?tab=whatsapp"
                className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
              />
            }
          >
            <SettingsIcon className="size-4" />
            {t("menuSettings")}
          </DropdownMenuItem>
          <DropdownMenuItem
            render={
              <Link
                href="/settings?tab=support"
                className="text-popover-foreground focus:bg-accent focus:text-accent-foreground flex items-center justify-between"
              />
            }
          >
            <div className="flex items-center gap-2">
              <Headphones className="size-4 text-emerald-400" />
              <span>{t("menuSupport")}</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <LogOut className="size-4" />
            {t("menuSignOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
