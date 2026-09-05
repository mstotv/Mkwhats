'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  MessageCircle,
  Phone,
  ChevronLeft,
  Share2,
  Check,
  BadgeCheck,
  Sun,
  Moon,
  Image as ImageIcon,
  MapPin,
} from 'lucide-react'
import type {
  BusinessType,
  ThemeConfig,
  ContactButtons,
  StorefrontSettings,
} from '@/lib/storefront/types'
import { useLocale } from 'next-intl'
import { getLinkPreset } from '@/lib/storefront/link-icons'
import { getButtonShapeClass, getIconContainerClasses, getThemePresetStyle } from '@/lib/storefront/theme-tokens'

function TwitterXIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function TelegramIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  )
}

function YouTubeIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function FacebookIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function TikTokIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )
}

function LinkedInIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  )
}

function SnapchatIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z" />
    </svg>
  )
}

interface LivePhonePreviewProps {
  storeName: string
  subdomain: string
  bio: string
  logoUrl: string
  bannerUrl: string
  themeConfig: ThemeConfig
  setThemeConfig?: React.Dispatch<React.SetStateAction<ThemeConfig>>
  contactButtons: ContactButtons
  sectionsOrder?: string[]
  settings?: StorefrontSettings
  itemsCount?: number
  businessType?: BusinessType
}

