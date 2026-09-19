'use client'

import {
  Zap,
  ShoppingBag,
  Mic,
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Bot,
  Shield,
  Clock,
  Layers,
} from 'lucide-react'
import Link from 'next/link'
import { HomePillarsContent, DEFAULT_HOME_CONTENT } from '@/lib/types/home-cms'
import { LinearIconBadge, IconBadgeVariant } from '@/components/ui/linear-icon-badge'

interface LandingValuePillarsProps {
  isAr: boolean
  content?: HomePillarsContent
}

function resolveIconComponent(iconName: string) {
  switch (iconName) {
    case 'Zap':
      return Zap
    case 'ShoppingBag':
      return ShoppingBag
    case 'Mic':
      return Mic
    case 'Globe':
      return Globe
    case 'Sparkles':
      return Sparkles
    case 'Bot':
      return Bot
    case 'Shield':
      return Shield
    case 'Clock':
      return Clock
    default:
      return Sparkles
  }
}

function renderPillarsTitle(rawTitle: string, isAr: boolean) {
  const targetWord = isAr ? 'واتساب' : 'WhatsApp'
  const title = (rawTitle || '').trim()

  const regex = new RegExp(`(${targetWord})`, 'i')
  if (regex.test(title)) {
    const parts = title.split(regex)
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === targetWord.toLowerCase() ? (
            <span key={i} className="italic text-[#00685F] dark:text-[#6BD8CB]">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    )
  }

  return (
    <>
      {title}{' '}
      <span className="italic text-[#00685F] dark:text-[#6BD8CB]">
        {targetWord}
      </span>
    </>
  )
}

export function LandingValuePillars({ isAr, content: rawContent }: LandingValuePillarsProps) {
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight
  const data = rawContent || DEFAULT_HOME_CONTENT.pillars

  const pillars = data.items && data.items.length > 0
    ? data.items.filter((p) => p.visible !== false)
    : DEFAULT_HOME_CONTENT.pillars.items.filter((p) => p.visible !== false)

  const getAccentVariant = (accent: string): IconBadgeVariant => {
    switch (accent) {
      case 'amber':
        return 'amber'
      case 'emerald':
        return 'emerald'
      case 'purple':
        return 'violet'
      default:
        return 'emerald'
    }
  }

  const getAccentStyles = (accent: string) => {
    switch (accent) {
      case 'amber':
        return {
          badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          check: 'text-amber-500',
        }
      case 'emerald':
        return {
          badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          check: 'text-emerald-500',
        }
      case 'purple':
        return {
          badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
          check: 'text-purple-500',
        }
      default:
        return {
          badge: 'bg-[#00685F]/10 text-[#00685F] dark:text-[#6BD8CB] border-[#00685F]/20',
          check: 'text-[#00685F] dark:text-[#6BD8CB]',
        }
    }
  }

  return (
    <section className="relative z-10 py-20 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3.5">
        <div className="inline-flex items-center gap-2 bg-[#00685F]/10 border border-[#00685F]/25 rounded-full px-4 py-1.5 shadow-sm text-[#00685F] dark:text-[#6BD8CB]">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="text-[12px] sm:text-[13px] font-semibold tracking-wide uppercase">
            {isAr ? (data.badge_ar || 'محركات القيمة والنمو') : (data.badge_en || '4 CORE VALUE PILLARS')}
          </span>
        </div>

        <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#1B1C1C] dark:text-white leading-tight">
          {renderPillarsTitle(isAr ? data.title_ar : data.title_en, isAr)}
        </h2>

        <p className="text-sm sm:text-base text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
          {isAr ? data.subtitle_ar : data.subtitle_en}
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {pillars.map((pillar, idx) => {
          const styles = getAccentStyles(pillar.accent)
          const variant = getAccentVariant(pillar.accent)
          const IconComponent = resolveIconComponent(pillar.icon)
          const highlights = isAr
            ? (pillar.highlights_ar || [])
            : (pillar.highlights_en || [])

          return (
            <div
              key={pillar.id || idx}
              className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl p-8 space-y-6 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] dark:hover:border-white/20 transition-all duration-300 group"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <LinearIconBadge
                    icon={IconComponent}
                    variant={variant}
                    size="lg"
                    glow
                  />
                  <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border tracking-tight ${styles.badge}`}>
                    {isAr ? pillar.badge_ar : pillar.badge_en}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#1B1C1C] dark:text-white group-hover:text-[#00685F] dark:group-hover:text-[#6BD8CB] transition-colors">
                    {isAr ? pillar.title_ar : pillar.title_en}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
                    {isAr ? pillar.desc_ar : pillar.desc_en}
                  </p>
                </div>

                {highlights.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-black/5 dark:border-white/10">
                    {highlights.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-center gap-2.5 text-xs text-[#1B1C1C] dark:text-white font-medium">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${styles.check}`} strokeWidth={1.5} />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#EFEDED] dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted-foreground uppercase">
                  0{idx + 1} / 04
                </span>
                <Link
                  href="/features"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00685F] dark:text-[#6BD8CB] hover:underline"
                >
                  <span>{isAr ? 'شاهد المواصفات الكاملة' : 'View Full Specs'}</span>
                  <ArrowIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
