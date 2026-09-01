import Link from 'next/link'
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Store,
  Globe,
  Zap,
} from 'lucide-react'

export interface StoreFeature {
  id: string
  text_ar: string
  text_en: string
}

export interface StoreCard {
  id: string
  visible?: boolean
  order?: number
  store_name: string
  api_badge: string
  accent_color: 'purple' | 'emerald' | 'blue' | 'amber' | 'indigo' | 'teal' | string
  subtitle_ar: string
  subtitle_en: string
  status_badge_ar: string
  status_badge_en: string
  features: StoreFeature[]
}

export interface NotificationCard {
  id: string
  position: 'top' | 'hero' | 'bottom'
  customer_name_ar: string
  customer_name_en: string
  title_ar: string
  title_en: string
  body_ar: string
  body_en: string
  timestamp_ar: string
  timestamp_en: string
  product_image_url: string
}

export interface MetricCard {
  id: string
  visible?: boolean
  value: string
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  color: 'primary' | 'purple' | 'emerald' | 'blue' | 'amber' | string
}

export interface EcommerceSectionContent {
  badge_text_ar?: string
  badge_text_en?: string
  headline_ar?: string
  headline_highlight_ar?: string
  headline_en?: string
  headline_highlight_en?: string
  subtitle_ar?: string
  subtitle_en?: string
  cta_text_ar?: string
  cta_text_en?: string
  cta_url?: string
  cta_visible?: boolean
  store_cards?: StoreCard[]
  notification_cards?: NotificationCard[]
  metrics?: MetricCard[]
}

