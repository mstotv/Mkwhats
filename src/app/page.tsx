import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Radio,
  BarChart3,
  Globe,
  FileSpreadsheet,
  FileText,
  Zap,
  Shield,
  Sparkles,
  MessageSquare,
  Clock,
  Smartphone,
  Users,
  Workflow,
  TrendingUp,
  Layers,
  Lock,
  Bell,
  ShoppingBag,
  LogIn,
} from 'lucide-react'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingHeroMockup } from '@/components/landing/landing-hero-mockup'
import { LandingEcommerceSection } from '@/components/landing/landing-ecommerce-section'
import { FloatingSupport } from '@/components/landing/floating-support'

export const dynamic = 'force-dynamic'

function getFeatureIcon(iconName: string) {
  const iconProps = { className: 'h-6 w-6' }
  const smIconProps = { className: 'h-5 w-5' }

  switch (iconName) {
    case 'Bot':
      return <Bot {...iconProps} />
    case 'BarChart3':
      return <BarChart3 {...smIconProps} />
    case 'Radio':
      return <Radio {...smIconProps} />
    case 'FileText':
      return <FileText {...smIconProps} />
    case 'FileSpreadsheet':
      return <FileSpreadsheet {...smIconProps} />
    case 'Zap':
      return <Zap {...smIconProps} />
    case 'Shield':
      return <Shield {...smIconProps} />
    case 'Sparkles':
      return <Sparkles {...smIconProps} />
    case 'MessageSquare':
      return <MessageSquare {...smIconProps} />
    case 'Clock':
      return <Clock {...smIconProps} />
    case 'Users':
      return <Users {...smIconProps} />
    case 'Smartphone':
      return <Smartphone {...smIconProps} />
    case 'Workflow':
      return <Workflow {...smIconProps} />
    case 'TrendingUp':
      return <TrendingUp {...smIconProps} />
    case 'Layers':
      return <Layers {...smIconProps} />
    case 'Lock':
      return <Lock {...smIconProps} />
    case 'Bell':
      return <Bell {...smIconProps} />
    case 'ShoppingBag':
      return <ShoppingBag {...smIconProps} />
    case 'Globe':
      return <Globe {...smIconProps} />
    default:
      return <Sparkles {...smIconProps} />
  }
}

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
      ? (settings?.hero_content?.headline_ar || settings?.hero_content?.headline || 'نمِّ أعمالك مع')
      : (settings?.hero_content?.headline_en || 'Scale Your Business with'),
    headline_highlight: isAr
      ? (settings?.hero_content?.headline_highlight_ar || settings?.hero_content?.headline_highlight || 'واتساب و Gemini AI')
      : (settings?.hero_content?.headline_highlight_en || 'WhatsApp & Gemini AI'),
    subtitle: isAr
      ? (settings?.hero_content?.subtitle_ar || settings?.hero_content?.subtitle || 'أتمتة المحادثات، تصنيف العملاء المحتملين، وإتمام المبيعات وحجز المواعيد بسلاسة عبر واتساب. جرب قوة التجارة القائمة على الذكاء الاصطناعي.')
      : (settings?.hero_content?.subtitle_en || 'Automate responses, qualify leads, and close sales seamlessly directly within WhatsApp. Experience the elegant utility of AI-driven conversational commerce.'),
    primary_cta_text: isAr
      ? (settings?.hero_content?.primary_cta_text_ar || settings?.hero_content?.primary_cta_text || 'ابدأ مجاناً الآن')
      : (settings?.hero_content?.primary_cta_text_en || 'Get Started Free'),
    secondary_cta_text: isAr ? 'تسجيل الدخول' : 'Login',
  }

  // Bento Grid / Features content configuration with full fallback
  const rawFeatures = settings?.features_content
  const sectionTitle = isAr
    ? (rawFeatures?.section_title_ar || 'كل ما تحتاجه للتحكم الكامل بـ واتساب')
    : (rawFeatures?.section_title_en || 'Everything You Need to Master WhatsApp')

  const sectionSubtitle = isAr
    ? (rawFeatures?.section_subtitle_ar || 'مجموعة متطورة من الأدوات المصممة لأتمتة وتحليل وتوسيع تجارتك بسهولة تامة.')
    : (rawFeatures?.section_subtitle_en || 'A sophisticated suite of tools designed to automate, analyze, and scale your conversational commerce effortlessly.')

  const defaultFeaturesList = [
    {
      id: 'ai-automation',
      title_ar: 'أتمتة الذكاء الاصطناعي (Gemini AI)',
      title_en: 'Gemini AI Automation',
      description_ar: 'نشر وكلاء محادثة يفهمون السياق والنية بدقة لتقديم ردود طبيعية شبيهة بالبشر على مدار الساعة.',
      description_en: 'Deploy conversational agents that understand context, nuance, and user intent, providing human-like responses 24/7.',
      icon: 'Bot',
      col_span: 'col-span-2',
      badges: [
        { text_ar: 'Gemini 2.5 & 3.6 Flash Active', text_en: 'Gemini 2.5 & 3.6 Flash Active', variant: 'pulse' },
        { text_ar: 'Intent: Purchase High', text_en: 'Intent: Purchase High', variant: 'neutral' },
      ],
      integrations: [],
    },
    {
      id: 'deep-analytics',
      title_ar: 'تحليلات عميقة',
      title_en: 'Deep Analytics',
      description_ar: 'متابعة معدلات التفاعل والتحويل واستهلاك الرسائل الشهرية لحظة بلحظة.',
      description_en: 'Track engagement, conversion rates, and agent performance in real-time.',
      icon: 'BarChart3',
      col_span: 'col-span-1',
      badges: [],
      integrations: [],
    },
    {
      id: 'targeted-broadcasts',
      title_ar: 'حملات برودكاست موجهة',
      title_en: 'Targeted Broadcasts',
      description_ar: 'إرسال رسائل تسويقية جماعية للجمهور المستهدف بمعدلات آمنة وموثوقة.',
      description_en: 'Send personalized bulk messages to segmented audiences securely.',
      icon: 'Radio',
      col_span: 'col-span-1',
      badges: [],
      integrations: [],
    },
    {
      id: 'approved-templates',
      title_ar: 'قوالب معتمدة',
      title_en: 'Approved Templates',
      description_ar: 'إنشاء واستخدام قوالب رسائل تفاعلية لتسريع ردود فريق المبيعات.',
      description_en: 'Manage and deploy WhatsApp-approved message templates effortlessly.',
      icon: 'FileText',
      col_span: 'col-span-1',
      badges: [],
      integrations: [],
    },
    {
      id: 'sheets-telegram-sync',
      title_ar: 'مزامنة Google Sheets و Telegram',
      title_en: 'Google Sheets & Telegram Sync',
      description_ar: 'تسجيل العملاء والطلبات تلقائياً في Google Sheets مع تنبيهات فورية على Telegram لفريقك عند تأكيد الطلب.',
      description_en: 'Automatically log leads into Google Sheets and trigger instant Telegram alerts for your sales team when high-intent actions occur.',
      icon: 'FileSpreadsheet',
      col_span: 'col-span-2',
      badges: [],
      integrations: [
        { title_ar: 'Google Sheets', title_en: 'Google Sheets', status_ar: '● Auto-Synced', status_en: '● Auto-Synced' },
        { title_ar: 'Telegram Bot', title_en: 'Telegram Bot', status_ar: '● Instant Alert', status_en: '● Instant Alert' },
      ],
    },
  ]

  let featuresList: any[] = defaultFeaturesList
  if (rawFeatures) {
    if (Array.isArray(rawFeatures.features) && rawFeatures.features.length > 0) {
      featuresList = rawFeatures.features
    } else if (Array.isArray(rawFeatures) && rawFeatures.length > 0) {
      featuresList = rawFeatures
    }
  }

  const socialLinks = (settings?.social_links as any[]) || []

  const defaultPartners = [
    { name: 'WooCommerce', logo_url: 'https://cdn.simpleicons.org/woocommerce/96588a' },
    { name: 'Shopify', logo_url: 'https://cdn.simpleicons.org/shopify/96bf48' },
    { name: 'Stripe', logo_url: 'https://cdn.simpleicons.org/stripe/635BFF' },
    { name: 'Telegram', logo_url: 'https://cdn.simpleicons.org/telegram/26A5E4' },
    { name: 'Sheets', logo_url: 'https://cdn.simpleicons.org/google/4285F4' },
    { name: 'HubSpot', logo_url: 'https://cdn.simpleicons.org/hubspot/FF7A59' },
  ]

  const partners = (Array.isArray(settings?.partners) && settings.partners.length > 0)
    ? settings.partners
    : ((dbPartners && dbPartners.length > 0) ? dbPartners : defaultPartners)
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
      <section id="home" className="relative pt-20 pb-20 md:pt-28 md:pb-28 max-w-6xl mx-auto px-6 sm:px-12 lg:px-16 text-center space-y-8">
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
      <section id="partners" className="py-14 border-y border-[#BCC9C6]/30 dark:border-white/10 bg-white/50 dark:bg-[#242424]/40">
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

      {/* ── 4. E-Commerce Integration Showcase (WooCommerce & Shopify) ── */}
      <LandingEcommerceSection isAr={isAr} userLoggedIn={Boolean(user)} content={settings?.ecommerce_content || settings?.how_it_works_content} />

      {/* ── 5. Bento Grid (Dynamic CMS Features) ── */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#1B1C1C] dark:text-white">
            {sectionTitle}
          </h2>
          <p className="text-sm sm:text-base text-[#605E5B] dark:text-[#C9C6C1]">
            {sectionSubtitle}
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuresList.map((card: any, idx: number) => {
            const isWide = card.col_span === 'col-span-2'
            const cardTitle = isAr
              ? (card.title_ar || card.title || '')
              : (card.title_en || card.title || '')
            const cardDesc = isAr
              ? (card.description_ar || card.description || '')
              : (card.description_en || card.description || '')
            const hasBadges = Array.isArray(card.badges) && card.badges.length > 0
            const hasIntegrations = Array.isArray(card.integrations) && card.integrations.length > 0

            if (isWide && hasIntegrations) {
              // Wide Integration Card (like Sheets & Telegram)
              return (
                <div
                  key={card.id || idx}
                  className="md:col-span-2 rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#00685F] transition-colors duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="h-10 w-10 rounded-[4px] bg-[#00685F]/10 flex items-center justify-center text-[#00685F] dark:text-[#6BD8CB]">
                      {getFeatureIcon(card.icon)}
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#1B1C1C] dark:text-white">
                      {cardTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed max-w-lg">
                      {cardDesc}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    {card.integrations.map((intg: any, iIdx: number) => {
                      const intgTitle = isAr ? (intg.title_ar || intg.title || '') : (intg.title_en || intg.title || '')
                      const intgStatus = isAr ? (intg.status_ar || intg.status || '') : (intg.status_en || intg.status || '')
                      return (
                        <div key={iIdx} className="rounded-[4px] border border-[#EFEDED] dark:border-zinc-800 bg-[#F9F5F0] dark:bg-zinc-800 px-4 py-3 text-center">
                          <div className="text-xs font-bold text-[#1B1C1C] dark:text-[#F2F0F0]">{intgTitle}</div>
                          <div className="text-[10px] text-[#00685F] dark:text-[#6BD8CB] font-mono">{intgStatus}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            }

            if (isWide) {
              // Wide Card with Badges or Normal Wide (like AI Automation)
              return (
                <div
                  key={card.id || idx}
                  className="md:col-span-2 rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#00685F] transition-colors duration-200 flex flex-col justify-between relative overflow-hidden group"
                >
                  <div className="z-10 space-y-5">
                    <div className="h-12 w-12 rounded-[4px] bg-[#00685F]/10 flex items-center justify-center text-[#00685F] dark:text-[#6BD8CB]">
                      {getFeatureIcon(card.icon)}
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-serif text-2xl font-bold text-[#1B1C1C] dark:text-white">
                        {cardTitle}
                      </h3>
                      <p className="text-sm text-[#605E5B] dark:text-[#C9C6C1] max-w-md leading-relaxed">
                        {cardDesc}
                      </p>
                    </div>
                  </div>

                  {hasBadges && (
                    <div className="pt-8 flex flex-wrap gap-2 z-10">
                      {card.badges.map((badge: any, bIdx: number) => {
                        const badgeText = isAr ? (badge.text_ar || badge.text || '') : (badge.text_en || badge.text || '')
                        const isPulse = badge.variant === 'pulse' || bIdx === 0
                        return (
                          <span
                            key={bIdx}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                              isPulse
                                ? 'bg-[#00685F]/10 text-[#00685F] dark:text-[#6BD8CB]'
                                : 'bg-[#F5F3F3] dark:bg-zinc-800 text-[#605E5B] dark:text-[#C9C6C1]'
                            }`}
                          >
                            {isPulse && <span className="h-1.5 w-1.5 rounded-full bg-[#00685F] dark:bg-[#6BD8CB] animate-pulse" />}
                            {badgeText}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            // Normal Card (1 Col)
            return (
              <div
                key={card.id || idx}
                className="rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-7 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#00685F] transition-colors duration-200 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-[4px] bg-[#F5F3F3] dark:bg-zinc-800 flex items-center justify-center text-[#1B1C1C] dark:text-[#F2F0F0]">
                    <div className="text-[#00685F] dark:text-[#6BD8CB]">
                      {getFeatureIcon(card.icon)}
                    </div>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#1B1C1C] dark:text-white">
                    {cardTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
                    {cardDesc}
                  </p>
                </div>

                {hasBadges && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {card.badges.map((badge: any, bIdx: number) => {
                      const badgeText = isAr ? (badge.text_ar || badge.text || '') : (badge.text_en || badge.text || '')
                      return (
                        <span
                          key={bIdx}
                          className="inline-flex items-center gap-1 rounded-full bg-[#00685F]/10 text-[#00685F] dark:text-[#6BD8CB] px-2.5 py-0.5 text-[10px] font-semibold"
                        >
                          {badgeText}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 5. Dark Editorial Footer ──────────────────────────── */}
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
