import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { PagesClient } from './pages-client'

export const dynamic = 'force-dynamic'

const DEFAULT_REQUIRED_PAGES = [
  {
    slug: 'privacy-policy',
    title: 'سياسة الخصوصية',
    title_en: 'Privacy Policy',
    content_html: `
      <h2>سياسة الخصوصية بلمسة احترافية</h2>
      <p>أهلاً بك في منصة <strong>MK Whats</strong>. نحن نلتزم بحماية خصوصية بياناتك وبيانات عملائك بكل أمان وشفافية.</p>
      <h3>1. جمع المعلومات</h3>
      <p>نجمع البيانات الأساسية اللازمة لتقديم خدمات الأتمتة وإدارة المحادثات ومزامنة الطلبات بطلب وموافقة من المستخدم.</p>
      <h3>2. حماية البيانات</h3>
      <p>تتم مشفرة واستضافة البيانات عبر سيرفرات مؤمنة ببروتوكولات التشفير العالمية SSL/TLS.</p>
    `.trim(),
    content_html_en: `
      <h2>Privacy Policy</h2>
      <p>Welcome to <strong>MK Whats</strong>. We are committed to protecting the privacy and security of your account and customer data with transparency.</p>
      <h3>1. Data Collection</h3>
      <p>We collect essential data required to provide WhatsApp automation, conversational commerce, and order synchronizations.</p>
      <h3>2. Data Security</h3>
      <p>All data is hosted and transmitted through secure servers using industry-standard SSL/TLS encryption.</p>
    `.trim(),
    is_published: true,
  },
  {
    slug: 'terms-and-conditions',
    title: 'الشروط والأحكام',
    title_en: 'Terms & Conditions',
    content_html: `
      <h2>الشروط والأحكام لاستخدام منصة MK Whats</h2>
      <p>باستخدامك لمنصتنا، فإنك توافق على الالتزام بالقواعد والسياسات التالية لضمان خدمة آمنة للجميع.</p>
      <h3>1. الاستخدام العادل</h3>
      <p>يجب عدم استخدام المنصة لإرسال الرسائل العشوائية أو المحتوى الضار أو الانتهاكي لسياسات وتطبيقات التواصل.</p>
      <h3>2. الاشتراكات والدفع</h3>
      <p>يتم تجديد الاشتراكات حسب الخطة المختارة (شهرياً أو سنوياً) ويمكن الإلغاء في أي وقت من لوحة التحكم.</p>
    `.trim(),
    content_html_en: `
      <h2>Terms & Conditions</h2>
      <p>By accessing or using <strong>MK Whats</strong>, you agree to comply with our terms of service and fair usage guidelines.</p>
      <h3>1. Fair Usage Policy</h3>
      <p>You agree not to use the platform for spam or transmitting content that violates Meta policies.</p>
      <h3>2. Subscriptions & Billing</h3>
      <p>Subscriptions renew automatically according to the selected billing interval and can be managed directly in the dashboard.</p>
    `.trim(),
    is_published: true,
  },
  {
    slug: 'about-us',
    title: 'من نحن',
    title_en: 'About Us',
    content_html: `
      <h2>عن منصة MK Whats</h2>
      <p>منصة <strong>MK Whats</strong> هي الحل المتكامل والأول لأتمتة وتسويق المحادثات عبر الواتساب والذكاء الاصطناعي <strong>Gemini AI</strong> للشركات والمتاجر الإلكترونية.</p>
      <p>هدفنا مساعدة أصحاب الأعمال وتجار المتاجر على زيادة المبيعات، أتمتة ردود خدمة العملاء على مدار 24 ساعة، ومزامنة البيانات تلقائياً بضغطات زر معدودة.</p>
    `.trim(),
    content_html_en: `
      <h2>About MK Whats</h2>
      <p><strong>MK Whats</strong> is the leading WhatsApp automation and conversational commerce platform powered by Gemini AI.</p>
      <p>Our mission is to help online businesses and merchants scale customer conversations, capture orders seamlessly, and provide 24/7 automated support.</p>
    `.trim(),
    is_published: true,
  },
  {
    slug: 'contact-us',
    title: 'اتصل بنا',
    title_en: 'Contact Us',
    content_html: `
      <h2>تواصل مع فريق MK Whats</h2>
      <p>يسعدنا تقديم الدعم الفني وتلقي استفساراتكم واقتراحاتكم على مدار الساعة.</p>
      <ul>
        <li><strong>البريد الإلكتروني للدعم:</strong> support@mkwhats.com</li>
        <li><strong>واتساب خدمة العملاء:</strong> +966 50 000 0000</li>
        <li><strong>ساعات العمل:</strong> 24/7 طوال أيام الأسبوع</li>
      </ul>
    `.trim(),
    content_html_en: `
      <h2>Get in Touch</h2>
      <p>Our support team is here to help you get the most out of your WhatsApp automation platform.</p>
      <ul>
        <li><strong>Support Email:</strong> support@mkwhats.com</li>
        <li><strong>WhatsApp Customer Care:</strong> Available 24/7</li>
        <li><strong>Working Hours:</strong> 24/7 worldwide</li>
      </ul>
    `.trim(),
    is_published: true,
  },
]

export default async function AdminPagesPage() {
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

  if (!user) {
    redirect('/admin/login')
  }

  const serviceClient = createServiceClient()
  const { data: adminRow } = await serviceClient
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminRow) {
    redirect('/admin/login')
  }

  // Fetch all existing pages
  let { data: pages } = await serviceClient
    .from('content_pages')
    .select('*')
    .order('created_at', { ascending: true })

  const existingSlugs = new Set((pages || []).map((p) => p.slug))

  const hasPageCategory = (category: string) => {
    return Array.from(existingSlugs).some((s) => s.toLowerCase().includes(category))
  }

  // Auto-seed standard required pages only if the entire category is missing
  const missingPages = DEFAULT_REQUIRED_PAGES.filter((item) => {
    if (item.slug.includes('privacy')) return !hasPageCategory('privacy')
    if (item.slug.includes('term')) return !hasPageCategory('term')
    if (item.slug.includes('about')) return !hasPageCategory('about')
    if (item.slug.includes('contact')) return !hasPageCategory('contact')
    return !existingSlugs.has(item.slug) && !existingSlugs.has(item.slug.replace(/-/g, '_'))
  })

  if (missingPages.length > 0) {
    await serviceClient.from('content_pages').insert(missingPages)
    const { data: refreshedPages } = await serviceClient
      .from('content_pages')
      .select('*')
      .order('created_at', { ascending: true })
    pages = refreshedPages
  }

  return <PagesClient initialPages={pages || []} />
}
