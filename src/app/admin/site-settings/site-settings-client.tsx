'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Globe,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Edit,
  Headphones,
  MessageCircle,
  Send,
  Mail,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

interface SiteSettings {
  id: number
  platform_name: string
  platform_name_ar?: string
  platform_name_en?: string
  logo_url: string | null
  favicon_url?: string | null
  support_whatsapp?: string
  support_telegram?: string
  support_email?: string
  user_panel_support_enabled?: {
    whatsapp: boolean
    telegram: boolean
    email: boolean
  }
  support_floating_enabled?: {
    whatsapp: boolean
    telegram: boolean
    email: boolean
  }
  plisio_api_key?: string | null
  plisio_enabled?: boolean
  stripe_enabled?: boolean
  stripe_publishable_key?: string | null
  stripe_secret_key?: string | null
  stripe_webhook_secret?: string | null
  google_auth_enabled?: boolean
  google_client_id?: string | null
  google_client_secret?: string | null
}

interface ContentPage {
  id: string
  slug: string
  title: string
  content_html: string
  is_published: boolean
  updated_at: string
}

interface SiteSettingsClientProps {
  initialSettings: SiteSettings | null
  initialPages: ContentPage[]
}

export function SiteSettingsClient({
  initialSettings,
  initialPages,
}: SiteSettingsClientProps) {
  const t = useTranslations('Admin.siteSettings')
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [settings, setSettings] = useState<SiteSettings>(() => {
    return {
      id: initialSettings?.id || 1,
      ...initialSettings,
      platform_name: initialSettings?.platform_name || '',
      platform_name_ar: initialSettings?.platform_name_ar || (initialSettings?.platform_name?.match(/[\u0600-\u06FF]/) ? initialSettings.platform_name : '') || '',
      platform_name_en: initialSettings?.platform_name_en || (!initialSettings?.platform_name?.match(/[\u0600-\u06FF]/) ? initialSettings?.platform_name : '') || '',
      logo_url: initialSettings?.logo_url || '',
      favicon_url: initialSettings?.favicon_url || '',
      support_whatsapp: initialSettings?.support_whatsapp || '',
      support_telegram: initialSettings?.support_telegram || '',
      support_email: initialSettings?.support_email || '',
      user_panel_support_enabled: initialSettings?.user_panel_support_enabled || {
        whatsapp: false,
        telegram: false,
        email: false,
      },
      support_floating_enabled: initialSettings?.support_floating_enabled || {
        whatsapp: false,
        telegram: false,
        email: false,
      },
    }
  })

  const [pages, setPages] = useState<ContentPage[]>(initialPages)
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleFaviconUpload = async (file: File) => {
    try {
      setUploadingFavicon(true)
      setErrorMsg(null)
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        setErrorMsg(data.error || (isAr ? 'فشل رفع أيقونة المتصفح' : 'Failed to upload favicon'))
        return
      }

      setSettings((prev) => ({ ...prev, favicon_url: data.url }))
      setSuccessMsg(isAr ? 'تم رفع أيقونة المتصفح بنجاح! تذكّر حفظ التغييرات 💾' : 'Favicon uploaded successfully! Remember to save changes 💾')
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? 'حدث خطأ أثناء رفع الأيقونة' : 'Error uploading favicon'))
    } finally {
      setUploadingFavicon(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingLogo(true)
      setErrorMsg(null)
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        setErrorMsg(data.error || (isAr ? 'فشل رفع صورة الشعار' : 'Failed to upload logo'))
        return
      }

      if (data.url) {
        setSettings((prev) => ({ ...prev, logo_url: data.url }))
        setSuccessMsg(isAr ? 'تم رفع الشعار بنجاح! 🖼️' : 'Logo uploaded successfully! 🖼️')
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? 'حدث خطأ أثناء رفع الشعار' : 'Error uploading logo'))
    } finally {
      setUploadingLogo(false)
    }
  }

  // Edit Page Modal state
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null)
  const [pageModalOpen, setPageModalOpen] = useState(false)


  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      let data: any = {}
      try {
        data = await res.json()
      } catch {
        // Empty body — treat as success if 2xx
      }

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'فشل حفظ إعدادات الموقع')
        return
      }

      // Update local state if fresh settings returned
      if (data.settings) {
        setSettings((prev) => {
          const merged = { ...prev, ...data.settings }
          try {
            localStorage.setItem('mk_site_settings', JSON.stringify(merged))
          } catch {}
          return merged
        })
      } else {
        try {
          localStorage.setItem('mk_site_settings', JSON.stringify(settings))
        } catch {}
      }
      setSuccessMsg('تم حفظ إعدادات الموقع وبوابات الدفع بنجاح 🎉')
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setLoading(false)
    }
  }

  // Submit Content Page Update
  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPage) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/content-pages/${editingPage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPage),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'فشل تعديل الصفحة')
        return
      }

      setPages(pages.map((p) => (p.id === editingPage.id ? data.page : p)))
      setPageModalOpen(false)
      setEditingPage(null)
      setSuccessMsg('تم حفظ الصفحة بنجاح')
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ الصفحة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-indigo-500 shrink-0" /> {t('title')}
          </h1>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {t('description')}
          </p>
        </div>

        {successMsg && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
              <Card className="bg-card border-border text-card-foreground shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold">{t('generalHeader')}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    {t('generalDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {/* Platform Name Bilingual Inputs */}
                    <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                      <Label className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Globe className="h-4 w-4 text-emerald-500" />
                        {isAr ? 'اسم المنصة (Platform Name)' : 'Platform Name'}
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-amber-500 flex items-center gap-1">🇸🇦 العربية</span>
                          <Input
                            value={settings.platform_name_ar || ''}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                platform_name_ar: e.target.value,
                                platform_name: e.target.value || settings.platform_name_en || '',
                              })
                            }
                            placeholder="أدخل اسم المنصة بالعربية..."
                            className="bg-background text-sm font-bold"
                            dir="rtl"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-sky-500 flex items-center gap-1">🇬🇧 English</span>
                          <Input
                            value={settings.platform_name_en || ''}
                            onChange={(e) =>
                              setSettings({ ...settings, platform_name_en: e.target.value })
                            }
                            placeholder="Enter platform name in English..."
                            className="bg-background text-sm font-bold"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo Section (URL or Device Upload) */}
                    <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-emerald-500" />
                          {isAr ? 'شعار المنصة (Logo)' : 'Platform Logo'}
                        </Label>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {isAr ? 'رابط مباشر أو رفع من الجهاز' : 'URL or File Upload'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        {/* Image Preview Box */}
                        <div className="sm:col-span-3 flex items-center justify-center p-2 rounded-xl border border-border bg-background h-24 relative overflow-hidden group shadow-inner">
                          {settings.logo_url ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                              <img
                                src={settings.logo_url}
                                alt="Logo Preview"
                                className="max-h-full max-w-full object-contain p-1"
                              />
                              <button
                                type="button"
                                onClick={() => setSettings({ ...settings, logo_url: '' })}
                                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-rose-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-md"
                                title={isAr ? 'حذف الشعار' : 'Remove logo'}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground space-y-1">
                              <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground/40" />
                              <p className="text-[10px] font-bold">{isAr ? 'لا يوجد شعار' : 'No Logo'}</p>
                            </div>
                          )}
                        </div>

                        {/* URL Input & File Upload Button */}
                        <div className="sm:col-span-9 space-y-2">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Input
                              value={settings.logo_url || ''}
                              onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                              placeholder="https://example.com/logo.png"
                              className="bg-background text-xs font-mono flex-1 h-9"
                            />
                            <div className="relative">
                              <input
                                id="logo-file-input"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleFileUpload(file)
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploadingLogo}
                                onClick={() => {
                                  document.getElementById('logo-file-input')?.click()
                                }}
                                className="w-full sm:w-auto border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold gap-1.5 h-9 shrink-0"
                              >
                                {uploadingLogo ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                                {isAr ? 'رفع من الجهاز 📁' : 'Upload File 📁'}
                              </Button>
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {isAr
                              ? 'يمكنك وضع رابط مباشر لصورة الشعار (PNG / SVG / JPG) أو الضغط على "رفع من الجهاز" لتحديد صورة من حاسوبك أو هاتفك وسيتم رفعها وحفظها تلقائياً.'
                              : 'Enter direct image URL or click "Upload File" to select an image from your device.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Favicon Section (Browser Tab Icon & Preview) */}
                    <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-2">
                          <Globe className="h-4 w-4 text-indigo-500" />
                          {isAr ? 'أيقونة تبويب المتصفح (Favicon / Browser Tab Icon)' : 'Browser Tab Favicon'}
                        </Label>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {isAr ? 'تظهر في أعلى المتصفح والمفضلة' : 'Appears in browser tab & bookmarks'}
                        </span>
                      </div>

                      {/* Mini Browser Tab Simulation Preview */}
                      <div className="p-3 rounded-xl border border-border/80 bg-background/60 shadow-sm space-y-2">
                        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                          {isAr ? '🔍 معاينة حية لشكل التبويب في المتصفح:' : '🔍 Live Browser Tab Preview:'}
                        </span>
                        <div className="flex items-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-t-lg bg-card border border-b-0 border-border text-xs font-medium text-foreground shadow-sm max-w-[260px]">
                            {/* Favicon or fallback */}
                            {settings.favicon_url ? (
                              <img
                                src={settings.favicon_url}
                                alt="Favicon"
                                className="h-4 w-4 object-contain rounded shrink-0"
                              />
                            ) : (
                              <div className="h-4 w-4 rounded bg-purple-600 flex items-center justify-center shrink-0">
                                <svg
                                  className="h-2.5 w-2.5 text-white"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                              </div>
                            )}
                            <span className="truncate text-xs font-semibold">
                              {settings.platform_name_ar || settings.platform_name_en || settings.platform_name || 'mkwacrm'}
                            </span>
                            <span className="text-muted-foreground/60 text-[10px] ml-auto shrink-0 hover:text-foreground cursor-default">✕</span>
                          </div>
                          <div className="flex-1 border-b border-border h-[29px]" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        {/* Favicon Preview Box */}
                        <div className="sm:col-span-3 flex items-center justify-center p-2 rounded-xl border border-border bg-background h-24 relative overflow-hidden group shadow-inner">
                          {settings.favicon_url ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                              <img
                                src={settings.favicon_url}
                                alt="Favicon Preview"
                                className="max-h-12 max-w-12 object-contain p-1 rounded-md"
                              />
                              <button
                                type="button"
                                onClick={() => setSettings({ ...settings, favicon_url: '' })}
                                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-rose-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-md"
                                title={isAr ? 'حذف الأيقونة والعودة للافتراضي' : 'Reset to default icon'}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground space-y-1">
                              <div className="h-8 w-8 rounded-lg bg-purple-600/20 border border-purple-500/30 mx-auto flex items-center justify-center text-purple-400 font-bold text-xs">
                                💬
                              </div>
                              <p className="text-[10px] font-bold">{isAr ? 'الأيقونة الافتراضية' : 'Default Icon'}</p>
                            </div>
                          )}
                        </div>

                        {/* URL Input & File Upload Button */}
                        <div className="sm:col-span-9 space-y-2">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Input
                              value={settings.favicon_url || ''}
                              onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                              placeholder="https://example.com/favicon.ico or png"
                              className="bg-background text-xs font-mono flex-1 h-9"
                            />
                            <div className="relative">
                              <input
                                id="favicon-file-input"
                                type="file"
                                accept="image/x-icon,image/png,image/svg+xml,image/jpeg,image/webp,.ico"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleFaviconUpload(file)
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploadingFavicon}
                                onClick={() => {
                                  document.getElementById('favicon-file-input')?.click()
                                }}
                                className="w-full sm:w-auto border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 text-xs font-bold gap-1.5 h-9 shrink-0"
                              >
                                {uploadingFavicon ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                                {isAr ? 'رفع الأيقونة 📁' : 'Upload Favicon 📁'}
                              </Button>
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {isAr
                              ? 'صورة مربعة صغيرة (32x32 أو 64x64 بكسل بصيغة ICO أو PNG أو SVG). تظهر في تبويب المتصفح وشريط العناوين.'
                              : 'Square icon (32x32 or 64x64 px in ICO, PNG, or SVG format) that appears in browser tabs.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plisio Payment Gateway Settings */}
              <Card className="bg-card border-border text-card-foreground shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <span className="text-amber-500">🪙</span> {t('cryptoHeader')}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {t('cryptoDesc')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {t('enableCrypto')}
                    </span>
                    <Switch
                      checked={Boolean(settings.plisio_enabled)}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, plisio_enabled: checked })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Plisio Secret API Key</Label>
                    <Input
                      type="password"
                      value={settings.plisio_api_key || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, plisio_api_key: e.target.value })
                      }
                      placeholder="Enter Plisio Secret API Key"
                      className="bg-background border-border text-foreground text-sm font-mono"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Stripe Payment Gateway Card */}
              <Card className="bg-card border-indigo-500/30 text-card-foreground shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                      <span className="text-lg">💳</span> {isAr ? 'بوابة الدفع الدولي للبطاقات Stripe (Visa / Mastercard)' : 'Stripe International Card Payment Gateway (Visa / Mastercard)'}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {isAr ? 'أدخل مفاتيح Stripe لتمكين العملاء والشركات من الدفع ببطاقات الفيزا والماستركارد والترقية التلقائية الفورية للباقات.' : 'Enter Stripe keys to allow clients and accounts to pay with Visa/Mastercard credit cards with instant automated plan upgrades.'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-foreground">
                      {isAr ? 'تفعيل Stripe' : 'Enable Stripe'}
                    </span>
                    <Switch
                      checked={Boolean(settings.stripe_enabled)}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, stripe_enabled: checked })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Stripe Publishable Key</Label>
                      <Input
                        value={settings.stripe_publishable_key || ''}
                        onChange={(e) =>
                          setSettings({ ...settings, stripe_publishable_key: e.target.value })
                        }
                        placeholder="pk_live_... / pk_test_..."
                        className="bg-background border-border text-foreground text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Stripe Secret Key</Label>
                      <Input
                        type="password"
                        value={settings.stripe_secret_key || ''}
                        onChange={(e) =>
                          setSettings({ ...settings, stripe_secret_key: e.target.value })
                        }
                        placeholder="sk_live_... / sk_test_..."
                        className="bg-background border-border text-foreground text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-xs font-bold text-foreground">Stripe Webhook Secret</Label>
                      <Input
                        type="password"
                        value={settings.stripe_webhook_secret || ''}
                        onChange={(e) =>
                          setSettings({ ...settings, stripe_webhook_secret: e.target.value })
                        }
                        placeholder="whsec_..."
                        className="bg-background border-border text-foreground text-sm font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Google OAuth Settings Card */}
              <Card className="bg-card border-emerald-500/30 text-card-foreground shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-500 dark:text-emerald-400">
                      <span className="text-lg">🔑</span> {isAr ? 'إعدادات تسجيل الدخول والإنشاء عبر Google (OAuth)' : 'Google Single Sign-On & Signup Settings (OAuth)'}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {isAr ? 'أدخل معرف العميل (Client ID) والرمز السري (Client Secret) لتمكين الزوار من تسجيل الدخول وإنشاء حسابات جديدة بضغطة زر واحدة عبر Google.' : 'Enter Google Client ID & Client Secret to allow visitors to login and register new accounts with 1-click via Google.'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-foreground">
                      {isAr ? 'تفعيل Google Auth' : 'Enable Google Auth'}
                    </span>
                    <Switch
                      checked={Boolean(settings.google_auth_enabled)}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, google_auth_enabled: checked })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Google Client ID</Label>
                      <Input
                        value={settings.google_client_id || ''}
                        onChange={(e) =>
                          setSettings({ ...settings, google_client_id: e.target.value })
                        }
                        placeholder="e.g. 1234567890-xxx.apps.googleusercontent.com"
                        className="bg-background border-border text-foreground text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Google Client Secret</Label>
                      <Input
                        type="password"
                        value={settings.google_client_secret || ''}
                        onChange={(e) =>
                          setSettings({ ...settings, google_client_secret: e.target.value })
                        }
                        placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
                        className="bg-background border-border text-foreground text-sm font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support Channels Control Card (Landing Page Floating & User Panel) */}
              <Card className="bg-card border-emerald-500/30 text-card-foreground shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-500 dark:text-emerald-400">
                    <Headphones className="h-5 w-5" />
                    {isAr
                      ? 'إعدادات قنوات الدعم المباشر (صفحة الهبوط ولوحة المستخدم)'
                      : 'Live Support Channels Settings (Landing Page & User Panel)'}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    {isAr
                      ? 'التحكم بإظهار أو إخفاء قنوات الدعم الخارجي (الواتساب، التلغرام، البريد) في الزر العائم لصفحة الهبوط (Live Support) وأيضاً داخل مركز الدعم للوحة المستخدمين.'
                      : 'Control which external support channels (WhatsApp, Telegram, Email) are visible in the Landing Page floating widget and in the User Support Panel.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* WhatsApp */}
                    <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-emerald-500/20">
                        <span className="text-xs font-black flex items-center gap-1.5 text-emerald-500">
                          <MessageCircle className="h-4 w-4" />
                          {isAr ? 'دعم الواتساب' : 'WhatsApp'}
                        </span>
                      </div>

                      {/* Toggles */}
                      <div className="space-y-2 bg-background/50 p-2.5 rounded-lg border border-emerald-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-foreground flex items-center gap-1">
                            🌐 {isAr ? 'الزر العائم بصفحة الهبوط' : 'Landing Floating Button'}
                          </span>
                          <Switch
                            checked={Boolean(settings.support_floating_enabled?.whatsapp)}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                support_floating_enabled: {
                                  ...(settings.support_floating_enabled || { whatsapp: false, telegram: false, email: false }),
                                  whatsapp: checked,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-foreground flex items-center gap-1">
                            👤 {isAr ? 'لوحة تحكم المستخدم' : 'User Panel Support'}
                          </span>
                          <Switch
                            checked={Boolean(settings.user_panel_support_enabled?.whatsapp)}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                user_panel_support_enabled: {
                                  ...(settings.user_panel_support_enabled || { whatsapp: false, telegram: false, email: false }),
                                  whatsapp: checked,
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground">
                          {isAr ? 'رقم الواتساب' : 'WhatsApp Phone Number'}
                        </Label>
                        <Input
                          value={settings.support_whatsapp || ''}
                          onChange={(e) => setSettings({ ...settings, support_whatsapp: e.target.value })}
                          placeholder="+966500000000"
                          className="bg-background text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Telegram */}
                    <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-sky-500/20">
                        <span className="text-xs font-black flex items-center gap-1.5 text-sky-500">
                          <Send className="h-4 w-4" />
                          {isAr ? 'دعم التلغرام' : 'Telegram'}
                        </span>
                      </div>

                      {/* Toggles */}
                      <div className="space-y-2 bg-background/50 p-2.5 rounded-lg border border-sky-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-foreground flex items-center gap-1">
                            🌐 {isAr ? 'الزر العائم بصفحة الهبوط' : 'Landing Floating Button'}
                          </span>
                          <Switch
                            checked={Boolean(settings.support_floating_enabled?.telegram)}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                support_floating_enabled: {
                                  ...(settings.support_floating_enabled || { whatsapp: false, telegram: false, email: false }),
                                  telegram: checked,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-foreground flex items-center gap-1">
                            👤 {isAr ? 'لوحة تحكم المستخدم' : 'User Panel Support'}
                          </span>
                          <Switch
                            checked={Boolean(settings.user_panel_support_enabled?.telegram)}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                user_panel_support_enabled: {
                                  ...(settings.user_panel_support_enabled || { whatsapp: false, telegram: false, email: false }),
                                  telegram: checked,
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground">
                          {isAr ? 'معرف التلغرام' : 'Telegram Username/Link'}
                        </Label>
                        <Input
                          value={settings.support_telegram || ''}
                          onChange={(e) => setSettings({ ...settings, support_telegram: e.target.value })}
                          placeholder="mkwhats_support"
                          className="bg-background text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-purple-500/20">
                        <span className="text-xs font-black flex items-center gap-1.5 text-purple-500">
                          <Mail className="h-4 w-4" />
                          {isAr ? 'دعم البريد' : 'Email'}
                        </span>
                      </div>

                      {/* Toggles */}
                      <div className="space-y-2 bg-background/50 p-2.5 rounded-lg border border-purple-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-foreground flex items-center gap-1">
                            🌐 {isAr ? 'الزر العائم بصفحة الهبوط' : 'Landing Floating Button'}
                          </span>
                          <Switch
                            checked={Boolean(settings.support_floating_enabled?.email)}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                support_floating_enabled: {
                                  ...(settings.support_floating_enabled || { whatsapp: false, telegram: false, email: false }),
                                  email: checked,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-foreground flex items-center gap-1">
                            👤 {isAr ? 'لوحة تحكم المستخدم' : 'User Panel Support'}
                          </span>
                          <Switch
                            checked={Boolean(settings.user_panel_support_enabled?.email)}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                user_panel_support_enabled: {
                                  ...(settings.user_panel_support_enabled || { whatsapp: false, telegram: false, email: false }),
                                  email: checked,
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground">
                          {isAr ? 'البريد الإلكتروني' : 'Support Email Address'}
                        </Label>
                        <Input
                          value={settings.support_email || ''}
                          onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                          placeholder="support@mkwhats.com"
                          className="bg-background text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

<div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-2 px-6 py-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t('saveAll')}
                </Button>
              </div>
            </form>
    </div>
  )
}
