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
  FileText,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Info,
  PhoneCall,
  Globe,
  RefreshCw,
} from 'lucide-react'
import { useLocale } from 'next-intl'
import Link from 'next/link'

export interface ContentPage {
  id: string
  slug: string
  title: string
  title_en?: string
  content_html: string
  content_html_en?: string
  is_published: boolean
  updated_at: string
}

interface PagesClientProps {
  initialPages: ContentPage[]
}

const PAGE_TEMPLATES_AR: Record<string, { title: string; html: string }> = {
  'privacy-policy': {
    title: 'سياسة الخصوصية',
    html: `<h2>سياسة الخصوصية</h2><p>نحن نلتزم بحماية خصوصية بياناتك ومعلومات حسابك في MK Whats.</p><h3>1. جمع البيانات</h3><p>نجمع المعلومات الضرورية فقط لتقديم خدمة أتمتة الواتساب.</p>`,
  },
  'terms-and-conditions': {
    title: 'الشروط والأحكام',
    html: `<h2>الشروط والأحكام</h2><p>باستخدامك لمنصتنا، فإنك موافق على شروط الاستخدام والاستخدام العادل.</p>`,
  },
  'about-us': {
    title: 'من نحن',
    html: `<h2>عن MK Whats</h2><p>المنصة الأولى لأتمتة وتسويق المحادثات عبر الواتساب والذكاء الاصطناعي Gemini AI.</p>`,
  },
  'contact-us': {
    title: 'اتصل بنا',
    html: `<h2>تواصل معنا</h2><p>يسعدنا تلقي استفساراتك على البريد support@mkwhats.com أو الواتساب.</p>`,
  },
}

const PAGE_TEMPLATES_EN: Record<string, { title: string; html: string }> = {
  'privacy-policy': {
    title: 'Privacy Policy',
    html: `<h2>Privacy Policy</h2><p>We are committed to protecting your privacy and personal data at MK Whats.</p><h3>1. Data Collection</h3><p>We collect essential data necessary for providing WhatsApp automation services.</p>`,
  },
  'terms-and-conditions': {
    title: 'Terms & Conditions',
    html: `<h2>Terms & Conditions</h2><p>By using our platform, you agree to comply with our terms of service and fair usage guidelines.</p>`,
  },
  'about-us': {
    title: 'About Us',
    html: `<h2>About MK Whats</h2><p>The #1 WhatsApp automation & Gemini AI marketing platform for e-commerce and businesses.</p>`,
  },
  'contact-us': {
    title: 'Contact Us',
    html: `<h2>Get in Touch</h2><p>Our support team is available 24/7 at support@mkwhats.com or WhatsApp.</p>`,
  },
}

