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
        body: JSON.stringify({
          title: editingPage.title,
          content_html: editingPage.content_html,
          is_published: editingPage.is_published,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        alert(data.error || 'فشل حفظ الصفحة')
        return
      }

      setPages((prev) => prev.map((p) => (p.id === data.page.id ? data.page : p)))
      setPageModalOpen(false)
    } catch (err: any) {
      alert(err.message || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 dir-rtl max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Globe className="h-6 w-6 text-indigo-400" /> إعدادات الموقع والصفحات العامة
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          إدارة اسم المنصة، الشعار، روابط التواصل، شركاء النجاح، والصفحات الثابتة العامة.
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
            <Globe className="h-4 w-4" /> الهوية والشركاء
          </TabsTrigger>
          <TabsTrigger value="pages" className="data-[state=active]:bg-slate-800 text-xs gap-2">
            <FileText className="h-4 w-4" /> الصفحات الثابتة ({pages.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: General Branding & Partners */}
        <TabsContent value="general" className="mt-4">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-bold">معلومات الهوية العامة</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  تظهر هذه البيانات في الهيدر والفوتر والصفحة الرئيسية العامة.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">اسم المنصة (Platform Name)</Label>
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
                    <Label className="text-xs text-slate-300">رابط الشعار (Logo Image URL)</Label>
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

            {/* Social Links */}
            <Card className="bg-slate-900 border-slate-800 text-slate-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">روابط منصات التواصل الاجتماعي</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    تظهر في الفوتر الخاص باللاندنك بيج والصفحات العامة.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={handleAddSocial}
                  variant="outline"
                  size="sm"
                  className="border-slate-800 text-slate-300 text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> إضافة منصة
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
                      placeholder="اسم المنصة (مثال: x, facebook)"
                      className="w-1/3 bg-slate-950 border-slate-800 text-slate-100 text-xs"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => {
                        const updated = [...settings.social_links]
                        updated[idx].url = e.target.value
                        setSettings({ ...settings, social_links: updated })
                      }}
                      placeholder="رابط الحساب (https://...)"
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
                {(!settings.social_links || settings.social_links.length === 0) && (
                  <p className="text-xs text-slate-500 text-center py-2">
                    لم يتم إضافة أي حسابات تواصل بعد.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Partners Logos */}
            <Card className="bg-slate-900 border-slate-800 text-slate-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">شريط شركاء النجاح (Partners Marquee)</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    الشعارات التي تتحرك أوتوماتيكياً في الصفحة الرئيسية.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={handleAddPartner}
                  variant="outline"
                  size="sm"
                  className="border-slate-800 text-slate-300 text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> إضافة شريك
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
                      placeholder="اسم الشريك (مثال: Shopify)"
                      className="w-1/3 bg-slate-950 border-slate-800 text-slate-100 text-xs"
                    />
                    <Input
                      value={partner.logo_url}
                      onChange={(e) => {
                        const updated = [...settings.partners]
                        updated[idx].logo_url = e.target.value
                        setSettings({ ...settings, partners: updated })
                      }}
                      placeholder="رابط الشعار أو الصورة (/partners/...) "
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
                حفظ كافة التغييرات
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
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {p.is_published ? 'منشورة' : 'مسودة'}
                    </span>
                  </div>
                  <CardDescription className="text-xs font-mono text-indigo-400">
                    /p/{p.slug}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <span className="text-[11px] text-slate-500">
                    آخر تحديث: {new Date(p.updated_at).toLocaleDateString('ar-EG')}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/p/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> معاينة
                    </a>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setEditingPage(p)
                        setPageModalOpen(true)
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs gap-1"
                    >
                      <Edit className="h-3.5 w-3.5" /> تعديل المحتوى
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Content Page Modal */}
      {editingPage && (
        <Dialog open={pageModalOpen} onOpenChange={setPageModalOpen}>
          <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-800 text-slate-100 dir-rtl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-right">
              <DialogTitle className="text-lg font-semibold text-slate-100">
                تعديل صفحة: {editingPage.title} ({editingPage.slug})
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSavePage} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">عنوان الصفحة</Label>
                <Input
                  value={editingPage.title}
                  onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">محتوى الصفحة (HTML / Markdown)</Label>
                <Textarea
                  rows={12}
                  value={editingPage.content_html}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, content_html: e.target.value })
                  }
                  className="bg-slate-950 border-slate-800 text-slate-100 font-mono text-xs leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-slate-800/80 p-3">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium text-slate-200">حالة النشر العامة</Label>
                  <p className="text-[11px] text-slate-400">
                    الصفحات المنشورة فقط تظهر للزوار في الفوتر والروابط العامة
                  </p>
                </div>
                <Switch
                  checked={editingPage.is_published}
                  onCheckedChange={(checked) =>
                    setEditingPage({ ...editingPage, is_published: checked })
                  }
                />
              </div>

              <DialogFooter className="pt-3 border-t border-slate-800 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPageModalOpen(false)}
                  className="border border-slate-800 text-slate-400 hover:bg-slate-800 text-xs"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  حفظ الصفحة
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
