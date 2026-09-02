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
  Mic,
  Users,
  Sparkles,
  Smartphone,
  FileSpreadsheet,
} from 'lucide-react'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingEcommerceSection } from '@/components/landing/landing-ecommerce-section'
import { FloatingSupport } from '@/components/landing/floating-support'

export const dynamic = 'force-dynamic'

function getFeatureIcon(iconName: string) {
  const iconProps = { className: 'h-5 w-5' }
  switch (iconName) {
    case 'Bot': return <Bot {...iconProps} />
    case 'ShoppingBag': return <ShoppingBag {...iconProps} />
    case 'CalendarCheck': return <CalendarCheck {...iconProps} />
    case 'Mic': return <Mic {...iconProps} />
    case 'Store': return <Store {...iconProps} />
    case 'FileSpreadsheet': return <FileSpreadsheet {...iconProps} />
    case 'BarChart3': return <BarChart3 {...iconProps} />
    case 'Radio': return <Radio {...iconProps} />
    case 'Workflow': return <Workflow {...iconProps} />
    case 'Users': return <Users {...iconProps} />
    case 'Smartphone': return <Smartphone {...iconProps} />
    case 'Bell': return <Bell {...iconProps} />
    case 'Table': return <Table {...iconProps} />
    default: return <Sparkles {...iconProps} />
  }
}

