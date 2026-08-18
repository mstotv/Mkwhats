import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import {
  MessageSquare,
  Sparkles,
  Zap,
  ShieldCheck,
  Users,
  ArrowLeft,
  ArrowRight,
  Bot,
  Radio,
  BarChart3,
  Globe,
  Star,
  Shield,
  Smartphone,
  Headphones,
  Check,
  TrendingUp,
  Quote,
  Clock,
  Send,
  Layers,
  FileSpreadsheet,
  FileText,
  PlayCircle,
  Sliders,
} from 'lucide-react'
import { LandingPricing } from '@/components/landing/landing-pricing'
import { LandingFAQ, FAQItem } from '@/components/landing/landing-faq'
import { LandingHeroMockup } from '@/components/landing/landing-hero-mockup'
import { FloatingSupport } from '@/components/landing/floating-support'
import { ModeToggle } from '@/components/layout/mode-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'

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

  // Fetch site_settings, partners, active plans, and published content pages in parallel
  const [{ data: settings }, { data: dbPartners }, { data: plans }, { data: contentPages }] =
    await Promise.all([
      serviceClient.from('site_settings').select('*').limit(1).maybeSingle(),
      serviceClient.from('partners').select('*').order('display_order', { ascending: true }),
      serviceClient
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true }),
      serviceClient
        .from('content_pages')
        .select('slug, title')
        .eq('is_published', true)
        .order('created_at', { ascending: true }),
    ])

  const platformName = isAr
    ? (settings?.platform_name_ar || settings?.platform_name || '')
    : (settings?.platform_name_en || settings?.platform_name || '')
  const logoUrl = settings?.logo_url
  const logoHeight = settings?.logo_height || 32
  const themeColors = (settings?.theme_colors as any) || {}
  const partnersGap = themeColors.partners_gap || 32

  // Dynamic Content with fallback defaults per locale
  const defaultHeroAr = {
    trust_badge_text: 'منصة أتمتة وتسويق الواتساب الأولى للشركات والمتاجر',
    headline: 'نمِّ عملك مع',
    headline_highlight: 'واتساب والذكاء الاصطناعي',
    subtitle:
      'منصة متكاملة تتيح لك أتمتة المحادثات، إرسال حملات البرودكاست الموجهة، وتوثيق المبيعات مع ربط Google Sheets وتنبيهات Telegram وربط فريقك بالكامل.',
    primary_cta_text: 'ابدأ مجاناً',
    secondary_cta_text: 'شاهد العرض التوضيحي',
  }

  const defaultHeroEn = {
    trust_badge_text: '#1 WhatsApp Automation & Marketing Platform for Businesses',
    headline: 'Scale Your Business with',
    headline_highlight: 'WhatsApp & Gemini AI',
    subtitle:
      'All-in-one platform to automate chat responses, trigger targeted broadcast campaigns, sync sales with Google Sheets, and notify your team via Telegram in real-time.',
    primary_cta_text: 'Get Started Free',
    secondary_cta_text: 'Watch Live Demo',
  }

  const heroContent = {
    trust_badge_text: isAr
      ? (settings?.hero_content?.trust_badge_text_ar || settings?.hero_content?.trust_badge_text || defaultHeroAr.trust_badge_text)
      : (settings?.hero_content?.trust_badge_text_en || defaultHeroEn.trust_badge_text),
    headline: isAr
      ? (settings?.hero_content?.headline_ar || settings?.hero_content?.headline || defaultHeroAr.headline)
      : (settings?.hero_content?.headline_en || defaultHeroEn.headline),
    headline_highlight: isAr
      ? (settings?.hero_content?.headline_highlight_ar || settings?.hero_content?.headline_highlight || defaultHeroAr.headline_highlight)
      : (settings?.hero_content?.headline_highlight_en || defaultHeroEn.headline_highlight),
    subtitle: isAr
      ? (settings?.hero_content?.subtitle_ar || settings?.hero_content?.subtitle || defaultHeroAr.subtitle)
      : (settings?.hero_content?.subtitle_en || defaultHeroEn.subtitle),
    primary_cta_text: isAr
      ? (settings?.hero_content?.primary_cta_text_ar || settings?.hero_content?.primary_cta_text || defaultHeroAr.primary_cta_text)
      : (settings?.hero_content?.primary_cta_text_en || defaultHeroEn.primary_cta_text),
    secondary_cta_text: isAr
      ? (settings?.hero_content?.secondary_cta_text_ar || settings?.hero_content?.secondary_cta_text || defaultHeroAr.secondary_cta_text)
      : (settings?.hero_content?.secondary_cta_text_en || defaultHeroEn.secondary_cta_text),
  }

  const defaultFeaturesAr = [
    {
      id: '1',
      title: '1. أتمتة المحادثات الذكية',
      description:
        'ردود فورية ومناقشات تفاعلية مدعومة بالذكاء الاصطناعي Gemini AI للإجابة على استفسارات العملاء وإتمام المبيعات 24/7.',
    },
    {
      id: '2',
      title: '2. إدارة حملات البرودكاست',
      description:
        'إرسال رسائل وحملات تسويقية جماعية مخصصة لآلاف العملاء المستهدفين بضغطة زر واحدة مع تتبع دقيق لنسب الوصول والقراءة.',
    },
    {
      id: '3',
      title: '3. قوالب الرسائل الجاهزة',
      description:
        'إنشاء وتنظيم قوالب رسائل ترحيبية وتفاعلية قابلة للتخصيص لإرسال الإشعارات وتسهيل تواصل موظفي المبيعات.',
    },
    {
      id: '4',
      title: '4. تحليلات وتقارير ذكية',
      description:
        'إحصائيات مباشرة لمعدلات استهلاك الرسائل، أداء الحملات، وسجل تفاعل العملاء لاتخاذ قرارات تسويقية صائبة.',
    },
    {
      id: '5',
      title: '5. ربط Google Sheets و Excel',
      description:
        'استخراج وتجميع كافة طلبات العملاء والعناوين والتلفونات تلقائياً وتصديرها بملفات إكسل مصفاة بضغطة زر.',
    },
    {
      id: '6',
      title: '6. إشعارات Telegram التلقائية',
      description:
        'ربط إشعارات المبيعات والطلبات الجديدة ببوت التلغرام لتلقي تنبيه فوري ومباشر على جوالك فور تأكيد العميل للطلب.',
    },
  ]

  const defaultFeaturesEn = [
    {
      id: '1',
      title: '1. Smart AI Automation',
      description:
        '24/7 automated interactive conversations powered by Gemini AI to answer inquiries and close sales around the clock.',
    },
    {
      id: '2',
      title: '2. Targeted Broadcasts',
      description:
        'Launch bulk WhatsApp marketing campaigns to thousands of targeted customers with 1-click and real-time delivery stats.',
    },
    {
      id: '3',
      title: '3. Pre-Approved Templates',
      description:
        'Create custom quick-reply templates and welcome sequences to speed up team responses and customer workflows.',
    },
    {
      id: '4',
      title: '4. Live Analytics & Insights',
      description:
        'Track campaign performance, message consumption, and customer engagement metrics with real-time dashboards.',
    },
    {
      id: '5',
      title: '5. Google Sheets & Excel Export',
      description:
        'Automatically sync order data, contacts, and phone numbers into structured Excel files and Google Sheets.',
    },
    {
      id: '6',
      title: '6. Telegram Bot Alerts',
      description:
        'Receive instant notifications on your mobile via Telegram whenever a new lead or order is confirmed.',
    },
  ]

  const rawFeatures = (settings?.features_content as any[]) || []
  const featuresList = (rawFeatures.length > 0 ? rawFeatures : defaultFeaturesAr).map((f: any, idx: number) => ({
    id: f.id || String(idx + 1),
    title: isAr
      ? (f.title_ar || f.title || defaultFeaturesAr[idx]?.title || '')
      : (f.title_en || defaultFeaturesEn[idx]?.title || f.title || ''),
    description: isAr
      ? (f.description_ar || f.description || defaultFeaturesAr[idx]?.description || '')
      : (f.description_en || defaultFeaturesEn[idx]?.description || f.description || ''),
  }))

  const defaultHowItWorksAr = [
    {
      step_number: '1',
      title: 'اربط واتساب',
      description:
        'افتح المنصة وامسح رمز الاستجابة السريعة (QR Code) بجوالك تماماً مثل فتح WhatsApp Web دون أي خبرة برمجة.',
    },
    {
      step_number: '2',
      title: 'اضبط الرد الآلي',
      description:
        'حدد قواعد الرد التلقائي، درّب مساعد الذكاء الاصطناعي Gemini على منتجاتك، وجهز قوالب الحملات.',
    },
    {
      step_number: '3',
      title: 'ابدأ البيع والنمو',
      description:
        'استقبل الطلبات، أرسل البرودكاست، وتابع التقارير وتنبيهات التلغرام وتصدير إكسل بنجاح 24 ساعة يومياً.',
    },
  ]

  const defaultHowItWorksEn = [
    {
      step_number: '1',
      title: 'Connect WhatsApp',
      description:
        'Scan the QR code with your mobile WhatsApp app in seconds just like WhatsApp Web, zero coding needed.',
    },
    {
      step_number: '2',
      title: 'Configure AI Rules',
      description:
        'Set up automated response rules, train the Gemini AI assistant on your products, and prepare broadcast templates.',
    },
    {
      step_number: '3',
      title: 'Scale & Close Sales',
      description:
        'Receive incoming leads, send broadcasts, track performance, and automate orders 24/7 effortless.',
    },
  ]

  const rawHowItWorks = (settings?.how_it_works_content as any[]) || []
  const howItWorksList = (rawHowItWorks.length > 0 ? rawHowItWorks : defaultHowItWorksAr).map((step: any, idx: number) => ({
    step_number: step.step_number || String(idx + 1),
    title: isAr
      ? (step.title_ar || step.title || defaultHowItWorksAr[idx]?.title || '')
      : (step.title_en || defaultHowItWorksEn[idx]?.title || step.title || ''),
    description: isAr
      ? (step.description_ar || step.description || defaultHowItWorksAr[idx]?.description || '')
      : (step.description_en || defaultHowItWorksEn[idx]?.description || step.description || ''),
  }))

  // Bilingual FAQs — use question_ar/question_en and answer_ar/answer_en
  const rawFaqs = (settings?.faqs as any[]) || []
  const faqsList: FAQItem[] = rawFaqs.map((f: any) => ({
    id: f.id || String(Math.random()),
    question: isAr
      ? (f.question_ar || f.question || '')
      : (f.question_en || f.question || ''),
    answer: isAr
      ? (f.answer_ar || f.answer || '')
      : (f.answer_en || f.answer || ''),
  }))
  const socialLinks = (settings?.social_links as any[]) || []

  // Ensure default partners exist
  const defaultPartnersMap = new Map([
    ['Shopify', 'https://cdn.simpleicons.org/shopify/96bf48'],
    ['WooCommerce', 'https://cdn.simpleicons.org/woocommerce/96588a'],
    ['Meta (WhatsApp)', 'https://cdn.simpleicons.org/meta/0668E1'],
    ['Stripe', 'https://cdn.simpleicons.org/stripe/635BFF'],
    ['Telegram', 'https://cdn.simpleicons.org/telegram/26A5E4'],
    ['Google Sheets', 'https://cdn.simpleicons.org/google/4285F4'],
  ])

  const uniquePartnersMap = new Map<string, { name: string; logo_url: string }>()
  if (dbPartners && dbPartners.length > 0) {
    dbPartners.forEach((p) => {
      uniquePartnersMap.set(p.name, { name: p.name, logo_url: p.logo_url })
    })
  }
  defaultPartnersMap.forEach((logoUrl, partnerName) => {
    if (!uniquePartnersMap.has(partnerName)) {
      uniquePartnersMap.set(partnerName, { name: partnerName, logo_url: logoUrl })
    }
  })

  const partners = Array.from(uniquePartnersMap.values()).map((p) => {
    let logo = p.logo_url
    if (!logo || logo.startsWith('/partners/')) {
      const lower = (p.name || '').toLowerCase()
      if (lower.includes('shopify')) logo = 'https://cdn.simpleicons.org/shopify/96bf48'
      else if (lower.includes('woocommerce')) logo = 'https://cdn.simpleicons.org/woocommerce/96588a'
      else if (lower.includes('meta')) logo = 'https://cdn.simpleicons.org/meta/0668E1'
      else if (lower.includes('stripe')) logo = 'https://cdn.simpleicons.org/stripe/635BFF'
      else if (lower.includes('whatsapp')) logo = 'https://cdn.simpleicons.org/whatsapp/25D366'
      else if (lower.includes('telegram')) logo = 'https://cdn.simpleicons.org/telegram/26A5E4'
      else if (lower.includes('google')) logo = 'https://cdn.simpleicons.org/google/4285F4'
      else logo = ''
    }
    return { name: p.name, logo_url: logo }
  })

  const featureIcons = [
    <Bot key="1" className="h-7 w-7 text-emerald-500" />,
    <Radio key="2" className="h-7 w-7 text-emerald-500" />,
    <FileText key="3" className="h-7 w-7 text-emerald-500" />,
    <BarChart3 key="4" className="h-7 w-7 text-emerald-500" />,
    <FileSpreadsheet key="5" className="h-7 w-7 text-emerald-500" />,
    <Send key="6" className="h-7 w-7 text-emerald-500" />,
  ]

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden transition-colors duration-300"
    >
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/10 blur-[160px] rounded-full pointer-events-none z-0" />

      {/* ── 1. Glassmorphism Top Navigation Bar ──────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-2xl transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={platformName}
                style={{ height: `${logoHeight}px` }}
                className="w-auto object-contain"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black shadow-lg">
                <MessageSquare className="h-5 w-5" />
              </div>
            )}
            <span className="text-xl font-black tracking-tight text-foreground">{platformName}</span>
          </div>

          {/* Navigation Items — bilingual from admin header_links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-muted-foreground">
            {((settings?.header_links as any[]) || [
              { label_ar: 'المميزات', label_en: 'Features', url: '#features' },
              { label_ar: 'كيف يعمل', label_en: 'How it Works', url: '#how-it-works' },
              { label_ar: 'الشركاء والتكاملات', label_en: 'Integrations', url: '#partners' },
              { label_ar: 'التسعير والخطط', label_en: 'Pricing', url: '#pricing' },
              { label_ar: 'الأسئلة الشائعة', label_en: 'FAQs', url: '#faqs' },
            ]).map((link: any, idx: number) => (
              <a key={idx} href={link.url || '#'} className="hover:text-foreground transition-colors">
                {isAr
                  ? (link.label_ar || link.label || '')
                  : (link.label_en || link.label || '')}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ModeToggle />
            <LanguageSwitcher />

            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg hover:bg-emerald-400 transition-all"
              >
                {isAr ? 'الذهاب للوحة التحكم' : 'Go to Dashboard'} <ArrowIcon className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-2 transition-colors"
                >
                  {isAr ? 'تسجيل الدخول' : 'Sign In'}
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg hover:bg-emerald-400 transition-all hover:scale-[1.02]"
                >
                  {heroContent.primary_cta_text || (isAr ? 'ابدأ مجاناً' : 'Get Started Free')} <ArrowIcon className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section ─────────────────────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8 relative z-10 space-y-8">
          {/* Trust Rating Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-black text-emerald-500 shadow-sm animate-in fade-in duration-500">
            <Sparkles className="h-4 w-4" />
            <span>{heroContent.trust_badge_text}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.15] max-w-4xl mx-auto">
            {heroContent.headline}{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              {heroContent.headline_highlight || (isAr ? 'واتساب والذكاء الاصطناعي' : 'WhatsApp & AI')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            {heroContent.subtitle}
          </p>

          {/* CTA Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href={user ? '/dashboard' : '/signup'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 text-sm font-black text-slate-950 shadow-2xl shadow-emerald-500/25 hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              {heroContent.primary_cta_text || (isAr ? 'ابدأ مجاناً الآن' : 'Get Started Free')}
              <ArrowIcon className="h-4 w-4" />
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/80 px-8 py-4 text-sm font-bold text-foreground hover:bg-muted transition-all duration-200"
            >
              <PlayCircle className="h-4 w-4 text-emerald-500" />
              {heroContent.secondary_cta_text || (isAr ? 'شاهد كيف يعمل' : 'Watch Demo')}
            </a>
          </div>
        </div>

        {/* Live Interactive Hero UI Mockup Showcase */}
        <div className="mt-12 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <LandingHeroMockup />
        </div>
      </section>

      {/* ── 3. Interactive Partners Carousel ───────────────── */}
      <section id="partners" className="py-14 border-b border-border bg-card/40 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {isAr ? 'يتكامل بسلاسة مع أشهر المنصات والخدمات' : 'Seamlessly Integrates With Top Platforms'}
          </p>

          <div className="relative flex overflow-x-hidden group py-2">
            <div
              className="flex shrink-0 animate-marquee-infinite items-center"
              style={{ gap: `${partnersGap}px` }}
            >
              {partners.concat(partners).map((partner, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 px-6 py-3 shadow-md hover:border-emerald-500/40 transition-all shrink-0"
                >
                  {partner.logo_url ? (
                    <img src={partner.logo_url} alt={partner.name} className="h-6 w-6 object-contain" />
                  ) : (
                    <Globe className="h-6 w-6 text-emerald-500" />
                  )}
                  <span className="text-xs font-bold text-foreground">{partner.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Features Grid Section ────────────────────────── */}
      <section id="features" className="py-24 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4">
            <span className="text-xs font-black uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 px-3.5 py-1 rounded-full">
              {isAr ? 'مميزات فائقة للنمو والمبيعات' : 'Powerful Features'}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground">
              {isAr ? 'كل ما تحتاجه للتحكم الكامل بـ واتساب' : 'Everything You Need to Master WhatsApp'}
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              {isAr ? 'أدوات متكاملة مصممة بعناية لزيادة أرباحك، أتمتة الردود، وتسهيل عمل فريقك.' : 'All-in-one suite built to boost revenue, automate responses, and empower your sales team.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList.map((item: any, idx: number) => (
              <div
                key={item.id || idx}
                className="rounded-3xl border border-border bg-card/80 p-8 space-y-5 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl shadow-sm"
              >
                <div className="h-14 w-14 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center font-bold shadow-lg">
                  {featureIcons[idx % featureIcons.length]}
                </div>
                <h3 className="text-xl font-black text-foreground">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. How It Works Section (3 Steps) ───────────────── */}
      <section id="how-it-works" className="py-24 border-b border-border bg-card/30 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-black uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 px-3.5 py-1 rounded-full">
              {isAr ? 'بساطة مطلقة' : 'Simple Setup'}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground">
              {isAr ? 'كيف تعمل المنصة؟' : 'How It Works'}
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              {isAr ? '3 خطوات بسيطة وسريعة لتشغيل أتمتة ومبيعات الواتساب في أقل من دقيقتين.' : '3 quick steps to automate your WhatsApp sales in less than 2 minutes.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {howItWorksList.map((step: any, idx: number) => (
              <div
                key={idx}
                className="rounded-3xl border border-border bg-card/60 p-8 space-y-4 text-center relative backdrop-blur-xl"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 font-black text-xl shadow-lg">
                  {step.step_number || idx + 1}
                </div>
                <h3 className="text-xl font-black text-foreground">{step.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Pricing & Plans Section ──────────────────────── */}
      <section id="pricing" className="py-24 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4">
            <span className="text-xs font-black uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 px-3.5 py-1 rounded-full">
              {isAr ? 'خطط مرنة وشفافة' : 'Flexible Pricing'}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground">
              {isAr ? 'اختر الخطة المناسبة لنشاطك' : 'Choose the Perfect Plan for Your Business'}
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              {isAr ? 'بدون رسوم خفية، إلغاء في أي وقت، مع خطة تجريبية مجانية بالكامل.' : 'No hidden fees. Cancel anytime. Full feature free trial included.'}
            </p>
          </div>

          <LandingPricing
            plans={(plans as any[]) || []}
            userLoggedIn={Boolean(user)}
            primaryColor="#10B981"
          />
        </div>
      </section>

      {/* ── 7. FAQ Section ──────────────────────────────────── */}
      <section id="faqs" className="py-24 border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4">
            <span className="text-xs font-black uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 px-3.5 py-1 rounded-full">
              {isAr ? 'إجابات فورية' : 'FAQs'}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground">
              {isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
            </h2>
          </div>

          <LandingFAQ items={faqsList} />
        </div>
      </section>

      {/* ── 8. Footer ────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card py-16 text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Platform Overview */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={platformName}
                    style={{ height: `${logoHeight}px` }}
                    className="w-auto object-contain"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black shadow-lg">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                )}
                <span className="text-lg font-black text-foreground">{platformName}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? 'منصة أتمتة وتسويق الواتساب والذكاء الاصطناعي الأولى لإدارة المحادثات والحملات ومزامنة الطلبات.'
                  : '#1 WhatsApp & Gemini AI automation platform for managing chats, broadcasts, and order sync.'}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-500 font-semibold">
                <ShieldCheck className="h-4 w-4" /> {isAr ? 'حماية وأمان البيانات 100%' : '100% Data Security & Protection'}
              </div>
            </div>

            {/* Column 2: Products & Solutions */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-foreground">{isAr ? 'المنتج والحلول' : 'Product & Solutions'}</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">{isAr ? 'حملات البرودكاست' : 'Broadcast Campaigns'}</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">{isAr ? 'مساعد الذكاء الاصطناعي' : 'Gemini AI Assistant'}</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">{isAr ? 'إدارة الفرق والأدوار' : 'Team & Roles Management'}</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">{isAr ? 'تكامل Evolution API' : 'Evolution API Integration'}</a></li>
              </ul>
            </div>

            {/* Column 3: Quick Navigation */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-foreground">{isAr ? 'روابط سريعة' : 'Quick Links'}</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#pricing" className="hover:text-foreground transition-colors">{isAr ? 'الخطط والأسعار' : 'Plans & Pricing'}</a></li>
                <li><a href="#partners" className="hover:text-foreground transition-colors">{isAr ? 'شركاء النجاح' : 'Integrations & Partners'}</a></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">{isAr ? 'تسجيل الدخول' : 'Sign In'}</Link></li>
                <li><Link href="/signup" className="hover:text-foreground transition-colors">{isAr ? 'إنشاء حساب مجاني' : 'Sign Up Free'}</Link></li>
              </ul>
            </div>

            {/* Column 4: Static Content Pages from DB */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-foreground">{isAr ? 'الصفحات والمعلومات' : 'Pages & Info'}</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {(() => {
                  const seenSlugs = new Set<string>()
                  const uniquePages = (contentPages || []).filter((p) => {
                    const normalized = p.slug.toLowerCase().replace(/_/g, '-')
                    if (seenSlugs.has(normalized)) return false
                    seenSlugs.add(normalized)
                    return true
                  })

                  return uniquePages.map((page) => {
                    let displayTitle = page.title
                    const slugLower = page.slug.toLowerCase()
                    if (!isAr) {
                      if (slugLower.includes('privacy')) displayTitle = 'Privacy Policy'
                      else if (slugLower.includes('term')) displayTitle = 'Terms & Conditions'
                      else if (slugLower.includes('about')) displayTitle = 'About Us'
                      else if (slugLower.includes('contact')) displayTitle = 'Contact Us'
                    } else {
                      if (slugLower.includes('privacy')) displayTitle = 'سياسة الخصوصية'
                      else if (slugLower.includes('term')) displayTitle = 'الشروط والأحكام'
                      else if (slugLower.includes('about')) displayTitle = 'من نحن'
                      else if (slugLower.includes('contact')) displayTitle = 'اتصل بنا'
                    }
                    return (
                      <li key={page.slug}>
                        <Link href={`/p/${page.slug}`} className="hover:text-foreground transition-colors">
                          {displayTitle}
                        </Link>
                      </li>
                    )
                  })
                })()}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border text-xs">
            <div>
              {isAr
                ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} ${platformName}.`
                : `All rights reserved © ${new Date().getFullYear()} ${platformName}.`}
            </div>

            <div className="flex items-center gap-3">
              {socialLinks
                .filter((s: any) => s && s.url && s.url.trim().length > 0)
                .map((s: any, idx: number) => {
                  const rawUrl = (s.url || '').trim()
                  const formattedHref =
                    rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
                      ? rawUrl
                      : `https://${rawUrl}`

                  const platformKey = (s.platform || s.name || '').toLowerCase()
                  let iconUrl = ''
                  if (platformKey.includes('facebook')) iconUrl = 'https://cdn.simpleicons.org/facebook/1877F2'
                  else if (platformKey.includes('instagram')) iconUrl = 'https://cdn.simpleicons.org/instagram/E4405F'
                  else if (platformKey.includes('twitter') || platformKey.includes('x')) iconUrl = 'https://cdn.simpleicons.org/x/FFFFFF'
                  else if (platformKey.includes('linkedin')) iconUrl = 'https://cdn.simpleicons.org/linkedin/0A66C2'
                  else if (platformKey.includes('youtube')) iconUrl = 'https://cdn.simpleicons.org/youtube/FF0000'
                  else if (platformKey.includes('tiktok')) iconUrl = 'https://cdn.simpleicons.org/tiktok/FFFFFF'
                  else if (platformKey.includes('snapchat')) iconUrl = 'https://cdn.simpleicons.org/snapchat/FFFC00'

                  return (
                    <a
                      key={idx}
                      href={formattedHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={s.name || s.platform}
                      className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:border-emerald-500 hover:scale-110 transition-all shadow-sm group"
                    >
                      {iconUrl ? (
                        <img src={iconUrl} alt={s.platform || 'Social'} className="h-4 w-4 object-contain group-hover:brightness-125" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                    </a>
                  )
                })}
            </div>
          </div>
        </div>
      </footer>

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
