import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { MessageSquare, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react'
import DOMPurify from 'isomorphic-dompurify'
import { ModeToggle } from '@/components/layout/mode-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'a', 'img', 'ul', 'ol', 'li',
    'strong', 'em', 'b', 'i', 'u', 'br', 'hr',
    'div', 'span', 'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'class', 'id', 'rel', 'style'],
  ALLOW_DATA_ATTR: false,
}

const FALLBACK_PAGES: Record<string, { en: { title: string; html: string }; ar: { title: string; html: string } }> = {
  privacy: {
    en: {
      title: 'Privacy Policy',
      html: `
        <h2>Privacy Policy</h2>
        <p>At <strong>MK Whats</strong>, we are committed to protecting your privacy and safeguarding your business and customer data with industry-leading encryption standards.</p>
        <h3>1. Information We Collect</h3>
        <p>We collect necessary account and messaging metadata to provide automated WhatsApp interactions, order tracking, and Gemini AI conversations strictly with user authorization.</p>
        <h3>2. Data Protection & Security</h3>
        <p>All transmitted data is encrypted end-to-end via secure HTTPS/TLS protocols. We never sell, rent, or trade your contacts or chat history to third parties.</p>
        <h3>3. Data Retention & Deletion</h3>
        <p>You maintain full ownership of your data and can request complete export or deletion of your logs, contacts, and account at any time.</p>
      `.trim(),
    },
    ar: {
      title: 'سياسة الخصوصية',
      html: `
        <h2>سياسة الخصوصية وحماية البيانات</h2>
        <p>في <strong>MK Whats</strong>، نلتزم بحماية خصوصيتك وبيانات عملائك وفق أعلى معايير الأمان والتشفير العالمية.</p>
        <h3>1. البيانات والمعلومات التي نجمعها</h3>
        <p>نقوم بمعالجة بيانات الحساب ومحادثات الواتساب الضرورية لتشغيل الردود الآلية، مزامنة الطلبات، وتكامل الذكاء الاصطناعي بناءً على موافقتك الصريحة.</p>
        <h3>2. أمان وتشفير البيانات</h3>
        <p>تتم حماية كافة البيانات عبر بروتوكولات تشفير متقدمة من طرف إلى طرف (End-to-End Encryption). لن نقوم بمشاركة أو بيع بيانات عملائك لأي جهة خارجية مطلقاً.</p>
        <h3>3. حق حذف واسترجاع البيانات</h3>
        <p>تملك السيطرة الكاملة على بياناتك ويمكنك طلب تصديرها أو حذفها نهائياً من خوادمنا في أي وقت من لوحة التحكم.</p>
      `.trim(),
    },
  },
  terms: {
    en: {
      title: 'Terms of Service',
      html: `
        <h2>Terms of Service</h2>
        <p>By using <strong>MK Whats</strong>, you agree to these terms and fair messaging usage guidelines.</p>
        <h3>1. Acceptable Use Policy</h3>
        <p>You agree not to use the platform for sending unsolicited spam, abusive material, or unauthorized bulk messaging that violates official Meta policies.</p>
        <h3>2. Subscriptions & Billing</h3>
        <p>Subscriptions renew automatically according to your chosen plan. You can cancel or change your plan at any time with immediate effect from your dashboard.</p>
      `.trim(),
    },
    ar: {
      title: 'الشروط والأحكام',
      html: `
        <h2>الشروط والأحكام وسياسة الاستخدام</h2>
        <p>باستخدامك لمنصة <strong>MK Whats</strong>، فإنك توافق على الالتزام ببنود الخدمة وسياسة الاستخدام العادل للمراسلات.</p>
        <h3>1. سياسة الاستخدام المقبول</h3>
        <p>يُحظر استخدام المنصة لإرسال الرسائل العشوائية المزعجة (Spam) أو المحتوى غير القانوني الذي يخالف إرشادات وسياسات Meta الرسمية.</p>
        <h3>2. الاشتراكات والفوترة</h3>
        <p>يتم تجديد الاشتراكات تلقائياً حسب الخطة المختارة (شهرية أو سنوية)، ويمكنك إلغاء أو ترقية اشتراكك في أي وقت بسهولة من لوحة التحكم.</p>
      `.trim(),
    },
  },
  about: {
    en: {
      title: 'About Us',
      html: `
        <h2>About MK Whats</h2>
        <p><strong>MK Whats</strong> is the premier WhatsApp Automation & Conversational Commerce platform powered by Gemini AI and Meta Cloud APIs.</p>
        <p>We empower e-commerce merchants, agencies, and businesses to automate sales, capture orders into Google Sheets, manage bookings, and trigger instant Telegram alerts effortlessly.</p>
      `.trim(),
    },
    ar: {
      title: 'من نحن',
      html: `
        <h2>عن منصة MK Whats</h2>
        <p><strong>MK Whats</strong> هي المنصة الرائدة لأتمتة وتسويق الواتساب والتجارة الحوارية المدعومة بالذكاء الاصطناعي Gemini AI والربط السحابي الرسمي.</p>
        <p>نهدف إلى تمكين المتاجر والشركات من الرد التلقائي على مدار الساعة، التقاط وتوثيق الطلبات في Google Sheets، حجز المواعيد، وتنبيه فرق المبيعات عبر Telegram لحظياً.</p>
      `.trim(),
    },
  },
  contact: {
    en: {
      title: 'Contact Us',
      html: `
        <h2>Contact Our Support Team</h2>
        <p>We are here to help you get the most out of your WhatsApp automation setup.</p>
        <ul>
          <li><strong>Email:</strong> support@mkwhats.com</li>
          <li><strong>WhatsApp Support:</strong> Available 24/7</li>
          <li><strong>Global Coverage:</strong> Serving businesses worldwide</li>
        </ul>
      `.trim(),
    },
    ar: {
      title: 'اتصل بنا',
      html: `
        <h2>تواصل مع فريق الدعم الفني</h2>
        <p>فريقنا متواجد على مدار الساعة لمساعدتك في إعداد وتخصيص البوتات وحل أي استفسارات تقنية.</p>
        <ul>
          <li><strong>البريد الإلكتروني:</strong> support@mkwhats.com</li>
          <li><strong>دعم الواتساب المباشر:</strong> متاح 24/7</li>
          <li><strong>التغطية:</strong> نخدم الشركات والمتاجر حول العالم</li>
        </ul>
      `.trim(),
    },
  },
}

