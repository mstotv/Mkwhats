import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  LogIn,
} from 'lucide-react'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingHeroMockup } from '@/components/landing/landing-hero-mockup'
import { LandingComparison } from '@/components/landing/landing-comparison'
import { LandingValuePillars } from '@/components/landing/landing-value-pillars'
import { LandingMetricsProof } from '@/components/landing/landing-metrics-proof'
import { LandingPricing } from '@/components/landing/landing-pricing'
import { LandingTestimonials } from '@/components/landing/landing-testimonials'
import { LandingFinalCta } from '@/components/landing/landing-final-cta'
import { FloatingSupport } from '@/components/landing/floating-support'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('NEXT_LOCALE')?.value as 'en' | 'ar') || 'en'
  const isAr = locale === 'ar'

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const serviceClient = createServiceClient()

  const [{ data: settings }, { data: dbPartners }, { data: contentPages }, { data: plans }] =
    await Promise.all([
      serviceClient.from('site_settings').select('*').limit(1).maybeSingle(),
      serviceClient.from('partners').select('*').order('display_order', { ascending: true }),
      serviceClient
        .from('content_pages')
        .select('slug, title, title_en')
        .eq('is_published', true)
        .order('created_at', { ascending: true }),
      serviceClient
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true }),
    ])

  const platformName = isAr
    ? (settings?.platform_name_ar || settings?.platform_name || 'Ethos Automation')
    : (settings?.platform_name_en || settings?.platform_name || 'Ethos Automation')
  const logoUrl = settings?.logo_url
  const logoHeight = settings?.logo_height || 32

  const heroContent = {
    trust_badge_text: isAr
      ? (settings?.hero_content?.trust_badge_text_ar || settings?.hero_content?.trust_badge_text || '#1 منصة أتمتة وتسويق الواتساب للأعمال')
      : (settings?.hero_content?.trust_badge_text_en || '#1 WhatsApp Automation & Marketing Platform for Businesses'),
    headline: isAr
      ? (settings?.hero_content?.headline_ar || settings?.hero_content?.headline || 'نمِّ أعمالك مع')
      : (settings?.hero_content?.headline_en || 'Scale Your Business with'),
    headline_highlight: isAr
      ? (settings?.hero_content?.headline_highlight_ar || settings?.hero_content?.headline_highlight || 'واتساب و Gemini AI')
      : (settings?.hero_content?.headline_highlight_en || 'WhatsApp & Gemini AI'),
    subtitle: isAr
      ? (settings?.hero_content?.subtitle_ar || settings?.hero_content?.subtitle || 'مساعد ذكي تفاعلي يجيب على استفسارات العملاء بلباقة، يلتقط الطلبات لحظياً، ويدير حملات التسويق بدقة.')
      : (settings?.hero_content?.subtitle_en || 'Interactive AI agent that answers customer queries, captures orders in real-time, and powers your marketing campaigns.'),
    primary_cta_text: isAr
      ? (settings?.hero_content?.primary_cta_text_ar || settings?.hero_content?.primary_cta_text || 'ابدأ التجربة المجانية')
      : (settings?.hero_content?.primary_cta_text_en || 'Start Free Trial'),
    secondary_cta_text: isAr
      ? (settings?.hero_content?.secondary_cta_text_ar || settings?.hero_content?.secondary_cta_text || 'تسجيل الدخول')
      : (settings?.hero_content?.secondary_cta_text_en || 'Log In'),
  }

  const socialLinks = (settings?.social_links as any[]) || []

  const defaultPartners = [
    { name: 'WooCommerce', logo_url: '/logos/woocommerce.png' },
    { name: 'Shopify', logo_url: '/logos/shopify.png' },
    { name: 'Stripe', logo_url: 'https://cdn.simpleicons.org/stripe/635BFF' },
    { name: 'Telegram', logo_url: 'https://cdn.simpleicons.org/telegram/26A5E4' },
    { name: 'Sheets', logo_url: 'https://cdn.simpleicons.org/google/4285F4' },
    { name: 'HubSpot', logo_url: 'https://cdn.simpleicons.org/hubspot/FF7A59' },
  ]

  const rawPartnersList = (Array.isArray(settings?.partners) && settings.partners.length > 0)
    ? settings.partners
    : ((dbPartners && dbPartners.length > 0) ? dbPartners : defaultPartners)

  const partners = rawPartnersList.map((p: any) => {
    const nameLower = (p.name || '').toLowerCase()
    if (nameLower.includes('woo') || nameLower.includes('wordpress')) {
      return { ...p, logo_url: '/logos/woocommerce.png' }
    }
    if (nameLower.includes('shopify')) {
      return { ...p, logo_url: '/logos/shopify.png' }
    }
    return p
  })

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#F9F5F0] dark:bg-[#1A1A1A] text-[#1B1C1C] dark:text-[#F2F0F0] font-sans relative overflow-x-hidden transition-colors duration-300"
    >
      {/* ── 1. Top Navigation Bar ──────────────────────────────── */}
      <LandingNavbar
        platformName={platformName}
        logoUrl={logoUrl}
        logoHeight={logoHeight}
        locale={locale}
        activePage="home"
        userLoggedIn={Boolean(user)}
        primaryCtaText={heroContent.primary_cta_text}
      />

      {/* ── 2. Hero Section ───────────────────────────────────── */}
      <section id="home" className="relative pt-20 pb-16 md:pt-28 md:pb-24 max-w-6xl mx-auto px-6 sm:px-12 lg:px-16 text-center space-y-8">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 bg-[#00685F]/10 dark:bg-[#00685F]/20 border border-[#00685F]/25 rounded-full px-4 py-1.5 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#00685F] dark:bg-[#6BD8CB] animate-pulse" />
          <span className="text-[12px] sm:text-[13px] font-semibold tracking-wide text-[#00685F] dark:text-[#6BD8CB]">
            {heroContent.trust_badge_text}
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#1B1C1C] dark:text-white leading-[1.15] max-w-4xl mx-auto">
          {heroContent.headline} <br />
          <span className="italic text-[#00685F] dark:text-[#6BD8CB]">
            {heroContent.headline_highlight}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[#605E5B] dark:text-[#C9C6C1] max-w-2xl mx-auto leading-relaxed font-normal">
          {heroContent.subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href={user ? '/dashboard' : '/signup'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#00685F] hover:bg-[#005049] text-white px-8 py-3.5 text-[13px] font-semibold uppercase tracking-wider shadow-sm hover:scale-[1.01] transition-all"
          >
            {heroContent.primary_cta_text}
            <ArrowIcon className="h-4 w-4" />
          </Link>
          {!user && (
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[4px] border border-[#00685F]/30 dark:border-white/20 bg-white/60 dark:bg-white/5 hover:bg-[#00685F]/10 dark:hover:bg-white/10 text-[#00685F] dark:text-[#6BD8CB] px-8 py-3.5 text-[13px] font-semibold uppercase tracking-wider shadow-sm hover:scale-[1.01] transition-all backdrop-blur-sm"
            >
              <LogIn className="h-4 w-4" />
              {heroContent.secondary_cta_text}
            </Link>
          )}
        </div>

        {/* Hero Interactive Laptop Showcase */}
        <LandingHeroMockup />
      </section>

      {/* ── 3. Integrations Bar ───────────────────────────────── */}
      <section id="partners" className="py-12 border-y border-[#BCC9C6]/30 dark:border-white/10 bg-white/50 dark:bg-[#242424]/40">
        <div className="mx-auto max-w-7xl px-6 sm:px-12 lg:px-16 text-center space-y-6">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#605E5B] dark:text-[#C9C6C1]">
            {isAr ? 'يتكامل بسلاسة مع أشهر المنصات والخدمات' : 'SEAMLESSLY INTEGRATES WITH TOP PLATFORMS'}
          </p>

          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-14 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
            {partners.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2.5 text-sm font-semibold text-[#1B1C1C] dark:text-[#F2F0F0]">
                {p.logo_url ? (
                  <img src={p.logo_url} alt={p.name} className="h-5 w-5 object-contain" />
                ) : (
                  <Globe className="h-5 w-5 text-[#00685F]" />
                )}
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. The Transformation: Pain vs Solution ───────────── */}
      <LandingComparison isAr={isAr} content={settings?.home_content?.comparison} />

      {/* ── 5. 4 Core Outcome Pillars (+ Link to Features) ───── */}
      <LandingValuePillars isAr={isAr} content={settings?.home_content?.pillars} />


      {/* ── 7. Proof by the Numbers & Key Metrics ────────────── */}
      <LandingMetricsProof isAr={isAr} content={settings?.home_content?.metrics_proof} />

      {/* ── 8. Plans & Pricing ─────────────────────────────────── */}
      <section id="pricing" className="py-16 md:py-24 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-[#00685F]/10 border border-[#00685F]/20 rounded-full px-4 py-1.5 text-xs font-semibold text-[#00685F] dark:text-[#6BD8CB] uppercase tracking-wider">
          {isAr ? 'خطط شفافة وتجربة مجانية' : 'TRANSPARENT PLANS & FREE TRIAL'}
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#1B1C1C] dark:text-white max-w-3xl mx-auto">
          {isAr ? 'اختر الخطة المناسبة وابدأ تجربتك المجانية' : 'Choose Your Plan & Start Your Free Trial'}
        </h2>
        <p className="text-base text-[#605E5B] dark:text-[#C9C6C1] max-w-2xl mx-auto">
          {isAr
            ? 'جرب جميع ميزات المنصة مجاناً بدون الحاجة لبطاقة ائتمان. يمكنك الترقية أو الإلغاء في أي وقت.'
            : 'Try all features free without a credit card. Upgrade or cancel at any time.'}
        </p>
        <div className="pt-4">
          <LandingPricing
            plans={(plans as any[]) || []}
            userLoggedIn={Boolean(user)}
            primaryColor="#00685F"
          />
        </div>
      </section>

      {/* ── 9. Real Customer Testimonials & Success Stories ───── */}
      <LandingTestimonials isAr={isAr} testimonials={settings?.testimonials} />

      {/* ── 10. Magnetic Final Call-to-Action ─────────────────── */}
      <LandingFinalCta isAr={isAr} userLoggedIn={Boolean(user)} content={settings?.home_content?.final_cta} />

      {/* ── 11. Dark Editorial Footer ─────────────────────────── */}
      <LandingFooter
        platformName={platformName}
        locale={locale}
        contentPages={contentPages || []}
        socialLinks={socialLinks}
      />

      {/* Floating Interactive Live Support Chat Widget */}
      <FloatingSupport
        whatsapp={settings?.support_whatsapp}
        telegram={settings?.support_telegram}
        email={settings?.support_email}
        enabled={settings?.support_floating_enabled}
        locale={locale}
      />
    </div>
  )
}