export function LivePhonePreview({
  storeName,
  subdomain,
  bio,
  logoUrl,
  bannerUrl,
  themeConfig,
  setThemeConfig,
  contactButtons,
  settings,
}: LivePhonePreviewProps) {
  const isPresetDark = themeConfig.theme_preset === 'cyber_dark' || themeConfig.background_style === 'midnight'
  const initialIsDark = themeConfig.dark_mode ? themeConfig.dark_mode === 'dark' : isPresetDark
  const [previewDark, setPreviewDark] = useState(initialIsDark)

  // Keep previewDark synchronized whenever themeConfig updates
  useEffect(() => {
    if (themeConfig.dark_mode) {
      setPreviewDark(themeConfig.dark_mode === 'dark')
    } else if (themeConfig.theme_preset === 'cyber_dark' || themeConfig.background_style === 'midnight') {
      setPreviewDark(true)
    }
  }, [themeConfig.dark_mode, themeConfig.theme_preset, themeConfig.background_style])

  const toggleDarkMode = () => {
    const next = !previewDark
    setPreviewDark(next)
    if (setThemeConfig) {
      setThemeConfig((prev) => ({ ...prev, dark_mode: next ? 'dark' : 'light' }))
    }
  }

  const themeStyle = getThemePresetStyle(themeConfig.theme_preset, previewDark)
  const isLight = !previewDark

  const customLinks = (settings?.custom_links || []).filter((l) => l.is_active !== false)
  const isVerified = themeConfig.verified ?? true
  const verifiedColor = themeConfig.verified_color || '#FBBF24'
  const globalShape = themeConfig.button_shape || 'soft'
  const iconStyle = themeConfig.icon_style || 'soft_bg'

  const isBannerMode = themeConfig.banner_mode === 'banner'
  const isBgMode = Boolean(bannerUrl) && !isBannerMode

  const locale = useLocale()
  const isAr = locale === 'ar'

  return (
    <div className="sticky top-6 flex flex-col items-center select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Preview Controls Bar */}
      <div className="w-[300px] mb-2 flex items-center justify-between px-2 text-xs text-muted-foreground">
        <span className="font-semibold flex items-center gap-1.5">
          <span>{isAr ? 'معاينة حية' : 'Live Preview'}</span>
        </span>
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer bg-muted/60 px-2 py-0.5 rounded-full border border-border/60"
        >
          {previewDark ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-slate-700" />}
          <span>{previewDark ? (isAr ? 'وضع داكن' : 'Dark Mode') : (isAr ? 'وضع فاتح' : 'Light Mode')}</span>
        </button>
      </div>

      {/* Phone Mockup Frame */}
      <div className="w-[300px] h-[610px] rounded-[44px] bg-slate-950 p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-slate-800 relative">
        {/* Dynamic Island Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-end px-2">
          <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-800" />
        </div>

        {/* Screen Content */}
        <div
          className={`w-full h-full rounded-[36px] overflow-hidden overflow-y-auto scrollbar-none relative transition-colors duration-300 flex flex-col justify-between ${
            previewDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
          }`}
          style={{
            background: isBgMode ? undefined : themeStyle.bgGradient,
            backgroundImage: isBgMode ? `url("${bannerUrl}")` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Background Wallpaper Overlay */}
          {isBgMode && (
            <div
              className={`absolute inset-0 pointer-events-none transition-colors duration-300 ${
                previewDark ? 'bg-slate-950/75' : 'bg-white/80'
              } backdrop-blur-[1px]`}
            />
          )}

          {/* Top Banner Mode (Header Cover) */}
          {isBannerMode && bannerUrl && (
            <div className="relative w-full h-28 shrink-0 overflow-hidden">
              <img src={bannerUrl} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
            </div>
          )}

          {/* Top Bar inside phone */}
          <div className={`flex items-center justify-between p-3 pt-6 z-20 ${isBannerMode && bannerUrl ? 'absolute top-0 left-0 right-0 pointer-events-auto' : ''}`}>
            <button
              type="button"
              onClick={toggleDarkMode}
              className={`w-6 h-6 rounded-full flex items-center justify-center border shadow-xs transition-all ${
                isLight ? 'bg-white/90 text-slate-700 border-slate-200 shadow-xs' : 'bg-slate-900/90 text-amber-400 border-slate-800 shadow-xs'
              }`}
            >
              {previewDark ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
            </button>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border shadow-xs ${
                isLight ? 'bg-white/90 text-slate-700 border-slate-200' : 'bg-slate-900/90 text-slate-300 border-slate-800'
              }`}
            >
              <Share2 className="w-3 h-3" />
            </div>
          </div>

          <div className={`p-3 min-h-full flex flex-col justify-between flex-1 relative z-10 ${isBannerMode && bannerUrl ? '-mt-10 pt-0' : 'pt-1'}`}>
            <div className="space-y-3">
              {/* Avatar & Verified Badge */}
              <div className="relative mx-auto w-16 h-16">
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-b from-white to-slate-200 shadow-md overflow-hidden flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Sparkles className="w-6 h-6 text-amber-500" />
                    </div>
                  )}
                </div>
                {isVerified && (
                  <div
                    className="absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: verifiedColor }}
                    title="حساب موثق"
                  >
                    <Check className="w-3 h-3 stroke-[3] text-slate-950" />
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="text-center">
                {storeName && (
                  <div className={`font-bold text-xs leading-tight flex items-center justify-center gap-1 ${
                    previewDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <span>{storeName}</span>
                    {isVerified && (
                      <BadgeCheck className="w-3.5 h-3.5" style={{ color: verifiedColor }} />
                    )}
                  </div>
                )}
                {bio && (
                  <p className={`text-[10px] mt-1.5 line-clamp-3 px-1.5 leading-relaxed font-normal ${previewDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {bio}
                  </p>
                )}
              </div>

              {/* Social Icons Pill Bar */}
              {(() => {
                const items: { icon: React.ComponentType<{ className?: string }>; color: string; key: string }[] = []
                if (contactButtons.phone_number) items.push({ icon: Phone, color: 'text-blue-500', key: 'phone' })
                if (contactButtons.youtube) items.push({ icon: YouTubeIcon, color: 'text-red-600', key: 'yt' })
                if (contactButtons.twitter) items.push({ icon: TwitterXIcon, color: isLight ? 'text-slate-900' : 'text-white', key: 'x' })
                if (contactButtons.instagram) items.push({ icon: InstagramIcon, color: 'text-pink-600', key: 'ig' })
                if (contactButtons.whatsapp_number) items.push({ icon: MessageCircle, color: 'text-emerald-500', key: 'wa' })
                if (contactButtons.telegram) items.push({ icon: TelegramIcon, color: 'text-[#24A1DE]', key: 'tg' })
                if (contactButtons.facebook) items.push({ icon: FacebookIcon, color: 'text-[#1877F2]', key: 'fb' })
                if (contactButtons.tiktok) items.push({ icon: TikTokIcon, color: isLight ? 'text-slate-900' : 'text-white', key: 'tt' })
                if (contactButtons.snapchat) items.push({ icon: SnapchatIcon, color: 'text-amber-500', key: 'sc' })
                if (contactButtons.linkedin) items.push({ icon: LinkedInIcon, color: 'text-[#0A66C2]', key: 'li' })
                if (contactButtons.maps_url) items.push({ icon: MapPin, color: 'text-emerald-500', key: 'maps' })

                const displayItems = items.length > 0 ? items : [
                  { icon: Phone, color: 'text-blue-500', key: 's-phone' },
                  { icon: YouTubeIcon, color: 'text-red-600', key: 's-yt' },
                  { icon: TwitterXIcon, color: 'text-slate-900', key: 's-x' },
                  { icon: InstagramIcon, color: 'text-pink-600', key: 's-ig' },
                  { icon: MessageCircle, color: 'text-emerald-500', key: 's-wa' },
                ]

                return (
                  <div className={`mx-auto w-fit px-3 py-1 rounded-full flex items-center gap-2 shadow-xs border ${themeStyle.pillBg} ${themeStyle.pillBorder} ${themeStyle.pillText}`}>
                    {displayItems.map((item) => {
                      const Icon = item.icon
                      return <Icon key={item.key} className={`w-3 h-3 ${item.color}`} />
                    })}
                  </div>
                )
              })()}

              {/* Stacked Link Cards & Image Cards */}
              <div className="space-y-2 pt-1">
                {customLinks.length > 0 ? (
                  customLinks.map((btn) => {
                    const itemShape = btn.btn_shape || globalShape
                    const shapeClass = getButtonShapeClass(itemShape)

                    // 1. IMAGE CARD PREVIEW
                    if (btn.type === 'image_card') {
                      const cardImg = btn.image_card?.src || btn.image_url
                      return (
                        <div
                          key={btn.id}
                          className={`overflow-hidden border shadow-xs ${shapeClass} ${themeStyle.cardBg} ${themeStyle.cardBorder}`}
                        >
                          {cardImg ? (
                            <div className="relative aspect-[16/9] w-full bg-slate-200 dark:bg-slate-800">
                              <img src={cardImg} alt={btn.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                              <div className="absolute bottom-1.5 right-2 left-2 text-white text-right">
                                <div className="text-[10px] font-bold leading-tight drop-shadow-sm truncate">
                                  {btn.image_card?.caption || btn.title}
                                </div>
                                {(btn.image_card?.description || btn.subtitle) && (
                                  <div className="text-[8px] text-white/80 line-clamp-1">
                                    {btn.image_card?.description || btn.subtitle}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 text-center text-muted-foreground text-[10px]">
                              <ImageIcon className="w-4 h-4 mx-auto opacity-50 mb-1" />
                              <span>{btn.title}</span>
                            </div>
                          )}
                        </div>
                      )
                    }

                    // 2. STANDARD BUTTON PREVIEW
                    const preset = getLinkPreset(btn.icon)
                    const Icon = preset.icon
                    const isHighlight = Boolean(btn.highlight)
                    const iconClasses = getIconContainerClasses(iconStyle, preset, isHighlight)

                    const customBg = btn.bg_color || themeConfig.button_color
                    const customText = btn.text_color || themeConfig.button_text_color

                    const inlineStyle: React.CSSProperties = {}
                    if (customBg && !isHighlight) inlineStyle.backgroundColor = customBg
                    if (customText && !isHighlight) inlineStyle.color = customText

                    return (
                      <div
                        key={btn.id}
                        className={`p-2 border shadow-xs flex items-center justify-between transition-all ${shapeClass} ${
                          isHighlight
                            ? 'bg-[#dcf245] border-[#cae035]/60 text-slate-900'
                            : !customBg
                            ? `${themeStyle.cardBg} ${themeStyle.cardBorder} ${themeStyle.cardText}`
                            : ''
                        }`}
                        style={inlineStyle}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {btn.image_url ? (
                            <img
                              src={btn.image_url}
                              alt={btn.title}
                              className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-200/50 shadow-xs"
                            />
                          ) : (
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${iconClasses}`}
                              style={btn.icon_color ? { color: btn.icon_color } : undefined}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0 text-right">
                            <div className="flex items-center gap-1">
                              <span className={`text-[10px] font-bold truncate ${isHighlight ? 'text-slate-900' : customText ? '' : previewDark ? 'text-white' : 'text-slate-900'}`}>
                                {btn.title || 'زر مخصص'}
                              </span>
                              {isHighlight && (
                                <span className="text-[7px] font-bold bg-slate-800/15 text-slate-800 px-1 py-0.2 rounded-full shrink-0">
                                  مميز
                                </span>
                              )}
                            </div>
                            {btn.subtitle && (
                              <div
                                className={`text-[8px] truncate mt-0.5 ${
                                  isHighlight ? 'text-slate-800 font-medium' : customText ? 'opacity-80' : previewDark ? 'text-slate-300' : 'text-slate-600'
                                }`}
                              >
                                {btn.subtitle}
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronLeft
                          className={`w-3.5 h-3.5 shrink-0 ${isHighlight ? 'text-slate-800' : previewDark ? 'text-slate-300' : 'text-slate-500'} opacity-75`}
                        />
                      </div>
                    )
                  })
                ) : (
                  /* Fallback sample card */
                  <div className={`p-2 rounded-xl bg-[#dcf245] border border-[#cae035]/60 shadow-xs flex items-center justify-between`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-800/10 flex items-center justify-center text-slate-800 shrink-0">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-900 truncate">
                            {settings?.hero_headline || 'أهلاً بكم في صفحتي الشخصية'}
                          </span>
                        </div>
                        <div className="text-[8px] text-slate-700 font-medium truncate">تواصلوا معي أو تصفحوا أعمالي</div>
                      </div>
                    </div>
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  </div>
                )}
              </div>
            </div>

            {/* Footer Brand Tag */}
            <div className="text-center pt-4 pb-2">
              <span className={`text-[9px] font-bold tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                mkwacrm
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
