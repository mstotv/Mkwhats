import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import {
  Bot,
  Radio,
  Workflow,
  BarChart3,
  Table,
  Bell,
  ShoppingBag,
  CheckCircle2,
  CalendarCheck,
  Store,
  Calendar,
} from 'lucide-react'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingEcommerceSection } from '@/components/landing/landing-ecommerce-section'
import { FloatingSupport } from '@/components/landing/floating-support'

export const dynamic = 'force-dynamic'

export default async function FeaturesPage() {
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

  const [{ data: settings }, { data: contentPages }] = await Promise.all([
    serviceClient.from('site_settings').select('*').limit(1).maybeSingle(),
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
  const socialLinks = (settings?.social_links as any[]) || []

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
        activePage="features"
        userLoggedIn={Boolean(user)}
      />

      {/* ── 2. Header & Capability Tags ────────────────────────── */}
      <section className="pt-20 pb-16 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-[#00685F]/10 border border-[#00685F]/20 rounded-full px-4 py-1.5 text-xs font-semibold text-[#00685F] dark:text-[#6BD8CB] uppercase tracking-wider">
          {isAr ? 'محرك فائق وقدرات متقدمة' : 'POWERFUL ENGINE & CAPABILITIES'}
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[#1B1C1C] dark:text-white max-w-4xl mx-auto leading-tight">
          {isAr ? 'مصمم لأتمتة كل نقطة تواصل مع العميل' : 'Engineered to Automate Every Customer Touchpoint'}
        </h1>

        <p className="text-base sm:text-lg text-[#605E5B] dark:text-[#C9C6C1] max-w-2xl mx-auto leading-relaxed">
          {isAr
            ? 'اربط عبر Meta API الرسمية أو QR Code، واستخدم نماذج Gemini و OpenAI لأتمتة الطلبات والمواعيد وتنبيهات الفريق.'
            : 'Connect via Official Meta Cloud API or QR Code, deploy Gemini & OpenAI models, and automate orders, bookings, and instant team notifications.'}
        </p>

        {/* Feature Tags Row */}
        <div className="flex flex-wrap justify-center gap-2.5 pt-2 max-w-3xl mx-auto">
          {['Meta Cloud API', 'QR Code Web Client', 'Google Gemini Pro', 'OpenAI GPT-4o', 'Telegram Webhook Bot', 'Google Sheets Live Sync'].map((tag, idx) => (
            <span key={idx} className="rounded-[4px] border border-[#EFEDED] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#605E5B] dark:text-[#C9C6C1] shadow-sm">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* ── 3. 6 White Cards Grid ──────────────────────────────── */}
      <section className="py-12 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#00685F] transition-colors duration-200 space-y-4">
            <div className="h-10 w-10 rounded-[4px] bg-[#00685F]/10 flex items-center justify-center text-[#00685F] dark:text-[#6BD8CB]">
              <Bot className="h-5 w-5" />
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#605E5B] dark:text-[#C9C6C1]">Gemini 1.5 + GPT-4o Support</div>
            <h3 className="font-serif text-xl font-bold text-[#1B1C1C] dark:text-white">
              {isAr ? 'أتمتة المحادثات الذكية' : 'Smart AI Automation'}
            </h3>
            <p className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
              {isAr
                ? 'محادثات تفاعلية آلية مدعومة بنماذج LLM المتقدمة للتعامل مع الاستفسارات المعقدة وترشيح المنتجات وإتمام المبيعات.'
                : '24/7 automated interactive conversations powered by advanced LLMs to handle complex queries, recommend catalog items, and close sales autonomously around the clock.'}
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#00685F] transition-colors duration-200 space-y-4">
            <div className="h-10 w-10 rounded-[4px] bg-[#00685F]/10 flex items-center justify-center text-[#00685F] dark:text-[#6BD8CB]">
              <Radio className="h-5 w-5" />
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#605E5B] dark:text-[#C9C6C1]">Official Meta API & Anti-Ban QR</div>
            <h3 className="font-serif text-xl font-bold text-[#1B1C1C] dark:text-white">
              {isAr ? 'حملات البرودكاست الموجهة' : 'Targeted Broadcasts'}
            </h3>
            <p className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
              {isAr
                ? 'إطلاق حملات تسويقية جماعية لآلاف العملاء بنقرة زر مع فواصل زمنية ذكية لحماية الأرقام وتتبع دقيق للمقاييس.'
                : 'Launch bulk WhatsApp marketing campaigns to thousands of segmented customers with 1-click execution, smart sending intervals, and real-time delivery metrics.'}
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#00685F] transition-colors duration-200 space-y-4">
            <div className="h-10 w-10 rounded-[4px] bg-[#00685F]/10 flex items-center justify-center text-[#00685F] dark:text-[#6BD8CB]">
              <Workflow className="h-5 w-5" />
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#605E5B] dark:text-[#C9C6C1]">Visual Flow Builder</div>
            <h3 className="font-serif text-xl font-bold text-[#1B1C1C] dark:text-white">
              {isAr ? 'قوالب وتدفقات معتمدة' : 'Pre-Approved Templates'}
            </h3>
            <p className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
              {isAr
                ? 'إنشاء قوالب رد سريع مخصصة، قوائم أزرار تفاعلية، وتدفقات ترحيبية آلية لتسريع رحلة العميل وتسهيل العمل.'
                : 'Create custom quick-reply templates, interactive button menus, and automated welcome sequences to speed up team responses and streamline client journeys.'}
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#00685F] transition-colors duration-200 space-y-4">
            <div className="h-10 w-10 rounded-[4px] bg-[#00685F]/10 flex items-center justify-center text-[#00685F] dark:text-[#6BD8CB]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#605E5B] dark:text-[#C9C6C1]">Real-Time Tracking</div>
            <h3 className="font-serif text-xl font-bold text-[#1B1C1C] dark:text-white">
              {isAr ? 'لوحة تحليلات وإحصائيات مباشرة' : 'Live Analytics Dashboard'}
            </h3>
            <p className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
              {isAr
                ? 'مراقبة استهلاك الرسائل المباشر، معدلات تحويل الحملات، اتجاهات نية العميل، وأداء الموظفين برسوم بيانية تفاعلية.'
                : 'Monitor live message consumption, campaign conversion rates, customer intent trends, and agent performance via interactive visual charts.'}
            </p>
          </div>

          {/* Card 5 */}
          <div className="rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#00685F] transition-colors duration-200 space-y-4">
            <div className="h-10 w-10 rounded-[4px] bg-[#00685F]/10 flex items-center justify-center text-[#00685F] dark:text-[#6BD8CB]">
              <Table className="h-5 w-5" />
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#605E5B] dark:text-[#C9C6C1]">Instant Data Pipeline</div>
            <h3 className="font-serif text-xl font-bold text-[#1B1C1C] dark:text-white">
              {isAr ? 'مزامنة وتوثيق الطلبات تلقائياً' : 'Automated Order Sync'}
            </h3>
            <p className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
              {isAr
                ? 'استخراج وحفظ طلبات العملاء الواردة والمقاسات والألوان والعناوين تلقائياً في جداول Google Sheets وملفات Excel.'
                : 'Automatically parse and capture incoming customer orders and instantly sync details like Size, Color, and Address to Google Sheets & Excel.'}
            </p>
          </div>

          {/* Card 6 */}
          <div className="rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#00685F] transition-colors duration-200 space-y-4">
            <div className="h-10 w-10 rounded-[4px] bg-[#00685F]/10 flex items-center justify-center text-[#00685F] dark:text-[#6BD8CB]">
              <Bell className="h-5 w-5" />
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#605E5B] dark:text-[#C9C6C1]">Zero Latency Webhooks</div>
            <h3 className="font-serif text-xl font-bold text-[#1B1C1C] dark:text-white">
              {isAr ? 'إشعارات تيليجرام الفورية' : 'Instant Telegram Alerts'}
            </h3>
            <p className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
              {isAr
                ? 'تلقي إشعارات فورية على هاتفك عبر قناة أو مجموعة Telegram المخصصة فور تسجيل عميل أو تأكيد طلب أو حجز موعد.'
                : 'Receive instant mobile notifications on your dedicated Telegram channel or group whenever a new lead is captured, an order is placed, or an appointment is confirmed.'}
            </p>
          </div>
        </div>
      </section>

      {/* ── E-Commerce & Store Integrations (WooCommerce & Shopify) ── */}
      <LandingEcommerceSection isAr={isAr} userLoggedIn={Boolean(user)} />

      {/* ── 4. Built for High-Velocity Businesses ─────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#1B1C1C] dark:text-white">
            {isAr ? 'مصمم للأنشطة والشركات سريعة النمو' : 'Built for High-Velocity Businesses'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: E-Commerce & Retail */}
          <div className="rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-10 shadow-[0_4px_20px_rgba(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-6 z-10">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-6 w-6 text-[#00685F] dark:text-[#6BD8CB]" />
                <h3 className="font-serif text-2xl font-bold text-[#1B1C1C] dark:text-white">
                  {isAr ? 'المتاجر الإلكترونية والتجزئة' : 'E-Commerce & Retail'}
                </h3>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1]">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                  <span>{isAr ? 'استقبال وتوثيق الطلبات آلياً' : 'Automated order intake'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                  <span>{isAr ? 'تحديد المقاس واللون والخيارات' : 'Size/color variant selection'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                  <span>{isAr ? 'جمع بيانات التوصيل والعنوان' : 'Checkout data gathering'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                  <span>{isAr ? 'تنبيهات فورية لتجهيز الطلب عبر Telegram' : 'Live Telegram fulfillment alerts'}</span>
                </li>
              </ul>
            </div>

            <Store className="absolute -bottom-6 -right-6 h-44 w-44 text-[#EFEDED]/60 dark:text-zinc-800/30 pointer-events-none" />
          </div>

          {/* Card 2: Healthcare & Services */}
          <div className="rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-10 shadow-[0_4px_20px_rgba(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-6 z-10">
              <div className="flex items-center gap-3">
                <CalendarCheck className="h-6 w-6 text-[#00685F] dark:text-[#6BD8CB]" />
                <h3 className="font-serif text-2xl font-bold text-[#1B1C1C] dark:text-white">
                  {isAr ? 'العيادات والخدمات والمواعيد' : 'Healthcare & Services'}
                </h3>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1]">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                  <span>{isAr ? 'حجز المواعيد واختيار الأوقات آلياً' : 'Automated date & time booking'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                  <span>{isAr ? 'معالجة تغيير وتأكيد المواعيد عبر الشات' : 'Reschedule handling via chat'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                  <span>{isAr ? 'إرسال تذكيرات آلية للعملاء قبل الموعد' : 'Customer reminder pings'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB] shrink-0" />
                  <span>{isAr ? 'إشعارات مباشرة لفريق العمل والأطباء' : 'Real-time appointment alerts'}</span>
                </li>
              </ul>
            </div>

            <Calendar className="absolute -bottom-6 -right-6 h-44 w-44 text-[#EFEDED]/60 dark:text-zinc-800/30 pointer-events-none" />
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
