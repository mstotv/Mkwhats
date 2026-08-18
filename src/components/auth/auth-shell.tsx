'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ShieldCheck, Sparkles, MessageSquare, Lock, Shield, Smartphone } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ModeToggle } from '@/components/layout/mode-toggle';

interface AuthShellProps {
  children: ReactNode;
  illustrationImage?: string;
  badgeText?: string;
  illustrationTitle?: string;
  illustrationSub?: string;
}

function getInitialAuthSettings() {
  if (typeof window === "undefined") {
    return {
      platform_name: "MK Whats",
      platform_name_ar: "واتساب اوتوميشن",
      platform_name_en: "WhatsApp Automation",
      primary_color: "#10b981",
    };
  }
  try {
    const cached = localStorage.getItem("mk_site_settings");
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        platform_name: parsed.platform_name || "MK Whats",
        platform_name_ar: parsed.platform_name_ar || "واتساب اوتوميشن",
        platform_name_en: parsed.platform_name_en || "WhatsApp Automation",
        primary_color: parsed.primary_color || "#10b981",
        logo_url: parsed.logo_url || "",
        logo_height: parsed.logo_height || 36,
      };
    }
  } catch {}
  return {
    platform_name: "MK Whats",
    platform_name_ar: "واتساب اوتوميشن",
    platform_name_en: "WhatsApp Automation",
    primary_color: "#10b981",
  };
}

export function AuthShell({
  children,
  illustrationImage = '/login-illustration.png',
  badgeText = 'المنصة الأولى للأتمتة وإدارة الأعمال',
  illustrationTitle = 'حماية وتوثيق رقمي عالي الأمان',
  illustrationSub = 'تسجيل دخول آمن ومباشر لإدارة حساباتك، المبيعات والردود التلقائية بأعلى جودة.',
}: AuthShellProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [siteSettings, setSiteSettings] = useState(getInitialAuthSettings);

  useEffect(() => {
    fetch('/api/site-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSiteSettings(data.settings);
          try { localStorage.setItem('mk_site_settings', JSON.stringify(data.settings)); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const logoUrl = siteSettings.logo_url || '';
  const logoHeight = siteSettings.logo_height || 36;
  const primaryColor = siteSettings.primary_color || '#10b981';
  const platformName = isAr
    ? (siteSettings.platform_name_ar || siteSettings.platform_name || 'واتساب اوتوميشن')
    : (siteSettings.platform_name_en || siteSettings.platform_name || 'WhatsApp Automation');

  return (
    <div className="min-h-screen w-full bg-background dark:bg-zinc-950 text-foreground dark:text-zinc-100 font-cairo dir-rtl flex flex-col justify-between p-4 lg:p-6 selection:bg-emerald-500/20 transition-colors duration-200">
      <div className="mx-auto w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[calc(100vh-3rem)]">
        
        {/* LEFT COLUMN: Authentication Form Container (~45% Desktop Width in LTR / RTL Right) */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between py-6 px-2 sm:px-8 space-y-8">
          
          {/* Header Branding + Controls (Language Switcher & Theme Toggle) */}
          <div className="flex items-center justify-between w-full gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={platformName}
                  style={{ height: `${logoHeight}px` }}
                  className="w-auto object-contain transition-transform group-hover:scale-105"
                />
              ) : (
                <div
                  style={{ backgroundColor: primaryColor }}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-white font-black shadow-lg transition-transform group-hover:scale-105 shrink-0"
                >
                  <MessageSquare className="h-5 w-5" />
                </div>
              )}
              <span className="text-xl font-extrabold tracking-tight text-foreground dark:text-zinc-100">
                {platformName}
              </span>
            </Link>

            {/* Quick Actions Header: Language & Theme Toggle */}
            <div className="flex items-center gap-2">
              <LanguageSwitcher className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-800 text-foreground dark:text-zinc-200 rounded-xl px-2.5 py-1.5 shadow-sm transition-colors" />
              <ModeToggle className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-800 text-foreground dark:text-zinc-200 rounded-xl h-9 w-9 p-0 shadow-sm transition-colors" />
            </div>
          </div>

          {/* Form Content Body */}
          <div className="space-y-6">{children}</div>

          {/* Clean Subdued Footer */}
          <div className="text-xs text-muted-foreground dark:text-zinc-400 flex items-center gap-2 pt-2 border-t border-border dark:border-zinc-800">
            <ShieldCheck className="h-4 w-4 text-[#7C3AED]" />
            <span>{isAr ? `نظام توثيق وحماية مشفر 100% © ${new Date().getFullYear()} ${platformName}` : `100% Encrypted & Secure Auth System © ${new Date().getFullYear()} ${platformName}`}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Premium SaaS Brand Illustration Container (~55% Desktop Width) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 h-full min-h-[600px] rounded-[2rem] bg-gradient-to-br from-[#6D28D9] via-[#7C3AED] to-[#A855F7] p-10 flex-col justify-between relative overflow-hidden shadow-2xl text-white">
          
          {/* Soft Abstract Background Circles & Lighting */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/15 blur-[100px] rounded-full pointer-events-none" />

          {/* Top Decorative Floating Badges */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4.5 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" /> {badgeText}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-white/80">
              <Shield className="h-4 w-4 text-purple-200" /> حماية وأمان متقدم
            </div>
          </div>

          {/* Center SaaS Vector Illustration Card */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative max-w-lg w-full">
              <div className="relative rounded-3xl bg-white/95 dark:bg-zinc-900/90 border border-white/40 dark:border-white/20 shadow-2xl p-6 backdrop-blur-xl transition-transform duration-500 hover:scale-[1.01]">
                <img
                  src={illustrationImage}
                  alt="SaaS Brand Illustration"
                  className="w-full max-h-[360px] object-contain mx-auto"
                />
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-black tracking-tight text-white">{illustrationTitle}</h2>
              <p className="text-xs text-purple-100/90 leading-relaxed font-normal">
                {illustrationSub}
              </p>
            </div>
          </div>

          {/* Bottom Floating Pill Highlights */}
          <div className="relative z-10 grid grid-cols-3 gap-3 pt-6 border-t border-white/15 text-xs font-bold">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/15 p-3 backdrop-blur-md text-white">
              <Smartphone className="h-4 w-4 text-purple-200 shrink-0" />
              <span className="text-[11px]">تكامل الأجهزة والتطبيقات</span>
            </div>

            <div className="flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/15 p-3 backdrop-blur-md text-white">
              <Lock className="h-4 w-4 text-purple-200 shrink-0" />
              <span className="text-[11px]">تشفير البيانات وحمايتها</span>
            </div>

            <div className="flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/15 p-3 backdrop-blur-md text-white">
              <ShieldCheck className="h-4 w-4 text-purple-200 shrink-0" />
              <span className="text-[11px]">توثيق سحابي مباشر 24/7</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
