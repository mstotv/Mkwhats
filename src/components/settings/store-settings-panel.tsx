'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Store,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Globe,
  Sparkles,
  Palette,
  Layers,
  ShoppingBag,
  Settings2,
  Info,
  Save,
  BarChart3,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { SettingsPanelHead } from './settings-panel-head'
import { useLocale } from 'next-intl'

import type {
  BusinessType,
  ThemeConfig,
  ContactButtons,
  StorefrontSettings,
  StorefrontFullConfig,
} from '@/lib/storefront/types'
import { BrandingEditor } from './store-builder/branding-editor'
import { SectionsReorder } from './store-builder/sections-reorder'
import { ItemsManager } from './store-builder/items-manager'
import { LivePhonePreview } from './store-builder/live-phone-preview'
import { AnalyticsPanel } from './store-builder/analytics-panel'

type BuilderTab = 'branding' | 'domain' | 'analytics' | 'sections' | 'items'

export function StoreSettingsPanel() {
  const { canEditSettings: authCanEdit, accountRole } = useAuth()
  const locale = useLocale()
  const isAr = locale === 'ar'
  // Admin+ can edit settings; fallback gracefully if role is still resolving
  const canEditSettings = authCanEdit ?? (accountRole === 'owner' || accountRole === 'admin' || !accountRole)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<BuilderTab>('branding')

  // Core Storefront State
  const [storefrontId, setStorefrontId] = useState<string | null>(null)
  const [storeName, setStoreName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [businessType, setBusinessType] = useState<BusinessType>('bio')
  const [bio, setBio] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    primary_color: '#059669',
    accent_color: '#0d9488',
    style: 'modern',
    font: 'cairo',
    rounded: 'rounded-2xl',
  })

  const [contactButtons, setContactButtons] = useState<ContactButtons>({
    whatsapp_enabled: true,
    whatsapp_number: '',
    phone_enabled: true,
    phone_number: '',
    instagram: '',
    tiktok: '',
    maps_url: '',
  })

  const [sectionsOrder, setSectionsOrder] = useState<string[]>([
    'hero',
    'services',
    'products',
    'appointments',
    'contact',
  ])

  const [settings, setSettings] = useState<StorefrontSettings>({
    enable_whatsapp_confirmation: true,
    enable_telegram_notifications: true,
    enable_appointments: true,
    enable_direct_orders: true,
  })

  // Subdomain Validation State
  const [checkStatus, setCheckStatus] = useState<'idle' | 'checking' | 'available' | 'current' | 'unavailable'>('idle')
  const [checkMessage, setCheckMessage] = useState('')

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'domain.com'

  // 1. Fetch Storefront Configuration
  const fetchStorefront = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/storefront')
      const json = await res.json()

      if (json.storefront) {
        const sf = json.storefront as StorefrontFullConfig
        setStorefrontId(sf.id)
        setStoreName(sf.store_name || '')
        setSubdomain(sf.subdomain || '')
        setIsActive(sf.is_active)
        setBusinessType('bio')
        setBio(sf.bio || '')
        setLogoUrl(sf.logo_url || '')
        setBannerUrl(sf.banner_url || '')
        if (sf.theme_config) setThemeConfig(sf.theme_config)
        if (sf.contact_buttons) setContactButtons(sf.contact_buttons)
        if (Array.isArray(sf.sections_order)) setSectionsOrder(sf.sections_order)
        if (sf.settings) setSettings(sf.settings)
        setCheckStatus('current')
        setCheckMessage('هذا هو نطاق متجرك الحالي')
      } else {
        setStoreName(json.accountName || '')
        if (json.accountName) {
          const suggested = json.accountName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
          if (suggested.length >= 3) {
            setSubdomain(suggested)
          }
        }
      }
    } catch (err) {
      console.error('[StoreSettings] Load error:', err)
      toast.error('تعذر تحميل إعدادات المتجر')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStorefront()
  }, [fetchStorefront])

  // 2. Debounced Subdomain Check
  useEffect(() => {
    const cleanSub = subdomain.trim().toLowerCase()
    if (!cleanSub) {
      setCheckStatus('idle')
      setCheckMessage('')
      return
    }

    if (storefrontId && cleanSub === subdomain) {
      setCheckStatus('current')
      setCheckMessage('هذا هو نطاق متجرك الحالي')
      return
    }

    if (cleanSub.length < 3) {
      setCheckStatus('unavailable')
      setCheckMessage('يجب ألا يقل النطاق عن 3 أحرف')
      return
    }

    setCheckStatus('checking')
    setCheckMessage('جاري التحقق...')

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/storefront/check-subdomain?subdomain=${encodeURIComponent(cleanSub)}`)
        const data = await res.json()

        if (data.isCurrent) {
          setCheckStatus('current')
          setCheckMessage(data.message || 'هذا هو نطاق متجرك الحالي')
        } else if (data.available) {
          setCheckStatus('available')
          setCheckMessage('اسم النطاق متاح للاستخدام!')
        } else {
          setCheckStatus('unavailable')
          setCheckMessage(data.reason || 'اسم النطاق غير متاح')
        }
      } catch {
        setCheckStatus('unavailable')
        setCheckMessage('تعذر التحقق من توفر النطاق')
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [subdomain, storefrontId])

  // 3. Save All Builder Settings
  const handleSaveAll = async () => {
    if (!canEditSettings || saving) return

    const cleanSub = subdomain.trim().toLowerCase()
    if (!cleanSub || cleanSub.length < 3) {
      toast.error(isAr ? 'يرجى اختيار اسم نطاق فرعي صالح لا يقل عن 3 أحرف' : 'Please enter a valid subdomain with at least 3 characters')
      setActiveTab('domain')
      return
    }

    if (checkStatus === 'unavailable') {
      toast.error(isAr ? 'اسم النطاق غير متاح، يرجى اختيار اسم آخر' : 'Subdomain is unavailable, please choose another')
      setActiveTab('domain')
      return
    }

    setSaving(true)
    try {
      const payload = {
        subdomain: cleanSub,
        store_name: storeName.trim(),
        is_active: isActive,
        business_type: businessType,
        bio: bio.trim(),
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
        theme_config: themeConfig,
        contact_buttons: contactButtons,
        sections_order: sectionsOrder,
        settings: settings,
      }

      const res = await fetch('/api/storefront', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error || (isAr ? 'حدث خطأ أثناء حفظ إعدادات المتجر' : 'Failed to save bio link settings'))
        return
      }

      if (data.storefront) {
        setStorefrontId(data.storefront.id)
      }
      setCheckStatus('current')
      toast.success(isAr ? 'تم حفظ كافة إعدادات وتصاميم البايو لينك بنجاح!' : 'Bio Link settings and design saved successfully!')
    } catch (err) {
      console.error('[StoreSettings] Save error:', err)
      toast.error(isAr ? 'فشل الاتصال بالخادم' : 'Server connection failed')
    } finally {
      setSaving(false)
    }
  }

  const fullStoreUrl = subdomain ? `https://${subdomain.toLowerCase()}.${rootDomain}` : ''
  const copyStoreUrl = () => {
    if (!fullStoreUrl) return
    navigator.clipboard.writeText(fullStoreUrl)
    toast.success(isAr ? 'تم نسخ رابط المتجر إلى الحافظة' : 'Link copied to clipboard')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SettingsPanelHead
          title={isAr ? 'منشئ البايو لينك (Bio Link Studio)' : 'Bio Link Studio'}
          description={isAr ? 'تخصيص الهوية البصرية، الروابط، وأزرار التواصل' : 'Customize your bio page, links, themes and contact buttons'}
        />
        <div className="flex items-center justify-center p-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>{isAr ? 'منشئ البايو لينك (Bio Link Studio)' : 'Bio Link Studio'}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAr
              ? 'خصص صفحة البايو لينك والروابط الخاصة بك بالكامل — الألوان، الصور، الأيقونات، والأزرار المخصصة.'
              : 'Fully customize your personal bio page — colors, themes, links, and contact channels.'}
          </p>
        </div>

        {/* Global Save Button */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={!canEditSettings || saving}
            className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5 shadow-md hover:shadow-purple-600/20 font-medium cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات ونشر البايو' : 'Save Changes & Publish')}</span>
          </Button>
        </div>
      </div>

      {/* Main Studio Grid: Left/Center controls, Right mobile preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Section (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Sub-Tabs Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-2xl border border-border/80 overflow-x-auto scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('branding')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'branding'
                  ? 'bg-background text-foreground shadow-xs ring-1 ring-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-purple-500" />
              <span>{isAr ? 'تخصيص البايو لينك والألوان والروابط' : 'Bio Link, Colors & Links'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('domain')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'domain'
                  ? 'bg-background text-foreground shadow-xs ring-1 ring-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>{isAr ? 'النطاق وحالة الصفحة' : 'Domain & Status'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-background text-foreground shadow-xs ring-1 ring-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
              <span>{isAr ? 'التحليلات والزيارات والنقرات' : 'Analytics & Clicks'}</span>
            </button>
          </div>

          {/* Tab 1: Branding, Colors & Links */}
          {activeTab === 'branding' && (
            <Card className="rounded-3xl border-border/80 p-5">
              <BrandingEditor
                storeName={storeName}
                setStoreName={setStoreName}
                businessType={businessType}
                setBusinessType={setBusinessType}
                bio={bio}
                setBio={setBio}
                logoUrl={logoUrl}
                setLogoUrl={setLogoUrl}
                bannerUrl={bannerUrl}
                setBannerUrl={setBannerUrl}
                themeConfig={themeConfig}
                setThemeConfig={setThemeConfig}
                contactButtons={contactButtons}
                setContactButtons={setContactButtons}
                settings={settings}
                setSettings={setSettings}
              />
            </Card>
          )}

          {/* Tab 2: Subdomain & Domain Settings */}
          {activeTab === 'domain' && (
            <Card className="rounded-3xl border-border/80 p-5 space-y-5">
              {/* Store Display Name */}
              <div className="space-y-1.5">
                <Label htmlFor="store-name">{isAr ? 'الاسم المعروض في البايو لينك (Display Name)' : 'Display Name in Bio Link'}</Label>
                <Input
                  id="store-name"
                  placeholder={isAr ? 'مثال: متجر الأناقة أو صانع محتوى' : 'e.g. Elegant Store or Content Creator'}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  disabled={!canEditSettings || saving}
                  className="max-w-md"
                />
              </div>

              {/* Subdomain Input */}
              <div className="space-y-1.5">
                <Label htmlFor="store-subdomain">{isAr ? 'النطاق الفرعي (Subdomain)' : 'Subdomain'}</Label>
                <div className="flex items-center gap-2 max-w-md">
                  <div className="relative flex-1" dir="ltr">
                    <Input
                      id="store-subdomain"
                      placeholder="ahmed-clinic"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      disabled={!canEditSettings || saving}
                      className="font-mono text-sm pl-3 pr-28"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs text-muted-foreground font-mono bg-muted/40 rounded-r-md px-2 border-l border-input">
                      .{rootDomain}
                    </div>
                  </div>
                </div>

                {checkStatus !== 'idle' && (
                  <div className="flex items-center gap-2 text-xs pt-1">
                    {checkStatus === 'checking' && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {checkMessage}
                      </span>
                    )}
                    {checkStatus === 'available' && (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {checkMessage}
                      </span>
                    )}
                    {checkStatus === 'current' && (
                      <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {checkMessage}
                      </span>
                    )}
                    {checkStatus === 'unavailable' && (
                      <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        {checkMessage}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-muted/20 max-w-xl">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">{isAr ? 'تفعيل المتجر للعامة (Active)' : 'Enable Public Bio Link (Active)'}</Label>
                  <p className="text-xs text-muted-foreground">
                    {isAr
                      ? 'عند التفعيل، يمكن للجمهور الدخول وتصفح المتجر وإرسال الطلبات والمواعيد.'
                      : 'When enabled, the public can view your page, click links, and interact.'}
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} disabled={!canEditSettings || saving} />
              </div>

              {/* Direct Storefront URL Box */}
              {subdomain && (
                <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 max-w-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      {isAr ? 'رابط الواجهة الإلكترونية' : 'Live Bio Link URL'}
                    </span>
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {isAr ? 'مباشر ومفعّل' : 'Live & Active'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {isAr ? 'معطّل / صفحة صيانة' : 'Disabled / Offline'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 font-mono text-sm text-emerald-400 border border-slate-800" dir="ltr">
                    <span className="truncate">{fullStoreUrl}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        onClick={copyStoreUrl}
                        title={isAr ? 'نسخ الرابط' : 'Copy Link'}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={fullStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title={isAr ? 'فتح المتجر' : 'Open Store'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Tab 3: Analytics (Traffic & Link Clicks) */}
          {activeTab === 'analytics' && (
            <AnalyticsPanel />
          )}
        </div>

        {/* Live Device Preview (4 Cols) */}
        <div className="lg:col-span-4 sticky top-6">
          <Card className="p-4 rounded-3xl border-border/80 bg-card/60 backdrop-blur-md flex flex-col items-center justify-center">
            <LivePhonePreview
              storeName={storeName}
              subdomain={subdomain}
              businessType={businessType}
              bio={bio}
              logoUrl={logoUrl}
              bannerUrl={bannerUrl}
              themeConfig={themeConfig}
              setThemeConfig={setThemeConfig}
              contactButtons={contactButtons}
              sectionsOrder={sectionsOrder}
              settings={settings}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
