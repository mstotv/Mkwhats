'use client'

import { Star, MessageSquareQuote } from 'lucide-react'
import { TestimonialItem, DEFAULT_TESTIMONIALS } from '@/lib/types/home-cms'

interface LandingTestimonialsProps {
  isAr: boolean
  testimonials?: TestimonialItem[]
}

export function LandingTestimonials({ isAr, testimonials: rawTestimonials }: LandingTestimonialsProps) {
  const testimonials = (Array.isArray(rawTestimonials) && rawTestimonials.length > 0)
    ? rawTestimonials.filter((t) => t.visible !== false)
    : DEFAULT_TESTIMONIALS.filter((t) => t.visible !== false)

  if (testimonials.length === 0) {
    return null
  }

  return (
    <section className="py-20 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/25 rounded-full px-4 py-1.5 shadow-sm text-purple-600 dark:text-purple-400">
          <MessageSquareQuote className="h-4 w-4" />
          <span className="text-[12px] sm:text-[13px] font-semibold tracking-wide uppercase">
            {isAr ? 'قصص نجاح حقيقية' : 'SUCCESS STORIES'}
          </span>
        </div>

        <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#1B1C1C] dark:text-white">
          {isAr ? 'ماذا يقول رواد الأعمال عن' : 'Trusted by Ambitious Brands Using'}{' '}
          <span className="italic text-[#00685F] dark:text-[#6BD8CB]">MK Whats</span>
        </h2>

        <p className="text-sm sm:text-base text-[#605E5B] dark:text-[#C9C6C1]">
          {isAr
            ? 'اكتشف كيف ساعدت الأتمتة الذكية المئات من أصحاب الأنشطة التجارية في توفير الوقت ومضاعفة المبيعات.'
            : 'Discover how smart automation empowers founders and teams to eliminate manual work and multiply sales.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {testimonials.map((t, idx) => {
          const ratingCount = Math.min(5, Math.max(1, t.stars || 5))
          return (
            <div
              key={t.id || idx}
              className="rounded-2xl bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  {[...Array(ratingCount)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed italic">
                  "{isAr ? (t.quote_ar || t.quote_en) : (t.quote_en || t.quote_ar)}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#EFEDED] dark:border-zinc-800">
                <div className="h-11 w-11 rounded-full bg-[#F9F5F0] dark:bg-zinc-800 flex items-center justify-center text-lg shrink-0 border border-[#EFEDED] dark:border-zinc-700 overflow-hidden shadow-sm">
                  {t.image_url ? (
                    <img
                      src={t.image_url}
                      alt={t.name_ar || t.name_en || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-sm text-[#00685F] dark:text-[#6BD8CB]">
                      {t.avatar_initial || (t.name_ar ? t.name_ar.charAt(0) : '⭐')}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#1B1C1C] dark:text-white truncate">
                    {isAr ? (t.name_ar || t.name_en) : (t.name_en || t.name_ar)}
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {isAr ? (t.role_ar || t.role_en) : (t.role_en || t.role_ar)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
