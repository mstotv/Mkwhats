'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ModeToggle } from '@/components/layout/mode-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'

interface LandingNavbarProps {
  platformName: string
  logoUrl?: string | null
  logoHeight?: number
  locale: 'en' | 'ar'
  activePage?: 'home' | 'features' | 'pricing' | 'faq'
  userLoggedIn?: boolean
  primaryCtaText?: string
}

export function LandingNavbar({
  platformName,
  logoUrl,
  logoHeight = 32,
  locale,
  activePage = 'home',
  userLoggedIn = false,
  primaryCtaText,
}: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(userLoggedIn)
  const isAr = locale === 'ar'
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight

  useEffect(() => {
    setIsLoggedIn(userLoggedIn)
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [userLoggedIn])

  const navLinks = [
    { key: 'home', href: '/', labelAr: 'الرئيسية', labelEn: 'Home' },
    { key: 'features', href: '/features', labelAr: 'المميزات', labelEn: 'Features' },
    { key: 'pricing', href: '/pricing', labelAr: 'الأسعار', labelEn: 'Pricing' },
    { key: 'faq', href: '/faq', labelAr: 'الأسئلة الشائعة', labelEn: 'FAQ' },
  ]

  return (
    <header className="fixed top-3 sm:top-5 inset-x-0 z-50 w-full px-3 sm:px-6 lg:px-8 transition-all duration-300 pointer-events-none">
      {/* Floating Glass Island Bar */}
      <div className="mx-auto flex h-14 sm:h-[58px] max-w-5xl items-center justify-between px-4 sm:px-6 rounded-2xl raycast-navbar-glass relative pointer-events-auto">
        {/* Brand Logo & Name */}
        <Link href="/" prefetch={true} className="flex items-center gap-2.5 z-10 shrink-0 group">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={platformName}
              style={{ height: `${Math.max(logoHeight || 32, 28)}px` }}
              className="w-auto object-contain max-h-10 transition-transform duration-200 group-hover:scale-105"
            />
          ) : null}
          <span className="text-base sm:text-lg font-bold tracking-tight text-foreground transition-colors">
            {platformName}
          </span>
        </Link>

        {/* Navigation Links (Centered on Desktop - Raycast Floating Pill Style) */}
        <nav className="hidden md:flex items-center gap-1 text-[13px] font-medium text-muted-foreground md:absolute md:left-1/2 md:-translate-x-1/2">
          {navLinks.map((link) => {
            const isActive = activePage === link.key
            return (
              <Link
                key={link.key}
                href={link.href}
                prefetch={true}
                className={`px-3 py-1.5 rounded-full transition-all duration-200 ${isActive
                    ? 'text-foreground bg-black/[0.08] dark:bg-white/[0.12] font-semibold shadow-xs'
                    : 'hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                  }`}
              >
                {isAr ? link.labelAr : link.labelEn}
              </Link>
            )
          })}
        </nav>

        {/* Desktop Actions & Toggles */}
        <div className="hidden sm:flex items-center gap-2 lg:gap-2.5 z-10">
          <ModeToggle />
          <LanguageSwitcher />

          {isLoggedIn ? (
            <Link
              href="/dashboard"
              prefetch={true}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90 px-3.5 py-1.5 text-xs sm:text-[13px] font-medium shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isAr ? 'لوحة التحكم' : 'Dashboard'} <ArrowIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                prefetch={true}
                className="hidden lg:inline-flex items-center text-[13px] font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-all"
              >
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </Link>
              <Link
                href="/signup"
                prefetch={true}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90 px-4 py-1.5 text-xs sm:text-[13px] font-medium shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {primaryCtaText || (isAr ? 'ابدأ مجاناً' : 'Get Started Free')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile & Small Screen Actions + Hamburger Button */}
        <div className="flex sm:hidden items-center gap-1.5 z-10">
          <ModeToggle />
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-xl text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu (Floating Glass Island) */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 mx-auto max-w-5xl rounded-2xl raycast-navbar-glass px-5 py-4 space-y-3 pointer-events-auto transition-all animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = activePage === link.key
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  prefetch={true}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium py-2 px-3 rounded-xl transition-all ${isActive
                      ? 'bg-black/[0.08] dark:bg-white/[0.12] text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                    }`}
                >
                  {isAr ? link.labelAr : link.labelEn}
                </Link>
              )
            })}
          </nav>

          <div className="pt-2.5 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col gap-2">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                prefetch={true}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-foreground text-background py-2.5 text-sm font-medium shadow-sm"
              >
                {isAr ? 'لوحة التحكم' : 'Dashboard'} <ArrowIcon className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  prefetch={true}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-foreground text-background py-2.5 text-sm font-medium shadow-sm"
                >
                  {primaryCtaText || (isAr ? 'ابدأ مجاناً' : 'Get Started Free')}
                </Link>
                <Link
                  href="/login"
                  prefetch={true}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] text-foreground py-2.5 text-sm font-medium shadow-sm"
                >
                  {isAr ? 'تسجيل الدخول' : 'Sign In'}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
