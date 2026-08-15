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
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Edit,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AdminNav } from '../_components/admin-nav'

interface SocialLink {
  platform: string
  url: string
}

interface Partner {
  name: string
  logo_url: string
}

interface SiteSettings {
  id: number
  platform_name: string
  logo_url: string | null
  social_links: SocialLink[]
  partners: Partner[]
  plisio_api_key?: string | null
  plisio_enabled?: boolean
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
  const [settings, setSettings] = useState<SiteSettings>(
    initialSettings || {
      id: 1,
      platform_name: 'MK Whats',
      logo_url: '',
      social_links: [],
      partners: [],
    }
  )

  const [pages, setPages] = useState<ContentPage[]>(initialPages)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Edit Page Modal state
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null)
  const [pageModalOpen, setPageModalOpen] = useState(false)

  // Handlers for Social Links
  const handleAddSocial = () => {
    setSettings({
      ...settings,
      social_links: [...(settings.social_links || []), { platform: 'twitter', url: '' }],
    })
  }

  const handleRemoveSocial = (index: number) => {
    const updated = [...(settings.social_links || [])]
    updated.splice(index, 1)
    setSettings({ ...settings, social_links: updated })
  }

  // Handlers for Partners
  const handleAddPartner = () => {
    setSettings({
      ...settings,
      partners: [...(settings.partners || []), { name: '', logo_url: '' }],
    })
  }

  const handleRemovePartner = (index: number) => {
    const updated = [...(settings.partners || [])]
    updated.splice(index, 1)
    setSettings({ ...settings, partners: updated })
  }

  // Submit Site Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'فشل حفظ إعدادات الموقع')
        return
      }

      setSettings(data.settings)
      setSuccessMsg('تم حفظ إعدادات الهوية والشركاء بنجاح')
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <AdminNav />

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Globe className="h-6 w-6 text-indigo-400" /> {t('title')}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
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

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-slate-900 border border-slate-800 p-1">
            <TabsTrigger value="general" className="data-[state=active]:bg-slate-800 text-xs gap-2">
              <Globe className="h-4 w-4" /> {t('tabGeneral')}
            </TabsTrigger>
            <TabsTrigger value="pages" className="data-[state=active]:bg-slate-800 text-xs gap-2">
              <FileText className="h-4 w-4" /> {t('tabPages')} ({pages.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: General Branding & Partners */}
          <TabsContent value="general" className="mt-4">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <Card className="bg-slate-900 border-slate-800 text-slate-100">
                <CardHeader>
                  <CardTitle className="text-base font-bold">{t('generalHeader')}</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    {t('generalDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">{t('platformName')}</Label>
                      <Input
                        value={settings.platform_name}
                        onChange={(e) =>
                          setSettings({ ...settings, platform_name: e.target.value })
                        }
                        className="bg-slate-950 border-slate-800 text-slate-100 text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">{t('logoUrl')}</Label>
                      <Input
                        value={settings.logo_url || ''}
                        onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                        placeholder="https://example.com/logo.png"
                        className="bg-slate-950 border-slate-800 text-slate-100 text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plisio Payment Gateway Settings */}
              <Card className="bg-slate-900 border-slate-800 text-slate-100">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <span className="text-amber-400">🪙</span> {t('cryptoHeader')}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      {t('cryptoDesc')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300">
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
                    <Label className="text-xs text-slate-300">Plisio Secret API Key</Label>
                    <Input
                      type="password"
                      value={settings.plisio_api_key || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, plisio_api_key: e.target.value })
                      }
                      placeholder="Enter Plisio Secret API Key"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-sm font-mono"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="bg-slate-900 border-slate-800 text-slate-100">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">{t('socialHeader')}</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      {t('socialDesc')}
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddSocial}
                    variant="outline"
                    size="sm"
                    className="border-slate-800 text-slate-300 text-xs gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> {t('addSocial')}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(settings.social_links || []).map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={link.platform}
                        onChange={(e) => {
                          const updated = [...settings.social_links]
                          updated[idx].platform = e.target.value
                          setSettings({ ...settings, social_links: updated })
                        }}
                        placeholder="Platform (e.g. twitter, facebook)"
                        className="w-1/3 bg-slate-950 border-slate-800 text-slate-100 text-xs"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => {
                          const updated = [...settings.social_links]
                          updated[idx].url = e.target.value
                          setSettings({ ...settings, social_links: updated })
                        }}
                        placeholder="URL (https://...)"
                        className="w-2/3 bg-slate-950 border-slate-800 text-slate-100 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSocial(idx)}
                        className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Partners Marquee Bar */}
              <Card className="bg-slate-900 border-slate-800 text-slate-100">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">{t('partnersHeader')}</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      {t('partnersDesc')}
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddPartner}
                    variant="outline"
                    size="sm"
                    className="border-slate-800 text-slate-300 text-xs gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> {t('addPartner')}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(settings.partners || []).map((partner, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={partner.name}
                        onChange={(e) => {
                          const updated = [...settings.partners]
                          updated[idx].name = e.target.value
                          setSettings({ ...settings, partners: updated })
                        }}
                        placeholder="Shopify / WooCommerce..."
                        className="w-1/3 bg-slate-950 border-slate-800 text-slate-100 text-xs"
                      />
                      <Input
                        value={partner.logo_url}
                        onChange={(e) => {
                          const updated = [...settings.partners]
                          updated[idx].logo_url = e.target.value
                          setSettings({ ...settings, partners: updated })
                        }}
                        placeholder="https://..."
                        className="w-2/3 bg-slate-950 border-slate-800 text-slate-100 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePartner(idx)}
                        className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
          </TabsContent>

          {/* Tab 2: Content Pages Manager */}
          <TabsContent value="pages" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pages.map((p) => (
                <Card key={p.id} className="bg-slate-900 border-slate-800 text-slate-100">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold">{p.title}</CardTitle>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${
                          p.is_published
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {p.is_published ? t('published') : t('draft')}
                      </span>
                    </div>
                    <CardDescription className="text-xs text-slate-400 font-mono">
                      /p/{p.slug}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex items-center justify-between border-t border-slate-800/60 mt-2 pt-3">
                    <a
                      href={`/p/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> /p/{p.slug}
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingPage(p)
                        setPageModalOpen(true)
                      }}
                      className="text-xs text-slate-300 hover:text-white gap-1 h-7 border border-slate-800"
                    >
                      <Edit className="h-3 w-3" /> {t('editPage')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Page Modal */}
      {editingPage && (
        <Dialog open={pageModalOpen} onOpenChange={setPageModalOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('editPage')}: {editingPage.title}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSavePage} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">عنوان الصفحة</Label>
                <Input
                  value={editingPage.title}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, title: e.target.value })
                  }
                  className="bg-slate-950 border-slate-800 text-slate-100 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">المحتوى (HTML / Markdown)</Label>
                <Textarea
                  value={editingPage.content_html}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, content_html: e.target.value })
                  }
                  rows={10}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingPage.is_published}
                    onCheckedChange={(checked) =>
                      setEditingPage({ ...editingPage, is_published: checked })
                    }
                  />
                  <Label className="text-xs text-slate-300">نشر الصفحة للعامة</Label>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPageModalOpen(false)}
                  className="text-xs text-slate-400"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  حفظ التعديلات
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
