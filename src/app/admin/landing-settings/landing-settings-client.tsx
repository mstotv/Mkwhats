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
  Grid,
  Bot,
  BarChart3,
  Radio,
  FileText,
  FileSpreadsheet,
  Zap,
  Shield,
  MessageSquare,
  Clock,
  Smartphone,
  Users,
  Workflow,
  TrendingUp,
  Layers,
  Lock,
  Bell,
  ArrowUp,
  ArrowDown,
  Tag,
  Boxes,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLocale } from 'next-intl'

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
  question_ar: string
  question_en: string
  answer_ar: string
  answer_en: string
  question?: string
  answer?: string
}

interface CustomLink {
  label_ar: string
  label_en: string
  url: string
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
  trust_badge_text_ar: string
  headline_ar: string
  headline_highlight_ar: string
  subtitle_ar: string
  primary_cta_text_ar: string
  secondary_cta_text_ar: string
  trust_badge_text_en: string
  headline_en: string
  headline_highlight_en: string
  subtitle_en: string
  primary_cta_text_en: string
  secondary_cta_text_en: string
  trust_badge_text?: string
  headline?: string
  headline_highlight?: string
  subtitle?: string
  primary_cta_text?: string
  secondary_cta_text?: string
}

export interface FeatureBadge {
  text_ar: string
  text_en: string
  variant?: 'pulse' | 'neutral' | 'accent'
}

export interface FeatureIntegration {
  title_ar: string
  title_en: string
  status_ar: string
  status_en: string
}

export interface FeatureItem {
  id: string
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  icon: string
  col_span: 'col-span-1' | 'col-span-2'
  badges?: FeatureBadge[]
  integrations?: FeatureIntegration[]
}

export interface FeaturesSectionContent {
  section_title_ar: string
  section_title_en: string
  section_subtitle_ar: string
  section_subtitle_en: string
  features: FeatureItem[]
}