function getFallbackCategory(slug: string): 'privacy' | 'terms' | 'about' | 'contact' | null {
  const norm = slug.toLowerCase().replace(/_/g, '-')
  if (norm.includes('privacy')) return 'privacy'
  if (norm.includes('term')) return 'terms'
  if (norm.includes('about')) return 'about'
  if (norm.includes('contact')) return 'contact'
  return null
}

function getPossibleSlugs(slug: string): string[] {
  const norm = slug.toLowerCase().replace(/_/g, '-')
  const category = getFallbackCategory(slug)
  if (category === 'privacy') return [slug, 'privacy', 'privacy_policy', 'privacy-policy']
  if (category === 'terms') return [slug, 'terms', 'terms_and_conditions', 'terms-and-conditions', 'term']
  if (category === 'about') return [slug, 'about', 'about_us', 'about-us']
  if (category === 'contact') return [slug, 'contact', 'contact_info', 'contact-info', 'contact_us', 'contact-us']
  return [slug, slug.replace(/-/g, '_'), slug.replace(/_/g, '-')]
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value as 'en' | 'ar' | undefined
  const locale = cookieLocale || 'en'
  const isAr = locale === 'ar'

  const serviceClient = createServiceClient()
  const candidateSlugs = getPossibleSlugs(slug)

  const { data: dbPages } = await serviceClient
    .from('content_pages')
    .select('*')
    .in('slug', candidateSlugs)
    .eq('is_published', true)
    .limit(1)

  const page = dbPages && dbPages.length > 0 ? dbPages[0] : null
  const fallbackCategory = getFallbackCategory(slug)

  if (!page && !fallbackCategory) {
    notFound()
  }

  const { data: settings } = await serviceClient
    .from('site_settings')
    .select('platform_name, platform_name_ar, platform_name_en, logo_url, logo_height')
    .limit(1)
    .maybeSingle()

  const platformName = isAr
    ? (settings?.platform_name_ar || settings?.platform_name || 'MK Whats')
    : (settings?.platform_name_en || settings?.platform_name || 'MK Whats')

  let displayTitle = ''
  let displayHtml = ''

  if (page) {
    if (isAr) {
      displayTitle = page.title || (fallbackCategory ? FALLBACK_PAGES[fallbackCategory]?.ar.title : page.title_en) || ''
      displayHtml = page.content_html || (fallbackCategory ? FALLBACK_PAGES[fallbackCategory]?.ar.html : page.content_html_en) || ''
    } else {
      displayTitle = page.title_en || (fallbackCategory ? FALLBACK_PAGES[fallbackCategory]?.en.title : page.title) || ''
      displayHtml = page.content_html_en || (fallbackCategory ? FALLBACK_PAGES[fallbackCategory]?.en.html : page.content_html) || ''
    }
  }

  // Fallback if content is empty or page was not in DB
  if (!displayHtml.trim() && fallbackCategory && FALLBACK_PAGES[fallbackCategory]) {
    const fb = FALLBACK_PAGES[fallbackCategory][isAr ? 'ar' : 'en']
    displayTitle = displayTitle || fb.title
    displayHtml = fb.html
  }

  const sanitizedContent = DOMPurify.sanitize(displayHtml, SANITIZE_CONFIG)
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#F9F5F0] dark:bg-[#141416] text-[#1B1C1C] dark:text-[#F2F0F0] flex flex-col font-sans transition-colors duration-300"
    >
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-800 bg-[#F9F5F0]/90 dark:bg-[#141416]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-6 sm:px-10">
          <Link href="/" className="flex items-center gap-3 group">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={platformName}
                style={{ height: `${Math.max(settings?.logo_height || 44, 40)}px` }}
                className="w-auto object-contain max-h-16 transition-transform group-hover:scale-105"
              />
            ) : null}
            <span className="font-serif text-xl sm:text-2xl font-bold text-[#00685F] dark:text-[#6BD8CB]">
              {platformName}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ModeToggle />
            <LanguageSwitcher />

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:text-[#00685F] dark:hover:text-[#6BD8CB] transition-colors px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xs"
            >
              {isAr ? 'الرئيسية' : 'Home'} <ArrowIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ────────────────────────────────── */}
      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-10 w-full flex-1">
        <div className="space-y-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#1C1C1E] p-8 sm:p-12 shadow-sm">
          <div className="border-b border-neutral-200/80 dark:border-neutral-800 pb-6">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
              {displayTitle}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
              {isAr ? 'آخر تحديث:' : 'Last updated:'}{' '}
              {page?.updated_at
                ? new Date(page.updated_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')
                : new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
            </p>
          </div>

          <div
            className="prose prose-neutral dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200 text-sm sm:text-base leading-relaxed space-y-4 font-normal"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-[#1C1C1E]/50 py-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
        {isAr
          ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} ${platformName}.`
          : `© ${new Date().getFullYear()} ${platformName}. All rights reserved.`}
      </footer>
    </div>
  )
}
