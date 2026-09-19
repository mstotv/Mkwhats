'use client'

import { useEffect, useState } from 'react'
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HomeFinalCtaContent, DEFAULT_HOME_CONTENT } from '@/lib/types/home-cms'

interface LandingFinalCtaProps {
  isAr: boolean
  userLoggedIn?: boolean
  content?: HomeFinalCtaContent
}

export function LandingFinalCta({ isAr, userLoggedIn = false, content: rawContent }: LandingFinalCtaProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(userLoggedIn)
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight
  const data = rawContent || DEFAULT_HOME_CONTENT.final_cta

  useEffect(() => {
    setIsLoggedIn(userLoggedIn)
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setIsLoggedIn(true)
    })
  }, [userLoggedIn])

  const perks = isAr
    ? (data.perks_ar && data.perks_ar.length > 0 ? data.perks_ar : DEFAULT_HOME_CONTENT.final_cta.perks_ar)
    : (data.perks_en && data.perks_en.length > 0 ? data.perks_en : DEFAULT_HOME_CONTENT.final_cta.perks_en)

  const primaryBtnUrl = isLoggedIn ? '/dashboard' : (data.primary_btn_url || '/signup')
  const primaryBtnText = isLoggedIn
    ? (isAr ? 'الانتقال للوحة التحكم' : 'Go to Dashboard')
    : (isAr ? (data.primary_btn_text_ar || 'أنشئ حسابك المجاني في دقيقة 🚀') : (data.primary_btn_text_en || 'Start Your Free Account Now 🚀'))

  const secondaryBtnUrl = data.secondary_btn_url || '/features'
  const secondaryBtnText = isAr
    ? (data.secondary_btn_text_ar || 'استكشف كافة المميزات والقدرات التقنية')
    : (data.secondary_btn_text_en || 'View Full Technical Features')

  return (
    <section className="relative z-10 py-20 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
      <div className="rounded-3xl bg-gradient-to-r from-[#00685F] via-[#005049] to-[#003833] p-10 sm:p-16 text-white text-center space-y-8 shadow-[0_20px_50px_rgba(0,104,95,0.3)] relative overflow-hidden">
        {/* Glow Circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#6BD8CB]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-4 z-10 relative">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 shadow-sm text-emerald-200">
            <Sparkles className="h-4 w-4" />
            <span className="text-[12px] sm:text-[13px] font-semibold tracking-wide uppercase">
              {isAr ? (data.badge_ar || 'ابدأ الآن بدون أي مخاطرة') : (data.badge_en || 'RISK-FREE SETUP IN 60 SECONDS')}
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
            {isAr ? data.title_ar : data.title_en}
          </h2>

          <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            {isAr ? data.subtitle_ar : data.subtitle_en}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 z-10 relative">
          <Link
            href={primaryBtnUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[4px] bg-white hover:bg-emerald-50 text-[#005049] px-8 py-4 text-sm font-bold uppercase tracking-wider shadow-lg hover:scale-[1.02] transition-all"
          >
            <span>{primaryBtnText}</span>
            <ArrowIcon className="h-4 w-4" />
          </Link>
          <Link
            href={secondaryBtnUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[4px] border border-white/30 bg-white/10 hover:bg-white/20 text-white px-8 py-4 text-sm font-bold uppercase tracking-wider shadow-sm transition-all backdrop-blur-sm"
          >
            <span>{secondaryBtnText}</span>
          </Link>
        </div>

        {perks.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-emerald-200/90 z-10 relative">
            {perks.map((perk, pIdx) => (
              <div key={pIdx} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#6BD8CB]" />
                <span>{perk}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
