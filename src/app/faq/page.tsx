import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { CheckCircle2, MessageCircle } from 'lucide-react'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingFAQ, FAQItem } from '@/components/landing/landing-faq'
import { FloatingSupport } from '@/components/landing/floating-support'

export const dynamic = 'force-dynamic'

export default async function FAQPage() {
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

  // Bilingual FAQs
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
        activePage="faq"
        userLoggedIn={Boolean(user)}
      />

      {/* ── 2. FAQ Header ──────────────────────────────────────── */}
      <section className="pt-20 pb-20 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#00685F]/10 border border-[#00685F]/20 rounded-full px-4 py-1.5 text-xs font-semibold text-[#00685F] dark:text-[#6BD8CB] uppercase tracking-wider">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isAr ? 'إجابات واضحة ودعم كامل' : 'CLEAR ANSWERS & SUPPORT'}
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[#1B1C1C] dark:text-white leading-tight">
            {isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </h1>
          <p className="text-base sm:text-lg text-[#605E5B] dark:text-[#C9C6C1]">
            {isAr
              ? 'كل ما تحتاج معرفته عن إعداد أتمتة الواتساب، نماذج الذكاء الاصطناعي، تجميع الطلبات، وإشعارات تيليجرام.'
              : 'Everything you need to know about setting up WhatsApp automation, AI models, order capturing, and Telegram notifications.'}
          </p>
        </div>

        {/* FAQ Accordions List */}
        <LandingFAQ items={faqsList} />

        {/* Bottom Help CTA Card (Screen 4) */}
        <div className="max-w-4xl mx-auto rounded-lg p-10 sm:p-14 bg-[#1A1A1A] border border-neutral-800 text-center shadow-lg space-y-6">
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white max-w-xl mx-auto leading-snug">
            {isAr ? 'هل ما زال لديك استفسارات حول نشاطك التجاري؟' : 'Still have questions about your specific business workflow?'}
          </h3>
          <p className="text-xs sm:text-sm text-[#C9C6C1] max-w-xl mx-auto leading-relaxed">
            {isAr
              ? 'مهندسو الأتمتة لدينا جاهزون لبناء عرض توضيحي مخصص لمتجرك أو عيادتك.'
              : 'Our automation engineers are ready to build a tailored demo for your store or clinic.'}
          </p>

          {settings?.support_whatsapp ? (
            <a
              href={`https://wa.me/${settings.support_whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#00685F] hover:bg-[#005049] px-8 py-3.5 text-[13px] font-semibold uppercase tracking-wider text-white shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              {isAr ? 'تواصل مع الدعم عبر واتساب' : 'Contact Support via WhatsApp'}
            </a>
          ) : (
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#00685F] hover:bg-[#005049] px-8 py-3.5 text-[13px] font-semibold uppercase tracking-wider text-white shadow-md transition-all cursor-pointer"
            >
              {isAr ? 'ابدأ تجربتك المجانية' : 'Contact Support via WhatsApp'}
            </Link>
          )}
        </div>
      </section>

      {/* ── 3. Dark Editorial Footer ──────────────────────────── */}
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
