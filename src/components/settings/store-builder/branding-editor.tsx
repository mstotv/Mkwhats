'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import {
  Store,
  Sparkles,
  UploadCloud,
  Loader2,
  Palette,
  MessageCircle,
  Phone,
  Link2,
  Plus,
  Trash2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Globe,
  BookOpen,
  Video,
  Download,
  ShoppingBag,
  Calendar,
  Headphones,
  Star,
  Link as LinkIcon,
  Image as ImageIcon,
  BadgeCheck,
  Check,
  MapPin,
  User,
  Sun,
  Moon,
} from 'lucide-react'
import type {
  BusinessType,
  ThemeConfig,
  ContactButtons,
  StorefrontSettings,
  CustomLinkButton,
} from '@/lib/storefront/types'
import { useLocale } from 'next-intl'
import { FLATICON_PRESETS, FLATICON_CATEGORIES, getLinkPreset } from '@/lib/storefront/link-icons'
import { BUTTON_SHAPES, ICON_STYLES } from '@/lib/storefront/theme-tokens'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

function SnapchatIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z" />
    </svg>
  )
}

const CURATED_THEMES = [
  {
    id: 'neon_lime',
    nameAr: 'النيون الليموني الحيوي',
    nameEn: 'Vibrant Neon Lime',
    badge: 'Neon Lime & Obsidian',
    emoji: '⚡',
    businessType: 'bio' as BusinessType,
    primary: '#dcf245',
    accent: '#b84cdb',
    style: 'modern' as const,
    backgroundStyle: 'clean_light' as const,
    descAr: 'مظهر عصري أنيق مع كبسولة سوشيال ميديا وأزرار ليمونية ملفتة وخلفية نقية',
    descEn: 'Modern aesthetic with social media capsule, punchy lime buttons and crisp canvas',
    suggestedBio: 'أهلاً بكم في صفحتي الشخصية! تابعوا أحدث أعمالنا وتواصلوا معنا مباشرة عبر جميع القنوات الرسمية.',
  },
  {
    id: 'cyber_dark',
    nameAr: 'السيبراني الليلي الفاخر',
    nameEn: 'Cyber Obsidian Dark',
    badge: 'Cyber Obsidian Dark',
    emoji: '🌙',
    businessType: 'bio' as BusinessType,
    primary: '#dcf245',
    accent: '#38bdf8',
    style: 'modern' as const,
    backgroundStyle: 'midnight' as const,
    descAr: 'أسود فحمي عميق مع لمسات نيون فسفورية حادة، مظهر مشاهير التقنية وصناع المحتوى',
    descEn: 'Deep obsidian black with vivid neon accents, tailor-made for tech creators',
    suggestedBio: 'صانع محتوى تقني ومطور برمجيات. استكشف مشاريعي وروابطي وأحدث الحلقات من هنا.',
  },
  {
    id: 'rose_luxury',
    nameAr: 'الوردي المخملي الراقي',
    nameEn: 'Rose Velvet Luxury',
    badge: 'Rose Luxury Velvet',
    emoji: '🌸',
    businessType: 'bio' as BusinessType,
    primary: '#f43f5e',
    accent: '#ec4899',
    style: 'luxury' as const,
    backgroundStyle: 'rose_luxury' as const,
    descAr: 'تدرجات الورد والتوت المخملية، مثالي لخبيرات التجميل والمؤثرات وعالم الأزياء',
    descEn: 'Velvet rose and berry gradients, ideal for beauty, fashion and lifestyle influencers',
    suggestedBio: 'أهلاً بكم في مساحتي الخاصة بالجمال والأناقة. تواصلوا معي وتصفحوا أحدث العروض.',
  },
  {
    id: 'warm_mocha',
    nameAr: 'موكا كافيه وكراميل دافئ',
    nameEn: 'Warm Mocha & Gold',
    badge: 'Warm Mocha & Gold',
    emoji: '☕',
    businessType: 'bio' as BusinessType,
    primary: '#d97706',
    accent: '#f59e0b',
    style: 'bento' as const,
    backgroundStyle: 'warm_coffee' as const,
    descAr: 'درجات الكراميل والقهوة المحمصة الدافئة بتناغم جذاب يريح العين',
    descEn: 'Cozy caramel and roasted coffee hues with soothing, warm balance',
    suggestedBio: 'مساحة للإلهام والقهوة وحب التفاصيل. كل ما تبحث عنه متاح في الروابط أدناه.',
  },
  {
    id: 'pure_emerald',
    nameAr: 'الزمردي الطبيعي النقي',
    nameEn: 'Pure Emerald Minimal',
    badge: 'Pure Emerald Minimal',
    emoji: '🌿',
    businessType: 'bio' as BusinessType,
    primary: '#10b981',
    accent: '#059669',
    style: 'minimal' as const,
    backgroundStyle: 'clean_light' as const,
    descAr: 'أخضر زمردي طبيعي ومنعش مع بطاقات بيضاء ناصعة وبساطة مطلقة',
    descEn: 'Fresh emerald green with clean white cards and pure minimalist design',
    suggestedBio: 'أسلوب حياة صحي واستشارات متخصصة. تواصل معي مباشرة عبر أي من الروابط.',
  },
]


interface CustomLinkItemEditorProps {
  link: CustomLinkButton
  index: number
  total: number
  onUpdate: (updates: Partial<CustomLinkButton>) => void
  onDelete: () => void
  onMove: (direction: 'up' | 'down') => void
  onFileUpload: (file: File, folder: 'logos', onDone: (url: string) => void) => Promise<void>
}

