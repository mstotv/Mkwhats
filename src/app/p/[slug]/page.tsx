import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { MessageSquare, ArrowRight } from 'lucide-react'
import DOMPurify from 'isomorphic-dompurify'

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

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const serviceClient = createServiceClient()

  const [{ data: page }, { data: settings }] = await Promise.all([
    serviceClient
      .from('content_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle(),
    serviceClient.from('site_settings').select('platform_name, logo_url').eq('id', 1).maybeSingle(),
  ])

  if (!page) {
    notFound()
  }

  const platformName = settings?.platform_name || 'MK Whats'
  const sanitizedContent = DOMPurify.sanitize(page.content_html || '', SANITIZE_CONFIG)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans dir-rtl selection:bg-indigo-500 selection:text-white flex flex-col justify-between">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={platformName} className="h-8 w-auto object-contain" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">
                <MessageSquare className="h-4 w-4" />
              </div>
            )}
            <span className="text-base font-bold text-white">{platformName}</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            الرئيسية <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 w-full flex-1">
        <div className="space-y-6">
          <div className="border-b border-slate-800/80 pb-6">
            <h1 className="text-2xl sm:text-4xl font-bold text-white">{page.title}</h1>
            <p className="text-xs text-slate-500 mt-2">
              آخر تحديث: {new Date(page.updated_at).toLocaleDateString('ar-EG')}
            </p>
          </div>

          <div
            className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        جميع الحقوق محفوظة © {new Date().getFullYear()} {platformName}.
      </footer>
    </div>
  )
}
