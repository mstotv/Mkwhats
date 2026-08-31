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
  PlayCircle,
} from 'lucide-react'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingHeroMockup } from '@/components/landing/landing-hero-mockup'
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
    secondary_cta_text: isAr
      ? (settings?.hero_content?.secondary_cta_text_ar || settings?.hero_content?.secondary_cta_text || 'شاهد العرض المباشر')
      : (settings?.hero_content?.secondary_cta_text_en || 'Watch Live Demo'),
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

  const partners = (dbPartners && dbPartners.length > 0) ? dbPartners : defaultPartners
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

          <Link
            href="/features"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[4px] border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-[#1B1C1C] dark:text-white px-7 py-3.5 text-[13px] font-semibold transition-all shadow-sm"
          >
            <PlayCircle className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB]" />
            {heroContent.secondary_cta_text}
          </Link>
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

      {/* ── 4. Bento Grid ("Everything You Need to Master WhatsApp") ── */}
      <section className="py-20 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#1B1C1C] dark:text-white">
            {isAr ? 'كل ما تحتاجه للتحكم الكامل بـ واتساب' : 'Everything You Need to Master WhatsApp'}
          </h2>
          <p className="text-sm sm:text-base text-[#605E5B] dark:text-[#C9C6C1]">
            {isAr
              ? 'مجموعة متطورة من الأدوات المصممة لأتمتة وتحليل وتوسيع تجارتك بسهولة تامة.'
              : 'A sophisticated suite of tools designed to automate, analyze, and scale your conversational commerce effortlessly.'}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Large Featured AI Automation */}
          <div className="md:col-span-2 rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#00685F] transition-colors duration-200 flex flex-col justify-between relative overflow-hidden group">
            <div className="z-10 space-y-5">
              <div className="h-12 w-12 rounded-[4px] bg-[#00685F]/10 flex items-center justify-center text-[#00685F] dark:text-[#6BD8CB]">
                <Bot className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-bold text-[#1B1C1C] dark:text-white">
                  {isAr ? 'أتمتة الذكاء الاصطناعي (Gemini AI)' : 'Gemini AI Automation'}
                </h3>
                <p className="text-sm text-[#605E5B] dark:text-[#C9C6C1] max-w-md leading-relaxed">
                  {isAr
                    ? 'نشر وكلاء محادثة يفهمون السياق والنية بدقة لتقديم ردود طبيعية شبيهة بالبشر على مدار الساعة.'
                    : 'Deploy conversational agents that understand context, nuance, and user intent, providing human-like responses 24/7.'}
                </p>
              </div>
            </div>

            <div className="pt-8 flex flex-wrap gap-2 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00685F]/10 text-[#00685F] dark:text-[#6BD8CB] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00685F] dark:bg-[#6BD8CB] animate-pulse" />
                Gemini 2.5 & 3.6 Flash Active
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F3F3] dark:bg-zinc-800 text-[#605E5B] dark:text-[#C9C6C1] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider">
                Intent: Purchase High
              </span>
            </div>
          </div>

          {/* Card 2: Deep Analytics */}
          <div className="rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-7 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#00685F] transition-colors duration-200 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-[4px] bg-[#F5F3F3] dark:bg-zinc-800 flex items-center justify-center text-[#1B1C1C] dark:text-[#F2F0F0]">
                <BarChart3 className="h-5 w-5 text-[#00685F] dark:text-[#6BD8CB]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1B1C1C] dark:text-white">
                {isAr ? 'تحليلات عميقة' : 'Deep Analytics'}
              </h3>
              <p className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
                {isAr
                  ? 'متابعة معدلات التفاعل والتحويل واستهلاك الرسائل الشهرية لحظة بلحظة.'
                  : 'Track engagement, conversion rates, and agent performance in real-time.'}
              </p>
            </div>
          </div>

          {/* Card 3: Targeted Broadcasts */}
          <div className="rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-7 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#00685F] transition-colors duration-200 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-[4px] bg-[#F5F3F3] dark:bg-zinc-800 flex items-center justify-center text-[#1B1C1C] dark:text-[#F2F0F0]">
                <Radio className="h-5 w-5 text-[#00685F] dark:text-[#6BD8CB]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1B1C1C] dark:text-white">
                {isAr ? 'حملات برودكاست موجهة' : 'Targeted Broadcasts'}
              </h3>
              <p className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
                {isAr
                  ? 'إرسال رسائل تسويقية جماعية للجمهور المستهدف بمعدلات آمنة وموثوقة.'
                  : 'Send personalized bulk messages to segmented audiences securely.'}
              </p>
            </div>
          </div>

          {/* Card 4: Approved Templates */}
          <div className="rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-7 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#00685F] transition-colors duration-200 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-[4px] bg-[#F5F3F3] dark:bg-zinc-800 flex items-center justify-center text-[#1B1C1C] dark:text-[#F2F0F0]">
                <FileText className="h-5 w-5 text-[#00685F] dark:text-[#6BD8CB]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1B1C1C] dark:text-white">
                {isAr ? 'قوالب معتمدة' : 'Approved Templates'}
              </h3>
              <p className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
                {isAr
                  ? 'إنشاء واستخدام قوالب رسائل تفاعلية لتسريع ردود فريق المبيعات.'
                  : 'Manage and deploy WhatsApp-approved message templates effortlessly.'}
              </p>
            </div>
          </div>

          {/* Card 5: Google Sheets & Telegram Sync */}
          <div className="md:col-span-2 rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#00685F] transition-colors duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="h-10 w-10 rounded-[4px] bg-[#00685F]/10 flex items-center justify-center text-[#00685F] dark:text-[#6BD8CB]">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1B1C1C] dark:text-white">
                {isAr ? 'مزامنة Google Sheets و Telegram' : 'Google Sheets & Telegram Sync'}
              </h3>
              <p className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed max-w-lg">
                {isAr
                  ? 'تسجيل العملاء والطلبات تلقائياً في Google Sheets مع تنبيهات فورية على Telegram لفريقك عند تأكيد الطلب.'
                  : 'Automatically log leads into Google Sheets and trigger instant Telegram alerts for your sales team when high-intent actions occur.'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="rounded-[4px] border border-[#EFEDED] dark:border-zinc-800 bg-[#F9F5F0] dark:bg-zinc-800 px-4 py-3 text-center">
                <div className="text-xs font-bold text-[#1B1C1C] dark:text-[#F2F0F0]">Google Sheets</div>
                <div className="text-[10px] text-[#00685F] dark:text-[#6BD8CB] font-mono">● Auto-Synced</div>
              </div>
              <div className="rounded-[4px] border border-[#EFEDED] dark:border-zinc-800 bg-[#F9F5F0] dark:bg-zinc-800 px-4 py-3 text-center">
                <div className="text-xs font-bold text-[#1B1C1C] dark:text-[#F2F0F0]">Telegram Bot</div>
                <div className="text-[10px] text-[#00685F] dark:text-[#6BD8CB] font-mono">● Instant Alert</div>
              </div>
            </div>
          </div>
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