export function PagesClient({ initialPages }: PagesClientProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [pages, setPages] = useState<ContentPage[]>(initialPages)
  const [loading, setLoading] = useState(false)
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const refreshPages = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/content-pages')
      const data = await res.json()
      if (data.pages) {
        setPages(data.pages)
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEdit = (page: ContentPage) => {
    setEditingPage({ ...page })
    setIsModalOpen(true)
  }

  const handleOpenCreate = (templateSlug?: string) => {
    const tmplAr = templateSlug ? PAGE_TEMPLATES_AR[templateSlug] : null
    const tmplEn = templateSlug ? PAGE_TEMPLATES_EN[templateSlug] : null

    setEditingPage({
      id: '',
      slug: templateSlug || 'new-page',
      title: tmplAr?.title || 'صفحة جديدة',
      title_en: tmplEn?.title || 'New Page',
      content_html: tmplAr?.html || '<h2>عنوان الصفحة</h2><p>محتوى الصفحة هنا...</p>',
      content_html_en: tmplEn?.html || '<h2>Page Title</h2><p>Page content here...</p>',
      is_published: true,
      updated_at: new Date().toISOString(),
    })
    setIsModalOpen(true)
  }

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPage) return

    setLoading(true)
    try {
      const isNew = !editingPage.id
      const url = isNew ? '/api/admin/content-pages' : `/api/admin/content-pages/${editingPage.id}`
      const method = isNew ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPage),
      })

      const data = await res.json()

      if (data.page) {
        if (isNew) {
          setPages([...pages, data.page])
        } else {
          setPages(pages.map((p) => (p.id === data.page.id ? data.page : p)))
        }
        setIsModalOpen(false)
        setEditingPage(null)
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePage = async (id: string) => {
    if (!confirm('هل أنت تأكد من رغبتك في حذف هذه الصفحة؟')) return

    try {
      const res = await fetch(`/api/admin/content-pages/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPages(pages.filter((p) => p.id !== id))
      }
    } catch {
      // Ignore
    }
  }

  const getPageBySlugKey = (keywords: string[]) => {
    return pages.find((p) => keywords.some((k) => p.slug.toLowerCase().includes(k)))
  }

  const privacyPage = getPageBySlugKey(['privacy'])
  const termsPage = getPageBySlugKey(['term'])
  const aboutPage = getPageBySlugKey(['about'])
  const contactPage = getPageBySlugKey(['contact'])

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            {isAr ? 'الصفحات والمعلومات العامة' : 'Pages & Information'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {isAr
              ? 'إدارة وتعديل الصفحات التعريفية المعروضة للجمهور باللغتين العربية والإنجليزية.'
              : 'Manage and customize public policy and informational pages in both Arabic & English.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={refreshPages}
            disabled={loading}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 rounded-xl border-border bg-card"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {isAr ? 'تحديث' : 'Refresh'}
          </Button>

          <Button
            onClick={() => handleOpenCreate()}
            size="sm"
            className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs gap-1.5 rounded-xl shadow-lg"
          >
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة صفحة جديدة' : 'Add New Page'}
          </Button>
        </div>
      </div>

      {/* Quick Standard Pages Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Privacy Policy Card */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 hover:border-emerald-500/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {privacyPage ? (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                {privacyPage.is_published ? (isAr ? 'منشورة ✓' : 'Published ✓') : (isAr ? 'مسودة' : 'Draft')}
              </span>
            ) : null}
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">/p/privacy-policy</p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            {privacyPage ? (
              <>
                <Button
                  onClick={() => handleOpenEdit(privacyPage)}
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs gap-1.5 rounded-xl border-border bg-muted/50 font-bold"
                >
                  <Edit className="h-3.5 w-3.5 text-emerald-500" /> {isAr ? 'تعديل النصين (AR / EN)' : 'Edit Both Languages'}
                </Button>
                <Link
                  href={`/p/${privacyPage.slug}`}
                  target="_blank"
                  className="h-8 w-8 rounded-xl border border-border bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="معاينة"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <Button
                onClick={() => handleOpenCreate('privacy-policy')}
                size="sm"
                className="w-full text-xs gap-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 font-bold"
              >
                <Plus className="h-3.5 w-3.5" /> {isAr ? 'إنشاء الصفـحة' : 'Create Page'}
              </Button>
            )}
          </div>
        </div>

        {/* Terms & Conditions Card */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 hover:border-emerald-500/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <FileCheck className="h-5 w-5" />
            </div>
            {termsPage ? (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                {termsPage.is_published ? (isAr ? 'منشورة ✓' : 'Published ✓') : (isAr ? 'مسودة' : 'Draft')}
              </span>
            ) : null}
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">/p/terms-and-conditions</p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            {termsPage ? (
              <>
                <Button
                  onClick={() => handleOpenEdit(termsPage)}
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs gap-1.5 rounded-xl border-border bg-muted/50 font-bold"
                >
                  <Edit className="h-3.5 w-3.5 text-emerald-500" /> {isAr ? 'تعديل النصين (AR / EN)' : 'Edit Both Languages'}
                </Button>
                <Link
                  href={`/p/${termsPage.slug}`}
                  target="_blank"
                  className="h-8 w-8 rounded-xl border border-border bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="معاينة"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <Button
                onClick={() => handleOpenCreate('terms-and-conditions')}
                size="sm"
                className="w-full text-xs gap-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 font-bold"
              >
                <Plus className="h-3.5 w-3.5" /> {isAr ? 'إنشاء الصفـحة' : 'Create Page'}
              </Button>
            )}
          </div>
        </div>

        {/* About Us Card */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 hover:border-emerald-500/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Info className="h-5 w-5" />
            </div>
            {aboutPage ? (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                {aboutPage.is_published ? (isAr ? 'منشورة ✓' : 'Published ✓') : (isAr ? 'مسودة' : 'Draft')}
              </span>
            ) : null}
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">{isAr ? 'من نحن' : 'About Us'}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">/p/about-us</p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            {aboutPage ? (
              <>
                <Button
                  onClick={() => handleOpenEdit(aboutPage)}
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs gap-1.5 rounded-xl border-border bg-muted/50 font-bold"
                >
                  <Edit className="h-3.5 w-3.5 text-emerald-500" /> {isAr ? 'تعديل النصين (AR / EN)' : 'Edit Both Languages'}
                </Button>
                <Link
                  href={`/p/${aboutPage.slug}`}
                  target="_blank"
                  className="h-8 w-8 rounded-xl border border-border bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="معاينة"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <Button
                onClick={() => handleOpenCreate('about-us')}
                size="sm"
                className="w-full text-xs gap-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 font-bold"
              >
                <Plus className="h-3.5 w-3.5" /> {isAr ? 'إنشاء الصفـحة' : 'Create Page'}
              </Button>
            )}
          </div>
        </div>

        {/* Contact Us Card */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 hover:border-emerald-500/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <PhoneCall className="h-5 w-5" />
            </div>
            {contactPage ? (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                {contactPage.is_published ? (isAr ? 'منشورة ✓' : 'Published ✓') : (isAr ? 'مسودة' : 'Draft')}
              </span>
            ) : null}
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">{isAr ? 'اتصل بنا' : 'Contact Us'}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">/p/contact-us</p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            {contactPage ? (
              <>
                <Button
                  onClick={() => handleOpenEdit(contactPage)}
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs gap-1.5 rounded-xl border-border bg-muted/50 font-bold"
                >
                  <Edit className="h-3.5 w-3.5 text-emerald-500" /> {isAr ? 'تعديل النصين (AR / EN)' : 'Edit Both Languages'}
                </Button>
                <Link
                  href={`/p/${contactPage.slug}`}
                  target="_blank"
                  className="h-8 w-8 rounded-xl border border-border bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="معاينة"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <Button
                onClick={() => handleOpenCreate('contact-us')}
                size="sm"
                className="w-full text-xs gap-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 font-bold"
              >
                <Plus className="h-3.5 w-3.5" /> {isAr ? 'إنشاء الصفـحة' : 'Create Page'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* All Content Pages Table Card */}
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-500" />
            {isAr ? 'جميع الصفحات المتاحة' : 'All Content Pages'}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr
              ? 'قائمة بكافة الصفحات التعريفية المنشورة والمحفوظة بالنصين العربي والإنجليزي.'
              : 'Complete directory of static informational pages stored with dual AR / EN content.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
                <tr>
                  <th className="p-4 text-start">{isAr ? 'العنوان بالعربية' : 'Arabic Title'}</th>
                  <th className="p-4 text-start">{isAr ? 'العنوان بالإنجليزية' : 'English Title'}</th>
                  <th className="p-4 text-start">{isAr ? 'الرابط (Slug)' : 'Slug URL'}</th>
                  <th className="p-4 text-start">{isAr ? 'حالة النشر' : 'Status'}</th>
                  <th className="p-4 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pages.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-bold text-foreground">{p.title}</td>
                    <td className="p-4 font-medium text-emerald-400">{p.title_en || '—'}</td>
                    <td className="p-4 font-mono text-muted-foreground">/p/{p.slug}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          p.is_published
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}
                      >
                        {p.is_published ? (isAr ? 'منشورة ✓' : 'Published ✓') : (isAr ? 'مسودة' : 'Draft')}
                      </span>
                    </td>
                    <td className="p-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/p/${p.slug}`}
                          target="_blank"
                          className="h-8 px-2.5 rounded-xl border border-border bg-card flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-[11px] font-medium"
                        >
                          <ExternalLink className="h-3 w-3" /> {isAr ? 'معاينة' : 'Preview'}
                        </Link>

                        <Button
                          onClick={() => handleOpenEdit(p)}
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-[11px] gap-1 rounded-xl border-border bg-card font-bold"
                        >
                          <Edit className="h-3 w-3 text-emerald-500" /> {isAr ? 'تعديل' : 'Edit'}
                        </Button>

                        <Button
                          onClick={() => handleDeletePage(p.id)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                          title="حذف"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit / Create Page Dialog Modal with Dual Language Tabs */}
      {isModalOpen && editingPage && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-3xl bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                {editingPage.id ? (isAr ? 'تعديل الصفحة (عربي وإنجليزي)' : 'Edit Page (Arabic & English)') : (isAr ? 'إنشاء صفحة جديدة' : 'Create New Page')}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSavePage} className="space-y-6 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">
                  {isAr ? 'الرابط الدائم (Slug):' : 'URL Slug:'}
                </Label>
                <Input
                  value={editingPage.slug}
                  onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                  placeholder="privacy-policy"
                  required
                  disabled={Boolean(editingPage.id)}
                  className="rounded-xl border-border bg-background text-xs font-mono"
                />
              </div>

              {/* Dual Language Tabs: Arabic & English */}
              <Tabs defaultValue="ar" className="w-full">
                <TabsList className="grid grid-cols-2 bg-muted/60 p-1 rounded-2xl border border-border">
                  <TabsTrigger value="ar" className="text-xs font-bold rounded-xl gap-2">
                    🇸🇦 {isAr ? 'المحتوى بالعربية (Arabic)' : 'Arabic Content'}
                  </TabsTrigger>
                  <TabsTrigger value="en" className="text-xs font-bold rounded-xl gap-2">
                    🇬🇧 {isAr ? 'المحتوى بالإنجليزية (English)' : 'English Content'}
                  </TabsTrigger>
                </TabsList>

                {/* Arabic Tab Content */}
                <TabsContent value="ar" className="space-y-4 pt-4 dir-rtl">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      عنوان الصفحة (بالعربية 🇸🇦):
                    </Label>
                    <Input
                      value={editingPage.title}
                      onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                      placeholder="مثال: سياسة الخصوصية"
                      required
                      className="rounded-xl border-border bg-background text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      محتوى الصفحة (بالعربية HTML 🇸🇦):
                    </Label>
                    <Textarea
                      value={editingPage.content_html}
                      onChange={(e) => setEditingPage({ ...editingPage, content_html: e.target.value })}
                      placeholder="<h2>عنوان...</h2><p>نص الصفحة...</p>"
                      rows={10}
                      className="rounded-xl border-border bg-background text-xs font-mono leading-relaxed"
                    />
                  </div>
                </TabsContent>

                {/* English Tab Content */}
                <TabsContent value="en" className="space-y-4 pt-4 dir-ltr">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      Page Title (in English 🇬🇧):
                    </Label>
                    <Input
                      value={editingPage.title_en || ''}
                      onChange={(e) => setEditingPage({ ...editingPage, title_en: e.target.value })}
                      placeholder="e.g. Privacy Policy"
                      className="rounded-xl border-border bg-background text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      Page Content (in English HTML 🇬🇧):
                    </Label>
                    <Textarea
                      value={editingPage.content_html_en || ''}
                      onChange={(e) => setEditingPage({ ...editingPage, content_html_en: e.target.value })}
                      placeholder="<h2>Title...</h2><p>Page body...</p>"
                      rows={10}
                      className="rounded-xl border-border bg-background text-xs font-mono leading-relaxed"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3.5 border border-border/60">
                <div>
                  <h4 className="text-xs font-bold text-foreground">{isAr ? 'حالة النشر للمشاهدين:' : 'Publishing Status:'}</h4>
                  <p className="text-[11px] text-muted-foreground">
                    {isAr ? 'تفعيل إظهار الصفحة للزوار على رابط الموقع العام.' : 'Make page visible on the public marketing site.'}
                  </p>
                </div>
                <Switch
                  checked={editingPage.is_published}
                  onCheckedChange={(checked) => setEditingPage({ ...editingPage, is_published: checked })}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs border-border"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 gap-1.5 shadow-md"
                >
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                  {isAr ? 'حفظ النصين (العربي والإنجليزي)' : 'Save Both AR & EN Content'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
