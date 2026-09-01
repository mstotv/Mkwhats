'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Menu, X } from 'lucide-react'
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
  const isAr = locale === 'ar'
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight

  const navLinks = [
    { key: 'home', href: '/', labelAr: 'الرئيسية', labelEn: 'Home' },
    { key: 'features', href: '/features', labelAr: 'المميزات', labelEn: 'Features' },
    { key: 'pricing', href: '/pricing', labelAr: 'الأسعار', labelEn: 'Pricing' },
    { key: 'faq', href: '/faq', labelAr: 'الأسئلة الشائعة', labelEn: 'FAQ' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-[#BCC9C6]/30 dark:border-white/10 bg-[#F9F5F0]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-16 relative">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 z-10 shrink-0 group">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={platformName}
              style={{ height: `${Math.max(logoHeight || 44, 40)}px` }}
              className="w-auto object-contain max-h-16 transition-transform group-hover:scale-105"
            />
          ) : null}
          <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#00685F] dark:text-[#6BD8CB]">
            {platformName}
          </span>
        </Link>

        {/* Navigation Links (Centered on Desktop) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[13px] font-semibold uppercase tracking-wider text-[#605E5B] dark:text-[#C9C6C1] md:absolute md:left-1/2 md:-translate-x-1/2">
          {navLinks.map((link) => {
            const isActive = activePage === link.key
            return (
              <Link
                key={link.key}
                href={link.href}
                className={`transition-colors pb-1 ${
                  isActive
                    ? 'text-[#00685F] dark:text-[#6BD8CB] border-b-2 border-[#00685F] dark:border-[#6BD8CB] font-bold'
                    : 'hover:text-[#00685F] dark:hover:text-[#6BD8CB]'
                }`}
              >
                {isAr ? link.labelAr : link.labelEn}
              </Link>
            )
          })}
        </nav>

        {/* Desktop Actions & Toggles */}
        <div className="hidden sm:flex items-center gap-2.5 lg:gap-3 z-10">
          <ModeToggle />
          <LanguageSwitcher />

          {userLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#00685F] hover:bg-[#005049] dark:bg-[#008378] dark:hover:bg-[#00685F] text-white px-4 lg:px-5 py-2.5 text-xs lg:text-[13px] font-semibold uppercase tracking-wider shadow-sm transition-all"
            >
              {isAr ? 'لوحة التحكم' : 'Dashboard'} <ArrowIcon className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden lg:inline-flex items-center gap-1.5 text-xs lg:text-[13px] font-semibold uppercase tracking-wider text-[#605E5B] dark:text-[#C9C6C1] hover:text-[#00685F] dark:hover:text-[#6BD8CB] px-3 py-2 transition-colors"
              >
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#00685F] hover:bg-[#005049] dark:bg-[#008378] dark:hover:bg-[#00685F] text-white px-4 lg:px-6 py-2.5 text-xs lg:text-[13px] font-semibold uppercase tracking-wider shadow-sm transition-all"
              >
                {primaryCtaText || (isAr ? 'إنشاء حساب مجاني' : 'Sign Up Free')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile & Small Screen Actions + Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2 z-10">
          <ModeToggle />
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#BCC9C6]/30 dark:border-white/10 bg-[#F9F5F0] dark:bg-[#1A1A1A] px-6 py-5 space-y-4 shadow-xl transition-all animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => {
              const isActive = activePage === link.key
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-semibold py-2 px-3 rounded-md transition-colors ${
                    isActive
                      ? 'bg-[#00685F]/10 dark:bg-[#00685F]/20 text-[#00685F] dark:text-[#6BD8CB] font-bold'
                      : 'text-[#605E5B] dark:text-[#C9C6C1] hover:text-[#00685F] dark:hover:text-[#6BD8CB]'
                  }`}
                >
                  {isAr ? link.labelAr : link.labelEn}
                </Link>
              )
            })}
          </nav>

          <div className="pt-3 border-t border-black/5 dark:border-white/10 flex flex-col gap-2.5">
            {userLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-[4px] bg-[#00685F] text-white py-3 text-xs font-bold uppercase tracking-wider shadow-sm"
              >
                {isAr ? 'لوحة التحكم' : 'Dashboard'} <ArrowIcon className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-[4px] bg-[#00685F] text-white py-3 text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  {primaryCtaText || (isAr ? 'إنشاء حساب مجاني' : 'Sign Up Free')}
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-[4px] border border-[#00685F]/30 dark:border-white/20 bg-white/50 dark:bg-white/5 text-[#00685F] dark:text-[#6BD8CB] py-3 text-xs font-bold uppercase tracking-wider shadow-sm"
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
