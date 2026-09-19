import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getLocale } from 'next-intl/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  ArrowLeft,
  ArrowRight,
  LogIn,
} from 'lucide-react'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingHeroMockup } from '@/components/landing/landing-hero-mockup'
import { LandingComparison } from '@/components/landing/landing-comparison'
import { LandingValuePillars } from '@/components/landing/landing-value-pillars'
import { LandingMetricsProof } from '@/components/landing/landing-metrics-proof'
import { LandingTestimonials } from '@/components/landing/landing-testimonials'
import { LandingFinalCta } from '@/components/landing/landing-final-cta'
import { InteractiveGridBackground } from '@/components/landing/interactive-grid-background'
import { PartnerLogoIcon } from '@/components/landing/partner-logo-icon'
import { ShimmerButton } from '@/components/magicui/shimmer-button'

const FloatingSupport = dynamic(
  () => import('@/components/landing/floating-support').then((mod) => mod.FloatingSupport)
)

export const revalidate = 60

export default async function LandingPage() {
  const locale = (await getLocale()) as 'en' | 'ar'
  const isAr = locale === 'ar'

  const serviceClient = createServiceClient()

  const [{ data: settings }, { data: dbPartners }, { data: contentPages }] =
    await Promise.all([
      serviceClient.from('site_settings').select('*').limit(1).maybeSingle(),
      serviceClient.from('partners').select('*').order('display_order', { ascending: true }),
      serviceClient
        .from('content_pages')
        .select('slug, title, title_en')
        .eq('is_published', true)
        .order('created_at', { ascending: true }),
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
      ? (settings?.hero_content?.headline_ar || settings?.hero_content?.headline || 'نمِّ عملك مع')
      : (settings?.hero_content?.headline_en || 'Scale Your Business with'),
    headline_highlight: isAr
      ? (settings?.hero_content?.headline_highlight_ar || settings?.hero_content?.headline_highlight || 'واتساب والذكاء الاصطناعي')
      : (settings?.hero_content?.headline_highlight_en || 'WhatsApp & AI'),
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
      className="min-h-screen bg-[#F9F5F0] dark:bg-[#1A1A1A] text-[#1B1C1C] dark:text-[#F2F0F0] font-sans relative overflow-x-hidden"
    >
      {/* 1. Interactive Geometric Grid with Spotlight & Parallax */}
      <InteractiveGridBackground gridSize={44} glowRadius={420} parallaxStrength={20} />

      {/* Top Ambient Mesh Lighting behind Floating Glass Navbar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] max-w-[95vw] h-[480px] bg-gradient-to-b from-emerald-500/20 via-teal-500/10 to-transparent blur-[110px] pointer-events-none -z-0" />
      <div className="absolute -top-20 left-1/3 w-[350px] h-[280px] bg-emerald-500/15 dark:bg-emerald-500/25 blur-[90px] pointer-events-none -z-0" />
      <div className="absolute -top-20 right-1/3 w-[350px] h-[280px] bg-teal-500/15 dark:bg-teal-500/25 blur-[90px] pointer-events-none -z-0" />

      {/* 1. Top Navigation Bar */}
      <LandingNavbar
        platformName={platformName}
        logoUrl={logoUrl}
        logoHeight={logoHeight}
        locale={locale}
        activePage="home"
        primaryCtaText={heroContent.primary_cta_text}
      />

      {/* 2. Hero Section */}
      <section id="home" className="relative pt-20 pb-16 md:pt-28 md:pb-24 max-w-6xl mx-auto px-6 sm:px-12 lg:px-16 text-center space-y-8 z-10">
        {/* Ambient Raycast/Linear Radial Glow */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] max-w-full h-[400px] bg-gradient-to-b from-emerald-500/15 via-teal-500/8 to-transparent blur-3xl pointer-events-none rounded-full -z-10" />

        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 backdrop-blur-md rounded-full px-4 py-1.5 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[12px] sm:text-[13px] font-medium tracking-tight text-foreground">
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

        {/* CTA Buttons with Magic UI ShimmerButton */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Link href="/signup" prefetch={true} className="w-full sm:w-auto">
            <ShimmerButton
              shimmerColor="#00E785"
              shimmerDuration="2.4s"
              shimmerSize="2px"
              background="#121316"
              className="w-full sm:w-auto shadow-xl shadow-emerald-500/15"
              innerClassName="px-8 py-3.5 text-sm font-semibold text-white"
            >
              <span>{heroContent.primary_cta_text}</span>
              <ArrowIcon className="h-4 w-4 text-[#00E785]" strokeWidth={2} />
            </ShimmerButton>
          </Link>
          <Link href="/login" prefetch={true} className="w-full sm:w-auto">
            <ShimmerButton
              shimmerColor="#6BD8CB"
              shimmerDuration="3s"
              shimmerSize="1.5px"
              background="#1A1B20"
              className="w-full sm:w-auto shadow-md"
              innerClassName="px-8 py-3.5 text-sm font-semibold text-white"
            >
              <LogIn className="h-4 w-4 text-[#6BD8CB]" strokeWidth={1.5} />
              <span>{heroContent.secondary_cta_text}</span>
            </ShimmerButton>
          </Link>
        </div>

        {/* Hero Interactive Laptop Showcase */}
        <LandingHeroMockup />
      </section>

      {/* 3. Integrations Bar */}
      <section id="partners" className="relative z-10 py-12 border-y border-black/5 dark:border-white/10 bg-[#F9F5F0]/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 sm:px-12 lg:px-16 text-center space-y-6">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#605E5B] dark:text-[#C9C6C1]">
            {isAr ? 'يتكامل بسلاسة مع أشهر المنصات والخدمات' : 'SEAMLESSLY INTEGRATES WITH TOP PLATFORMS'}
          </p>

          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-14 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
            {partners.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2.5 text-sm font-semibold text-[#1B1C1C] dark:text-[#F2F0F0]">
                <PartnerLogoIcon name={p.name} logoUrl={p.logo_url} className="h-5 w-5" />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. The Transformation: Pain vs Solution */}
      <LandingComparison isAr={isAr} content={settings?.home_content?.comparison} />

      {/* 5. 4 Core Outcome Pillars (+ Link to Features) */}
      <LandingValuePillars isAr={isAr} content={settings?.home_content?.pillars} />


      {/* 7. Proof by the Numbers & Key Metrics */}
      <LandingMetricsProof isAr={isAr} content={settings?.home_content?.metrics_proof} />

      {/* 7. Real Customer Testimonials & Success Stories */}
      <LandingTestimonials
        isAr={isAr}
        testimonials={settings?.testimonials}
        speedSeconds={settings?.home_content?.testimonials_speed}
      />

      {/* 10. Magnetic Final Call-to-Action */}
      <LandingFinalCta isAr={isAr} content={settings?.home_content?.final_cta} />

      {/* 11. Dark Editorial Footer */}
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
