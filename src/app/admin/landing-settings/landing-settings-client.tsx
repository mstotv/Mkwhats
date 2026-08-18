'use client'

import { useState } from 'react'
import {
  Layout,
  Save,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Globe,
  Sparkles,
  HelpCircle,
  Share2,
  Palette,
  Link2,
  Headphones,
  Image as ImageIcon,
  MessageCircle,
  Send,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslations, useLocale } from 'next-intl'

interface SocialLink {
  platform: string
  url: string
}

interface Partner {
  name: string
  logo_url: string
}

interface FAQ {
  id: string
  // Bilingual fields
  question_ar: string
  question_en: string
  answer_ar: string
  answer_en: string
  // Legacy fallback (kept for backward compat)
  question?: string
  answer?: string
}

interface CustomLink {
  label_ar: string
  label_en: string
  url: string
  // Legacy fallback
  label?: string
}

interface ThemeColors {
  primary: string
  background: string
  card_bg: string
  text_primary: string
  text_secondary: string
  partners_gap?: number
}

interface HeroContent {
  // Arabic
  trust_badge_text_ar: string
  headline_ar: string
  headline_highlight_ar: string
  subtitle_ar: string
  primary_cta_text_ar: string
  secondary_cta_text_ar: string
  // English
  trust_badge_text_en: string
  headline_en: string
  headline_highlight_en: string
  subtitle_en: string
  primary_cta_text_en: string
  secondary_cta_text_en: string
  // Legacy (for backward compat reading)
  trust_badge_text?: string
  headline?: string
  headline_highlight?: string
  subtitle?: string
  primary_cta_text?: string
  secondary_cta_text?: string
}

interface LandingSettings {
  id: number
  platform_name: string
  logo_url: string | null
  hero_content: HeroContent
  faqs: FAQ[]
  social_links: SocialLink[]
  partners: Partner[]
  header_links: CustomLink[]
  footer_links: CustomLink[]
  theme_colors: ThemeColors
  support_whatsapp: string
  support_telegram: string
  support_email: string
  support_floating_enabled: {
    whatsapp: boolean
    telegram: boolean
    email: boolean
  }
}

const DEFAULT_THEME_COLORS: ThemeColors = {
  primary: '#10B981',
  background: '#020617',
  card_bg: '#1F2937',
  text_primary: '#FFFFFF',
  text_secondary: '#9CA3AF',
  partners_gap: 32,
}

// Normalize FAQ from DB (may have old format or new bilingual format)
function normalizeFaq(f: any, idx: number): FAQ {
  return {
    id: f.id || String(idx + 1),
    question_ar: f.question_ar || f.question || '',
    question_en: f.question_en || '',
    answer_ar: f.answer_ar || f.answer || '',
    answer_en: f.answer_en || '',
  }
}

// Normalize CustomLink from DB
function normalizeLink(l: any): CustomLink {
  return {
    label_ar: l.label_ar || l.label || '',
    label_en: l.label_en || '',
    url: l.url || '',
  }
}

// Normalize HeroContent from DB
function normalizeHero(h: any): HeroContent {
  return {
    trust_badge_text_ar: h.trust_badge_text_ar || h.trust_badge_text || 'منصة أتمتة وتسويق الواتساب الأولى للشركات والمتاجر',
    headline_ar: h.headline_ar || h.headline || 'نمِّ عملك مع',
    headline_highlight_ar: h.headline_highlight_ar || h.headline_highlight || 'واتساب والذكاء الاصطناعي',
    subtitle_ar: h.subtitle_ar || h.subtitle || 'منصة متكاملة تتيح لك أتمتة المحادثات، إرسال حملات البرودكاست الموجهة، وتوثيق المبيعات.',
    primary_cta_text_ar: h.primary_cta_text_ar || h.primary_cta_text || 'ابدأ مجاناً',
    secondary_cta_text_ar: h.secondary_cta_text_ar || h.secondary_cta_text || 'شاهد العرض التوضيحي',
    trust_badge_text_en: h.trust_badge_text_en || '#1 WhatsApp Automation & Marketing Platform for Businesses',
    headline_en: h.headline_en || 'Scale Your Business with',
    headline_highlight_en: h.headline_highlight_en || 'WhatsApp & Gemini AI',
    subtitle_en: h.subtitle_en || 'All-in-one platform to automate chat responses, trigger targeted broadcast campaigns, sync sales with Google Sheets, and notify your team via Telegram in real-time.',
    primary_cta_text_en: h.primary_cta_text_en || 'Get Started Free',
    secondary_cta_text_en: h.secondary_cta_text_en || 'Watch Live Demo',
  }
}