export const DEFAULT_ECOMMERCE_CONTENT: EcommerceSectionContent = {
  badge_text_ar: 'ربط المتاجر الإلكترونية الذكي',
  badge_text_en: 'E-COMMERCE & STORE INTEGRATION',
  headline_ar: 'ضاعف مبيعات متجرك مع',
  headline_highlight_ar: 'ووكومرس وشوبيفاي',
  headline_en: 'Scale Your Store with',
  headline_highlight_en: 'WooCommerce & Shopify',
  subtitle_ar:
    'اربط متجرك بضغطة زر واحدة وبدون أي خبرة برمجية. أرسل إشعارات تأكيد الطلبات وتتبع الشحنات فورياً، واستعد حتى 30% من السلات المتروكة تلقائياً عبر واتساب.',
  subtitle_en:
    'Connect your online store in seconds with zero code. Send instant order confirmations, live shipping updates, and automatically recover up to 30% of abandoned carts directly on WhatsApp.',
  cta_text_ar: 'اربط متجرك الآن مجاناً',
  cta_text_en: 'Connect Your Store Now',
  cta_url: '/settings?tab=integrations',
  cta_visible: true,
  store_cards: [
    {
      id: 'woocommerce',
      visible: true,
      order: 1,
      store_name: 'WooCommerce',
      api_badge: 'REST API & Webhooks',
      accent_color: 'purple',
      subtitle_ar: 'ربط مباشر لجميع متاجر ووردبريس',
      subtitle_en: 'Direct integration for WordPress stores',
      status_badge_ar: 'ربط فوري متاح',
      status_badge_en: '1-Click Connect',
      features: [
        { id: 'wc-1', text_ar: 'تأكيد الطلبات الجديدة لحظياً (Order Created)', text_en: 'Instant new order confirmation alerts' },
        { id: 'wc-2', text_ar: 'استرجاع السلات المتروكة برابط دفع مباشر', text_en: 'Abandoned cart recovery with 1-click URL' },
        { id: 'wc-3', text_ar: 'تحديثات الشحن والدفع (Order Status Sync)', text_en: 'Live shipping and payment status updates' },
        { id: 'wc-4', text_ar: 'إنشاء جهات الاتصال ومزامنتها تلقائياً', text_en: 'Auto CRM contact creation & tagging' },
      ],
    },
    {
      id: 'shopify',
      visible: true,
      order: 2,
      store_name: 'Shopify',
      api_badge: 'Admin API & Webhooks',
      accent_color: 'emerald',
      subtitle_ar: 'ربط سحابي فائق السرعة لمتاجر شوبيفاي',
      subtitle_en: 'High-speed cloud connection for Shopify',
      status_badge_ar: 'ربط فوري متاح',
      status_badge_en: '1-Click Connect',
      features: [
        { id: 'sh-1', text_ar: 'إشعارات الطلبات والدفع (Order Creation & Paid)', text_en: 'Live order & payment notifications' },
        { id: 'sh-2', text_ar: 'استعادة عمليات الدفع المتروكة (Abandoned Checkouts)', text_en: 'Recover abandoned checkouts automatically' },
        { id: 'sh-3', text_ar: 'إرسال باركود التتبع فور تنفيذ الطلب (Fulfillment)', text_en: 'Instant tracking barcode & fulfillment alert' },
        { id: 'sh-4', text_ar: 'تأمين كامل وتشفير الـ Webhook Secrets', text_en: 'Secure HMAC payload verification' },
      ],
    },
  ],
  notification_cards: [
    {
      id: 'notif-top',
      position: 'top',
      customer_name_ar: 'إيميلي',
      customer_name_en: 'Emily',
      title_ar: 'تم شحن الطلب #10495',
      title_en: 'Order #10495 Dispatched',
      body_ar: 'تم تسليم الشحنة لشركة النقل DHL Express.',
      body_en: 'Your package is on its way with DHL Express.',
      timestamp_ar: 'منذ دقيقة',
      timestamp_en: '1m ago',
      product_image_url:
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'notif-hero',
      position: 'hero',
      customer_name_ar: 'سارة',
      customer_name_en: 'Sarah',
      title_ar: 'تم تأكيد الطلب #10482',
      title_en: 'Order #10482 Confirmed',
      body_ar: 'شحنتك في الطريق. موعد التوصيل المتوقع: غداً.',
      body_en: 'Your order is In Transit. Estimated delivery: Tomorrow.',
      timestamp_ar: 'الآن',
      timestamp_en: 'now',
      product_image_url:
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'notif-bottom',
      position: 'bottom',
      customer_name_ar: 'محمد',
      customer_name_en: 'Michael',
      title_ar: 'تم تجهيز الطلب #10468',
      title_en: 'Order #10468 Packed',
      body_ar: 'تم تغليف طلبك بنجاح وجاري إرسال رقم التتبع.',
      body_en: 'Your parcel is packed and ready for carrier pickup.',
      timestamp_ar: 'منذ ٣ دقائق',
      timestamp_en: '3m ago',
      product_image_url:
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&auto=format&fit=crop&q=80',
    },
  ],
  metrics: [
    {
      id: 'metric-1',
      visible: true,
      value: '+30%',
      title_ar: 'استعادة مبيعات السلات المتروكة',
      title_en: 'Cart Abandonment Recovery',
      description_ar: 'إعادة استهداف ذكية لزبائن الـ Checkout قبل مغادرة المتجر',
      description_en: 'Re-engage checkout drop-offs with timed WhatsApp nudges',
      color: 'primary',
    },
    {
      id: 'metric-2',
      visible: true,
      value: '< 1 sec',
      title_ar: 'سرعة إرسال الإشعار فور الشراء',
      title_en: 'Zero-Latency Live Webhooks',
      description_ar: 'وصول رسالة تأكيد الطلب للزبون فور إتمام الدفع بالثواني',
      description_en: 'Instant delivery receipt as soon as the order is placed',
      color: 'purple',
    },
    {
      id: 'metric-3',
      visible: true,
      value: '100% No-Code',
      title_ar: 'ربط مباشر وسهل بدون برمجة',
      title_en: 'Zero Coding Setup',
      description_ar: 'خطوات واضحة بالصور في لوحة التحكم للربط خلال دقيقتين',
      description_en: 'Plug-and-play API keys with visual setup walkthrough',
      color: 'emerald',
    },
  ],
}

