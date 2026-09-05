'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  MessageCircle,
  Phone,
  ArrowLeft,
  Share2,
  Check,
  BookOpen,
  Headphones,
  Globe,
  Video,
  Download,
  Star,
  Link as LinkIcon,
  Sun,
  Moon,
  BadgeCheck,
  ExternalLink,
  X,
  Image as ImageIcon,
  MapPin,
} from 'lucide-react'
import type { StorefrontFullConfig, CustomLinkButton } from '@/lib/storefront/types'
import { toast } from 'sonner'
import { getLinkPreset } from '@/lib/storefront/link-icons'
import {
  getButtonStyles,
  getIconContainerClasses,
  getButtonShapeClass,
  getThemePresetStyle,
} from '@/lib/storefront/theme-tokens'

interface BioStorefrontProps {
  storefront: StorefrontFullConfig
  primaryColor?: string
  isAppointmentsEnabled?: boolean
  isProductsEnabled?: boolean
  onOpenBooking?: () => void
  onOpenCart?: () => void
}

function TwitterXIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function TelegramIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  )
}

function YouTubeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function FacebookIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function TikTokIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )
}

function LinkedInIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  )
}

function SnapchatIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z" />
    </svg>
  )
}

export function BioStorefront({ storefront }: BioStorefrontProps) {
  const displayName = storefront.store_name || ''
  const customLinks = (storefront.settings?.custom_links || []).filter((l) => l.is_active !== false)
  const contact = storefront.contact_buttons || {
    whatsapp_enabled: true,
    whatsapp_number: '',
    phone_enabled: true,
    phone_number: '',
  }

  // Dark Mode State
  const isPresetDark = storefront.theme_config?.theme_preset === 'cyber_dark' || storefront.theme_config?.background_style === 'midnight'
  const initialDark = storefront.theme_config?.dark_mode ? storefront.theme_config.dark_mode === 'dark' : isPresetDark
  const [isDarkMode, setIsDarkMode] = useState(initialDark)
  const [lightboxImg, setLightboxImg] = useState<{ src: string; caption?: string; description?: string } | null>(null)

  // Track page visit on mount
  useEffect(() => {
    if (storefront?.id && storefront?.account_id) {
      fetch('/api/storefront/track/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storefront_id: storefront.id,
          account_id: storefront.account_id,
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        }),
      }).catch(() => {})
    }
  }, [storefront?.id, storefront?.account_id])

  const trackClick = (link: CustomLinkButton) => {
    if (storefront?.id && storefront?.account_id) {
      fetch('/api/storefront/track/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storefront_id: storefront.id,
          account_id: storefront.account_id,
          link_id: link.id,
          link_title: link.title,
          link_url: link.url,
        }),
      }).catch(() => {})
    }
  }

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: displayName,
          url: window.location.href,
        })
        .catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('تم نسخ رابط الصفحة إلى الحافظة ✓')
    }
  }

  // Contact list
  const socialList = [
    {
      id: 'whatsapp',
      label: 'واتساب',
      url: contact.whatsapp_number
        ? `https://wa.me/${contact.whatsapp_number.replace(/[^0-9]/g, '')}`
        : null,
      icon: <MessageCircle className="w-4 h-4" />,
      color: 'hover:text-emerald-500',
    },
    {
      id: 'instagram',
      label: 'إنستغرام',
      url: contact.instagram
        ? contact.instagram.startsWith('http')
          ? contact.instagram
          : `https://instagram.com/${contact.instagram.replace('@', '')}`
        : null,
      icon: <InstagramIcon className="w-3.5 h-3.5" />,
      color: 'hover:text-pink-500',
    },
    {
      id: 'twitter',
      label: 'إكس (تويتر)',
      url: contact.twitter
        ? contact.twitter.startsWith('http')
          ? contact.twitter
          : `https://x.com/${contact.twitter.replace('@', '')}`
        : null,
      icon: <TwitterXIcon className="w-3.5 h-3.5" />,
      color: 'hover:text-slate-900 dark:hover:text-white',
    },
    {
      id: 'youtube',
      label: 'يوتيوب',
      url: contact.youtube || null,
      icon: <YouTubeIcon className="w-4 h-4" />,
      color: 'hover:text-red-600',
    },
    {
      id: 'telegram',
      label: 'تليقرام',
      url: contact.telegram
        ? contact.telegram.startsWith('http')
          ? contact.telegram
          : `https://t.me/${contact.telegram.replace('@', '')}`
        : null,
      icon: <TelegramIcon className="w-3.5 h-3.5" />,
      color: 'hover:text-[#24A1DE]',
    },
    {
      id: 'facebook',
      label: 'فيسبوك',
      url: contact.facebook || null,
      icon: <FacebookIcon className="w-3.5 h-3.5" />,
      color: 'hover:text-blue-600',
    },
    {
      id: 'tiktok',
      label: 'تيك توك',
      url: contact.tiktok
        ? contact.tiktok.startsWith('http')
          ? contact.tiktok
          : `https://tiktok.com/@${contact.tiktok.replace('@', '')}`
        : null,
      icon: <TikTokIcon className="w-3.5 h-3.5" />,
      color: 'hover:text-slate-900 dark:hover:text-white',
    },
    {
      id: 'snapchat',
      label: 'سناب شات',
      url: contact.snapchat
        ? contact.snapchat.startsWith('http')
          ? contact.snapchat
          : `https://snapchat.com/add/${contact.snapchat.replace('@', '')}`
        : null,
      icon: <SnapchatIcon className="w-3.5 h-3.5" />,
      color: 'hover:text-amber-400',
    },
    {
      id: 'linkedin',
      label: 'لينكد إن',
      url: contact.linkedin || null,
      icon: <LinkedInIcon className="w-3.5 h-3.5" />,
      color: 'hover:text-blue-700',
    },
    {
      id: 'phone',
      label: 'اتصال هاتفي',
      url: contact.phone_number ? `tel:${contact.phone_number}` : null,
      icon: <Phone className="w-3.5 h-3.5" />,
      color: 'hover:text-blue-600',
    },
    {
      id: 'maps',
      label: 'خرائط Google',
      url: contact.maps_url || null,
      icon: <MapPin className="w-3.5 h-3.5" />,
      color: 'hover:text-emerald-500',
    },
  ].filter((s) => Boolean(s.url))

  const displaySocials = socialList.length > 0 ? socialList : [
    { id: 'wa', label: 'واتساب', url: '#', icon: <MessageCircle className="w-4 h-4" />, color: 'hover:text-emerald-500' },
    { id: 'ig', label: 'إنستغرام', url: '#', icon: <InstagramIcon className="w-3.5 h-3.5" />, color: 'hover:text-pink-500' },
    { id: 'x', label: 'إكس', url: '#', icon: <TwitterXIcon className="w-3.5 h-3.5" />, color: 'hover:text-slate-900 dark:hover:text-white' },
    { id: 'yt', label: 'يوتيوب', url: '#', icon: <YouTubeIcon className="w-4 h-4" />, color: 'hover:text-red-600' },
    { id: 'ph', label: 'هاتف', url: '#', icon: <Phone className="w-3.5 h-3.5" />, color: 'hover:text-blue-600' },
  ]

  // Theme Background & Colors per Preset & Mode
  const themeStyle = getThemePresetStyle(storefront.theme_config?.theme_preset, isDarkMode)
  const isLight = !isDarkMode

  const isVerified = storefront.theme_config?.verified ?? true
  const verifiedColor = storefront.theme_config?.verified_color || '#FBBF24'
  const iconStyle = storefront.theme_config?.icon_style || 'soft_bg'

  const isBannerMode = storefront.theme_config?.banner_mode === 'banner'
  const isBgMode = Boolean(storefront.banner_url) && !isBannerMode

  return (
    <div
      className={`min-h-screen flex flex-col justify-between items-center ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      } antialiased px-4 py-8 sm:py-12 selection:bg-lime-300 selection:text-slate-900 transition-colors duration-300 relative`}
      style={{
        background: isBgMode ? undefined : themeStyle.bgGradient,
        backgroundImage: isBgMode ? `url("${storefront.banner_url}")` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
      dir="rtl"
    >
      {/* Background Wallpaper Overlay */}
      {isBgMode && (
        <div
          className={`fixed inset-0 pointer-events-none ${
            isDarkMode ? 'bg-slate-950/80' : 'bg-white/80'
          } backdrop-blur-[1px] -z-10`}
        />
      )}

      <main className="w-full max-w-[460px] flex flex-col justify-between flex-1">
        {/* Top Floating Action Bar: Share + Light/Dark Switch */}
        <div className="flex items-center justify-between mb-4 w-full px-1">
          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsDarkMode((prev) => !prev)}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xs border active:scale-95 transition-all backdrop-blur-md ${
              isLight
                ? 'bg-white/90 hover:bg-white text-slate-700 border-slate-200/90 shadow-xs'
                : 'bg-slate-900/90 hover:bg-slate-900 text-amber-400 border-slate-800 shadow-xs'
            }`}
            title={isDarkMode ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Share Action */}
          <button
            type="button"
            onClick={handleShare}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xs border active:scale-95 transition-all backdrop-blur-md ${
              isLight
                ? 'bg-white/90 hover:bg-white text-slate-700 border-slate-200/90'
                : 'bg-slate-900/90 hover:bg-slate-900 text-slate-300 border-slate-800'
            }`}
            title="مشاركة الصفحة"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center">
          {/* Cover Banner (Header Banner Mode) */}
          {isBannerMode && storefront.banner_url && (
            <div className="w-full h-32 sm:h-36 rounded-3xl overflow-hidden relative -mb-10 shadow-sm">
              <img src={storefront.banner_url} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
            </div>
          )}

          {/* Profile Header Section */}
          <section className="flex flex-col items-center text-center w-full z-10">
            {/* Avatar Container with Optional Verified Badge */}
            <div className="relative mb-3.5">
              <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-b from-white to-slate-200 shadow-md overflow-hidden flex items-center justify-center">
                {storefront.logo_url ? (
                  <img
                    alt={displayName}
                    className="w-full h-full object-cover rounded-full"
                    src={storefront.logo_url}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Sparkles className="w-8 h-8 text-amber-500" />
                  </div>
                )}
              </div>

              {/* Verified Badge on Avatar */}
              {isVerified && (
                <div
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: verifiedColor }}
                  title="حساب موثق"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3] text-slate-950" />
                </div>
              )}
            </div>

            {/* Name with Verified Icon */}
            {displayName && (
              <h1 className={`text-xl font-bold tracking-tight flex items-center gap-1.5 justify-center ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                <span>{displayName}</span>
                {isVerified && (
                  <span title="حساب موثق وموثوق" className="inline-flex items-center">
                    <BadgeCheck
                      className="w-5 h-5 shrink-0"
                      style={{ color: verifiedColor }}
                    />
                  </span>
                )}
              </h1>
            )}

            {/* Bio Description */}
            {storefront.bio && (
              <p className={`text-xs leading-relaxed font-normal max-w-[340px] mt-2.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {storefront.bio}
              </p>
            )}

            {/* Social Media Icons Pill Bar */}
            <div
              className={`mt-4 px-4 py-2 rounded-full flex flex-wrap items-center justify-center gap-3.5 shadow-sm border ${themeStyle.pillBg} ${themeStyle.pillBorder} ${themeStyle.pillText}`}
            >
              {displaySocials.map((s) => (
                <a
                  key={s.id}
                  href={s.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`transition-colors ${s.color}`}
                  aria-label={s.label}
                  title={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </section>

          {/* Link Buttons & Image Cards Stack */}
          <section className="w-full flex flex-col gap-3 mt-6">
            {customLinks.map((btn) => {
              // 1. IMAGE CARD TYPE
              if (btn.type === 'image_card') {
                const cardImg = btn.image_card?.src || btn.image_url
                const shape = btn.btn_shape || storefront.theme_config?.button_shape || 'soft'
                const shapeClass = getButtonShapeClass(shape)

                return (
                  <div
                    key={btn.id}
                    onClick={() => {
                      trackClick(btn)
                      if (cardImg) {
                        setLightboxImg({
                          src: cardImg,
                          caption: btn.image_card?.caption || btn.title,
                          description: btn.image_card?.description || btn.subtitle,
                        })
                      }
                    }}
                    className={`w-full overflow-hidden border shadow-sm transition-all hover:scale-[1.01] cursor-pointer relative group ${shapeClass} ${themeStyle.cardBg} ${themeStyle.cardBorder}`}
                  >
                    {cardImg ? (
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={cardImg}
                          alt={btn.image_card?.caption || btn.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 right-3 left-3 text-white text-right">
                          <h3 className="font-bold text-sm drop-shadow-sm">
                            {btn.image_card?.caption || btn.title}
                          </h3>
                          {(btn.image_card?.description || btn.subtitle) && (
                            <p className="text-[11px] text-white/85 line-clamp-2 mt-0.5">
                              {btn.image_card?.description || btn.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center space-y-2 text-muted-foreground">
                        <ImageIcon className="w-8 h-8 mx-auto opacity-50" />
                        <div className="text-xs font-semibold">{btn.title}</div>
                      </div>
                    )}
                    {btn.url && btn.url !== 'https://' && (
                      <a
                        href={btn.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation()
                          trackClick(btn)
                        }}
                        className="absolute top-3 left-3 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-all"
                        title="فتح الرابط"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )
              }

              // 2. STANDARD CUSTOM LINK BUTTON
              const preset = getLinkPreset(btn.icon)
              const Icon = preset.icon
              const isHighlight = Boolean(btn.highlight)
              const showBadge = isHighlight && btn.title.trim() !== 'مميز'
              const { className: btnClasses, style: btnStyle } = getButtonStyles(
                btn,
                storefront.theme_config,
                isDarkMode
              )
              const iconClasses = getIconContainerClasses(iconStyle, preset, isHighlight)

              return (
                <a
                  key={btn.id}
                  href={btn.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick(btn)}
                  className={btnClasses}
                  style={btnStyle}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {btn.image_url ? (
                      <img
                        src={btn.image_url}
                        alt={btn.title}
                        className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-200/50 shadow-xs"
                      />
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${iconClasses}`}
                        style={btn.icon_color ? { color: btn.icon_color } : undefined}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="text-right min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold leading-tight truncate">
                          {btn.title}
                        </span>
                        {showBadge && (
                          <span className="text-[9px] font-bold bg-slate-900/15 text-slate-900 px-1.5 py-0.5 rounded-full shrink-0">
                            مميز
                          </span>
                        )}
                      </div>
                      {btn.subtitle && (
                        <p className={`text-[10px] mt-0.5 truncate ${isHighlight ? 'text-slate-800' : isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          {btn.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 mr-1 opacity-60 hover:opacity-100">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                </a>
              )
            })}

            {/* Fallback Sample Card if user has 0 custom buttons */}
            {customLinks.length === 0 && (
              <div
                className="w-full bg-[#dcf245] transition-all rounded-2xl py-3 px-3.5 flex items-center justify-between border border-[#cae035]/60 shadow-[0_7px_22px_-3px_rgba(188,212,45,0.45)] text-slate-900"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-800/10 flex items-center justify-center shrink-0 text-slate-800">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 leading-tight block">
                      {storefront.settings?.hero_headline || 'أهلاً بكم في صفحتي الشخصية'}
                    </span>
                    <p className="text-[10px] text-slate-700/85 mt-0.5 font-medium">
                      {storefront.settings?.hero_subtitle || 'تواصلوا معي أو أضيفوا أزراركم من لوحة التحكم'}
                    </p>
                  </div>
                </div>
                <div className="text-slate-700 shrink-0 mr-1">
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Branding Footer */}
        <footer className="mt-10 mb-2 flex items-center justify-center text-center">
          <span className={`text-xs font-bold tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            mkwacrm
          </span>
        </footer>
      </main>

      {/* Lightbox Modal for Image Cards */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxImg(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImg(null)}
            className="absolute top-5 left-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="max-w-xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={lightboxImg.src} alt="Preview" className="w-full max-h-[70vh] object-contain bg-black" />
            {(lightboxImg.caption || lightboxImg.description) && (
              <div className="p-4 text-right text-white space-y-1">
                {lightboxImg.caption && <h3 className="font-bold text-base">{lightboxImg.caption}</h3>}
                {lightboxImg.description && (
                  <p className="text-xs text-slate-300 leading-relaxed">{lightboxImg.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