function CustomLinkItemEditor({
  link,
  index,
  total,
  onUpdate,
  onDelete,
  onMove,
  onFileUpload,
}: CustomLinkItemEditorProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const isImageCard = link.type === 'image_card'
  const [activeTab, setActiveTab] = useState<'flaticon' | 'custom_image'>(link.image_url ? 'custom_image' : 'flaticon')
  const [category, setCategory] = useState<string>('all')
  const [isUploading, setIsUploading] = useState<boolean>(false)

  const iconsToShow =
    category === 'all'
      ? FLATICON_PRESETS
      : FLATICON_PRESETS.filter((p) => p.category === category)

  const selectedPreset = getLinkPreset(link.icon)

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIsUploading(true)
      await onFileUpload(file, 'logos', (url) => {
        if (isImageCard) {
          onUpdate({
            image_url: url,
            image_card: {
              src: url,
              caption: link.image_card?.caption || link.title,
              description: link.image_card?.description || link.subtitle,
            },
          })
        } else {
          onUpdate({ image_url: url })
        }
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div
      className={`p-3.5 rounded-2xl border transition-all ${
        link.highlight
          ? 'border-lime-500/50 bg-lime-500/5 dark:bg-lime-500/10 shadow-xs'
          : 'border-border/80 bg-background/60 hover:bg-background'
      }`}
    >
      {/* Top Bar: Order, Status, Type, Badge & Delete */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onMove('up')}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              title={isAr ? 'تحريك لأعلى' : 'Move up'}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={() => onMove('down')}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              title={isAr ? 'تحريك لأسفل' : 'Move down'}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="font-semibold text-foreground text-xs mr-1 truncate max-w-[140px]">
            {link.title || (isImageCard ? (isAr ? 'بطاقة صورة' : 'Image Card') : (isAr ? 'زر بدون عنوان' : 'Untitled Button'))}
          </span>

          {/* Type Badge */}
          {isImageCard ? (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              {isAr ? 'بطاقة صورة' : 'Image Card'}
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-muted text-muted-foreground">
              {isAr ? 'رابط وزر' : 'Link Button'}
            </span>
          )}

          {link.highlight && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#dcf245] text-slate-900 border border-[#cae035]">
              {isAr ? 'مميز' : 'Featured'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>{link.is_active !== false ? (isAr ? 'مفعّل' : 'Active') : (isAr ? 'معطّل' : 'Disabled')}</span>
            <Switch
              checked={link.is_active !== false}
              onCheckedChange={(checked) => onUpdate({ is_active: checked })}
            />
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-muted-foreground hover:text-rose-500 rounded-md transition-colors cursor-pointer"
            title={isAr ? 'حذف الزر' : 'Delete item'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Item Type Switcher (Link vs Image Card) */}
      <div className="flex items-center gap-1 mb-3 p-1 bg-muted/50 rounded-xl border border-border/60 w-fit text-xs">
        <button
          type="button"
          onClick={() => onUpdate({ type: 'link' })}
          className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
            !isImageCard ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>{isAr ? 'زر رابط عادي' : 'Standard Link'}</span>
        </button>
        <button
          type="button"
          onClick={() => onUpdate({ type: 'image_card' })}
          className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
            isImageCard ? 'bg-card text-foreground shadow-xs font-bold text-purple-600 dark:text-purple-400' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{isAr ? 'بطاقة صورة مع وصف' : 'Image Card with Description'}</span>
        </button>
      </div>

      {/* 1. IF IMAGE CARD TYPE */}
      {isImageCard ? (
        <div className="space-y-3 text-xs">
          {/* Image Upload Area */}
          <div className="p-3 rounded-xl border border-dashed border-border/80 bg-muted/20 space-y-2">
            <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
              <span>{isAr ? 'صورة البطاقة (Image)' : 'Card Image'}</span>
            </Label>
            <div className="flex items-center gap-3">
              {(link.image_card?.src || link.image_url) && (
                <div className="w-20 h-14 rounded-lg overflow-hidden border border-border shrink-0">
                  <img
                    src={link.image_card?.src || link.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input bg-card hover:bg-muted text-xs font-semibold cursor-pointer transition-all shadow-xs">
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  <span>{isUploading ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'رفع صورة البطاقة' : 'Upload Card Image')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={handleImageFileChange}
                  />
                </label>
                <div className="text-[10px] text-muted-foreground">{isAr ? 'أو أدخل رابط مباشر للصورة بالأسفل' : 'Or enter direct image URL below'}</div>
              </div>
            </div>
            <Input
              value={link.image_card?.src || link.image_url || ''}
              onChange={(e) =>
                onUpdate({
                  image_url: e.target.value,
                  image_card: {
                    src: e.target.value,
                    caption: link.image_card?.caption || link.title,
                    description: link.image_card?.description || link.subtitle,
                  },
                })
              }
              placeholder="https://images.unsplash.com/..."
              dir="ltr"
              className="text-xs h-8 font-mono"
            />
          </div>

          {/* Caption / Title */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">{isAr ? 'عنوان الصورة (Caption)' : 'Image Caption / Title'}</Label>
            <Input
              value={link.image_card?.caption || link.title}
              onChange={(e) =>
                onUpdate({
                  title: e.target.value,
                  image_card: {
                    src: link.image_card?.src || link.image_url || '',
                    caption: e.target.value,
                    description: link.image_card?.description || link.subtitle,
                  },
                })
              }
              placeholder={isAr ? 'مثال: من أعمالنا في تصميم الهويات البصرية' : 'e.g. Featured visual identity showcase'}
              className="text-xs h-8"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? 'وصف توضيحي أسفل الصورة (اختياري)' : 'Description below image (optional)'}</Label>
            <textarea
              rows={2}
              value={link.image_card?.description || link.subtitle || ''}
              onChange={(e) =>
                onUpdate({
                  subtitle: e.target.value,
                  image_card: {
                    src: link.image_card?.src || link.image_url || '',
                    caption: link.image_card?.caption || link.title,
                    description: e.target.value,
                  },
                })
              }
              placeholder={isAr ? 'اكتب نبذة أو تفاصيل إضافية حول هذه الصورة...' : 'Write details or backstory about this image...'}
              className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring leading-relaxed"
            />
          </div>

          {/* Optional Destination URL */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? 'رابط توجيه عند الضغط على الصورة (اختياري)' : 'Click destination URL (optional)'}</Label>
            <Input
              value={link.url}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="https://..."
              dir="ltr"
              className="text-xs h-8 font-mono"
            />
          </div>
        </div>
      ) : (
        /* 2. STANDARD LINK INPUTS */
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Title */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-foreground">{isAr ? 'عنوان الزر النصي' : 'Button Title'}</Label>
              <Input
                value={link.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder={isAr ? 'مثال: ورشة عمل مجانية UI/UX' : 'e.g. Free UI/UX Workshop'}
                className="text-xs h-8"
              />
            </div>

            {/* URL */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-foreground flex items-center justify-between">
                <span>{isAr ? 'رابط التوجيه (URL)' : 'Destination URL'}</span>
                {link.url && link.url.startsWith('http') && (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>{isAr ? 'فتح' : 'Open'}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </Label>
              <Input
                value={link.url}
                onChange={(e) => onUpdate({ url: e.target.value })}
                placeholder="https://example.com/..."
                dir="ltr"
                className="text-xs h-8 font-mono"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? 'نص فرعي توضيحي (اختياري)' : 'Subtitle (Optional)'}</Label>
              <Input
                value={link.subtitle || ''}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                placeholder={isAr ? 'مثال: احجز مقعدك المباشر • متاح لفترة محدودة' : 'e.g. Limited spots available • Enroll today'}
                className="text-xs h-8"
              />
            </div>

            {/* Highlight switch */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{isAr ? 'تمييز الزر بلون ملفت (Highlight)' : 'Highlight Button'}</span>
                </span>
                <p className="text-[10px] text-muted-foreground">{isAr ? 'خلفية ليمونية وبادج جديد لجذب الزوار' : 'Vibrant accent & badge to attract attention'}</p>
              </div>
              <Switch
                checked={Boolean(link.highlight)}
                onCheckedChange={(checked) => onUpdate({ highlight: checked })}
              />
            </div>
          </div>

          {/* Color & Shape Overrides for this Button */}
          <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
            <div className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-500" />
              <span>{isAr ? 'تخصيص ألوان وشكل هذا الزر تحديداً (اختياري)' : 'Button Color & Shape Overrides (Optional)'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{isAr ? 'لون خلفية الزر' : 'Button Background'}</Label>
                <div className="flex items-center gap-1.5" dir="ltr">
                  <input
                    type="color"
                    value={link.bg_color || '#ffffff'}
                    onChange={(e) => onUpdate({ bg_color: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border p-0.5"
                  />
                  <Input
                    value={link.bg_color || ''}
                    onChange={(e) => onUpdate({ bg_color: e.target.value })}
                    placeholder="#ffffff"
                    className="text-[10px] h-7 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{isAr ? 'لون نص الزر' : 'Button Text Color'}</Label>
                <div className="flex items-center gap-1.5" dir="ltr">
                  <input
                    type="color"
                    value={link.text_color || '#000000'}
                    onChange={(e) => onUpdate({ text_color: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border p-0.5"
                  />
                  <Input
                    value={link.text_color || ''}
                    onChange={(e) => onUpdate({ text_color: e.target.value })}
                    placeholder="#000000"
                    className="text-[10px] h-7 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{isAr ? 'شكل زوايا الزر' : 'Button Corner Shape'}</Label>
                <select
                  value={link.btn_shape || ''}
                  onChange={(e) => onUpdate({ btn_shape: (e.target.value || undefined) as any })}
                  className="w-full h-7 rounded-md border border-input bg-background px-2 text-[11px]"
                >
                  <option value="">{isAr ? 'حسب النمط العام' : 'Default Theme Style'}</option>
                  <option value="pill">{isAr ? 'مستدير كامل (Pill)' : 'Full Pill'}</option>
                  <option value="soft">{isAr ? 'حواف ناعمة (Soft)' : 'Soft Rounded'}</option>
                  <option value="rounded">{isAr ? 'زوايا خفيفة (Rounded)' : 'Rounded'}</option>
                  <option value="sharp">{isAr ? 'زوايا حادة (Sharp)' : 'Sharp Corners'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Icon & Logo Selector */}
          <div className="space-y-2 pt-1 border-t border-border/40">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <span>{isAr ? 'أيقونة أو لوغو الزر' : 'Button Icon or Logo'}</span>
              </Label>

              <div className="flex items-center p-0.5 bg-muted rounded-lg border border-border text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveTab('flaticon')}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    activeTab === 'flaticon'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{isAr ? 'مكتبة الأيقونات' : 'Icon Library'}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/10 text-purple-600 font-bold">
                    {FLATICON_PRESETS.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('custom_image')}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    activeTab === 'custom_image'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>{isAr ? 'رفع لوغو/صورة' : 'Upload Image/Logo'}</span>
                </button>
              </div>
            </div>

            {/* FLATICON PRESET GRID */}
            {activeTab === 'flaticon' && (
              <div className="space-y-2 pt-1">
                {/* Category Badges */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                  {FLATICON_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-2 py-0.5 rounded-md shrink-0 transition-all font-medium cursor-pointer ${
                        category === cat.id
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {isAr ? (cat.labelAr || cat.label) : (cat.labelEn || cat.label)}
                    </button>
                  ))}
                </div>

                {/* Icons Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1 bg-muted/15 rounded-xl border border-border/50">
                  {iconsToShow.map((preset) => {
                    const isSelected = link.icon === preset.id && !link.image_url
                    const IconComp = preset.icon
                    const iconLabel = isAr ? (preset.labelAr || preset.label) : (preset.labelEn || preset.label)
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          onUpdate({ icon: preset.id, image_url: undefined })
                        }}
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 relative cursor-pointer ${
                          isSelected
                            ? 'border-purple-600 bg-purple-500/10 ring-1 ring-purple-500/40 shadow-xs'
                            : 'border-border/60 bg-card hover:bg-muted/60'
                        }`}
                        title={iconLabel}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${preset.bgClass} ${preset.textClass} ${preset.borderClass}`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-medium text-foreground truncate max-w-full">
                          {iconLabel}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* CUSTOM IMAGE / LOGO */}
            {activeTab === 'custom_image' && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="p-3 rounded-xl border border-dashed border-border/80 hover:border-purple-500 bg-muted/10 hover:bg-purple-500/5 text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors">
                    {isUploading ? <Loader2 className="w-5 h-5 text-purple-600 animate-spin" /> : <UploadCloud className="w-5 h-5 text-purple-600" />}
                    <span className="text-xs font-semibold text-foreground">
                      {isUploading ? (isAr ? 'جاري رفع الملف...' : 'Uploading...') : (isAr ? 'اضغط لاختيار صورة من جهازك' : 'Click to select image')}
                    </span>
                    <span className="text-[9px] text-muted-foreground">PNG, JPG, SVG, WebP</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={handleImageFileChange}
                    />
                  </label>

                  <div className="space-y-1.5 flex flex-col justify-center">
                    <Label className="text-[10px] text-muted-foreground font-medium">
                      {isAr ? 'أو الصق رابط صورة/أيقونة من Flaticon أو أي موقع:' : 'Or paste direct icon / image URL:'}
                    </Label>
                    <Input
                      placeholder="https://cdn-icons-png.flaticon.com/..."
                      value={link.image_url || ''}
                      onChange={(e) => onUpdate({ image_url: e.target.value })}
                      dir="ltr"
                      className="text-[11px] h-8 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function BrandingEditor({
  storeName,
  setStoreName,
  businessType,
  setBusinessType,
  bio,
  setBio,
  logoUrl,
  setLogoUrl,
  bannerUrl,
  setBannerUrl,
  themeConfig,
  setThemeConfig,
  contactButtons,
  setContactButtons,
  settings,
  setSettings,
}: {
  storeName: string
  setStoreName: (v: string) => void
  businessType: BusinessType
  setBusinessType: (v: BusinessType) => void
  bio: string
  setBio: (v: string) => void
  logoUrl: string
  setLogoUrl: (v: string) => void
  bannerUrl: string
  setBannerUrl: (v: string) => void
  themeConfig: ThemeConfig
  setThemeConfig: React.Dispatch<React.SetStateAction<ThemeConfig>>
  contactButtons: ContactButtons
  setContactButtons: React.Dispatch<React.SetStateAction<ContactButtons>>
  settings: StorefrontSettings
  setSettings: React.Dispatch<React.SetStateAction<StorefrontSettings>>
}) {
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  const locale = useLocale()
  const isAr = locale === 'ar'

  const customLinks: CustomLinkButton[] = settings.custom_links || []

  const handleAddCustomLink = (type: 'link' | 'image_card' = 'link') => {
    const newLink: CustomLinkButton = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `link_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: type === 'image_card' ? (isAr ? 'بطاقة صورة جديدة' : 'New Image Card') : (isAr ? 'رابط جديد' : 'New Link'),
      url: type === 'image_card' ? '' : 'https://',
      subtitle: '',
      icon: 'link',
      highlight: false,
      is_active: true,
      type,
    }
    setSettings((prev) => ({
      ...prev,
      custom_links: [...(prev.custom_links || []), newLink],
    }))
    toast.success(type === 'image_card' ? (isAr ? 'تمت إضافة بطاقة صورة جديدة' : 'Added new image card') : (isAr ? 'تمت إضافة زر جديد للقائمة' : 'Added new link button'))
  }

  const handleUpdateCustomLink = (id: string, updates: Partial<CustomLinkButton>) => {
    setSettings((prev) => ({
      ...prev,
      custom_links: (prev.custom_links || []).map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }))
  }

  const handleDeleteCustomLink = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      custom_links: (prev.custom_links || []).filter((l) => l.id !== id),
    }))
    toast.success(isAr ? 'تم حذف العنصر' : 'Item deleted')
  }

  const handleMoveCustomLink = (index: number, direction: 'up' | 'down') => {
    const list = [...(settings.custom_links || [])]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= list.length) return
    const [moved] = list.splice(index, 1)
    list.splice(targetIndex, 0, moved)
    setSettings((prev) => ({ ...prev, custom_links: list }))
  }

  const handleFileUpload = async (file: File, folder: 'logos' | 'banners', onDone: (url: string) => void) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const res = await fetch('/api/storefront/upload', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (json.url) {
        onDone(json.url)
        toast.success(isAr ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully')
      } else {
        toast.error(json.error || (isAr ? 'فشل رفع الصورة' : 'Failed to upload image'))
      }
    } catch {
      toast.error(isAr ? 'حدث خطأ أثناء رفع الملف' : 'Error uploading file')
    }
  }

  const applyCuratedTheme = (t: (typeof CURATED_THEMES)[0]) => {
    if (setBusinessType) setBusinessType('bio')
    const isDark = t.id === 'cyber_dark' || t.backgroundStyle === 'midnight'
    setThemeConfig((prev) => ({
      ...prev,
      primary_color: t.primary,
      accent_color: t.accent,
      style: t.style,
      background_style: t.backgroundStyle,
      theme_preset: t.id,
      dark_mode: isDark ? 'dark' : (prev.dark_mode || 'light'),
    }))

    setBio(t.suggestedBio)
    toast.success(isAr ? `تم تطبيق ثيم "${t.nameAr}" بنجاح` : `Applied theme "${t.nameEn}" successfully`)
  }

  const isVerified = themeConfig.verified ?? true
  const verifiedColor = themeConfig.verified_color || '#FBBF24'

  return (
    <div className="space-y-7" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Curated Bio-Link Themes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>{isAr ? 'ثيمات وتدرجات ألوان البايو لينك (Bio Link Themes)' : 'Bio Link Themes & Palettes'}</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'اختر مظهرك المفضل بنقرة واحدة — ألوان نيون ليمونية، أسود ملكي، سيبراني، أو وردي مخملي'
                : 'Choose your favorite look in one click — Neon Lime, Cyber Obsidian, Velvet Rose, or Warm Mocha'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CURATED_THEMES.map((theme) => {
            const isCurrent =
              themeConfig.theme_preset === theme.id ||
              themeConfig.primary_color === theme.primary
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => applyCuratedTheme(theme)}
                className={`p-3.5 rounded-2xl border ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between relative group cursor-pointer ${
                  isCurrent
                    ? 'border-purple-600 bg-purple-500/10 ring-1 ring-purple-500/50 shadow-xs'
                    : 'border-border bg-card hover:bg-muted/60'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{theme.emoji}</span>
                    <div className="flex items-center gap-1">
                      <span className="w-3.5 h-3.5 rounded-full shadow-xs border border-white/20" style={{ backgroundColor: theme.primary }} />
                      <span className="w-3.5 h-3.5 rounded-full opacity-80" style={{ backgroundColor: theme.accent }} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{isAr ? theme.nameAr : theme.nameEn}</div>
                    <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">{theme.badge}</div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{isAr ? theme.descAr : theme.descEn}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Default Color Mode Switcher */}
        <div className="p-3.5 rounded-2xl border border-border bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'وضع الألوان الافتراضي للصفحة (Default Mode)' : 'Default Color Mode (Light / Dark)'}</span>
            </span>
            <p className="text-[11px] text-muted-foreground">
              {isAr
                ? 'حدد النمط اللوني الذي تفتح به صفحتك للزوار افتراضياً (يمكن للزائر أيضاً التبديل بين الفاتح والداكن عبر الزر العائم).'
                : 'Select the default theme for visitors (visitors can also switch modes with floating toggle).'}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/80 shrink-0">
            <button
              type="button"
              onClick={() => setThemeConfig((prev) => ({ ...prev, dark_mode: 'light' }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                (themeConfig.dark_mode || 'light') === 'light'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? 'فاتح (Light)' : 'Light'}</span>
            </button>
            <button
              type="button"
              onClick={() => setThemeConfig((prev) => ({ ...prev, dark_mode: 'dark' }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                themeConfig.dark_mode === 'dark'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              <span>{isAr ? 'ليلي (Dark)' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Logo & Banner Uploader */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Logo */}
        <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
          <Label className="text-xs font-semibold">{isAr ? 'الصورة الشخصية أو الشعار (Profile Avatar)' : 'Profile Avatar or Logo'}</Label>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl border border-border bg-muted/40 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-6 h-6 text-muted-foreground/40" />
              )}
            </div>

            <div className="flex-1">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input bg-background hover:bg-muted text-xs font-medium cursor-pointer transition-colors">
                {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                <span>{uploadingLogo ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'تغيير الشعار' : 'Change Avatar')}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingLogo}
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setUploadingLogo(true)
                      await handleFileUpload(f, 'logos', setLogoUrl)
                      setUploadingLogo(false)
                    }
                  }}
                />
              </label>
              <div className="text-[10px] text-muted-foreground mt-1">{isAr ? 'موصى به: 500×500 بكسل PNG مربع.' : 'Recommended: 500×500px square PNG.'}</div>
            </div>
          </div>
        </div>

        {/* Banner & Background */}
        <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">{isAr ? 'صورة الغلاف وخلفية الصفحة (Cover Banner & Background)' : 'Cover Banner & Background'}</Label>
            {bannerUrl && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {isAr ? 'تم رفع الصورة' : 'Image Uploaded'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 h-14 rounded-2xl border border-border bg-muted/40 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-muted-foreground/60">{isAr ? 'بدون صورة' : 'No Image'}</span>
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input bg-background hover:bg-muted text-xs font-medium cursor-pointer transition-colors">
                  {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  <span>{uploadingBanner ? (isAr ? 'جاري الرفع...' : 'Uploading...') : bannerUrl ? (isAr ? 'تغيير الصورة' : 'Change Image') : (isAr ? 'رفع صورة' : 'Upload Image')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingBanner}
                    onChange={async (e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        setUploadingBanner(true)
                        await handleFileUpload(f, 'banners', setBannerUrl)
                        setUploadingBanner(false)
                      }
                    }}
                  />
                </label>

                {bannerUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setBannerUrl('')
                      toast.success(isAr ? 'تمت إزالة صورة الغلاف/الخلفية' : 'Cover banner removed')
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إزالة' : 'Remove'}</span>
                  </button>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">{isAr ? 'صورة عالية الدقة تظهر كخلفية كاملة أو غلاف علوي.' : 'High-res image that appears as full background or top cover.'}</div>
            </div>
          </div>

          {/* Display Mode Selector */}
          {bannerUrl && (
            <div className="pt-2 border-t border-border/60 space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? 'طريقة عرض الصورة في صفحة البايو والمعاينة:' : 'Display mode in bio page & preview:'}</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setThemeConfig((prev) => ({ ...prev, banner_mode: 'background' }))}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    (themeConfig.banner_mode || 'background') === 'background'
                      ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                      : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span>{isAr ? '🖼️ خلفية كاملة للصفحة' : '🖼️ Full Background'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemeConfig((prev) => ({ ...prev, banner_mode: 'banner' }))}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    themeConfig.banner_mode === 'banner'
                      ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                      : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span>{isAr ? '🌄 غلاف علوي للبروفايل' : '🌄 Top Banner'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Verified Badge Customization (توثيق الحساب) */}
      <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'شارة التوثيق الرسمية (Verified Badge)' : 'Official Verified Badge'}</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'تظهر شارة التوثيق الاحترافية بجانب الاسم وعلى الصورة الرمزية لزيادة المصداقية وثقة الزوار'
                : 'Show a verified badge beside your name and avatar to boost credibility and trust.'}
            </p>
          </div>
          <Switch
            checked={isVerified}
            onCheckedChange={(checked) =>
              setThemeConfig((prev) => ({ ...prev, verified: checked }))
            }
          />
        </div>

        {isVerified && (
          <div className="pt-2 border-t border-border/50 flex items-center gap-3 flex-wrap text-xs">
            <span className="text-muted-foreground">{isAr ? 'لون شارة التوثيق:' : 'Badge color:'}</span>
            <div className="flex items-center gap-2">
              {[
                { name: isAr ? 'ذهبي كلاسيكي' : 'Classic Gold', color: '#FBBF24' },
                { name: isAr ? 'سماوي تليقرام' : 'Telegram Cyan', color: '#06B6D4' },
                { name: isAr ? 'أخضر موثوق' : 'Trusted Green', color: '#10B981' },
                { name: isAr ? 'بنفسجي ملكي' : 'Royal Purple', color: '#8B5CF6' },
                { name: isAr ? 'وردي جريء' : 'Bold Pink', color: '#EC4899' },
              ].map((p) => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => setThemeConfig((prev) => ({ ...prev, verified_color: p.color }))}
                  className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                    verifiedColor === p.color ? 'border-foreground scale-110 shadow-xs' : 'border-transparent opacity-80'
                  }`}
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                >
                  {verifiedColor === p.color && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                </button>
              ))}

              <div className="flex items-center gap-1 mr-2" dir="ltr">
                <input
                  type="color"
                  value={verifiedColor}
                  onChange={(e) => setThemeConfig((prev) => ({ ...prev, verified_color: e.target.value }))}
                  className="w-6 h-6 rounded border cursor-pointer p-0.5"
                />
                <span className="font-mono text-[11px] text-muted-foreground uppercase">{verifiedColor}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Name & Bio / Description */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card space-y-4">
        {/* Display Name */}
        <div className="space-y-1.5">
          <Label htmlFor="store-display-name" className="text-sm font-semibold flex items-center gap-1.5">
            <User className="w-4 h-4 text-primary" />
            <span>{isAr ? 'الاسم المعروض (Display Name)' : 'Display Name'}</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? 'الاسم الرئيسي الذي يظهر في أعلى البروفايل وبجانب علامة التوثيق.'
              : 'The primary name shown at the top of your profile and beside the badge.'}
          </p>
          <Input
            id="store-display-name"
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder={isAr ? 'مثال: مصطفى، أو متجر الأناقة...' : 'e.g. Mustafa, or Tech Studio...'}
            className="rounded-xl h-10 text-sm font-medium"
          />
        </div>

        {/* Bio / Description */}
        <div className="border-t border-border/50 pt-3 space-y-1.5">
          <Label htmlFor="store-bio" className="text-sm font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'نبذة المتجر والبيو (Bio & Description)' : 'Bio & Description'}</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? 'النص التعريفي الذي يظهر مباشرة أسفل الاسم في صفحة المتجر والبايو لينك.'
              : 'Short description that appears directly below your name on your bio page.'}
          </p>
          <textarea
            id="store-bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={isAr ? 'اكتب النبذة أو الوصف التعريفي الخاص بك هنا...' : 'Write your bio or description here...'}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring leading-relaxed"
          />
        </div>
      </div>

      {/* 5. Button Shapes & Icon Styles Customization */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card space-y-4">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-purple-500" />
            <span>{isAr ? 'أشكال الأزرار والأيقونات (Button & Icon Design)' : 'Button & Icon Design'}</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? 'حدد شكل زوايا الأزرار ونمط الأيقونات ليتطابق تماماً مع هويتك البصرية'
              : 'Set button corner shapes and icon styles to perfectly match your branding'}
          </p>
        </div>

        {/* Button Shapes */}
        <div className="space-y-2 pt-1">
          <Label className="text-xs font-semibold">{isAr ? 'شكل حواف الأزرار (Button Shape)' : 'Button Corner Shape'}</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BUTTON_SHAPES.map((shape) => {
              const active = (themeConfig.button_shape || 'soft') === shape.id
              const shapeLabel = isAr ? (shape.labelAr || shape.label) : (shape.labelEn || shape.label)
              return (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => setThemeConfig((prev) => ({ ...prev, button_shape: shape.id as any }))}
                  className={`p-3 border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${shape.class} ${
                    active
                      ? 'border-purple-600 bg-purple-500/10 ring-1 ring-purple-500/50 shadow-xs'
                      : 'border-border bg-background hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-16 h-4 border border-purple-500/40 bg-purple-500/20 ${shape.class}`} />
                  <span className="text-[11px] font-medium text-foreground">{shapeLabel}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Icon Styles */}
        <div className="space-y-2 pt-1">
          <Label className="text-xs font-semibold">{isAr ? 'أسلوب الأيقونات (Icon Style)' : 'Icon Style'}</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ICON_STYLES.map((iconSt) => {
              const active = (themeConfig.icon_style || 'soft_bg') === iconSt.id
              const styleLabel = isAr ? (iconSt.labelAr || iconSt.label) : (iconSt.labelEn || iconSt.label)
              const styleDesc = isAr ? (iconSt.descAr || iconSt.description) : (iconSt.descEn || iconSt.description)
              return (
                <button
                  key={iconSt.id}
                  type="button"
                  onClick={() => setThemeConfig((prev) => ({ ...prev, icon_style: iconSt.id as any }))}
                  className={`p-2.5 rounded-xl border ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col gap-1 cursor-pointer ${
                    active
                      ? 'border-purple-600 bg-purple-500/10 ring-1 ring-purple-500/50 shadow-xs'
                      : 'border-border bg-background hover:bg-muted/50'
                  }`}
                >
                  <span className="text-xs font-bold text-foreground">{styleLabel}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{styleDesc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Global Button Color & Text Color */}
        <div className="pt-2 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium">{isAr ? 'لون خلفية الأزرار الافتراضي' : 'Default Button Background'}</Label>
            <div className="flex items-center gap-2" dir="ltr">
              <input
                type="color"
                value={themeConfig.button_color || '#ffffff'}
                onChange={(e) => setThemeConfig((prev) => ({ ...prev, button_color: e.target.value }))}
                className="w-7 h-7 rounded cursor-pointer border p-0.5"
              />
              <Input
                value={themeConfig.button_color || ''}
                onChange={(e) => setThemeConfig((prev) => ({ ...prev, button_color: e.target.value }))}
                placeholder={isAr ? 'تلقائي (حسب الثيم)' : 'Auto (Theme Default)'}
                className="text-xs h-8 font-mono uppercase"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">{isAr ? 'لون نص الأزرار الافتراضي' : 'Default Button Text Color'}</Label>
            <div className="flex items-center gap-2" dir="ltr">
              <input
                type="color"
                value={themeConfig.button_text_color || '#0f172a'}
                onChange={(e) => setThemeConfig((prev) => ({ ...prev, button_text_color: e.target.value }))}
                className="w-7 h-7 rounded cursor-pointer border p-0.5"
              />
              <Input
                value={themeConfig.button_text_color || ''}
                onChange={(e) => setThemeConfig((prev) => ({ ...prev, button_text_color: e.target.value }))}
                placeholder={isAr ? 'تلقائي (داكن/فاتح)' : 'Auto (Dark/Light)'}
                className="text-xs h-8 font-mono uppercase"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. Contact Buttons & Social Links */}
      <div className="p-4 rounded-2xl border border-border bg-card space-y-4">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            <span>{isAr ? 'أزرار التواصل وروابط السوشيال ميديا (Social Media Links)' : 'Contact Buttons & Social Media Links'}</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? 'تظهر كأيقونات تفاعلية في شريط السوشيال ميديا الكبسولي. املأ الروابط التي ترغب بإظهارها.'
              : 'Interactive icons in the social capsule bar. Fill in the channels you wish to display.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {/* WhatsApp */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isAr ? 'رقم الواتساب المباشر (WhatsApp)' : 'Direct WhatsApp Number'}</span>
            </Label>
            <Input
              value={contactButtons.whatsapp_number || ''}
              onChange={(e) =>
                setContactButtons((prev) => ({ ...prev, whatsapp_number: e.target.value }))
              }
              placeholder={isAr ? 'مثال: +9647701234567' : 'e.g. +9647701234567'}
              dir="ltr"
              className="text-xs font-mono"
            />
          </div>

          {/* Direct Phone */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Phone className="w-3.5 h-3.5 text-blue-500" />
              <span>{isAr ? 'رقم الاتصال الهاتفي المباشر (Phone Call)' : 'Direct Phone Number'}</span>
            </Label>
            <Input
              value={contactButtons.phone_number || ''}
              onChange={(e) =>
                setContactButtons((prev) => ({ ...prev, phone_number: e.target.value }))
              }
              placeholder={isAr ? 'مثال: +9647701234567' : 'e.g. +9647701234567'}
              dir="ltr"
              className="text-xs font-mono"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1.5 text-pink-600 dark:text-pink-400">
              <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
              <span>{isAr ? 'رابط حساب إنستغرام (Instagram)' : 'Instagram Profile URL'}</span>
            </Label>
            <Input
              value={contactButtons.instagram || ''}
              onChange={(e) =>
                setContactButtons((prev) => ({ ...prev, instagram: e.target.value }))
              }
              placeholder="https://instagram.com/yourhandle"
              dir="ltr"
              className="text-xs"
            />
          </div>

          {/* Snapchat */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
              <SnapchatIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{isAr ? 'رابط أو يوزر سناب شات (Snapchat)' : 'Snapchat Profile or Username'}</span>
            </Label>
            <Input
              value={contactButtons.snapchat || ''}
              onChange={(e) =>
                setContactButtons((prev) => ({ ...prev, snapchat: e.target.value }))
              }
              placeholder={isAr ? 'https://snapchat.com/add/username أو username' : 'https://snapchat.com/add/username or username'}
              dir="ltr"
              className="text-xs font-mono"
            />
          </div>

          {/* TikTok */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1.5 text-foreground">
              <span className="w-2 h-2 rounded-full bg-foreground inline-block" />
              <span>{isAr ? 'رابط حساب تيك توك (TikTok)' : 'TikTok Profile URL'}</span>
            </Label>
            <Input
              value={contactButtons.tiktok || ''}
              onChange={(e) =>
                setContactButtons((prev) => ({ ...prev, tiktok: e.target.value }))
              }
              placeholder="https://tiktok.com/@youraccount"
              dir="ltr"
              className="text-xs font-mono"
            />
          </div>

          {/* Facebook */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1.5 text-[#1877F2] dark:text-[#4599FF]">
              <span className="w-2 h-2 rounded-full bg-[#1877F2] inline-block" />
              <span>{isAr ? 'رابط صفحة أو حساب فيسبوك (Facebook)' : 'Facebook Page or Profile URL'}</span>
            </Label>
            <Input
              value={contactButtons.facebook || ''}
              onChange={(e) =>
                setContactButtons((prev) => ({ ...prev, facebook: e.target.value }))
              }
              placeholder="https://facebook.com/yourpage"
              dir="ltr"
              className="text-xs"
            />
          </div>

          {/* Twitter / X */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1.5 text-foreground">
              <span className="w-2 h-2 rounded-full bg-foreground inline-block" />
              <span>{isAr ? 'رابط حساب إكس / تويتر (X - Twitter)' : 'X / Twitter Profile URL'}</span>
            </Label>
            <Input
              value={contactButtons.twitter || ''}
              onChange={(e) =>
                setContactButtons((prev) => ({ ...prev, twitter: e.target.value }))
              }
              placeholder="https://x.com/yourhandle"
              dir="ltr"
              className="text-xs font-mono"
            />
          </div>

          {/* YouTube */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1.5 text-red-600 dark:text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              <span>{isAr ? 'رابط قناة يوتيوب (YouTube)' : 'YouTube Channel URL'}</span>
            </Label>
            <Input
              value={contactButtons.youtube || ''}
              onChange={(e) =>
                setContactButtons((prev) => ({ ...prev, youtube: e.target.value }))
              }
              placeholder="https://youtube.com/@channel"
              dir="ltr"
              className="text-xs"
            />
          </div>

          {/* Telegram */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1.5 text-[#24A1DE]">
              <span className="w-2 h-2 rounded-full bg-[#24A1DE] inline-block" />
              <span>{isAr ? 'رابط أو يوزر تليقرام (Telegram)' : 'Telegram Channel or Username'}</span>
            </Label>
            <Input
              value={contactButtons.telegram || ''}
              onChange={(e) =>
                setContactButtons((prev) => ({ ...prev, telegram: e.target.value }))
              }
              placeholder="https://t.me/username"
              dir="ltr"
              className="text-xs font-mono"
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1.5 text-[#0A66C2]">
              <span className="w-2 h-2 rounded-full bg-[#0A66C2] inline-block" />
              <span>{isAr ? 'رابط حساب لينكد إن (LinkedIn)' : 'LinkedIn Profile URL'}</span>
            </Label>
            <Input
              value={contactButtons.linkedin || ''}
              onChange={(e) =>
                setContactButtons((prev) => ({ ...prev, linkedin: e.target.value }))
              }
              placeholder="https://linkedin.com/in/username"
              dir="ltr"
              className="text-xs font-mono"
            />
          </div>

          {/* Google Maps / Location */}
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs font-medium flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isAr ? 'رابط الموقع على خرائط جوجل (Google Maps Location)' : 'Google Maps Location URL'}</span>
            </Label>
            <Input
              value={contactButtons.maps_url || ''}
              onChange={(e) =>
                setContactButtons((prev) => ({ ...prev, maps_url: e.target.value }))
              }
              placeholder="https://maps.google.com/?q=..."
              dir="ltr"
              className="text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* 9. Custom Link Buttons & Image Cards */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-purple-500" />
              <span>{isAr ? 'الأزرار والروابط المخصصة وبطاقات الصور' : 'Custom Links & Image Cards'}</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'أضف روابط مخصصة مع أيقونات ملونة، أو أضف بطاقات صور غامرة مع عنوان ووصف'
                : 'Add custom links with colorful icons, or add immersive image cards with caption & description'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleAddCustomLink('link')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة رابط' : 'Add Link'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddCustomLink('image_card')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة بطاقة صورة' : 'Add Image Card'}</span>
            </button>
          </div>
        </div>

        {customLinks.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-border/80 text-center space-y-3 bg-muted/10">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
              <Link2 className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-foreground">{isAr ? 'لم تقم بإضافة روابط أو بطاقات بعد' : 'No links or cards added yet'}</div>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              {isAr
                ? 'أضف روابطك وقنواتك وعروضك الترويجية مع أيقونات ملونة أو أضف بطاقات صور مميزة لصفحتك.'
                : 'Add your links, social channels, and featured offers with colorful icons or image cards.'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleAddCustomLink('link')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة رابط' : 'Add Link'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddCustomLink('image_card')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-all cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة بطاقة صورة' : 'Add Image Card'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {customLinks.map((link, idx) => (
              <CustomLinkItemEditor
                key={link.id}
                link={link}
                index={idx}
                total={customLinks.length}
                onUpdate={(updates) => handleUpdateCustomLink(link.id, updates)}
                onDelete={() => handleDeleteCustomLink(link.id)}
                onMove={(dir) => handleMoveCustomLink(idx, dir)}
                onFileUpload={handleFileUpload}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
