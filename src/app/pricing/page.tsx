import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { ShieldCheck, Lock, RefreshCw, CheckCircle2 } from 'lucide-react'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingPricing } from '@/components/landing/landing-pricing'
import { FloatingSupport } from '@/components/landing/floating-support'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
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

  const [{ data: settings }, { data: plans }, { data: contentPages }] =
    await Promise.all([
      serviceClient.from('site_settings').select('*').limit(1).maybeSingle(),
      serviceClient
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true }),
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
        activePage="pricing"
        userLoggedIn={Boolean(user)}
      />

      {/* ── 2. Pricing Header ──────────────────────────────────── */}
      <section className="pt-20 pb-16 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-[#00685F]/10 border border-[#00685F]/20 rounded-full px-4 py-1.5 text-xs font-semibold text-[#00685F] dark:text-[#6BD8CB] uppercase tracking-wider">
          {isAr ? 'خطط شفافة وقابلة للتوسع' : 'TRANSPARENT & SCALABLE PLANS'}
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[#1B1C1C] dark:text-white max-w-4xl mx-auto leading-tight">
          {isAr ? 'اختر الخطة المناسبة لنشاطك التجاري' : 'Choose the Perfect Plan for Your Business'}
        </h1>

        <p className="text-base sm:text-lg text-[#605E5B] dark:text-[#C9C6C1] max-w-2xl mx-auto leading-relaxed">
          {isAr
            ? 'بدون أي رسوم خفية للإعداد. قم بالترقية أو الإلغاء في أي وقت مع فترة تجريبية مجانية لجميع الخطط.'
            : 'No hidden setup fees. Upgrade or cancel anytime. Full 14-day free trial on all paid plans.'}
        </p>

        {/* ── Pricing Cards Table ────────────────────────────── */}
        <div className="pt-6">
          <LandingPricing
            plans={(plans as any[]) || []}
            userLoggedIn={Boolean(user)}
            primaryColor="#00685F"
          />
        </div>
      </section>

      {/* ── 3. Trust & Guarantee Badges (Screen 3 Bottom) ──────── */}
      <section className="py-16 border-t border-[#BCC9C6]/30 dark:border-white/10 bg-white/40 dark:bg-[#242424]/30">
        <div className="mx-auto max-w-7xl px-6 sm:px-12 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3 p-6 rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="mx-auto h-10 w-10 rounded-[4px] bg-[#00685F]/10 flex items-center justify-center text-[#00685F] dark:text-[#6BD8CB]">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1B1C1C] dark:text-white">
                {isAr ? 'أمان بمستوى مصرفي' : 'Bank-Grade Security'}
              </h3>
              <p className="text-xs text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
                {isAr
                  ? 'تشفير شامل وآمن لجميع تدفقات المحادثات والبيانات الحساسة.'
                  : 'End-to-end encryption for all your conversation workflows.'}
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="mx-auto h-10 w-10 rounded-[4px] bg-[#00685F]/10 flex items-center justify-center text-[#00685F] dark:text-[#6BD8CB]">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1B1C1C] dark:text-white">
                {isAr ? 'بدون عقود ملزمة' : 'No Lock-in Contracts'}
              </h3>
              <p className="text-xs text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
                {isAr
                  ? 'إلغاء أو إيقاف أو ترقية خطتك في أي وقت بكل سهولة ودون قيود.'
                  : 'Cancel, pause, or upgrade your plan at any time effortlessly.'}
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-lg bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="mx-auto h-10 w-10 rounded-[4px] bg-[#00685F]/10 flex items-center justify-center text-[#00685F] dark:text-[#6BD8CB]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1B1C1C] dark:text-white">
                {isAr ? 'متوافق مع معايير Meta' : 'Meta Compliant'}
              </h3>
              <p className="text-xs text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
                {isAr
                  ? 'توافق 100% مع إرشادات وسياسات واتساب الرسمية لضمان الأمان.'
                  : '100% compliant with WhatsApp official API guidelines.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Dark Editorial Footer ──────────────────────────── */}
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
