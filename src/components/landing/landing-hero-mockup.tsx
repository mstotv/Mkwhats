'use client'

import { useLocale } from 'next-intl'
import { Sparkles, Calendar, Send, FileSpreadsheet, Bot, CheckCircle2, Zap } from 'lucide-react'

export function LandingHeroMockup() {
  const locale = useLocale()
  const isAr = locale === 'ar'

  return (
    <div className="relative max-w-6xl mx-auto pt-6 sm:pt-10">
      {/* ── Main Showcase Container with Glow and Rounded Corners ── */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-[#BCC9C6]/60 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden bg-white/60 dark:bg-[#141416]/60 backdrop-blur-sm p-1.5 sm:p-3">
        {/* The Realistic MacBook Dashboard Pro Image */}
        <img
          src="/dashboard-hero.jpg"
          alt="WhatsApp Automation & AI Dashboard Pro"
          className="w-full h-auto rounded-xl sm:rounded-2xl object-cover shadow-sm transition-transform duration-700 hover:scale-[1.005]"
        />

        {/* ── Floating Animated Badges Around the Edges ───────────── */}

        {/* 1. Top-Left: Google Gemini & OpenAI Badge */}
        <div
          className="absolute top-4 sm:top-8 start-4 sm:start-8 z-20 animate-bounce"
          style={{ animationDuration: '3.5s' }}
        >
          <div className="flex items-center gap-2.5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-[#1C1C1E]/95 border border-neutral-200/80 dark:border-neutral-700/80 px-3 sm:px-4 py-2 shadow-xl backdrop-blur-md">
            <div className="h-7 sm:h-8 w-7 sm:w-8 rounded-lg bg-gradient-to-tr from-[#00A389] to-[#6BD8CB] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="h-4 w-4 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div className="text-start">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-bold text-neutral-900 dark:text-white">
                  Gemini &amp; OpenAI
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#00A389] animate-ping" />
              </div>
              <span className="text-[9.5px] sm:text-[10px] text-[#00A389] font-semibold block">
                {isAr ? 'ذكاء اصطناعي تفاعلي مباشر' : 'Conversational AI Engine'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Top-Right: Automated Appointments & Calendar Badge */}
        <div
          className="absolute top-4 sm:top-8 end-4 sm:end-8 z-20 animate-bounce hidden sm:block"
          style={{ animationDuration: '4s', animationDelay: '0.5s' }}
        >
          <div className="flex items-center gap-2.5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-[#1C1C1E]/95 border border-neutral-200/80 dark:border-neutral-700/80 px-3 sm:px-4 py-2 shadow-xl backdrop-blur-md">
            <div className="h-7 sm:h-8 w-7 sm:w-8 rounded-lg bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center shadow-xs">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="text-start">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-bold text-neutral-900 dark:text-white">
                  {isAr ? 'حجز وتذكير المواعيد' : 'Smart Appointments'}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
              </div>
              <span className="text-[9.5px] sm:text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-semibold block">
                {isAr ? 'تذكيرات واتساب تلقائية' : 'Auto WhatsApp Reminders'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Bottom-Left: Google Sheets & Excel Export Badge */}
        <div
          className="absolute bottom-6 sm:bottom-12 start-4 sm:start-10 z-20 animate-bounce hidden sm:block"
          style={{ animationDuration: '3.8s', animationDelay: '1s' }}
        >
          <div className="flex items-center gap-2.5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-[#1C1C1E]/95 border border-neutral-200/80 dark:border-neutral-700/80 px-3.5 py-2 shadow-xl backdrop-blur-md">
            <div className="h-7 sm:h-8 w-7 sm:w-8 rounded-lg bg-[#107C41]/15 text-[#107C41] dark:text-[#34D399] flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div className="text-start">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-bold text-neutral-900 dark:text-white">
                  Google Sheets
                </span>
                <CheckCircle2 className="h-3 w-3 text-[#107C41]" />
              </div>
              <span className="text-[9.5px] sm:text-[10px] text-[#107C41] dark:text-[#34D399] font-semibold block">
                {isAr ? 'مزامنة الطلبات والبيانات لحظياً' : 'Live Order & Lead Sync'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Bottom-Right: Telegram Bot Notifications Badge */}
        <div
          className="absolute bottom-6 sm:bottom-12 end-4 sm:end-10 z-20 animate-bounce hidden sm:block"
          style={{ animationDuration: '4.2s', animationDelay: '1.5s' }}
        >
          <div className="flex items-center gap-2.5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-[#1C1C1E]/95 border border-neutral-200/80 dark:border-neutral-700/80 px-3.5 py-2 shadow-xl backdrop-blur-md">
            <div className="h-7 sm:h-8 w-7 sm:w-8 rounded-lg bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center shadow-xs">
              <Send className="h-4 w-4" />
            </div>
            <div className="text-start">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-bold text-neutral-900 dark:text-white">
                  Telegram Bot
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#229ED9] animate-ping" />
              </div>
              <span className="text-[9.5px] sm:text-[10px] text-[#229ED9] font-semibold block">
                {isAr ? 'إشعارات فورية لفريق المبيعات' : 'Instant Staff Alerts'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
