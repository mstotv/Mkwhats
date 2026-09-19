'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import {
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Calendar,
  Send,
  CreditCard,
  Zap,
} from 'lucide-react'
import { AnimatedList } from '@/components/magicui/animated-list'

interface NotificationItem {
  nameAr: string
  nameEn: string
  descriptionAr: string
  descriptionEn: string
  timeAr: string
  timeEn: string
  icon: React.ReactNode
  color: string
}

const NOTIFICATIONS: NotificationItem[] = [
  {
    nameAr: 'رسالة واتساب جديدة',
    nameEn: 'New WhatsApp Lead',
    descriptionAr: 'مرحباً، أود تفعيل المساعد الذكي وربط متجر ووكومرس 🚀',
    descriptionEn: 'Hello! I want to activate AI assistant & connect WooCommerce 🚀',
    timeAr: 'الآن',
    timeEn: 'Just now',
    icon: <MessageSquare className="h-4.5 w-4.5 text-white" />,
    color: 'bg-emerald-500 shadow-emerald-500/25',
  },
  {
    nameAr: 'رد تلقائي ذكي (Gemini AI)',
    nameEn: 'Smart AI Auto-Reply (Gemini)',
    descriptionAr: 'تمت الإجابة فورياً وتوضيح الباقات وإرسال تفاصيل الربط ⚡',
    descriptionEn: 'Instant reply sent with product specs & checkout link ⚡',
    timeAr: 'منذ ثانية',
    timeEn: '1s ago',
    icon: <Sparkles className="h-4.5 w-4.5 text-white" />,
    color: 'bg-[#00685F] dark:bg-[#00E785] text-slate-950 shadow-[#00685F]/25',
  },
  {
    nameAr: 'طلب جديد تم توثيقه (E-Commerce)',
    nameEn: 'Order Captured & Synced',
    descriptionAr: 'طلب بقيمة 450 ر.س — تم استخراج المقاس واللون وحفظه بالسلة 📦',
    descriptionEn: 'Order of $120 captured, size & address extracted 📦',
    timeAr: 'منذ دقيقة',
    timeEn: '1m ago',
    icon: <ShoppingBag className="h-4.5 w-4.5 text-white" />,
    color: 'bg-amber-500 shadow-amber-500/25',
  },
  {
    nameAr: 'تثبيت موعد في التقويم',
    nameEn: 'Appointment Confirmed',
    descriptionAr: 'تم حجز موعد استشارة الأحد 10:30 ص وإرسال تذكير للعميل 📅',
    descriptionEn: 'Meeting scheduled for Sun 10:30 AM + auto WhatsApp reminder 📅',
    timeAr: 'منذ 2 دقيقة',
    timeEn: '2m ago',
    icon: <Calendar className="h-4.5 w-4.5 text-white" />,
    color: 'bg-blue-500 shadow-blue-500/25',
  },
  {
    nameAr: 'إشعار فوري لفريق العمل (Telegram)',
    nameEn: 'Instant Team Alert (Telegram)',
    descriptionAr: 'إرسال بيانات العميل والطلب لحظياً لقناة المبيعات 🚀',
    descriptionEn: 'Lead details & phone dispatched to staff Telegram channel 🚀',
    timeAr: 'منذ 5 دقائق',
    timeEn: '5m ago',
    icon: <Send className="h-4.5 w-4.5 text-white" />,
    color: 'bg-cyan-500 shadow-cyan-500/25',
  },
  {
    nameAr: 'استرداد سلة متروكة ناجح',
    nameEn: 'Cart Recovery Success',
    descriptionAr: 'تم تحويل العميل واسترداد طلب بقيمة 320 ر.س بنقرة زر 💳',
    descriptionEn: 'Customer returned & finished $85 checkout via 1-click WhatsApp 💳',
    timeAr: 'منذ 10 دقائق',
    timeEn: '10m ago',
    icon: <CreditCard className="h-4.5 w-4.5 text-white" />,
    color: 'bg-purple-500 shadow-purple-500/25',
  },
]

function NotificationCard({ item, isAr }: { item: NotificationItem; isAr: boolean }) {
  return (
    <figure className="relative mx-auto min-h-fit w-full max-w-[420px] cursor-pointer overflow-hidden rounded-2xl p-4 transition-all duration-300 ease-out hover:scale-[1.02] bg-white/80 dark:bg-[#18191E]/90 border border-black/[0.08] dark:border-white/[0.1] shadow-[0_8px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      <div className="flex flex-row items-center gap-3.5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-md shrink-0 ${item.color}`}>
          {item.icon}
        </div>
        <div className="flex flex-col overflow-hidden text-start min-w-0 flex-1">
          <figcaption className="flex flex-row items-center justify-between gap-1 text-xs font-bold text-foreground">
            <span className="truncate">{isAr ? item.nameAr : item.nameEn}</span>
            <span className="text-[10px] font-mono font-medium text-muted-foreground shrink-0">
              {isAr ? item.timeAr : item.timeEn}
            </span>
          </figcaption>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed truncate">
            {isAr ? item.descriptionAr : item.descriptionEn}
          </p>
        </div>
      </div>
    </figure>
  )
}

export function LandingHeroMockup() {
  const locale = useLocale()
  const isAr = locale === 'ar'

  return (
    <div className="relative w-full max-w-lg mx-auto pt-2 select-none">
      {/* Subtle Floating Live Badge */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 dark:border-emerald-500/30 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {isAr ? 'نشاط الأتمتة المباشر 24/7' : 'Live Automation Stream 24/7'}
          </span>
          <span className="text-muted-foreground/40">•</span>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Zap className="h-3 w-3 text-amber-500" />
            <span>{isAr ? 'معالجة فورية' : 'Zero-delay AI'}</span>
          </div>
        </div>
      </div>

      {/* Magic UI Animated List - Seamless Floating Stream */}
      <div
        className="relative h-[310px] sm:h-[340px] w-full overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, black 0%, black 72%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 72%, transparent 100%)',
        }}
      >
        <AnimatedList delay={2200}>
          {NOTIFICATIONS.map((item, idx) => (
            <NotificationCard key={idx} item={item} isAr={isAr} />
          ))}
        </AnimatedList>
      </div>
    </div>
  )
}
