import Link from 'next/link'
import { ShieldCheck, Globe } from 'lucide-react'

interface ContentPageItem {
  slug: string
  title: string
  title_en?: string | null
}

interface LandingFooterProps {
  platformName: string
  locale: 'en' | 'ar'
  contentPages?: ContentPageItem[]
  socialLinks?: Array<{ url: string }>
}

export function LandingFooter({
  platformName,
  locale,
  contentPages = [],
  socialLinks = [],
}: LandingFooterProps) {
  const isAr = locale === 'ar'

  // Helper to map and canonicalize legal/info slugs and titles
  const getPageTitle = (page: ContentPageItem) => {
    const slugNorm = page.slug.toLowerCase().replace(/_/g, '-')
    if (slugNorm === 'privacy-policy' || slugNorm === 'privacy') {
      return isAr ? 'سياسة الخصوصية' : 'Privacy Policy'
    }
    if (slugNorm === 'terms' || slugNorm === 'terms-and-conditions') {
      return isAr ? 'الشروط والأحكام' : 'Terms of Service'
    }
    if (slugNorm === 'about' || slugNorm === 'about-us') {
      return isAr ? 'من نحن' : 'About Us'
    }
    if (slugNorm === 'contact' || slugNorm === 'contact-info' || slugNorm === 'contact-us') {
      return isAr ? 'اتصل بنا' : 'Contact Us'
    }
    if (slugNorm === 'security') {
      return isAr ? 'الأمان والحماية' : 'Security'
    }
    return isAr ? (page.title || page.title_en || page.slug) : (page.title_en || page.title || page.slug)
  }

  // De-duplicate alias slugs (e.g. keep one of privacy/privacy_policy, terms/terms-and-conditions)
  const canonicalSlugGroup = (slug: string) => {
    const norm = slug.toLowerCase().replace(/_/g, '-')
    if (norm === 'privacy-policy' || norm === 'privacy') return 'privacy'
    if (norm === 'terms' || norm === 'terms-and-conditions') return 'terms'
    if (norm === 'about' || norm === 'about-us') return 'about'
    if (norm === 'contact' || norm === 'contact-info' || norm === 'contact-us') return 'contact'
    if (norm === 'security') return 'security'
    return norm
  }

  const seenGroups = new Set<string>()
  const uniquePages = (contentPages || []).filter((p) => {
    const group = canonicalSlugGroup(p.slug)
    if (seenGroups.has(group)) return false
    seenGroups.add(group)
    return true
  })

  return (
    <footer className="border-t border-neutral-800 bg-[#1A1A1A] py-16 text-xs text-[#C9C6C1]">
      <div className="mx-auto max-w-7xl px-6 sm:px-12 lg:px-16 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
          {/* Column 1: Platform Overview */}
          <div className="space-y-4">
            <span className="font-serif text-xl font-bold text-white tracking-tight block">
              {platformName}
            </span>
            <p className="text-xs text-[#C9C6C1] leading-relaxed max-w-sm">
              {isAr
                ? 'منصة أتمتة وتسويق الواتساب والذكاء الاصطناعي لإدارة المحادثات، المبيعات، ومزامنة الطلبات والمواعيد.'
                : 'Elevating conversational commerce with intelligent automation and refined editorial design.'}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#6BD8CB] font-medium">
              <ShieldCheck className="h-4 w-4" /> {isAr ? 'حماية وأمان البيانات 100%' : 'Enterprise Grade Security'}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-semibold uppercase tracking-wider text-white">
              {isAr ? 'روابط سريعة' : 'QUICK LINKS'}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#C9C6C1]">
              <li><Link href="/features" className="hover:text-white transition-colors">{isAr ? 'نظرة عامة على المميزات' : 'Features Overview'}</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">{isAr ? 'الخطط والأسعار' : 'Pricing Plans'}</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">{isAr ? 'مركز المساعدة والأسئلة' : 'Help Center / FAQ'}</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">{isAr ? 'تسجيل الدخول' : 'Sign In'}</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal & DB Content Pages */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-semibold uppercase tracking-wider text-white">
              {isAr ? 'الصفحات والمعلومات' : 'LEGAL & INFO'}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#C9C6C1]">
              {uniquePages.length > 0 ? (
                uniquePages.map((page) => (
                  <li key={page.slug}>
                    <Link href={`/p/${page.slug}`} className="hover:text-white transition-colors">
                      {getPageTitle(page)}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="/p/privacy" className="hover:text-white transition-colors">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link></li>
                  <li><Link href="/p/terms" className="hover:text-white transition-colors">{isAr ? 'الشروط والأحكام' : 'Terms of Service'}</Link></li>
                  <li><Link href="/p/about" className="hover:text-white transition-colors">{isAr ? 'من نحن' : 'About Us'}</Link></li>
                  <li><Link href="/p/contact" className="hover:text-white transition-colors">{isAr ? 'اتصل بنا' : 'Contact Us'}</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Clean Language-Strict Copyright Notice */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-neutral-800 text-xs text-[#C9C6C1]/70">
          <div>
            {isAr
              ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} ${platformName}.`
              : `© ${new Date().getFullYear()} ${platformName}. All rights reserved.`}
          </div>

          <div className="flex items-center gap-3">
            {socialLinks
              .filter((s: any) => s && s.url && s.url.trim().length > 0)
              .map((s: any, idx: number) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-[4px] bg-white/5 border border-white/10 flex items-center justify-center text-[#C9C6C1] hover:border-[#00685F] hover:text-white transition-all shadow-sm"
                >
                  <Globe className="h-3.5 w-3.5" />
                </a>
              ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