interface LandingSettings {
  id: number
  platform_name: string
  logo_url: string | null
  hero_content: HeroContent
  features_content: FeaturesSectionContent
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

const DEFAULT_FEATURES_SECTION: FeaturesSectionContent = {
  section_title_ar: 'كل ما تحتاجه للتحكم الكامل بـ واتساب',
  section_title_en: 'Everything You Need to Master WhatsApp',
  section_subtitle_ar: 'مجموعة متطورة من الأدوات المصممة لأتمتة وتحليل وتوسيع تجارتك بسهولة تامة.',
  section_subtitle_en: 'A sophisticated suite of tools designed to automate, analyze, and scale your conversational commerce effortlessly.',
  features: [
    {
      id: 'ai-automation',
      title_ar: 'أتمتة الذكاء الاصطناعي (Gemini AI)',
      title_en: 'Gemini AI Automation',
      description_ar: 'نشر وكلاء محادثة يفهمون السياق والنية بدقة لتقديم ردود طبيعية شبيهة بالبشر على مدار الساعة.',
      description_en: 'Deploy conversational agents that understand context, nuance, and user intent, providing human-like responses 24/7.',
      icon: 'Bot',
      col_span: 'col-span-2',
      badges: [
        { text_ar: 'Gemini 2.5 & 3.6 Flash نشط', text_en: 'Gemini 2.5 & 3.6 Flash Active', variant: 'pulse' },
        { text_ar: 'نية الشراء: عالية جداً', text_en: 'Intent: Purchase High', variant: 'neutral' },
      ],
      integrations: [],
    },
    {
      id: 'deep-analytics',
      title_ar: 'تحليلات عميقة',
      title_en: 'Deep Analytics',
      description_ar: 'متابعة معدلات التفاعل والتحويل واستهلاك الرسائل الشهرية لحظة بلحظة.',
      description_en: 'Track engagement, conversion rates, and agent performance in real-time.',
      icon: 'BarChart3',
      col_span: 'col-span-1',
      badges: [],
      integrations: [],
    },
    {
      id: 'targeted-broadcasts',
      title_ar: 'حملات برودكاست موجهة',
      title_en: 'Targeted Broadcasts',
      description_ar: 'إرسال رسائل تسويقية جماعية للجمهور المستهدف بمعدلات آمنة وموثوقة.',
      description_en: 'Send personalized bulk messages to segmented audiences securely.',
      icon: 'Radio',
      col_span: 'col-span-1',
      badges: [],
      integrations: [],
    },
    {
      id: 'approved-templates',
      title_ar: 'قوالب معتمدة',
      title_en: 'Approved Templates',
      description_ar: 'إنشاء واستخدام قوالب رسائل تفاعلية لتسريع ردود فريق المبيعات.',
      description_en: 'Manage and deploy WhatsApp-approved message templates effortlessly.',
      icon: 'FileText',
      col_span: 'col-span-1',
      badges: [],
      integrations: [],
    },
    {
      id: 'sheets-telegram-sync',
      title_ar: 'مزامنة Google Sheets و Telegram',
      title_en: 'Google Sheets & Telegram Sync',
      description_ar: 'تسجيل العملاء والطلبات تلقائياً في Google Sheets مع تنبيهات فورية على Telegram لفريقك عند تأكيد الطلب.',
      description_en: 'Automatically log leads into Google Sheets and trigger instant Telegram alerts for your sales team when high-intent actions occur.',
      icon: 'FileSpreadsheet',
      col_span: 'col-span-2',
      badges: [],
      integrations: [
        { title_ar: 'Google Sheets', title_en: 'Google Sheets', status_ar: '● مزامنة فورية', status_en: '● Auto-Synced' },
        { title_ar: 'Telegram Bot', title_en: 'Telegram Bot', status_ar: '● تنبيه فوري', status_en: '● Instant Alert' },
      ],
    },
  ],
}

const AVAILABLE_ICONS = [
  { value: 'Bot', label_ar: 'روبوت الذكاء الاصطناعي (Bot)', label_en: 'AI Bot' },
  { value: 'BarChart3', label_ar: 'إحصائيات وتحليلات (Analytics)', label_en: 'Analytics' },
  { value: 'Radio', label_ar: 'بث وحملات برودكاست (Broadcast)', label_en: 'Broadcast' },
  { value: 'FileText', label_ar: 'قوالب ونصوص (Templates)', label_en: 'Templates' },
  { value: 'FileSpreadsheet', label_ar: 'شيتس وإكسل (Spreadsheet)', label_en: 'Spreadsheet' },
  { value: 'Zap', label_ar: 'أتمتة وسرعة (Lightning)', label_en: 'Automation' },
  { value: 'Shield', label_ar: 'أمان وحماية (Security)', label_en: 'Security' },
  { value: 'Sparkles', label_ar: 'ذكاء اصطناعي وبريق (Sparkles)', label_en: 'AI Sparkles' },
  { value: 'MessageSquare', label_ar: 'محادثات ورسائل (Chat)', label_en: 'Chat' },
  { value: 'Workflow', label_ar: 'مسارات وتدفقات (Workflow)', label_en: 'Workflow' },
  { value: 'TrendingUp', label_ar: 'نمو ومبيعات (Growth)', label_en: 'Growth' },
  { value: 'Clock', label_ar: 'ساعة وعمل 24/7 (24/7)', label_en: '24/7 Availability' },
  { value: 'Users', label_ar: 'فريق ومستخدمين (Team)', label_en: 'Team' },
  { value: 'Smartphone', label_ar: 'جوال وهواتف (Mobile)', label_en: 'Mobile' },
  { value: 'Globe', label_ar: 'عالمي وربط دولي (Global)', label_en: 'Global' },
  { value: 'Layers', label_ar: 'طبقات متعددة (Layers)', label_en: 'Layers' },
  { value: 'Lock', label_ar: 'تشفير وخصوصية (Privacy)', label_en: 'Privacy' },
  { value: 'Bell', label_ar: 'تنبيهات وإشعارات (Notifications)', label_en: 'Notifications' },
]

function renderIconPreview(iconName: string) {
  const iconProps = { className: 'h-4 w-4' }
  switch (iconName) {
    case 'Bot': return <Bot {...iconProps} />
    case 'BarChart3': return <BarChart3 {...iconProps} />
    case 'Radio': return <Radio {...iconProps} />
    case 'FileText': return <FileText {...iconProps} />
    case 'FileSpreadsheet': return <FileSpreadsheet {...iconProps} />
    case 'Zap': return <Zap {...iconProps} />
    case 'Shield': return <Shield {...iconProps} />
    case 'Sparkles': return <Sparkles {...iconProps} />
    case 'MessageSquare': return <MessageSquare {...iconProps} />
    case 'Workflow': return <Workflow {...iconProps} />
    case 'TrendingUp': return <TrendingUp {...iconProps} />
    case 'Clock': return <Clock {...iconProps} />
    case 'Users': return <Users {...iconProps} />
    case 'Smartphone': return <Smartphone {...iconProps} />
    case 'Globe': return <Globe {...iconProps} />
    case 'Layers': return <Layers {...iconProps} />
    case 'Lock': return <Lock {...iconProps} />
    case 'Bell': return <Bell {...iconProps} />
    default: return <Sparkles {...iconProps} />
  }
}

function normalizeFaq(f: any, idx: number): FAQ {
  return {
    id: f.id || String(idx + 1),
    question_ar: f.question_ar || f.question || '',
    question_en: f.question_en || '',
    answer_ar: f.answer_ar || f.answer || '',
    answer_en: f.answer_en || '',
  }
}

function normalizeLink(l: any): CustomLink {
  return {
    label_ar: l.label_ar || l.label || '',
    label_en: l.label_en || '',
    url: l.url || '',
  }
}

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

function normalizeFeatures(raw: any): FeaturesSectionContent {
  if (!raw) return DEFAULT_FEATURES_SECTION

  // If it's an old array format
  if (Array.isArray(raw)) {
    return {
      section_title_ar: DEFAULT_FEATURES_SECTION.section_title_ar,
      section_title_en: DEFAULT_FEATURES_SECTION.section_title_en,
      section_subtitle_ar: DEFAULT_FEATURES_SECTION.section_subtitle_ar,
      section_subtitle_en: DEFAULT_FEATURES_SECTION.section_subtitle_en,
      features: raw.map((item, idx) => ({
        id: item.id || `feature-${idx + 1}`,
        title_ar: item.title_ar || item.title || `ميزة ${idx + 1}`,
        title_en: item.title_en || `Feature ${idx + 1}`,
        description_ar: item.description_ar || item.description || '',
        description_en: item.description_en || '',
        icon: item.icon || 'Sparkles',
        col_span: item.col_span || 'col-span-1',
        badges: item.badges || [],
        integrations: item.integrations || [],
      })),
    }
  }

  // If it's the new object format
  return {
    section_title_ar: raw.section_title_ar || DEFAULT_FEATURES_SECTION.section_title_ar,
    section_title_en: raw.section_title_en || DEFAULT_FEATURES_SECTION.section_title_en,
    section_subtitle_ar: raw.section_subtitle_ar || DEFAULT_FEATURES_SECTION.section_subtitle_ar,
    section_subtitle_en: raw.section_subtitle_en || DEFAULT_FEATURES_SECTION.section_subtitle_en,
    features: Array.isArray(raw.features) && raw.features.length > 0
      ? raw.features.map((item: any, idx: number) => ({
          id: item.id || `feature-${idx + 1}`,
          title_ar: item.title_ar || item.title || '',
          title_en: item.title_en || '',
          description_ar: item.description_ar || item.description || '',
          description_en: item.description_en || '',
          icon: item.icon || 'Sparkles',
          col_span: item.col_span === 'col-span-2' ? 'col-span-2' : 'col-span-1',
          badges: Array.isArray(item.badges) ? item.badges : [],
          integrations: Array.isArray(item.integrations) ? item.integrations : [],
        }))
      : DEFAULT_FEATURES_SECTION.features,
  }
}

export function LandingSettingsClient({ initialSettings }: { initialSettings: any }) {
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [settings, setSettings] = useState<LandingSettings>({
    id: initialSettings?.id || 1,
    platform_name: initialSettings?.platform_name || 'MK Whats',
    logo_url: initialSettings?.logo_url || '',
    hero_content: normalizeHero(initialSettings?.hero_content || {}),
    features_content: normalizeFeatures(initialSettings?.features_content),
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

      setSuccessMsg(isAr ? 'تم حفظ كافة إعدادات صفحة الهبوط والمميزات بنجاح! 🎉' : 'Landing Page Settings & Bento Features saved successfully! 🎉')
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving settings')
    } finally {
      setLoading(false)
    }
  }

  // Feature Section Handlers
  const updateFeatureSection = (field: 'section_title_ar' | 'section_title_en' | 'section_subtitle_ar' | 'section_subtitle_en', value: string) => {
    setSettings((prev) => ({
      ...prev,
      features_content: {
        ...prev.features_content,
        [field]: value,
      },
    }))
  }

  const handleAddFeature = () => {
    const newId = `feature-${Date.now()}`
    const newFeature: FeatureItem = {
      id: newId,
      title_ar: 'ميزة جديدة متطورة',
      title_en: 'New Advanced Feature',
      description_ar: 'شرح وتفاصيل الميزة وكيف تخدم العملاء وتزيد من كفاءة العمل والمبيعات.',
      description_en: 'Description and details of how this feature empowers business workflows and increases sales.',
      icon: 'Zap',
      col_span: 'col-span-1',
      badges: [],
      integrations: [],
    }

    setSettings((prev) => ({
      ...prev,
      features_content: {
        ...prev.features_content,
        features: [...prev.features_content.features, newFeature],
      },
    }))
  }

  const handleRemoveFeature = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      features_content: {
        ...prev.features_content,
        features: prev.features_content.features.filter((_, i) => i !== index),
      },
    }))
  }

  const handleMoveFeature = (index: number, direction: 'up' | 'down') => {
    const list = [...settings.features_content.features]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= list.length) return
    const [moved] = list.splice(index, 1)
    list.splice(targetIndex, 0, moved)
    setSettings((prev) => ({
      ...prev,
      features_content: {
        ...prev.features_content,
        features: list,
      },
    }))
  }

  const updateFeatureItem = (index: number, field: keyof FeatureItem, value: any) => {
    setSettings((prev) => {
      const updated = [...prev.features_content.features]
      updated[index] = { ...updated[index], [field]: value }
      return {
        ...prev,
        features_content: {
          ...prev.features_content,
          features: updated,
        },
      }
    })
  }

  // Feature Badges
  const handleAddBadge = (featureIndex: number) => {
    const feature = settings.features_content.features[featureIndex]
    const updatedBadges = [...(feature.badges || []), { text_ar: 'شارة جديدة', text_en: 'New Badge', variant: 'pulse' as const }]
    updateFeatureItem(featureIndex, 'badges', updatedBadges)
  }

  const handleRemoveBadge = (featureIndex: number, badgeIndex: number) => {
    const feature = settings.features_content.features[featureIndex]
    const updatedBadges = (feature.badges || []).filter((_, i) => i !== badgeIndex)
    updateFeatureItem(featureIndex, 'badges', updatedBadges)
  }

  const handleUpdateBadge = (featureIndex: number, badgeIndex: number, field: keyof FeatureBadge, value: any) => {
    const feature = settings.features_content.features[featureIndex]
    const updatedBadges = [...(feature.badges || [])]
    updatedBadges[badgeIndex] = { ...updatedBadges[badgeIndex], [field]: value }
    updateFeatureItem(featureIndex, 'badges', updatedBadges)
  }

  // Feature Integrations
  const handleAddIntegration = (featureIndex: number) => {
    const feature = settings.features_content.features[featureIndex]
    const updatedIntegrations = [
      ...(feature.integrations || []),
      { title_ar: 'المنصة', title_en: 'Platform', status_ar: '● متصل', status_en: '● Connected' },
    ]
    updateFeatureItem(featureIndex, 'integrations', updatedIntegrations)
  }

  const handleRemoveIntegration = (featureIndex: number, intIndex: number) => {
    const feature = settings.features_content.features[featureIndex]
    const updatedIntegrations = (feature.integrations || []).filter((_, i) => i !== intIndex)
    updateFeatureItem(featureIndex, 'integrations', updatedIntegrations)
  }

  const handleUpdateIntegration = (featureIndex: number, intIndex: number, field: keyof FeatureIntegration, value: any) => {
    const feature = settings.features_content.features[featureIndex]
    const updatedIntegrations = [...(feature.integrations || [])]
    updatedIntegrations[intIndex] = { ...updatedIntegrations[intIndex], [field]: value }
    updateFeatureItem(featureIndex, 'integrations', updatedIntegrations)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Layout className="h-6 w-6 text-emerald-500 shrink-0" />
            {isAr ? 'إدارة صفحة الهبوط الشاملة (Landing Page CMS)' : 'Landing Page Full Management System'}
          </h1>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {isAr
              ? 'التحكم الكامل بالنصوص، قسم المميزات والـ Bento Grid، الألوان، الأسئلة الشائعة، الشركاء، وروابط الموقع بالعربية والإنجليزية.'
              : 'Full bilingual (AR + EN) control over text, Bento Grid features, colors, FAQs, partners, and site links.'}
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

      <Tabs defaultValue="features" className="w-full space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 bg-muted p-1 rounded-xl gap-1">
          <TabsTrigger value="hero" className="text-xs font-bold gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {isAr ? 'الهيرو' : 'Hero'}
          </TabsTrigger>

          <TabsTrigger value="features" className="text-xs font-bold gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Grid className="h-3.5 w-3.5" />
            {isAr ? 'المميزات Bento' : 'Features'}
          </TabsTrigger>

          <TabsTrigger value="faqs" className="text-xs font-bold gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" />
            {isAr ? 'الأسئلة الشائعة' : 'FAQs'}
          </TabsTrigger>

          <TabsTrigger value="social" className="text-xs font-bold gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            {isAr ? 'السوشيال' : 'Social'}
          </TabsTrigger>

          <TabsTrigger value="partners" className="text-xs font-bold gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            {isAr ? 'الشركاء' : 'Partners'}
          </TabsTrigger>

          <TabsTrigger value="theme" className="text-xs font-bold gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            {isAr ? 'الألوان' : 'Colors'}
          </TabsTrigger>

          <TabsTrigger value="menu" className="text-xs font-bold gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            {isAr ? 'الهيدر/فوتر' : 'Links'}
          </TabsTrigger>

          <TabsTrigger value="support" className="text-xs font-bold gap-1.5">
            <Headphones className="h-3.5 w-3.5" />
            {isAr ? 'أزرار الدعم' : 'Support'}
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

        {/* 2. Bento Grid & Features Tab — BILINGUAL CMS */}
        <TabsContent value="features" className="space-y-6">
          <Card className="bg-card border-border text-card-foreground shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Grid className="h-4 w-4 text-emerald-500" />
                  {isAr ? 'إدارة قسم المميزات وشبكة Bento Grid' : 'Features & Bento Grid Management'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isAr
                    ? 'التحكم الكامل بالعناوين، كروت المميزات، الأيقونات، الشارات، ووسوم التكامل مع إمكانية إضافة كروت جديدة.'
                    : 'Manage section header, cards, icons, badges, integrations, and add new feature cards dynamically.'}
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleAddFeature}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shrink-0"
              >
                <Plus className="h-4 w-4" />
                {isAr ? 'إضافة كارت ميزة جديد' : 'Add Feature Card'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Section Header Inputs */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-black text-foreground">
                    {isAr ? 'عنوان ووصف قسم المميزات العام (Section Header)' : 'Section Main Header & Subtitle'}
                  </span>
                </div>

                {/* Section Title */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">{isAr ? 'عنوان القسم الرئيسي' : 'Section Main Title'}</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                      <Input
                        value={settings.features_content.section_title_ar}
                        onChange={(e) => updateFeatureSection('section_title_ar', e.target.value)}
                        className="bg-background text-sm font-bold"
                        dir="rtl"
                        placeholder="كل ما تحتاجه للتحكم الكامل بـ واتساب"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                      <Input
                        value={settings.features_content.section_title_en}
                        onChange={(e) => updateFeatureSection('section_title_en', e.target.value)}
                        className="bg-background text-sm font-bold"
                        dir="ltr"
                        placeholder="Everything You Need to Master WhatsApp"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Subtitle */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">{isAr ? 'الوصف الفرعي للقسم' : 'Section Subtitle'}</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                      <Textarea
                        value={settings.features_content.section_subtitle_ar}
                        onChange={(e) => updateFeatureSection('section_subtitle_ar', e.target.value)}
                        rows={2}
                        className="bg-background text-xs leading-relaxed"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                      <Textarea
                        value={settings.features_content.section_subtitle_en}
                        onChange={(e) => updateFeatureSection('section_subtitle_en', e.target.value)}
                        rows={2}
                        className="bg-background text-xs leading-relaxed"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Cards List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Boxes className="h-4 w-4 text-emerald-500" />
                    {isAr ? `كروت المميزات الحالية (${settings.features_content.features.length})` : `Feature Cards List (${settings.features_content.features.length})`}
                  </span>
                </div>

                {settings.features_content.features.map((feature, fIdx) => (
                  <div
                    key={feature.id || fIdx}
                    className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4 relative group hover:border-emerald-500/40 transition-colors duration-200"
                  >
                    {/* Card Top Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <span className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-xs">
                          #{fIdx + 1}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                          {renderIconPreview(feature.icon)}
                          <span>{isAr ? feature.title_ar || `ميزة #${fIdx + 1}` : feature.title_en || `Feature #${fIdx + 1}`}</span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${feature.col_span === 'col-span-2' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-muted border-border text-muted-foreground'}`}>
                          {feature.col_span === 'col-span-2' ? (isAr ? 'عريض 2 أعمدة' : 'Wide 2-Col') : (isAr ? 'عادي 1 عمود' : 'Normal 1-Col')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={fIdx === 0}
                          onClick={() => handleMoveFeature(fIdx, 'up')}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title={isAr ? 'تحريك للأعلى' : 'Move Up'}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={fIdx === settings.features_content.features.length - 1}
                          onClick={() => handleMoveFeature(fIdx, 'down')}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title={isAr ? 'تحريك للأسفل' : 'Move Down'}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFeature(fIdx)}
                          className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 ml-1"
                          title={isAr ? 'حذف الميزة' : 'Delete Feature'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Settings Row: Icon & Layout Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Icon Selector */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold flex items-center gap-1.5">
                          {renderIconPreview(feature.icon)}
                          {isAr ? 'الأيقونة' : 'Icon'}
                        </Label>
                        <select
                          value={feature.icon || 'Sparkles'}
                          onChange={(e) => updateFeatureItem(fIdx, 'icon', e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {AVAILABLE_ICONS.map((ic) => (
                            <option key={ic.value} value={ic.value}>
                              {isAr ? ic.label_ar : ic.label_en}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Layout Size Selector */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold flex items-center gap-1.5">
                          <Grid className="h-3.5 w-3.5 text-emerald-500" />
                          {isAr ? 'حجم الكارت في الشبكة' : 'Grid Layout Span'}
                        </Label>
                        <select
                          value={feature.col_span || 'col-span-1'}
                          onChange={(e) => updateFeatureItem(fIdx, 'col_span', e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="col-span-1">{isAr ? 'كارت عادي (عمود واحد - 1 Col)' : 'Normal Card (1 Column)'}</option>
                          <option value="col-span-2">{isAr ? 'كارت مميز عريض (عمودين - 2 Cols)' : 'Featured Wide Card (2 Columns)'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Title Inputs */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">{isAr ? 'عنوان الميزة' : 'Feature Title'}</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                          <Input
                            value={feature.title_ar}
                            onChange={(e) => updateFeatureItem(fIdx, 'title_ar', e.target.value)}
                            className="bg-background text-sm font-bold"
                            dir="rtl"
                            placeholder="عنوان الميزة بالعربية"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                          <Input
                            value={feature.title_en}
                            onChange={(e) => updateFeatureItem(fIdx, 'title_en', e.target.value)}
                            className="bg-background text-sm font-bold"
                            dir="ltr"
                            placeholder="Feature Title in English"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Description Inputs */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">{isAr ? 'وصف الميزة' : 'Feature Description'}</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                          <Textarea
                            value={feature.description_ar}
                            onChange={(e) => updateFeatureItem(fIdx, 'description_ar', e.target.value)}
                            rows={2}
                            className="bg-background text-xs leading-relaxed"
                            dir="rtl"
                            placeholder="شرح تفصيلي للميزة..."
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                          <Textarea
                            value={feature.description_en}
                            onChange={(e) => updateFeatureItem(fIdx, 'description_en', e.target.value)}
                            rows={2}
                            className="bg-background text-xs leading-relaxed"
                            dir="ltr"
                            placeholder="Detailed description in English..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Feature Badges Section (Optional tags like Gemini Active, Purchase Intent) */}
                    <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                          <Tag className="h-3.5 w-3.5 text-emerald-500" />
                          {isAr ? 'الشارات التفاعلية الإضافية (Badges)' : 'Interactive Badges'}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddBadge(fIdx)}
                          className="h-7 text-[11px] gap-1 border-dashed"
                        >
                          <Plus className="h-3 w-3" />
                          {isAr ? 'إضافة شارة' : 'Add Badge'}
                        </Button>
                      </div>

                      {feature.badges && feature.badges.length > 0 ? (
                        <div className="space-y-2">
                          {feature.badges.map((badge, bIdx) => (
                            <div key={bIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-background p-2 rounded-md border border-border">
                              <div className="sm:col-span-5 space-y-0.5">
                                <span className="text-[9px] font-black text-amber-500">🇸🇦 AR:</span>
                                <Input
                                  value={badge.text_ar}
                                  onChange={(e) => handleUpdateBadge(fIdx, bIdx, 'text_ar', e.target.value)}
                                  className="h-7 text-xs"
                                  dir="rtl"
                                />
                              </div>
                              <div className="sm:col-span-5 space-y-0.5">
                                <span className="text-[9px] font-black text-sky-500">🇬🇧 EN:</span>
                                <Input
                                  value={badge.text_en}
                                  onChange={(e) => handleUpdateBadge(fIdx, bIdx, 'text_en', e.target.value)}
                                  className="h-7 text-xs"
                                  dir="ltr"
                                />
                              </div>
                              <div className="sm:col-span-2 flex justify-end pt-3 sm:pt-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveBadge(fIdx, bIdx)}
                                  className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-500/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">
                          {isAr ? 'لا توجد شارات لهذا الكارت (اختياري).' : 'No badges added for this card (optional).'}
                        </p>
                      )}
                    </div>

                    {/* Feature Integrations Pills (Optional for tools like Google Sheets / Telegram Bot) */}
                    <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                          <Boxes className="h-3.5 w-3.5 text-emerald-500" />
                          {isAr ? 'صناديق الربط والتكامل (Integration Pills)' : 'Integration Pills'}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddIntegration(fIdx)}
                          className="h-7 text-[11px] gap-1 border-dashed"
                        >
                          <Plus className="h-3 w-3" />
                          {isAr ? 'إضافة صندوق ربط' : 'Add Integration Pill'}
                        </Button>
                      </div>

                      {feature.integrations && feature.integrations.length > 0 ? (
                        <div className="space-y-2">
                          {feature.integrations.map((intg, iIdx) => (
                            <div key={iIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-background p-2 rounded-md border border-border">
                              <div className="sm:col-span-3 space-y-0.5">
                                <span className="text-[9px] font-black text-amber-500">🇸🇦 العنوان:</span>
                                <Input
                                  value={intg.title_ar}
                                  onChange={(e) => handleUpdateIntegration(fIdx, iIdx, 'title_ar', e.target.value)}
                                  className="h-7 text-xs font-bold"
                                  dir="rtl"
                                  placeholder="Google Sheets"
                                />
                              </div>
                              <div className="sm:col-span-3 space-y-0.5">
                                <span className="text-[9px] font-black text-sky-500">🇬🇧 Title:</span>
                                <Input
                                  value={intg.title_en}
                                  onChange={(e) => handleUpdateIntegration(fIdx, iIdx, 'title_en', e.target.value)}
                                  className="h-7 text-xs font-bold"
                                  dir="ltr"
                                  placeholder="Google Sheets"
                                />
                              </div>
                              <div className="sm:col-span-2.5 space-y-0.5">
                                <span className="text-[9px] font-black text-emerald-500">🇸🇦 الحالة:</span>
                                <Input
                                  value={intg.status_ar}
                                  onChange={(e) => handleUpdateIntegration(fIdx, iIdx, 'status_ar', e.target.value)}
                                  className="h-7 text-[11px]"
                                  dir="rtl"
                                  placeholder="● مزامنة فورية"
                                />
                              </div>
                              <div className="sm:col-span-2.5 space-y-0.5">
                                <span className="text-[9px] font-black text-emerald-500">🇬🇧 Status:</span>
                                <Input
                                  value={intg.status_en}
                                  onChange={(e) => handleUpdateIntegration(fIdx, iIdx, 'status_en', e.target.value)}
                                  className="h-7 text-[11px]"
                                  dir="ltr"
                                  placeholder="● Auto-Synced"
                                />
                              </div>
                              <div className="sm:col-span-1 flex justify-end pt-2 sm:pt-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveIntegration(fIdx, iIdx)}
                                  className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-500/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">
                          {isAr ? 'لا توجد صناديق تكامل لهذا الكارت (اختياري).' : 'No integration pills added for this card (optional).'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Add Feature Button */}
              <Button
                type="button"
                onClick={handleAddFeature}
                className="w-full py-4 border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                {isAr ? 'إضافة كارت ميزة جديد في شبكة Bento Grid' : 'Add New Feature Card to Bento Grid'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. FAQs Tab — BILINGUAL */}
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

        {/* 4. Social Links Tab */}
        <TabsContent value="social" className="space-y-6">
          <Card className="bg-card border-border text-card-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-emerald-500" />
                  {isAr ? 'روابط مواقع التواصل الاجتماعي' : 'Social Media Links'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isAr
                    ? 'إضافة حسابات المنصة الرسمية التي تظهر في الفوتر'
                    : 'Manage official social channels displayed in the footer'}
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleAddSocial}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {isAr ? 'إضافة رابط جديد' : 'Add Link'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.social_links.map((link, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                  <select
                    value={link.platform}
                    onChange={(e) => {
                      const updated = [...settings.social_links]
                      updated[idx] = { ...updated[idx], platform: e.target.value }
                      setSettings({ ...settings, social_links: updated })
                    }}
                    className="h-10 rounded-lg border border-input bg-background px-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="twitter">X / Twitter</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                  <Input
                    value={link.url}
                    onChange={(e) => {
                      const updated = [...settings.social_links]
                      updated[idx] = { ...updated[idx], url: e.target.value }
                      setSettings({ ...settings, social_links: updated })
                    }}
                    placeholder="https://..."
                    className="flex-1 bg-background text-xs font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSocial(idx)}
                    className="text-rose-500 hover:bg-rose-500/10 h-10 w-10 p-0 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Partners Tab */}
        <TabsContent value="partners" className="space-y-6">
          <Card className="bg-card border-border text-card-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-emerald-500" />
                  {isAr ? 'شريط الشركاء والتكاملات (Integrations Bar)' : 'Partners & Integrations Bar'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isAr
                    ? 'إضافة أسماء وشعارات المنصات التي تتكامل معها منصتك'
                    : 'Manage platform logos & integration partners shown on landing page'}
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleAddPartner}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {isAr ? 'إضافة شريك جديد' : 'Add Partner'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.partners.map((partner, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                  <Input
                    value={partner.name}
                    onChange={(e) => {
                      const updated = [...settings.partners]
                      updated[idx] = { ...updated[idx], name: e.target.value }
                      setSettings({ ...settings, partners: updated })
                    }}
                    placeholder={isAr ? 'اسم الشريك (مثال: Shopify)' : 'Partner Name'}
                    className="w-full sm:w-1/3 bg-background text-xs font-bold"
                  />
                  <Input
                    value={partner.logo_url}
                    onChange={(e) => {
                      const updated = [...settings.partners]
                      updated[idx] = { ...updated[idx], logo_url: e.target.value }
                      setSettings({ ...settings, partners: updated })
                    }}
                    placeholder="https://... (رابط شعار الشريك SVG أو PNG)"
                    className="w-full sm:flex-1 bg-background text-xs font-mono"
                  />
                  {partner.logo_url && (
                    <img src={partner.logo_url} alt={partner.name} className="h-6 w-6 object-contain shrink-0" />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePartner(idx)}
                    className="text-rose-500 hover:bg-rose-500/10 h-10 w-10 p-0 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Colors Tab */}
        <TabsContent value="theme" className="space-y-6">
          <Card className="bg-card border-border text-card-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Palette className="h-4 w-4 text-emerald-500" />
                  {isAr ? 'ألوان وهوية اللاندينغ بيج' : 'Theme Colors'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isAr
                    ? 'تخصيص الألوان الافتراضية لعناصر واجهة الهبوط'
                    : 'Customize primary brand color tokens'}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetColors}
                className="text-xs gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {isAr ? 'استعادة الافتراضي' : 'Reset Defaults'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2 p-3 rounded-xl border border-border bg-muted/20">
                  <Label className="text-xs font-bold">{isAr ? 'اللون الرئيسي (Primary)' : 'Primary Color'}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.theme_colors.primary}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          theme_colors: { ...settings.theme_colors, primary: e.target.value },
                        })
                      }
                      className="h-9 w-12 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={settings.theme_colors.primary}
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. Header & Footer Links Tab — BILINGUAL */}
        <TabsContent value="menu" className="space-y-6">
          <Card className="bg-card border-border text-card-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-emerald-500" />
                  {isAr ? 'روابط القائمة العلوية (Header Links)' : 'Header Navigation Links'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isAr
                    ? 'الروابط التي تظهر في شريط التنقل العلوي للزوار'
                    : 'Manage top navigation menu links'}
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleAddHeaderLink}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {isAr ? 'إضافة رابط' : 'Add Link'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {settings.header_links.map((link, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-3 rounded-xl border border-border bg-muted/20">
                  <div className="md:col-span-4 space-y-1">
                    <span className="text-[10px] font-black text-amber-500">🇸🇦 AR:</span>
                    <Input
                      value={link.label_ar}
                      onChange={(e) => {
                        const updated = [...settings.header_links]
                        updated[idx] = { ...updated[idx], label_ar: e.target.value }
                        setSettings({ ...settings, header_links: updated })
                      }}
                      className="bg-background text-xs font-bold"
                      dir="rtl"
                      placeholder="الاسم بالعربي"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-1">
                    <span className="text-[10px] font-black text-sky-500">🇬🇧 EN:</span>
                    <Input
                      value={link.label_en}
                      onChange={(e) => {
                        const updated = [...settings.header_links]
                        updated[idx] = { ...updated[idx], label_en: e.target.value }
                        setSettings({ ...settings, header_links: updated })
                      }}
                      className="bg-background text-xs font-bold"
                      dir="ltr"
                      placeholder="Label in English"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <span className="text-[10px] font-black text-muted-foreground">URL:</span>
                    <Input
                      value={link.url}
                      onChange={(e) => {
                        const updated = [...settings.header_links]
                        updated[idx] = { ...updated[idx], url: e.target.value }
                        setSettings({ ...settings, header_links: updated })
                      }}
                      className="bg-background text-xs font-mono"
                      placeholder="#features or /page"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end pt-3 md:pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveHeaderLink(idx)}
                      className="text-rose-500 hover:bg-rose-500/10 h-9 w-9 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Footer Links */}
          <Card className="bg-card border-border text-card-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-emerald-500" />
                  {isAr ? 'روابط التذييل السفلي (Footer Links)' : 'Footer Quick Links'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isAr
                    ? 'الروابط الإضافية وروابط الصفحات التعريفية في أسفل الموقع'
                    : 'Manage footer secondary links'}
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleAddFooterLink}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {isAr ? 'إضافة رابط فوتر' : 'Add Link'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {settings.footer_links.map((link, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-3 rounded-xl border border-border bg-muted/20">
                  <div className="md:col-span-4 space-y-1">
                    <span className="text-[10px] font-black text-amber-500">🇸🇦 AR:</span>
                    <Input
                      value={link.label_ar}
                      onChange={(e) => {
                        const updated = [...settings.footer_links]
                        updated[idx] = { ...updated[idx], label_ar: e.target.value }
                        setSettings({ ...settings, footer_links: updated })
                      }}
                      className="bg-background text-xs font-bold"
                      dir="rtl"
                      placeholder="الشروط والأحكام"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-1">
                    <span className="text-[10px] font-black text-sky-500">🇬🇧 EN:</span>
                    <Input
                      value={link.label_en}
                      onChange={(e) => {
                        const updated = [...settings.footer_links]
                        updated[idx] = { ...updated[idx], label_en: e.target.value }
                        setSettings({ ...settings, footer_links: updated })
                      }}
                      className="bg-background text-xs font-bold"
                      dir="ltr"
                      placeholder="Terms & Conditions"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <span className="text-[10px] font-black text-muted-foreground">URL:</span>
                    <Input
                      value={link.url}
                      onChange={(e) => {
                        const updated = [...settings.footer_links]
                        updated[idx] = { ...updated[idx], url: e.target.value }
                        setSettings({ ...settings, footer_links: updated })
                      }}
                      className="bg-background text-xs font-mono"
                      placeholder="/terms"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end pt-3 md:pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFooterLink(idx)}
                      className="text-rose-500 hover:bg-rose-500/10 h-9 w-9 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 8. Live Support Floating Buttons Tab */}
        <TabsContent value="support" className="space-y-6">
          <Card className="bg-card border-border text-card-foreground shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Headphones className="h-4 w-4 text-emerald-500" />
                {isAr ? 'أزرار الدعم الفني المباشر العائمة (Live Support)' : 'Floating Live Support Buttons'}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isAr
                  ? 'التحكم بظهور أزرار واتساب وتلغرام والبريد في الزاوية العائمة للزوار'
                  : 'Manage WhatsApp, Telegram, and Email support floating widgets'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* WhatsApp Support Row */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
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
