'use client'

import { useMemo } from 'react'
import { MessageSquareQuote } from 'lucide-react'
import { TestimonialItem, DEFAULT_TESTIMONIALS } from '@/lib/types/home-cms'

interface LandingTestimonialsProps {
  isAr: boolean
  testimonials?: TestimonialItem[]
  speedSeconds?: number
}

function TestimonialCard({ t, isAr }: { t: TestimonialItem; isAr: boolean }) {
  const ratingCount = Math.min(5, Math.max(1, t.stars || 5))

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-[#181A20] border border-black/[0.07] dark:border-white/[0.08] p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_36px_rgba(0,0,0,0.6)] hover:border-black/20 dark:hover:border-white/20 transition-all duration-300 flex flex-col justify-between mb-5 select-none">
      <div>
        {/* 5 Professional Golden SVG Stars */}
        <div className="flex items-center gap-1 mb-4 text-[#F59E0B]">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`h-4 w-4 shrink-0 ${i < ratingCount ? 'fill-[#F59E0B] text-[#F59E0B]' : 'fill-black/10 dark:fill-white/10 text-transparent'
                }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        {/* Quote text */}
        <p className="text-xs sm:text-[13.5px] leading-relaxed text-foreground/85 dark:text-zinc-300 font-normal mb-6">
          &ldquo;{isAr ? (t.quote_ar || t.quote_en) : (t.quote_en || t.quote_ar)}&rdquo;
        </p>
      </div>

      {/* Author Footer */}
      <div className="flex items-center gap-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.06] mt-auto">
        <div className="h-10 w-10 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs text-foreground/80 shadow-xs">
          {t.image_url ? (
            <img
              src={t.image_url}
              alt={t.name_ar || t.name_en || 'Avatar'}
              width={40}
              height={40}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <span>
              {t.avatar_initial || (isAr ? (t.name_ar?.charAt(0) || '★') : (t.name_en?.charAt(0) || '★'))}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-[13.5px] font-bold text-foreground truncate">
            {isAr ? (t.name_ar || t.name_en) : (t.name_en || t.name_ar)}
          </h4>
          <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
            {isAr ? (t.role_ar || t.role_en) : (t.role_en || t.role_ar)}
          </p>
        </div>
      </div>
    </div>
  )
}

export function LandingTestimonials({ isAr, testimonials: rawTestimonials, speedSeconds }: LandingTestimonialsProps) {
  const rawList = (Array.isArray(rawTestimonials) && rawTestimonials.length > 0)
    ? rawTestimonials.filter((t) => t.visible !== false)
    : DEFAULT_TESTIMONIALS.filter((t) => t.visible !== false)

  // Ensure optimal DOM footprint for 60FPS performance & instant theme switching
  const testimonials = useMemo(() => {
    const active = rawList.slice(0, 45)
    let list = [...active]
    while (list.length < 6 && list.length > 0) {
      list = [...list, ...active.map((item, idx) => ({ ...item, id: `${item.id}-dup-${idx}` }))]
    }
    return list
  }, [rawList])

  // Dynamic animation speeds - exactly uniform across all columns as configured in Admin
  const duration = typeof speedSeconds === 'number' && speedSeconds > 0 ? speedSeconds : 120

  // Partition items into 3 columns
  const col1 = useMemo(() => testimonials.filter((_, i) => i % 3 === 0), [testimonials])
  const col2 = useMemo(() => testimonials.filter((_, i) => i % 3 === 1), [testimonials])
  const col3 = useMemo(() => testimonials.filter((_, i) => i % 3 === 2), [testimonials])

  if (testimonials.length === 0) {
    return null
  }

  return (
    <section className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-12">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-4 py-1.5 shadow-xs text-emerald-600 dark:text-emerald-400">
          <MessageSquareQuote className="h-4 w-4" strokeWidth={1.5} />
          <span className="text-[11px] sm:text-[12px] font-bold tracking-wider uppercase">
            {isAr ? 'قصص نجاح وتجارب العملاء' : 'CUSTOMER STORIES & REVIEWS'}
          </span>
        </div>

        <h2 className="font-serif text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
          {isAr ? 'ماذا يقول رواد الأعمال والمتاجر؟' : 'Loved by Growing Teams & Brands'}
        </h2>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {isAr
            ? 'شاهد كيف ساعدت أتمتة واتساب الذكية المئات من أصحاب الأنشطة التجارية في مضاعفة مبيعاتهم وتوفير ساعات العمل اليومية.'
            : 'See how modern e-commerce and service teams scale conversions and eliminate repetitive manual messaging with autonomous AI.'}
        </p>
      </div>

      {/* ── Vertical Multi-Column Infinite Scrolling Marquee Container with True Alpha Mask ── */}
      <div
        className="relative h-[680px] sm:h-[760px] overflow-hidden group"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 8%, rgba(0,0,0,1) 22%, rgba(0,0,0,1) 78%, rgba(0,0,0,0.4) 92%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 8%, rgba(0,0,0,1) 22%, rgba(0,0,0,1) 78%, rgba(0,0,0,0.4) 92%, transparent 100%)',
        }}
      >
        {/* 3 Scrolling Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 h-full items-start px-2">

          {/* Column 1 (Always visible) */}
          <div
            className="flex flex-col animate-marquee-up marquee-pause hover:[animation-play-state:paused]"
            style={{ animationDuration: `${duration}s` }}
          >
            {[...col1, ...col1].map((t, idx) => (
              <TestimonialCard key={`col1-${t.id}-${idx}`} t={t} isAr={isAr} />
            ))}
          </div>

          {/* Column 2 (Visible on Tablet & Desktop) */}
          <div
            className="hidden md:flex flex-col animate-marquee-up marquee-pause hover:[animation-play-state:paused]"
            style={{ animationDuration: `${duration}s` }}
          >
            {[...col2, ...col2].map((t, idx) => (
              <TestimonialCard key={`col2-${t.id}-${idx}`} t={t} isAr={isAr} />
            ))}
          </div>

          {/* Column 3 (Visible on Desktop) */}
          <div
            className="hidden lg:flex flex-col animate-marquee-up marquee-pause hover:[animation-play-state:paused]"
            style={{ animationDuration: `${duration}s` }}
          >
            {[...col3, ...col3].map((t, idx) => (
              <TestimonialCard key={`col3-${t.id}-${idx}`} t={t} isAr={isAr} />
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