const DEFAULT_FEATURES = [
  {
    id: 'order-intake',
    title_ar: 'أخذ وتوثيق الطلبات وإشعار تيليجرام الفوري',
    title_en: 'Automated Order Intake & Telegram Alerts',
    tag_ar: 'تجميع الطلبات + تنبيهات تيليجرام',
    tag_en: 'AI Order Intake + Telegram Alerts',
    description_ar: 'يقوم الذكاء الاصطناعي بجمع مواصفات الطلب خطوة بخطوة (المنتج، المقاس، اللون، الكمية، العنوان، رقم الهاتف)، مع إرسال إشعار لحظي فوري بتفاصيل الطلب إلى قناة أو مجموعة Telegram لفريق التجهيز والتوصيل.',
    description_en: 'AI collects complete order specifications step-by-step (item, size, color, delivery address, phone) and instantly fires a real-time Telegram notification to your fulfillment team.',
    icon: 'ShoppingBag',
  },
  {
    id: 'appointment-booking',
    title_ar: 'حجز المواعيد وإشعارات تيليجرام الفورية',
    title_en: 'Smart Booking & Team Telegram Alerts',
    tag_ar: 'حجز المواعيد + تنبيهات الأطباء',
    tag_en: 'Calendar Booking + Instant Alerts',
    description_ar: 'تنسيق وحجز المواعيد آلياً حسب أوقات العمل المتاحة، وجمع اسم العميل والخدمة المطلوبة، مع إرسال إشعار فوري لحظي بتفاصيل الحجز للأطباء أو الموظفين عبر Telegram وإرسال تذكيرات آلية للعملاء.',
    description_en: 'Automate client appointments based on live working hours, verify chosen slots, and dispatch instant Telegram alerts to doctors/agents while scheduling automated reminder pings.',
    icon: 'CalendarCheck',
  },
  {
    id: 'voice-stt',
    title_ar: 'فهم وتفريغ الرسائل الصوتية (Voice STT)',
    title_en: 'AI Voice Notes Transcription',
    tag_ar: 'تفريغ وفهم الصوت الفوري',
    tag_en: 'Whisper + Gemini Voice AI',
    description_ar: 'استماع المساعد الذكي للرسائل الصوتية الواردة من العملاء بمختلف اللهجات العربية، وتفريغها صوتياً بدقة عالية، وفهم تفاصيل الطلبات والمواعيد والرد عليها فورياً بالكتابة أو الصوت.',
    description_en: 'AI listens to customer voice notes across diverse Arabic and English dialects, transcribes audio in real-time, extracts order/booking intents, and responds autonomously.',
    icon: 'Mic',
  },
  {
    id: 'ecommerce-sync',
    title_ar: 'ربط المتاجر واسترجاع السلات المتروكة',
    title_en: 'E-Commerce Sync & Cart Recovery',
    tag_ar: 'مزامنة ووكومرس وشوبيفاي',
    tag_en: 'WooCommerce & Shopify 2-Way Sync',
    description_ar: 'مزامنة مباشرة مع متاجر WooCommerce وشوبيفاي، وتحديث حالات الطلبات، وإرسال رسائل استرجاع ذكية للسلات المتروكة برابط دفع سريع لزيادة مبيعات المتجر بنسبة +30%.',
    description_en: 'Bi-directional sync with WooCommerce & Shopify, automated order status updates, and high-converting WhatsApp abandoned cart recovery with 1-click checkout links.',
    icon: 'Store',
  },
  {
    id: 'google-sheets-sync',
    title_ar: 'المزامنة التلقائية مع جداول Google Sheets',
    title_en: 'Live Google Sheets & Excel Auto-Sync',
    tag_ar: 'ترحيل البيانات السحابية الحية',
    tag_en: 'Live Cloud Data Pipeline',
    description_ar: 'توثيق وترحيل بيانات كل طلب أو موعد أو عميل جديد تلقائياً إلى جداول Google Sheets وملفات Excel المربوطة لحظياً دون الحاجة لأي إدخال يدوي.',
    description_en: 'Automatically capture and stream every incoming customer order, booking, and contact lead straight into your Google Sheets and Excel spreadsheets with zero manual data entry.',
    icon: 'FileSpreadsheet',
  },
  {
    id: 'ai-automation',
    title_ar: 'أتمتة المحادثات والرد الذكي 24/7',
    title_en: 'Smart Conversational AI Assistant',
    tag_ar: 'دعم Gemini 2.0 و GPT-4o',
    tag_en: 'Gemini 2.0 + GPT-4o Support',
    description_ar: 'ردود تفاعلية فائقة السرعة مدعومة بأحدث نماذج الذكاء الاصطناعي مع تدريب المساعد بملفات ومستندات وقواعد المعرفة الخاصة بنشاطك التجاري لتقديم إجابات دقيقة وموثوقة.',
    description_en: 'Ultra-fast interactive auto-replies powered by advanced LLMs, grounded in your business knowledge base documents to provide accurate, reliable answers around the clock.',
    icon: 'Bot',
  },
  {
    id: 'targeted-broadcasts',
    title_ar: 'حملات البرودكاست الموجهة والآمنة',
    title_en: 'Targeted WhatsApp Broadcasts',
    tag_ar: 'Meta Cloud API و QR ضد الحظر',
    tag_en: 'Official Meta API & Anti-Ban QR',
    description_ar: 'إطلاق حملات تسويقية جماعية لآلاف العملاء بنقرة زر مع فواصل زمنية متغيرة ذكية لحماية الأرقام وتتبع دقيق للمقاييس ومعدلات التسليم والقراءة.',
    description_en: 'Execute high-scale segmented WhatsApp marketing broadcasts with intelligent intervals, anti-ban protections, and real-time open/read analytics.',
    icon: 'Radio',
  },
  {
    id: 'flow-builder',
    title_ar: 'منشئ التدفقات البصري والقوالب التفاعلية',
    title_en: 'Visual Flow Builder & Interactive Menus',
    tag_ar: 'منشئ التدفقات بدون كود',
    tag_en: 'Visual No-Code Flow Builder',
    description_ar: 'إنشاء قوالب رد سريع مخصصة، قوائم أزرار تفاعلية، وتدفقات ترحيبية آلية لتسريع رحلة العميل وتسهيل العمل بسحب وإفلات العناصر.',
    description_en: 'Build multi-branch conversational flows, interactive buttons, quick-reply menus, and automated routing rules with an intuitive drag-and-drop visual canvas.',
    icon: 'Workflow',
  },
  {
    id: 'team-crm',
    title_ar: 'صندوق الوارد الموحد وإدارة المبيعات (CRM)',
    title_en: 'Multi-Agent Team Inbox & CRM Pipelines',
    tag_ar: 'صندوق الفريق ومراحل الصفقات',
    tag_en: 'Multi-Agent CRM & Deal Pipelines',
    description_ar: 'واجهة موحدة لفريق العمل، تصنيف المحادثات بالوسوم الملونة، تتبع الصفقات عبر مراحل المبيعات، وإسناد كل محادثة للموظف المختص بسهولة.',
    description_en: 'Unified collaboration inbox for support and sales agents, colored tag labeling, visual deal stage pipelines, and seamless team conversation assignment.',
    icon: 'Users',
  },
  {
    id: 'dual-whatsapp-gateway',
    title_ar: 'بوابة الربط المزدوج بالواتساب',
    title_en: 'Dual WhatsApp Gateway',
    tag_ar: 'ربط سحابي رسمي + ويب QR',
    tag_en: 'Official Meta API & Web QR',
    description_ar: 'حرية الاختيار الكاملة بين الربط السحابي الرسمي لشركة Meta أو الربط الفوري المباشر عبر مسح QR Code بدون قيود نافذة الـ 24 ساعة وبدون تكاليف قوالب إضافية.',
    description_en: 'Full freedom to connect via Official Meta Cloud API or instant Web QR Client with zero 24-hour window restrictions and zero extra template fees.',
    icon: 'Smartphone',
  },
  {
    id: 'smart-handoff',
    title_ar: 'التحويل الذكي للموظف وتنبيهات التدخل',
    title_en: 'AI-to-Human Handoff & Instant Dispatch',
    tag_ar: 'التحويل السلس وتنبيه الموظف',
    tag_en: 'Smart Handoff & Dispatch Alerts',
    description_ar: 'تحويل المحادثة بسلاسة من الذكاء الاصطناعي إلى الموظف البشري فور طلب العميل، مع إرسال إشعار فوري وتنبيه للموظف عبر تيليجرام للتدخل السريع وإنهاء الصفقة.',
    description_en: 'Seamlessly transfer active conversations from AI to human agents when requested, with instant Telegram dispatch alerts for fast human intervention.',
    icon: 'Bell',
  },
  {
    id: 'contacts-export',
    title_ar: 'إدارة وتصدير جهات الاتصال الذكية',
    title_en: 'Advanced Contacts CRM & Excel Export',
    tag_ar: 'استيراد وتقسيم العملاء',
    tag_en: 'Bulk Contacts & Segmentation',
    description_ar: 'استيراد وتصدير آلاف جهات الاتصال بملفات Excel و CSV، مع تصنيف العملاء وتقسيمهم حسب السلوك ومراحل الشراء لاستهدافهم بدقة في الحملات التسويقية.',
    description_en: 'Import and export bulk contacts via Excel and CSV, segment customer audiences by tags and behavior, and target them precisely in marketing campaigns.',
    icon: 'FileSpreadsheet',
  },
]

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

  const rawFeatures = settings?.features_content?.features
  const featuresList = Array.isArray(rawFeatures) && rawFeatures.length > 0
    ? rawFeatures
    : DEFAULT_FEATURES

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
          {['Meta Cloud API', 'QR Code Web Client', 'Google Gemini Pro', 'OpenAI GPT-4o', isAr ? 'تفريغ الصوت (Voice STT)' : 'Voice STT Audio AI', 'Telegram Webhook Bot', 'Google Sheets Live Sync'].map((tag, idx) => (
            <span key={idx} className="rounded-[4px] border border-[#EFEDED] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#605E5B] dark:text-[#C9C6C1] shadow-sm">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* ── 3. Comprehensive Features Grid (Dynamic CMS) ────────── */}
      <section className="py-12 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuresList.map((card: any, idx: number) => {
            const cardTitle = isAr
              ? (card.title_ar || card.title || '')
              : (card.title_en || card.title || '')
            const cardDesc = isAr
              ? (card.description_ar || card.description || '')
              : (card.description_en || card.description || '')
            const cardTag = isAr
              ? (card.tag_ar || card.tag || '')
              : (card.tag_en || card.tag || '')

            return (
              <div
                key={card.id || idx}
                className="rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#00685F] transition-colors duration-200 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-[4px] bg-[#00685F]/10 flex items-center justify-center text-[#00685F] dark:text-[#6BD8CB]">
                    {getFeatureIcon(card.icon)}
                  </div>
                  {cardTag && (
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#605E5B] dark:text-[#C9C6C1]">
                      {cardTag}
                    </div>
                  )}
                  <h3 className="font-serif text-xl font-bold text-[#1B1C1C] dark:text-white">
                    {cardTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
                    {cardDesc}
                  </p>
                </div>
              </div>
            )
          })}
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
                  <span>{isAr ? 'فهم الرسائل الصوتية وتنسيق المواعيد صوتياً' : 'Voice note intake & spoken booking assistance'}</span>
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