interface LandingEcommerceSectionProps {
  isAr: boolean
  userLoggedIn: boolean
  content?: EcommerceSectionContent
}

function getStoreLogo(storeName: string) {
  const normalized = storeName.toLowerCase()
  if (normalized.includes('woo') || normalized.includes('wordpress')) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" role="img">
        <path d="M23.015 11.085c-.172-3.805-2.67-6.085-6.538-6.085-3.328 0-5.834 1.83-6.84 4.542-.712-1.077-1.848-1.742-3.21-1.742-2.378 0-4.048 1.637-4.42 4.093-.207 1.344.025 2.873.743 4.22 1.488 2.766 4.39 4.747 8.016 4.887l.234-1.393c-2.825-.138-5.112-1.737-6.289-3.926-.523-.974-.694-2.023-.538-2.956.249-1.503 1.258-2.52 2.712-2.52.88 0 1.62.404 2.083 1.107l-1.312 7.747h1.492l1.243-7.361c.42-.511 1.054-.836 1.769-.836 1.402 0 2.457 1.05 2.457 2.467 0 .393-.08.826-.239 1.285l-1.34 3.987c-.504 1.507-.074 2.83 1.157 3.535 1.072.613 2.502.66 3.659.123 2.012-.934 3.498-2.998 3.978-5.524.237-1.257.25-2.458.037-3.415z" />
      </svg>
    )
  }
  if (normalized.includes('shopify')) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" role="img">
        <path d="M19.68 5.76c-.03-.26-.23-.46-.48-.48l-4.14-.37c-.1-.01-.19-.06-.25-.14L13.1 2.5c-.17-.23-.47-.32-.73-.22L10.3 3c-.15.06-.27.18-.33.33L8.85 6.07c-.06.15-.18.27-.33.33L6.45 7.1c-.26.1-.42.36-.38.64l.87 9.87c.02.26.22.47.48.5l8.76 1.04c.03 0 .06 0 .09 0 .23 0 .44-.16.48-.39l2.93-13zm-6.84-2.22l1.19 1.76-2.56-.23 1.37-1.53zm-2.02.83l2.25.2-1.2 3.58-1.53-3.23.48-.55zm-1.89 2.51l1.62 3.42-3.1-.28 1.48-3.14z" />
      </svg>
    )
  }
  return <Store className="h-6 w-6" />
}

function getCardColorStyles(color: string) {
  switch (color) {
    case 'purple':
      return {
        hoverBorder: 'hover:border-purple-500/50',
        iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        check: 'text-purple-600 dark:text-purple-400',
      }
    case 'emerald':
      return {
        hoverBorder: 'hover:border-emerald-500/50',
        iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        check: 'text-emerald-600 dark:text-emerald-400',
      }
    case 'blue':
      return {
        hoverBorder: 'hover:border-blue-500/50',
        iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        check: 'text-blue-600 dark:text-blue-400',
      }
    case 'amber':
      return {
        hoverBorder: 'hover:border-amber-500/50',
        iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        check: 'text-amber-600 dark:text-amber-400',
      }
    case 'indigo':
      return {
        hoverBorder: 'hover:border-indigo-500/50',
        iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        check: 'text-indigo-600 dark:text-indigo-400',
      }
    default:
      return {
        hoverBorder: 'hover:border-[#00685F]/50',
        iconBg: 'bg-[#00685F]/10 text-[#00685F] dark:text-[#6BD8CB]',
        badge: 'bg-[#00685F]/10 text-[#00685F] dark:text-[#6BD8CB] border-[#00685F]/20',
        check: 'text-[#00685F] dark:text-[#6BD8CB]',
      }
  }
}

