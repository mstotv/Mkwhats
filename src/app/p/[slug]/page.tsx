import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { MessageSquare, ArrowRight, ArrowLeft } from 'lucide-react'
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

const ENGLISH_FALLBACK_PAGES: Record<string, { title: string; html: string }> = {
  privacy: {
    title: 'Privacy Policy',
    html: `
      <h2>Privacy Policy</h2>
      <p>At <strong>MK Whats</strong>, we are committed to protecting your privacy and personal data with complete transparency and security.</p>
      <h3>1. Information Collection</h3>
      <p>We collect essential information required to deliver WhatsApp automation, chat management, and order synchronization services upon user consent.</p>
      <h3>2. Data Protection & Security</h3>
      <p>All data is encrypted and hosted on secure servers using industry-standard SSL/TLS protocols.</p>
    `.trim(),
  },
  term: {
    title: 'Terms & Conditions',
    html: `
      <h2>Terms & Conditions</h2>
      <p>By accessing or using the MK Whats platform, you agree to comply with our terms of service and fair usage guidelines.</p>
      <h3>1. Fair Usage Policy</h3>
      <p>The platform must not be used to send spam, unauthorized broadcasts, or content violating messaging network policies.</p>
      <h3>2. Billing & Subscriptions</h3>
      <p>Subscriptions renew according to your selected plan (monthly or yearly) and can be cancelled at any time from your dashboard.</p>
    `.trim(),
  },
  about: {
    title: 'About Us',
    html: `
      <h2>About MK Whats</h2>
      <p><strong>MK Whats</strong> is the ultimate #1 WhatsApp marketing & Gemini AI automation platform engineered for modern businesses and e-commerce stores.</p>
      <p>Our mission is to help business owners automate customer support 24/7, trigger targeted bulk broadcasts, and sync orders seamlessly with zero friction.</p>
    `.trim(),
  },
  contact: {
    title: 'Contact Us',
    html: `
      <h2>Get in Touch with MK Whats</h2>
      <p>Our support team is available around the clock to assist with inquiries, custom setups, and technical help.</p>
      <ul>
        <li><strong>Support Email:</strong> support@mkwhats.com</li>
        <li><strong>Customer Support WhatsApp:</strong> +966 50 000 0000</li>
        <li><strong>Operating Hours:</strong> 24/7 Worldwide</li>
      </ul>
    `.trim(),
  },
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cookieStore = await cookies()
  const locale = (cookieStore.get('NEXT_LOCALE')?.value as 'en' | 'ar') || 'en'
  const isAr = locale === 'ar'

  const serviceClient = createServiceClient()

  let { data: page } = await serviceClient
    .from('content_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (!page) {
    // Fallback to alternate slug format
    const altSlug = slug.includes('-') ? slug.replace(/-/g, '_') : slug.replace(/_/g, '-')
    const { data: altPage } = await serviceClient
      .from('content_pages')
      .select('*')
      .eq('slug', altSlug)
      .eq('is_published', true)
      .maybeSingle()
    page = altPage
  }

  if (!page) {
    notFound()
  }

  const { data: settings } = await serviceClient
    .from('site_settings')
    .select('platform_name, platform_name_ar, platform_name_en, logo_url')
    .eq('id', 1)
    .maybeSingle()

  const platformName = isAr
    ? (settings?.platform_name_ar || settings?.platform_name || '')
    : (settings?.platform_name_en || settings?.platform_name || '')
  const slugLower = (page.slug || '').toLowerCase()

  let displayTitle = isAr ? page.title : (page.title_en || page.title)
  let displayHtml = isAr ? (page.content_html || '') : (page.content_html_en || page.content_html || '')

  if (!isAr) {
    // If no custom English text in DB, fallback to standard defaults for known pages
    if (!page.title_en && !page.content_html_en) {
      if (slugLower.includes('privacy')) {
        displayTitle = ENGLISH_FALLBACK_PAGES.privacy.title
        displayHtml = ENGLISH_FALLBACK_PAGES.privacy.html
      } else if (slugLower.includes('term')) {
        displayTitle = ENGLISH_FALLBACK_PAGES.term.title
        displayHtml = ENGLISH_FALLBACK_PAGES.term.html
      } else if (slugLower.includes('about')) {
        displayTitle = ENGLISH_FALLBACK_PAGES.about.title
        displayHtml = ENGLISH_FALLBACK_PAGES.about.html
      } else if (slugLower.includes('contact')) {
        displayTitle = ENGLISH_FALLBACK_PAGES.contact.title
        displayHtml = ENGLISH_FALLBACK_PAGES.contact.html
      }
    }
  }

  const sanitizedContent = DOMPurify.sanitize(displayHtml, SANITIZE_CONFIG)
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-background text-foreground font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col justify-between transition-colors duration-300"
    >
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={platformName} className="h-8 w-auto object-contain" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black">
                <MessageSquare className="h-4 w-4" />
              </div>
            )}
            <span className="text-base font-black text-foreground">{platformName}</span>
          </Link>

          <div className="flex items-center gap-3">
            <ModeToggle />
            <LanguageSwitcher />

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl border border-border bg-card"
            >
              {isAr ? 'الرئيسية' : 'Home'} <ArrowIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 w-full flex-1">
        <div className="space-y-8 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-lg">
          <div className="border-b border-border pb-6">
            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">{displayTitle}</h1>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              {isAr ? 'آخر تحديث:' : 'Last updated:'}{' '}
              {new Date(page.updated_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
            </p>
          </div>

          <div
            className="prose prose-neutral dark:prose-invert max-w-none text-foreground text-sm sm:text-base leading-relaxed space-y-4 font-normal"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      </main>

      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground">
        {isAr
          ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} ${platformName}.`
          : `All rights reserved © ${new Date().getFullYear()} ${platformName}.`}
      </footer>
    </div>
  )
}
