import Link from 'next/link'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/service'
import {
  Store,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { StorefrontClientView } from '@/components/storefront/storefront-client-view'

export const dynamic = 'force-dynamic'

interface StorePageProps {
  params: Promise<{ subdomain: string }>
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { subdomain } = await params
  const service = createServiceClient()

  const { data: storefront } = await service
    .from('storefronts')
    .select('store_name, is_active')
    .eq('subdomain', subdomain.toLowerCase())
    .maybeSingle()

  const storeName = storefront?.store_name || subdomain
  return {
    title: `متجر ${storeName} — قريباً`,
    description: `المتجر الإلكتروني الرسمي لـ ${storeName}`,
  }
}

export default async function StorefrontPage({ params }: StorePageProps) {
  const { subdomain } = await params
  const cleanSubdomain = (subdomain || '').toLowerCase().trim()

  const service = createServiceClient()

  // Fetch storefront and associated account name with full configuration
  const { data: storefront } = await service
    .from('storefronts')
    .select('*, accounts(name, default_currency)')
    .eq('subdomain', cleanSubdomain)
    .maybeSingle()

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'domain.com'
  const mainSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || '/'

  // 1. Case: Storefront not registered
  if (!storefront) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="max-w-md w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-8 shadow-xl backdrop-blur-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-5 border border-amber-200 dark:border-amber-800/50">
            <AlertCircle className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 rounded-full mb-3">
            نطاق فرعي غير مسجل
          </span>

          <h1 className="text-2xl font-bold tracking-tight mb-2">
            هذا المتجر غير موجود
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            النطاق <span className="font-mono font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{cleanSubdomain}.{rootDomain}</span> غير مرتبط بأي متجر نشط حالياً.
          </p>

          <Link
            href={mainSiteUrl}
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md hover:shadow-emerald-600/20"
          >
            الانتقال للمنصة الرئيسية
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  const accountName = (storefront.accounts as any)?.name || storefront.store_name || 'المتجر'
  const displayName = storefront.store_name || accountName
  const currency = (storefront.accounts as any)?.default_currency || 'USD'

  // 2. Case: Storefront is disabled / inactive
  if (!storefront.is_active) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="max-w-md w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-8 shadow-xl backdrop-blur-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-5 border border-slate-200 dark:border-slate-700">
            <Clock className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800 mb-3">
            المتجر قيد الصيانة
          </span>

          <h1 className="text-2xl font-bold tracking-tight mb-2">
            متجر {displayName} غير متاح حالياً
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            يقوم فريق العمل حالياً بتهيئة المتجر وتحديث الخدمات والمنتجات، يرجى العودة لاحقاً.
          </p>

          <Link
            href={mainSiteUrl}
            className="inline-flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors"
          >
            الرجوع إلى الصفحة الرئيسية
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    )
  }

  // 3. Fetch all active products and services for this storefront
  const { data: items } = await service
    .from('storefront_items')
    .select('*')
    .eq('storefront_id', storefront.id)
    .eq('is_available', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  // 4. Render the Full Interactive Storefront
  return (
    <StorefrontClientView
      storefront={storefront as any}
      items={items || []}
      currency={currency}
    />
  )
}