function getMetricTextColor(color: string) {
  switch (color) {
    case 'purple':
      return 'text-purple-600 dark:text-purple-400'
    case 'emerald':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'blue':
      return 'text-blue-600 dark:text-blue-400'
    case 'amber':
      return 'text-amber-600 dark:text-amber-400'
    default:
      return 'text-[#00685F] dark:text-[#6BD8CB]'
  }
}

export function LandingEcommerceSection({ isAr, userLoggedIn, content }: LandingEcommerceSectionProps) {
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight

  const merged: EcommerceSectionContent = {
    ...DEFAULT_ECOMMERCE_CONTENT,
    ...content,
  }

  const badgeText = isAr
    ? (merged.badge_text_ar || DEFAULT_ECOMMERCE_CONTENT.badge_text_ar)
    : (merged.badge_text_en || DEFAULT_ECOMMERCE_CONTENT.badge_text_en)

  const headline = isAr
    ? (merged.headline_ar || DEFAULT_ECOMMERCE_CONTENT.headline_ar)
    : (merged.headline_en || DEFAULT_ECOMMERCE_CONTENT.headline_en)

  const headlineHighlight = isAr
    ? (merged.headline_highlight_ar || DEFAULT_ECOMMERCE_CONTENT.headline_highlight_ar)
    : (merged.headline_highlight_en || DEFAULT_ECOMMERCE_CONTENT.headline_highlight_en)

  const subtitle = isAr
    ? (merged.subtitle_ar || DEFAULT_ECOMMERCE_CONTENT.subtitle_ar)
    : (merged.subtitle_en || DEFAULT_ECOMMERCE_CONTENT.subtitle_en)

  const ctaText = isAr
    ? (merged.cta_text_ar || DEFAULT_ECOMMERCE_CONTENT.cta_text_ar)
    : (merged.cta_text_en || DEFAULT_ECOMMERCE_CONTENT.cta_text_en)

  const ctaUrl = userLoggedIn
    ? '/settings?tab=integrations'
    : (merged.cta_url || '/signup')

  const storeCards = (merged.store_cards && merged.store_cards.length > 0)
    ? merged.store_cards.filter((c) => c.visible !== false)
    : DEFAULT_ECOMMERCE_CONTENT.store_cards!

  const notifCards = (merged.notification_cards && merged.notification_cards.length > 0)
    ? merged.notification_cards
    : DEFAULT_ECOMMERCE_CONTENT.notification_cards!

  const topNotif = notifCards.find((c) => c.position === 'top') || notifCards[0] || DEFAULT_ECOMMERCE_CONTENT.notification_cards![0]
  const heroNotif = notifCards.find((c) => c.position === 'hero') || notifCards[1] || DEFAULT_ECOMMERCE_CONTENT.notification_cards![1]
  const bottomNotif = notifCards.find((c) => c.position === 'bottom') || notifCards[2] || DEFAULT_ECOMMERCE_CONTENT.notification_cards![2]

  const metrics = (merged.metrics && merged.metrics.length > 0)
    ? merged.metrics.filter((m) => m.visible !== false)
    : DEFAULT_ECOMMERCE_CONTENT.metrics!

  return (
    <section id="ecommerce" className="py-20 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3.5">
        <div className="inline-flex items-center gap-2 bg-[#00685F]/10 dark:bg-[#00685F]/20 border border-[#00685F]/25 rounded-full px-4 py-1.5 shadow-sm">
          <ShoppingBag className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB]" />
          <span className="text-[12px] sm:text-[13px] font-semibold tracking-wide text-[#00685F] dark:text-[#6BD8CB]">
            {badgeText}
          </span>
        </div>

        <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#1B1C1C] dark:text-white leading-tight">
          {headline}{' '}
          {headlineHighlight && (
            <span className="italic text-[#00685F] dark:text-[#6BD8CB]">
              {headlineHighlight}
            </span>
          )}
        </h2>

        <p className="text-sm sm:text-base text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Main Grid: Stores Cards + WhatsApp Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Store Feature Cards (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-center gap-4">
          {storeCards.map((card) => {
            const styles = getCardColorStyles(card.accent_color || 'teal')
            const cardSubtitle = isAr ? card.subtitle_ar : card.subtitle_en
            const cardStatusBadge = isAr ? card.status_badge_ar : card.status_badge_en

            return (
              <div
                key={card.id}
                className={`rounded-xl bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${styles.hoverBorder} transition-all duration-300 relative group overflow-hidden`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#EFEDED] dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-xl ${styles.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      {getStoreLogo(card.store_name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#1B1C1C] dark:text-white flex items-center gap-2">
                        {card.store_name}
                        {card.api_badge && (
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${styles.badge}`}>
                            {card.api_badge}
                          </span>
                        )}
                      </h3>
                      {cardSubtitle && (
                        <p className="text-xs text-[#605E5B] dark:text-[#C9C6C1] mt-0.5">
                          {cardSubtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {cardStatusBadge && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full w-fit">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {cardStatusBadge}
                    </div>
                  )}
                </div>

                {card.features && card.features.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3.5">
                    {card.features.map((feat) => (
                      <div key={feat.id} className="flex items-start gap-2 text-xs text-[#605E5B] dark:text-[#C9C6C1]">
                        <CheckCircle2 className={`h-4 w-4 ${styles.check} shrink-0 mt-0.5`} />
                        <span>{isAr ? feat.text_ar : feat.text_en}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Right Column: 3D Frosted Glass Stacked Notification Mockup (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-[#14171B] border border-zinc-800 p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col justify-center gap-6 relative overflow-hidden text-white">
          {/* Studio Matte Spotlight Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-emerald-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* 3D Notification Stack Studio Container (Tight Isometric Stacking) */}
          <div className="relative py-6 px-1 flex flex-col items-center justify-center min-h-[220px] select-none">
            {/* 1. TOP CARD (Frosted Glass / Translucent / Depth) */}
            {topNotif && (
              <div className="w-full max-w-[390px] absolute transform -translate-y-12 scale-[0.91] opacity-45 blur-[0.3px] z-10 transition-all duration-300 pointer-events-none">
                <div className="rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/20 p-3 sm:p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-between gap-3 ring-1 ring-amber-500/20">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* WhatsApp App Icon */}
                    <div className="h-10 w-10 rounded-xl bg-[#25D366]/90 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" role="img">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.405z" />
                      </svg>
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-white truncate">
                            {isAr ? topNotif.customer_name_ar : topNotif.customer_name_en}
                          </span>
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#3897f0] fill-current shrink-0">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </div>
                        <span className="text-[9px] text-zinc-400 font-medium">
                          {isAr ? topNotif.timestamp_ar : topNotif.timestamp_en}
                        </span>
                      </div>
                      <h5 className="text-[11px] font-semibold text-zinc-200 truncate mt-0.5">
                        {isAr ? topNotif.title_ar : topNotif.title_en}
                      </h5>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {isAr ? topNotif.body_ar : topNotif.body_en}
                      </p>
                    </div>
                  </div>

                  {/* Product 1 Thumbnail */}
                  {topNotif.product_image_url && (
                    <div className="h-11 w-11 rounded-lg bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={topNotif.product_image_url}
                        alt="Product 1"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. MIDDLE CARD (HERO / FOCAL 3D LAYER) */}
            {heroNotif && (
              <div className="w-full max-w-[400px] relative z-30 transform scale-100 hover:scale-[1.02] transition-all duration-300">
                <div className="rounded-2xl bg-white text-[#172127] p-4 sm:p-4.5 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.6),-12px_15px_25px_rgba(0,0,0,0.35)] flex items-center justify-between gap-3.5 ring-1 ring-black/5 relative overflow-hidden">
                  {/* 3D Left Border Accent Highlight */}
                  <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-400/80 via-emerald-400/80 to-transparent" />

                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* WhatsApp App Icon with 3D Depth */}
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#20ba5a] to-[#25D366] flex items-center justify-center text-white shrink-0 shadow-[0_6px_16px_rgba(37,211,102,0.4)]">
                      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current drop-shadow-sm" role="img">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.405z" />
                      </svg>
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-zinc-900 truncate">
                            {isAr ? heroNotif.customer_name_ar : heroNotif.customer_name_en}
                          </span>
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#3897f0] fill-current shrink-0">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-medium font-mono">
                          {isAr ? heroNotif.timestamp_ar : heroNotif.timestamp_en}
                        </span>
                      </div>

                      <h5 className="text-[12px] font-bold text-zinc-900 truncate mt-0.5">
                        {isAr ? heroNotif.title_ar : heroNotif.title_en}
                      </h5>

                      <p className="text-[11px] text-zinc-600 truncate leading-snug">
                        {isAr ? heroNotif.body_ar : heroNotif.body_en}
                      </p>
                    </div>
                  </div>

                  {/* Product 2 Thumbnail */}
                  {heroNotif.product_image_url && (
                    <div className="h-12 w-12 rounded-xl bg-zinc-100 border border-zinc-200 shadow-sm overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroNotif.product_image_url}
                        alt="Product 2"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. BOTTOM CARD (Frosted Glass / Translucent / Depth) */}
            {bottomNotif && (
              <div className="w-full max-w-[390px] absolute transform translate-y-12 scale-[0.91] opacity-45 blur-[0.3px] z-10 transition-all duration-300 pointer-events-none">
                <div className="rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/20 p-3 sm:p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-between gap-3 ring-1 ring-amber-500/20">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* WhatsApp App Icon */}
                    <div className="h-10 w-10 rounded-xl bg-[#25D366]/90 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" role="img">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.405z" />
                      </svg>
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-white truncate">
                            {isAr ? bottomNotif.customer_name_ar : bottomNotif.customer_name_en}
                          </span>
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#3897f0] fill-current shrink-0">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </div>
                        <span className="text-[9px] text-zinc-400 font-medium">
                          {isAr ? bottomNotif.timestamp_ar : bottomNotif.timestamp_en}
                        </span>
                      </div>
                      <h5 className="text-[11px] font-semibold text-zinc-200 truncate mt-0.5">
                        {isAr ? bottomNotif.title_ar : bottomNotif.title_en}
                      </h5>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {isAr ? bottomNotif.body_ar : bottomNotif.body_en}
                      </p>
                    </div>
                  </div>

                  {/* Product 3 Thumbnail */}
                  {bottomNotif.product_image_url && (
                    <div className="h-11 w-11 rounded-lg bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bottomNotif.product_image_url}
                        alt="Product 3"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CTA Link to Dashboard / Signup */}
          {merged.cta_visible !== false && (
            <Link
              href={ctaUrl}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#00685F] hover:bg-[#005049] text-white px-5 py-3 text-xs font-bold shadow-md hover:shadow-lg transition-all z-10"
            >
              <span>{ctaText}</span>
              <ArrowIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      {metrics.length > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(metrics.length, 3)} gap-5 pt-2`}>
          {metrics.map((m) => {
            const valColorClass = getMetricTextColor(m.color || 'primary')
            return (
              <div
                key={m.id}
                className="rounded-xl bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-5 text-center space-y-1.5 shadow-sm"
              >
                <div className={`text-3xl font-bold font-serif ${valColorClass}`}>
                  {m.value}
                </div>
                <div className="text-xs font-bold text-[#1B1C1C] dark:text-white">
                  {isAr ? m.title_ar : m.title_en}
                </div>
                <p className="text-[11px] text-[#605E5B] dark:text-[#C9C6C1]">
                  {isAr ? m.description_ar : m.description_en}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
