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
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Bot,
  Radio,
  BarChart3,
  Globe,
  Star,
  Shield,
  Smartphone,
  Lock,
  Headphones,
  Check,
  Send,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const cookieStore = await cookies()
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
  const [{ data: settings }, { data: dbPartners }, { data: plans }, { data: contentPages }] = await Promise.all([
    serviceClient.from('site_settings').select('*').eq('id', 'global_config').maybeSingle(),
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

  const platformName = settings?.platform_name || 'MK Whats'
  const logoUrl = settings?.logo_url

  const rawPartners = (dbPartners && dbPartners.length > 0) ? dbPartners : (settings?.partners as any[]) || []
  const uniquePartnersMap = new Map<string, any>()
  for (const p of rawPartners) {
    if (p && p.name) {
      const key = p.name.trim().toLowerCase()
      if (!uniquePartnersMap.has(key)) {
        uniquePartnersMap.set(key, p)
      }
    }
  }

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
      else if (lower.includes('amazon')) logo = 'https://cdn.simpleicons.org/amazon/FF9900'
      else if (lower.includes('salesforce')) logo = 'https://cdn.simpleicons.org/salesforce/00A1E0'
      else if (lower.includes('paypal')) logo = 'https://cdn.simpleicons.org/paypal/003087'
      else logo = ''
    }
    return { name: p.name, logo_url: logo }
  })


  const socialLinks = (settings?.social_links as any[]) || []


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans dir-rtl selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[600px] right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[140px] rounded-full pointer-events-none z-0" />

      {/* ── 1. Top Navigation Bar ────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={platformName} className="h-8 w-auto object-contain" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                <MessageSquare className="h-5 w-5" />
              </div>
            )}
            <span className="text-xl font-black tracking-tight text-white">{platformName}</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              المميزات
            </a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">
              الخطط والأسعار
            </a>
            <a href="#partners" className="hover:text-emerald-400 transition-colors">
              الشركاء
            </a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
              >
                الذهاب للوحة التحكم <ArrowLeft className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 transition-colors"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
                >
                  إنشاء حساب مجاني <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section ─────────────────────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 border-b border-slate-800/50">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8 relative z-10 space-y-8">
          {/* Trust Rating Pill Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-800 bg-slate-900/90 px-4 py-1.5 text-xs font-semibold text-slate-200 shadow-md backdrop-blur-md">
            <div className="flex items-center text-amber-400 gap-0.5">
              <Star className="h-3.5 w-3.5 fill-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400" />
            </div>
            <span className="font-bold text-white">4.9/5</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">موثوق من +500 شركة متنامية ومحترف</span>
          </div>

          {/* Huge Hero Headline with Glowing Highlight Badges */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.15] tracking-tight">
            حوّل محادثات الواتساب إلى <br className="hidden sm:inline" />
            <span className="inline-block px-3.5 py-1 my-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.25)]">
              مبيعات آليّة لا تتوقف
            </span>{' '}
            ودعم ذكي 24/7
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
            منصة متكاملة تُمكنك من إرسال حملات البرودكاست الموجهة، تفعيل بوتات الرد الذكية بالذكاء الاصطناعي، وربط كافة أجهزة فريق عملك بمرونة تامة.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={user ? '/dashboard' : '/signup'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-base font-extrabold text-slate-950 shadow-xl shadow-emerald-500/25 hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              ابدأ تجربتك المجانية الآن <ArrowLeft className="h-5 w-5" />
            </Link>
            <a
              href="#pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-8 py-4 text-base font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all"
            >
              استعرض الخطط والأسعار
            </a>
          </div>

          {/* Guarantee Pill */}
          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-400" /> تجربة مجانية بدون بطاقة
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-400" /> إعداد سريع خلال دقيقتين
            </span>
          </div>

          {/* ── 3. Real Mac Browser Window UI Mockup ───────────────── */}
          <div className="pt-10">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 sm:p-4 shadow-2xl shadow-emerald-500/5 backdrop-blur-xl">
              {/* Window Bar Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 px-2 dir-ltr">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="rounded-md bg-slate-950 border border-slate-800/80 px-4 py-1 text-[11px] font-mono text-slate-400 w-1/2 text-center">
                  app.mkwhats.com/inbox
                </div>
                <div className="text-[11px] text-slate-500 font-mono">Live Dashboard</div>
              </div>

              {/* Window Content Layout */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-6 flex flex-col lg:flex-row items-stretch gap-6 text-right">
                {/* Chat Sidebar Mock */}
                <div className="w-full lg:w-1/3 bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white">المحادثات النشطة</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                      32 متصل الآن
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-slate-800/90 border border-slate-700/60 p-2.5 rounded-lg flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center text-xs">
                        أ
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center text-xs font-semibold text-white">
                          <span>أحمد العتيبي</span>
                          <span className="text-[10px] text-slate-400">10:42 ص</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">تم تأكيد الطلب #8920 بنجاح</p>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/60 p-2.5 rounded-lg flex items-center gap-3 opacity-80">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 font-bold flex items-center justify-center text-xs">
                        م
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                          <span>مؤسسة الحلول</span>
                          <span className="text-[10px] text-slate-500">10:38 ص</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">كم سعر الخطة الاحترافية؟</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Active Chat View */}
                <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-white">أحمد العتيبي (+966 50...)</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      رد آلي بالذكاء الاصطناعي
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-800/90 text-slate-100 text-xs p-3 rounded-xl max-w-[85%] text-right self-start border border-slate-700/50">
                      مرحباً، هل متوفر شحن سريع للرياض؟
                    </div>

                    <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-100 text-xs p-3 rounded-xl max-w-[85%] mr-auto text-right shadow-lg shadow-emerald-500/5 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                        <Bot className="h-3.5 w-3.5" /> مساعد MK Whats الذكي
                      </div>
                      <p>
                        أهلاً بك أحمد! نعم متوفر الشحن السريع للرياض خلال 24 ساعة فقط 🚚. هل ترغب في تأكيد طلبك الآن؟
                      </p>
                    </div>
                  </div>

                  {/* Message Input Simulation */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 text-right">
                      اكتب رسالة أو اختر رداً سريعاً...
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                      <Send className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Partners Infinite Marquee High-Contrast Container ─ */}
      <section id="partners" className="py-4 border-y border-slate-800/80 bg-slate-950/80 backdrop-blur-xl overflow-hidden dir-ltr">
        <div className="mx-auto max-w-7xl px-4 text-center mb-2.5">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            الشركاء والمنصات التوافقية
          </p>
        </div>

        <style>{`
          @keyframes marqueeSeamless {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-50% - 0.625rem)); }
          }
          .marquee-track-seamless {
            display: flex !important;
            width: max-content !important;
            gap: 1.25rem !important;
            animation: marqueeSeamless 35s linear infinite !important;
            will-change: transform;
          }
          .marquee-track-seamless:hover {
            animation-play-state: paused;
          }
        `}</style>

        <div className="relative w-full flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
          <div className="marquee-track-seamless py-1">
            {[...partners, ...partners, ...partners].map((p, idx) => (
              <div
                key={`p-${idx}`}
                className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800/80 px-4 py-2 rounded-lg shadow-sm hover:border-emerald-500/50 hover:bg-slate-800 transition-all shrink-0"
              >
                {p.logo_url ? (
                  <img src={p.logo_url} alt={p.name} className="h-5 w-5 object-contain" />
                ) : (
                  <div className="h-5 w-5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-200">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ── 5. Features Showcase ────────────────────────────── */}
      <section id="features" className="py-24 border-b border-slate-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-white">كل ما تحتاجه للنمو والسيطرة عبر الواتساب</h2>
            <p className="text-base text-slate-300 max-w-2xl mx-auto">
              أدوات مصممة بعناية فائقة لزيادة المبيعات، أتمتة الدعم الفني، وتسهيل عمل الفريق.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 space-y-4 hover:border-emerald-500/40 transition-all hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Radio className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">حملات برودكاست غير محدودة</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                أرسل الإشعارات، عروض التخفيضات، والرسائل الجماعية لآلاف العملاء في ثوانٍ مع تتبع دقيق لنسب التوصيل والقراءة.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 space-y-4 hover:border-emerald-500/40 transition-all hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">مساعد الذكاء الاصطناعي (AI)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                درّب البوت على منتجاتك وملفاتك ليقوم بالرد التلقائي وإتمام الطلبات بأسلوب طبيعي ومقنع 24 ساعة في اليوم.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 space-y-4 hover:border-emerald-500/40 transition-all hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">إدارة الفريق والصلاحيات</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                دعوة موظفي الدعم والمبيعات للحساب نفسه مع توزيع المحادثات التلقائي وتحديد أدوار الرؤية والتحكم.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Pricing & Plans Comparison Grid ─────────────── */}
      <section id="pricing" className="py-24 border-b border-slate-800/50 bg-slate-950/80 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-white">خطط وأسعار تناسب جميع الأحجام</h2>
            <p className="text-base text-slate-300 max-w-xl mx-auto">
              اختر الخطة المناسبة لحجم أعمالك وابدأ فوراً مع ضمان أعلى مستوى من الخدمة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {(plans || []).map((plan) => {
              const isPopular = plan.slug === 'pro' || plan.slug === 'professional'
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-8 flex flex-col justify-between transition-all relative ${
                    isPopular
                      ? 'bg-slate-900 border-emerald-500/80 shadow-2xl shadow-emerald-500/10 scale-105 z-10'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-xs font-black text-slate-950 shadow-lg">
                      الخطة الأكثر طلباً ⭐
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="border-b border-slate-800 pb-6">
                      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                      <div className="mt-3 text-4xl font-black text-white dir-ltr">
                        ${plan.price_monthly} <span className="text-xs font-normal text-slate-400">/شهر</span>
                      </div>
                    </div>

                    <ul className="space-y-3 text-xs text-slate-200">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>
                          {plan.max_messages_monthly === -1
                            ? 'رسائل غير محدودة'
                            : `${plan.max_messages_monthly.toLocaleString()} رسالة شهرية`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>
                          {plan.max_broadcasts_monthly === -1
                            ? 'حملات غير محدودة'
                            : `${plan.max_broadcasts_monthly.toLocaleString()} حملة شهرياً`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>
                          {plan.max_users === -1
                            ? 'أعضاء غير محدودين'
                            : `حتى ${plan.max_users} أعضاء فريق`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        {plan.features?.ai_assistant ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-600 shrink-0" />
                        )}
                        <span className={plan.features?.ai_assistant ? 'font-medium' : 'text-slate-500 line-through'}>
                          مساعد الذكاء الاصطناعي (AI)
                        </span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        {plan.features?.excel_export ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-600 shrink-0" />
                        )}
                        <span className={plan.features?.excel_export ? 'font-medium' : 'text-slate-500 line-through'}>
                          تصدير تقارير Excel
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-8">
                    <Link
                      href={user ? '/dashboard' : '/signup'}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition-all ${
                        isPopular
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      اشترك الآن <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 7. Organized Multi-Column Rich Footer ───────────── */}
      <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-900 pt-16 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Brand & Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt={platformName} className="h-8 w-auto object-contain" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                )}
                <span className="text-lg font-black text-white">{platformName}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                المنصة الأولى لأتمتة تسويق ودعم عملاء الواتساب المخصصة للمتاجر والشركات المتنامية.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
                <ShieldCheck className="h-4 w-4" /> حماية وأمان البيانات 100%
              </div>
            </div>

            {/* Column 2: Products & Features */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white">المنتج والحلول</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#features" className="hover:text-emerald-400 transition-colors">حملات البرودكاست</a></li>
                <li><a href="#features" className="hover:text-emerald-400 transition-colors">مساعد الذكاء الاصطناعي</a></li>
                <li><a href="#features" className="hover:text-emerald-400 transition-colors">إدارة الفرق والأدوار</a></li>
                <li><a href="#features" className="hover:text-emerald-400 transition-colors">تكامل Evolution API</a></li>
              </ul>
            </div>

            {/* Column 3: Quick Navigation */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white">روابط سريعة</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#pricing" className="hover:text-emerald-400 transition-colors">الخطط والأسعار</a></li>
                <li><a href="#partners" className="hover:text-emerald-400 transition-colors">شركاء النجاح</a></li>
                <li><Link href="/login" className="hover:text-emerald-400 transition-colors">تسجيل الدخول</Link></li>
                <li><Link href="/signup" className="hover:text-emerald-400 transition-colors">إنشاء حساب مجاني</Link></li>
              </ul>
            </div>

            {/* Column 4: Static Content Pages from DB */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white">الصفحات والمعلومات</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {(contentPages || []).map((page) => (
                  <li key={page.slug}>
                    <Link href={`/p/${page.slug}`} className="hover:text-emerald-400 transition-colors">
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-900 text-[11px] text-slate-500">
            <div>
              جميع الحقوق محفوظة © {new Date().getFullYear()} {platformName}.
            </div>
            <div className="flex items-center gap-3">
              {socialLinks.map((s, idx) => {
                const rawUrl = (s.url || '').trim()
                const formattedHref =
                  rawUrl.startsWith('http://') ||
                  rawUrl.startsWith('https://') ||
                  rawUrl.startsWith('mailto:') ||
                  rawUrl.startsWith('tel:')
                    ? rawUrl
                    : rawUrl.includes('@')
                    ? `mailto:${rawUrl}`
                    : rawUrl
                    ? `https://${rawUrl}`
                    : '#'

                return (
                  <a
                    key={idx}
                    href={formattedHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-emerald-500/50 transition-all"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