export function LandingSettingsClient({ initialSettings }: { initialSettings: any }) {
  const t = useTranslations('Admin.siteSettings')
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [settings, setSettings] = useState<LandingSettings>({
    id: initialSettings?.id || 1,
    platform_name: initialSettings?.platform_name || 'MK Whats',
    logo_url: initialSettings?.logo_url || '',
    hero_content: normalizeHero(initialSettings?.hero_content || {}),
    faqs: (initialSettings?.faqs || [
      {
        id: '1',
        question_ar: 'هل يحتاج ربط حساب الواتساب إلى خبرة برمجة؟',
        question_en: 'Does connecting a WhatsApp account require programming knowledge?',
        answer_ar: 'لا على الإطلاق! الربط يتم بسهولة فائقة عن طريق مسح رمز الاستجابة السريعة (QR Code).',
        answer_en: 'Not at all! The connection is done effortlessly by scanning a QR Code, just like WhatsApp Web.',
      },
    ]).map(normalizeFaq),
    social_links: initialSettings?.social_links || [
      { platform: 'whatsapp', url: 'https://wa.me/966500000000' },
      { platform: 'telegram', url: 'https://t.me/mkwhats_support' },
      { platform: 'twitter', url: 'https://x.com' },
    ],
    partners: initialSettings?.partners || [
      { name: 'Shopify', logo_url: 'https://cdn.worldvectorlogo.com/logos/shopify.svg' },
      { name: 'WooCommerce', logo_url: 'https://cdn.worldvectorlogo.com/logos/woocommerce.svg' },
    ],
    header_links: (initialSettings?.header_links || [
      { label_ar: 'الرئيسية', label_en: 'Home', url: '#hero' },
      { label_ar: 'المميزات', label_en: 'Features', url: '#features' },
      { label_ar: 'الباقات', label_en: 'Pricing', url: '#pricing' },
      { label_ar: 'الأسئلة الشائعة', label_en: 'FAQs', url: '#faq' },
    ]).map(normalizeLink),
    footer_links: (initialSettings?.footer_links || [
      { label_ar: 'الشروط والأحكام', label_en: 'Terms & Conditions', url: '/terms' },
      { label_ar: 'سياسة الخصوصية', label_en: 'Privacy Policy', url: '/privacy' },
    ]).map(normalizeLink),
    theme_colors: initialSettings?.theme_colors || DEFAULT_THEME_COLORS,
    support_whatsapp: initialSettings?.support_whatsapp || '+966500000000',
    support_telegram: initialSettings?.support_telegram || 'mkwhats_support',
    support_email: initialSettings?.support_email || 'support@mkwhats.com',
    support_floating_enabled: initialSettings?.support_floating_enabled || {
      whatsapp: true,
      telegram: true,
      email: true,
    },
  })

  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save landing settings')
      }

      setSuccessMsg(isAr ? 'تم حفظ كافة إعدادات صفحة الهبوط بنجاح! 🎉' : 'Landing Page Settings saved successfully! 🎉')
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving settings')
    } finally {
      setLoading(false)
    }
  }

  // FAQ handlers
  const handleAddFaq = () => {
    setSettings((prev) => ({
      ...prev,
      faqs: [
        ...prev.faqs,
        {
          id: Date.now().toString(),
          question_ar: 'سؤال جديد؟',
          question_en: 'New Question?',
          answer_ar: 'الإجابة التوضيحية...',
          answer_en: 'Explanation answer...',
        },
      ],
    }))
  }

  const handleRemoveFaq = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }))
  }

  // Social link handlers
  const handleAddSocial = () => {
    setSettings((prev) => ({
      ...prev,
      social_links: [...prev.social_links, { platform: 'twitter', url: 'https://' }],
    }))
  }

  const handleRemoveSocial = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index),
    }))
  }

  // Partner handlers
  const handleAddPartner = () => {
    setSettings((prev) => ({
      ...prev,
      partners: [...prev.partners, { name: 'Partner Name', logo_url: 'https://cdn.worldvectorlogo.com/logos/google-2015.svg' }],
    }))
  }

  const handleRemovePartner = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      partners: prev.partners.filter((_, i) => i !== index),
    }))
  }

  // Header & Footer link handlers
  const handleAddHeaderLink = () => {
    setSettings((prev) => ({
      ...prev,
      header_links: [...prev.header_links, { label_ar: 'رابط جديد', label_en: 'New Link', url: '#section' }],
    }))
  }

  const handleRemoveHeaderLink = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      header_links: prev.header_links.filter((_, i) => i !== index),
    }))
  }

  const handleAddFooterLink = () => {
    setSettings((prev) => ({
      ...prev,
      footer_links: [...prev.footer_links, { label_ar: 'صفحة جديدة', label_en: 'New Page', url: '/page' }],
    }))
  }

  const handleRemoveFooterLink = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      footer_links: prev.footer_links.filter((_, i) => i !== index),
    }))
  }

  // Reset colors
  const handleResetColors = () => {
    setSettings((prev) => ({
      ...prev,
      theme_colors: DEFAULT_THEME_COLORS,
    }))
  }

  // Hero field updater
  const updateHero = (field: keyof HeroContent, value: string) => {
    setSettings((prev) => ({
      ...prev,
      hero_content: { ...prev.hero_content, [field]: value },
    }))
  }

  // Bilingual label row
  const BilingualLabel = ({ ar, en }: { ar: string; en: string }) => (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md border border-amber-500/20">
        🇸🇦 AR
      </span>
      <span className="text-xs font-bold text-foreground">{ar}</span>
      <span className="mx-1 text-muted-foreground">/</span>
      <span className="inline-flex items-center gap-1 text-[10px] font-black bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded-md border border-sky-500/20">
        🇬🇧 EN
      </span>
      <span className="text-xs font-bold text-foreground">{en}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Layout className="h-6 w-6 text-emerald-500 shrink-0" />
            {isAr ? 'إعدادات صفحة الهبوط الشاملة (Landing Page CMS)' : 'Landing Page Full Management System'}
          </h1>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {isAr
              ? 'التحكم الكامل بالنصوص (عربي + إنجليزي)، ألوان الصفحة، الأسئلة الشائعة، الشركاء، روابط الهيدر والفوتر، وأزرار الدعم المباشر.'
              : 'Full bilingual (AR + EN) control over text, colors, FAQs, partners, header/footer links, and live support buttons.'}
          </p>
        </div>

        <Button
          onClick={handleSaveSettings}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 text-xs h-10 px-5 shadow-lg shadow-emerald-500/20"
        >
          <Save className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {isAr ? 'حفظ التغييرات الآن' : 'Save All Changes'}
        </Button>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-500 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-500 font-bold">
          {errorMsg}
        </div>
      )}

      {/* Bilingual notice banner */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-3 text-xs font-bold text-emerald-600">
        <Globe className="h-4 w-4 shrink-0" />
        <span>
          {isAr
            ? 'كل حقل نصي يدعم اللغتين العربية 🇸🇦 والإنجليزية 🇬🇧 بشكل مستقل. اللاندينغ بيج ستعرض المحتوى المناسب حسب لغة الزائر.'
            : 'Every text field supports both Arabic 🇸🇦 and English 🇬🇧 independently. The landing page shows content based on visitor language.'}
        </span>
      </div>

      <Tabs defaultValue="hero" className="w-full space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 bg-muted p-1 rounded-xl gap-1">
          <TabsTrigger value="hero" className="text-xs font-bold gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {isAr ? 'القسم الرئيسي' : 'Hero & Text'}
          </TabsTrigger>

          <TabsTrigger value="faqs" className="text-xs font-bold gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" />
            {isAr ? 'الأسئلة الشائعة' : 'FAQs'}
          </TabsTrigger>

          <TabsTrigger value="social" className="text-xs font-bold gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            {isAr ? 'السوشيال ميديا' : 'Social Links'}
          </TabsTrigger>

          <TabsTrigger value="partners" className="text-xs font-bold gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            {isAr ? 'الشركاء' : 'Partners'}
          </TabsTrigger>

          <TabsTrigger value="theme" className="text-xs font-bold gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            {isAr ? 'الألوان والهوية' : 'Colors & Reset'}
          </TabsTrigger>

          <TabsTrigger value="menu" className="text-xs font-bold gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            {isAr ? 'الهيدر والفوتر' : 'Header & Footer'}
          </TabsTrigger>

          <TabsTrigger value="support" className="text-xs font-bold gap-1.5">
            <Headphones className="h-3.5 w-3.5" />
            {isAr ? 'أزرار الدعم' : 'Support Buttons'}
          </TabsTrigger>
        </TabsList>

        {/* 1. Hero & General Content Tab — BILINGUAL */}
        <TabsContent value="hero" className="space-y-6">
          <Card className="bg-card border-border text-card-foreground shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                {isAr ? 'نصوص القسم الرئيسي (Hero Section)' : 'Hero Section Headlines'}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isAr
                  ? 'تخصيص عناوين وشارة ومحتوى الهيرو بالعربية والإنجليزية معاً'
                  : 'Customize hero titles, badge, and CTA buttons in both Arabic & English'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Trust Badge */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <Label className="text-xs font-black flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-emerald-500" />
                  {isAr ? 'نص شارة الثقة العلوي' : 'Trust Badge Text'}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-amber-500 flex items-center gap-1">🇸🇦 العربية</span>
                    <Input
                      value={settings.hero_content.trust_badge_text_ar}
                      onChange={(e) => updateHero('trust_badge_text_ar', e.target.value)}
                      className="bg-background text-sm font-medium"
                      placeholder="منصة أتمتة وتسويق الواتساب..."
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-sky-500 flex items-center gap-1">🇬🇧 English</span>
                    <Input
                      value={settings.hero_content.trust_badge_text_en}
                      onChange={(e) => updateHero('trust_badge_text_en', e.target.value)}
                      className="bg-background text-sm font-medium"
                      placeholder="#1 WhatsApp Automation Platform..."
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Headline */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <Label className="text-xs font-black flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-emerald-500" />
                  {isAr ? 'العنوان الرئيسي (Headline)' : 'Headline Title'}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                    <Input value={settings.hero_content.headline_ar} onChange={(e) => updateHero('headline_ar', e.target.value)} className="bg-background text-sm font-bold" dir="rtl" placeholder="نمِّ عملك مع" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                    <Input value={settings.hero_content.headline_en} onChange={(e) => updateHero('headline_en', e.target.value)} className="bg-background text-sm font-bold" dir="ltr" placeholder="Scale Your Business with" />
                  </div>
                </div>
              </div>

              {/* Headline Highlight */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                <Label className="text-xs font-black text-emerald-500 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  {isAr ? 'النص البارز الملون (Highlight)' : 'Highlighted Title Text'}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                    <Input value={settings.hero_content.headline_highlight_ar} onChange={(e) => updateHero('headline_highlight_ar', e.target.value)} className="bg-background text-sm font-black text-emerald-500" dir="rtl" placeholder="واتساب والذكاء الاصطناعي" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                    <Input value={settings.hero_content.headline_highlight_en} onChange={(e) => updateHero('headline_highlight_en', e.target.value)} className="bg-background text-sm font-black text-emerald-500" dir="ltr" placeholder="WhatsApp & Gemini AI" />
                  </div>
                </div>
              </div>

              {/* Subtitle */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <Label className="text-xs font-black flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-emerald-500" />
                  {isAr ? 'الوصف الفرعي (Subtitle)' : 'Hero Subtitle'}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                    <Textarea value={settings.hero_content.subtitle_ar} onChange={(e) => updateHero('subtitle_ar', e.target.value)} rows={3} className="bg-background text-xs leading-relaxed" dir="rtl" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                    <Textarea value={settings.hero_content.subtitle_en} onChange={(e) => updateHero('subtitle_en', e.target.value)} rows={3} className="bg-background text-xs leading-relaxed" dir="ltr" />
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <Label className="text-xs font-black flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-emerald-500" />
                  {isAr ? 'أزرار CTA' : 'CTA Buttons'}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary CTA */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-muted-foreground">{isAr ? 'الزر الرئيسي' : 'Primary Button'}</p>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                      <Input value={settings.hero_content.primary_cta_text_ar} onChange={(e) => updateHero('primary_cta_text_ar', e.target.value)} className="bg-background text-sm font-bold" dir="rtl" placeholder="ابدأ مجاناً" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                      <Input value={settings.hero_content.primary_cta_text_en} onChange={(e) => updateHero('primary_cta_text_en', e.target.value)} className="bg-background text-sm font-bold" dir="ltr" placeholder="Get Started Free" />
                    </div>
                  </div>
                  {/* Secondary CTA */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-muted-foreground">{isAr ? 'الزر الثانوي' : 'Secondary Button'}</p>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                      <Input value={settings.hero_content.secondary_cta_text_ar} onChange={(e) => updateHero('secondary_cta_text_ar', e.target.value)} className="bg-background text-sm font-bold" dir="rtl" placeholder="شاهد العرض التوضيحي" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                      <Input value={settings.hero_content.secondary_cta_text_en} onChange={(e) => updateHero('secondary_cta_text_en', e.target.value)} className="bg-background text-sm font-bold" dir="ltr" placeholder="Watch Live Demo" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. FAQs Tab — BILINGUAL */}
        <TabsContent value="faqs" className="space-y-6">
          <Card className="bg-card border-border text-card-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-500" />
                  {isAr ? 'إدارة الأسئلة الشائعة (FAQs Management)' : 'Frequently Asked Questions'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isAr
                    ? 'إضافة وتعديل وحذف الأسئلة والإجابات بالعربية والإنجليزية'
                    : 'Add, edit, or delete questions & answers in Arabic & English'}
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleAddFaq}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {isAr ? 'إضافة سؤال جديد' : 'Add New FAQ'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.faqs.map((faq, idx) => (
                <div key={faq.id || idx} className="p-4 rounded-xl border border-border bg-muted/30 space-y-4 relative group">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-emerald-500">#{idx + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFaq(idx)}
                      className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 h-8 px-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Question bilingual */}
                  <div className="space-y-2">
                    <Label className="text-xs font-black">{isAr ? 'السؤال' : 'Question'}</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                        <Input
                          value={faq.question_ar}
                          onChange={(e) => {
                            const updated = [...settings.faqs]
                            updated[idx] = { ...updated[idx], question_ar: e.target.value }
                            setSettings({ ...settings, faqs: updated })
                          }}
                          className="bg-background text-sm font-bold"
                          dir="rtl"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                        <Input
                          value={faq.question_en}
                          onChange={(e) => {
                            const updated = [...settings.faqs]
                            updated[idx] = { ...updated[idx], question_en: e.target.value }
                            setSettings({ ...settings, faqs: updated })
                          }}
                          className="bg-background text-sm font-bold"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Answer bilingual */}
                  <div className="space-y-2">
                    <Label className="text-xs font-black">{isAr ? 'الإجابة' : 'Answer'}</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                        <Textarea
                          value={faq.answer_ar}
                          onChange={(e) => {
                            const updated = [...settings.faqs]
                            updated[idx] = { ...updated[idx], answer_ar: e.target.value }
                            setSettings({ ...settings, faqs: updated })
                          }}
                          rows={2}
                          className="bg-background text-xs leading-relaxed"
                          dir="rtl"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                        <Textarea
                          value={faq.answer_en}
                          onChange={(e) => {
                            const updated = [...settings.faqs]
                            updated[idx] = { ...updated[idx], answer_en: e.target.value }
                            setSettings({ ...settings, faqs: updated })
                          }}
                          rows={2}
                          className="bg-background text-xs leading-relaxed"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Social Media Links Tab */}
        <TabsContent value="social" className="space-y-6">
          <Card className="bg-card border-border text-card-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-emerald-500" />
                  {isAr ? 'روابط وسائل التواصل الاجتماعي' : 'Social Media Links'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isAr ? 'ربط السوشيال ميديا بالفوتر والهيدر (Twitter, Instagram, WhatsApp, Telegram, etc.)' : 'Link social accounts displayed in header & footer'}
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleAddSocial}
                size="sm"
                variant="outline"
                className="border-border text-xs gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {isAr ? 'إضافة منصة جديدة' : 'Add Social Link'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {settings.social_links.map((link, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/20">
                  <Input
                    value={link.platform}
                    onChange={(e) => {
                      const updated = [...settings.social_links]
                      updated[idx].platform = e.target.value
                      setSettings({ ...settings, social_links: updated })
                    }}
                    placeholder="Platform (twitter, instagram, whatsapp...)"
                    className="w-1/3 bg-background text-xs font-bold"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => {
                      const updated = [...settings.social_links]
                      updated[idx].url = e.target.value
                      setSettings({ ...settings, social_links: updated })
                    }}
                    placeholder="URL (https://...)"
                    className="w-2/3 bg-background text-xs font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSocial(idx)}
                    className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 h-8 px-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Partner Logos Tab */}
        <TabsContent value="partners" className="space-y-6">
          <Card className="bg-card border-border text-card-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-emerald-500" />
                  {isAr ? 'شريط الشركاء والمعرض (Partner Logos)' : 'Partner Logos & Integration Marquee'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isAr ? 'تعديل وحذف وإضافة شعارات الشركات والمتاجر المتحركة في صفحة الهبوط' : 'Manage scrolling partner logos with live image preview'}
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleAddPartner}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {isAr ? 'إضافة شريك جديد' : 'Add Partner Logo'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.partners.map((partner, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {partner.logo_url ? (
                          <img
                            src={partner.logo_url}
                            alt={partner.name}
                            className="h-7 w-auto max-w-[90px] object-contain rounded bg-white/90 p-1"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded bg-muted flex items-center justify-center text-[10px]">
                            N/A
                          </div>
                        )}
                        <span className="text-xs font-bold">{partner.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePartner(idx)}
                        className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 h-7 px-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold">{isAr ? 'اسم الشريك / المنصة' : 'Partner Name'}</Label>
                      <Input
                        value={partner.name}
                        onChange={(e) => {
                          const updated = [...settings.partners]
                          updated[idx].name = e.target.value
                          setSettings({ ...settings, partners: updated })
                        }}
                        className="bg-background text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold">{isAr ? 'رابط اللوجو SVG/PNG' : 'Logo Image URL'}</Label>
                      <Input
                        value={partner.logo_url}
                        onChange={(e) => {
                          const updated = [...settings.partners]
                          updated[idx].logo_url = e.target.value
                          setSettings({ ...settings, partners: updated })
                        }}
                        className="bg-background text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Theme Colors & Reset Tab */}
        <TabsContent value="theme" className="space-y-6">
          <Card className="bg-card border-border text-card-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Palette className="h-4 w-4 text-emerald-500" />
                  {isAr ? 'تخصيص ألوان وإعادة ضبـط الألوان (Theme Colors & Reset)' : 'Theme Color Customization & Reset'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isAr ? 'التحكم بألوان الهوية الرئيسية للاندينغ بيج، مع إمكانية استعادة الألوان الافتراضية بضغطة زر' : 'Customize theme colors or reset back to default green palette with 1 click'}
                </CardDescription>
              </div>

              <Button
                type="button"
                onClick={handleResetColors}
                variant="outline"
                size="sm"
                className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs gap-1.5 font-bold"
              >
                <RotateCcw className="h-4 w-4" />
                {isAr ? 'إعادة ضبط الألوان الافتراضية 🔄' : 'Reset Default Colors 🔄'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 p-3 rounded-xl border border-border bg-muted/20">
                  <Label className="text-xs font-bold">{isAr ? 'اللون الرئيسي (Primary)' : 'Primary Color'}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.theme_colors.primary || '#10B981'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          theme_colors: { ...settings.theme_colors, primary: e.target.value },
                        })
                      }
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={settings.theme_colors.primary || '#10B981'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          theme_colors: { ...settings.theme_colors, primary: e.target.value },
                        })
                      }
                      className="bg-background text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl border border-border bg-muted/20">
                  <Label className="text-xs font-bold">{isAr ? 'خلفية الصفحة (Background)' : 'Background Color'}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.theme_colors.background || '#020617'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          theme_colors: { ...settings.theme_colors, background: e.target.value },
                        })
                      }
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={settings.theme_colors.background || '#020617'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          theme_colors: { ...settings.theme_colors, background: e.target.value },
                        })
                      }
                      className="bg-background text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl border border-border bg-muted/20">
                  <Label className="text-xs font-bold">{isAr ? 'خلفية الكروت (Card Background)' : 'Card Background'}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.theme_colors.card_bg || '#1F2937'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          theme_colors: { ...settings.theme_colors, card_bg: e.target.value },
                        })
                      }
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={settings.theme_colors.card_bg || '#1F2937'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          theme_colors: { ...settings.theme_colors, card_bg: e.target.value },
                        })
                      }
                      className="bg-background text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Header & Footer Links Tab — BILINGUAL */}
        <TabsContent value="menu" className="space-y-6">
          {/* Header Navigation Links */}
          <Card className="bg-card border-border text-card-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-emerald-500" />
                  {isAr ? 'روابط القائمة العلوية (Header Navigation Links)' : 'Header Navigation Links'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isAr
                    ? 'إضافة وتعديل وحذف روابط التنقل الرئيسية بالعربية والإنجليزية'
                    : 'Manage header links in both Arabic & English'}
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleAddHeaderLink}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {isAr ? 'إضافة رابط للهيدر' : 'Add Header Link'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {settings.header_links.map((link, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-muted-foreground">#{idx + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveHeaderLink(idx)}
                      className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 h-7 px-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                      <Input
                        value={link.label_ar}
                        onChange={(e) => {
                          const updated = [...settings.header_links]
                          updated[idx] = { ...updated[idx], label_ar: e.target.value }
                          setSettings({ ...settings, header_links: updated })
                        }}
                        placeholder="الرئيسية"
                        className="bg-background text-xs font-bold"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                      <Input
                        value={link.label_en}
                        onChange={(e) => {
                          const updated = [...settings.header_links]
                          updated[idx] = { ...updated[idx], label_en: e.target.value }
                          setSettings({ ...settings, header_links: updated })
                        }}
                        placeholder="Home"
                        className="bg-background text-xs font-bold"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-muted-foreground">🔗 URL</span>
                      <Input
                        value={link.url}
                        onChange={(e) => {
                          const updated = [...settings.header_links]
                          updated[idx] = { ...updated[idx], url: e.target.value }
                          setSettings({ ...settings, header_links: updated })
                        }}
                        placeholder="#section or /page"
                        className="bg-background text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Footer Navigation Links */}
          <Card className="bg-card border-border text-card-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-emerald-500" />
                  {isAr ? 'روابط التذييل (Footer Navigation Links)' : 'Footer Links'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isAr
                    ? 'إضافة وتعديل روابط الشروط والأحكام والسياسات بالعربية والإنجليزية'
                    : 'Manage footer legal and policy links in both languages'}
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleAddFooterLink}
                size="sm"
                variant="outline"
                className="border-border text-xs gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {isAr ? 'إضافة رابط للفوتر' : 'Add Footer Link'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {settings.footer_links.map((link, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-muted-foreground">#{idx + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFooterLink(idx)}
                      className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 h-7 px-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                      <Input
                        value={link.label_ar}
                        onChange={(e) => {
                          const updated = [...settings.footer_links]
                          updated[idx] = { ...updated[idx], label_ar: e.target.value }
                          setSettings({ ...settings, footer_links: updated })
                        }}
                        placeholder="الشروط والأحكام"
                        className="bg-background text-xs font-bold"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                      <Input
                        value={link.label_en}
                        onChange={(e) => {
                          const updated = [...settings.footer_links]
                          updated[idx] = { ...updated[idx], label_en: e.target.value }
                          setSettings({ ...settings, footer_links: updated })
                        }}
                        placeholder="Terms & Conditions"
                        className="bg-background text-xs font-bold"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-muted-foreground">🔗 URL</span>
                      <Input
                        value={link.url}
                        onChange={(e) => {
                          const updated = [...settings.footer_links]
                          updated[idx] = { ...updated[idx], url: e.target.value }
                          setSettings({ ...settings, footer_links: updated })
                        }}
                        placeholder="/terms"
                        className="bg-background text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. Support Buttons Tab */}
        <TabsContent value="support" className="space-y-6">
          <Card className="bg-card border-border text-card-foreground shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Headphones className="h-4 w-4 text-emerald-500" />
                {isAr ? 'أزرار الدعم المباشر باللاندينغ بيج (WhatsApp & Telegram Support)' : 'Landing Page Floating Support Buttons'}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isAr
                  ? 'إدخال بياني رقم الواتساب وتلغرام والإيميل، والتحكم بإظهار الزر العائم لزوار اللاندينغ بيج (عربي + إنجليزي تلقائياً)'
                  : 'Configure WhatsApp, Telegram, Email contact info and toggle floating buttons (bilingual auto-switch)'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* WhatsApp Support Row */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold flex items-center gap-2 text-emerald-500">
                    <MessageCircle className="h-4 w-4" />
                    {isAr ? 'دعم الواتساب (WhatsApp Live Chat)' : 'WhatsApp Support'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{isAr ? 'إظهار الزر العائم' : 'Show Floating Button'}</span>
                    <Switch
                      checked={Boolean(settings.support_floating_enabled.whatsapp)}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          support_floating_enabled: { ...settings.support_floating_enabled, whatsapp: checked },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{isAr ? 'رقم الواتساب مع المفتاح الدولي' : 'WhatsApp Number (e.g. +966500000000)'}</Label>
                  <Input
                    value={settings.support_whatsapp}
                    onChange={(e) => setSettings({ ...settings, support_whatsapp: e.target.value })}
                    placeholder="+966500000000"
                    className="bg-background text-xs font-mono"
                  />
                </div>
              </div>

              {/* Telegram Support Row */}
              <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold flex items-center gap-2 text-sky-500">
                    <Send className="h-4 w-4" />
                    {isAr ? 'دعم التلغرام (Telegram Direct)' : 'Telegram Support'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{isAr ? 'إظهار الزر العائم' : 'Show Floating Button'}</span>
                    <Switch
                      checked={Boolean(settings.support_floating_enabled.telegram)}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          support_floating_enabled: { ...settings.support_floating_enabled, telegram: checked },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{isAr ? 'اسم المستخدم بـ Telegram' : 'Telegram Handle / Username'}</Label>
                  <Input
                    value={settings.support_telegram}
                    onChange={(e) => setSettings({ ...settings, support_telegram: e.target.value })}
                    placeholder="mkwhats_support"
                    className="bg-background text-xs font-mono"
                  />
                </div>
              </div>

              {/* Support Email Row */}
              <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold flex items-center gap-2 text-indigo-500">
                    <Mail className="h-4 w-4" />
                    {isAr ? 'إيميل الدعم الفني (Support Email)' : 'Email Support'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{isAr ? 'إظهار الزر العائم' : 'Show Floating Button'}</span>
                    <Switch
                      checked={Boolean(settings.support_floating_enabled.email)}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          support_floating_enabled: { ...settings.support_floating_enabled, email: checked },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{isAr ? 'بريد الدعم الفني' : 'Support Email Address'}</Label>
                  <Input
                    value={settings.support_email}
                    onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                    placeholder="support@mkwhats.com"
                    className="bg-background text-xs font-mono"
                  />
                </div>
              </div>

              {/* Info box */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-bold text-emerald-600 flex items-start gap-2">
                <Globe className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {isAr
                    ? 'زر الدعم العائم سيعرض النصوص تلقائياً بالعربية أو الإنجليزية حسب لغة الزائر المختارة.'
                    : 'The floating support button will automatically display text in Arabic or English based on the visitor\'s selected language.'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
