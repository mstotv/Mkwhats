'use client'

import { useState, useRef } from 'react'
import {
  Star,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Image as ImageIcon,
  Building2,
  User,
  Quote,
  CheckCircle2,
  Eye,
  EyeOff,
  RotateCcw,
  Gauge,
  Clock,
  Sparkles,
  Sliders,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { TestimonialItem, DEFAULT_TESTIMONIALS } from '@/lib/types/home-cms'

interface ReviewsTabProps {
  isAr: boolean
  testimonials: TestimonialItem[]
  speedSeconds?: number
  onChange: (updated: TestimonialItem[]) => void
  onSpeedChange?: (speed: number) => void
}

export function ReviewsTab({
  isAr,
  testimonials,
  speedSeconds = 120,
  onChange,
  onSpeedChange,
}: ReviewsTabProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  const handleAddReview = () => {
    const newId = `review-${Date.now()}`
    const newReview: TestimonialItem = {
      id: newId,
      visible: true,
      name_ar: 'عميل جديد / اسم الشركة',
      name_en: 'New Client / Company Name',
      role_ar: 'النشاط التجاري أو المسمى الوظيفي',
      role_en: 'Business Industry or Title',
      quote_ar: 'اكتب هنا تجربة العميل أو الشركة مع المنصة، والنتائج الإيجابية التي تحققت.',
      quote_en: 'Write here the review and positive impact achieved with the platform.',
      stars: 5,
      avatar_initial: '⭐',
      image_url: '',
    }
    onChange([...testimonials, newReview])
  }

  const handleRemoveReview = (index: number) => {
    onChange(testimonials.filter((_, i) => i !== index))
  }

  const handleMoveReview = (index: number, direction: 'up' | 'down') => {
    const list = [...testimonials]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= list.length) return
    const [moved] = list.splice(index, 1)
    list.splice(target, 0, moved)
    onChange(list)
  }

  const handleUpdateReview = (index: number, field: keyof TestimonialItem, value: any) => {
    const list = [...testimonials]
    list[index] = { ...list[index], [field]: value }
    onChange(list)
  }

  const handleImageFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingIndex(index)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        handleUpdateReview(index, 'image_url', data.url)
      } else {
        alert(data.error || 'فشل رفع الصورة')
      }
    } catch (err) {
      console.error('Image upload failed:', err)
      alert(isAr ? 'حدث خطأ أثناء رفع الصورة' : 'Error uploading image')
    } finally {
      setUploadingIndex(null)
      if (e.target) e.target.value = ''
    }
  }

  const handleResetDefaults = () => {
    if (confirm(isAr ? 'هل أنت متأكد من استعادة المراجعات الافتراضية؟' : 'Reset to default testimonials?')) {
      onChange(DEFAULT_TESTIMONIALS)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Info & Actions */}
      <Card className="border-border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Star className="h-5 w-5 text-amber-500 shrink-0 fill-amber-500" />
              {isAr ? 'إدارة المراجعات وتجارب العملاء والشركات' : 'Reviews & Customer Testimonials CMS'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isAr
                ? 'أضف وعدّل مراجعات العملاء وقصص النجاح المعروضة في الصفحة الرئيسية مع صور الأشخاص أو شعارات الشركات، والتقييم بالنجوم (1-5).'
                : 'Manage customer and company reviews on the Home page, including avatars/logos, star ratings (1-5), and quotes.'}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {isAr ? 'استعادة الافتراضي' : 'Reset Defaults'}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleAddReview}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {isAr ? 'إضافة مراجعة جديدة' : 'Add New Review'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* ── Scroll Speed Controller Card ── */}
      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] via-card to-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Gauge className="h-4 w-4 text-amber-500" />
                {isAr ? 'سرعة حركة وتمرير المراجعات في الصفحة الرئيسية' : 'Landing Page Testimonials Scrolling Speed'}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isAr
                  ? 'تحكم في سرعة صعود بطاقات المراجعات عمودياً. زيادة الثواني تجعل التمرير أبطأ وأكثر راحة وهدوءاً للقراءة.'
                  : 'Adjust vertical marquee speed. Higher duration makes scrolling slower and more relaxing for visitors.'}
              </CardDescription>
            </div>

            {/* Live Speed Badge */}
            <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold shadow-xs">
              <Clock className="h-3.5 w-3.5 animate-pulse" />
              <span>
                {speedSeconds} {isAr ? 'ثانية للّفة الكاملة' : 'sec / cycle'}
              </span>
              <span className="text-[10px] opacity-75 font-sans font-semibold">
                ({speedSeconds >= 180
                  ? isAr ? 'هادئ جداً' : 'Ultra Slow'
                  : speedSeconds >= 110
                  ? isAr ? 'متوازن ومريح' : 'Balanced'
                  : speedSeconds >= 60
                  ? isAr ? 'متوسط' : 'Moderate'
                  : isAr ? 'سريع' : 'Fast'})
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {/* Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>{isAr ? 'سريع وحيوي (20 ثانية)' : 'Fast (20s)'}</span>
              <span className="text-foreground font-bold">{speedSeconds}s</span>
              <span>{isAr ? 'بطيء جداً ومريح (300 ثانية)' : 'Ultra Slow (300s)'}</span>
            </div>
            <input
              type="range"
              min={20}
              max={300}
              step={5}
              value={speedSeconds}
              onChange={(e) => onSpeedChange?.(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Quick Presets Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mr-1">
              <Sliders className="h-3 w-3" />
              {isAr ? 'خيارات جاهزة:' : 'Presets:'}
            </span>
            {[
              { val: 220, label_ar: 'بطيء ومريح جداً (220s)', label_en: 'Ultra Slow (220s)' },
              { val: 130, label_ar: 'هادئ ومتوازن (130s) ✨', label_en: 'Balanced (130s) ✨' },
              { val: 80, label_ar: 'سرعة متوسطة (80s)', label_en: 'Moderate (80s)' },
              { val: 45, label_ar: 'سريع (45s)', label_en: 'Fast (45s)' },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => onSpeedChange?.(preset.val)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                  speedSeconds === preset.val
                    ? 'bg-amber-500 text-white font-bold border-amber-500 shadow-xs'
                    : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                }`}
              >
                {isAr ? preset.label_ar : preset.label_en}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {testimonials.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground space-y-3">
            <p className="text-sm font-medium">
              {isAr ? 'لا توجد مراجعات مضافة حالياً.' : 'No testimonials added yet.'}
            </p>
            <Button type="button" onClick={handleAddReview} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              {isAr ? 'إضافة أول مراجعة' : 'Add First Review'}
            </Button>
          </div>
        ) : (
          testimonials.map((review, idx) => (
            <Card
              key={review.id || idx}
              className={`border transition-all ${
                review.visible !== false
                  ? 'border-border bg-card'
                  : 'border-muted bg-muted/30 opacity-70'
              }`}
            >
              <CardContent className="p-5 space-y-5">
                {/* Top Control Bar for this Review */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {review.name_ar || review.name_en || (isAr ? 'مراجعة بدون اسم' : 'Unnamed Review')}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      ({review.role_ar || review.role_en || '-'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Active / Hidden Switch */}
                    <div className="flex items-center gap-2 bg-muted/60 px-2.5 py-1 rounded-md text-xs font-semibold">
                      {review.visible !== false ? (
                        <Eye className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {review.visible !== false ? (isAr ? 'ظاهرة' : 'Active') : (isAr ? 'مخفية' : 'Hidden')}
                      </span>
                      <Switch
                        checked={review.visible !== false}
                        onCheckedChange={(v) => handleUpdateReview(idx, 'visible', v)}
                      />
                    </div>

                    {/* Move Up */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      disabled={idx === 0}
                      onClick={() => handleMoveReview(idx, 'up')}
                      title={isAr ? 'تحريك للأعلى' : 'Move Up'}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>

                    {/* Move Down */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      disabled={idx === testimonials.length - 1}
                      onClick={() => handleMoveReview(idx, 'down')}
                      title={isAr ? 'تحريك للأسفل' : 'Move Down'}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>

                    {/* Delete */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      onClick={() => handleRemoveReview(idx)}
                      title={isAr ? 'حذف المراجعة' : 'Delete Review'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Rating & Visual Star Selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-muted/20 p-3 rounded-lg border border-border/40">
                  <div>
                    <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground mb-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      {isAr ? 'التقييم بالنجوم (اختر من 1 إلى 5):' : 'Star Rating (Choose 1 to 5):'}
                    </Label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleUpdateReview(idx, 'stars', star)}
                          className="p-1 hover:scale-125 transition-transform focus:outline-none"
                          title={`${star} ${isAr ? 'نجوم' : 'Stars'}`}
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= (review.stars || 5)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-zinc-400 dark:text-zinc-600'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                        {review.stars || 5}/5
                      </span>
                    </div>
                  </div>

                  {/* Photo / Company Logo Upload or URL */}
                  <div>
                    <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground mb-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-purple-500" />
                      {isAr ? 'صورة الشخص أو شعار الشركة:' : 'Person Photo or Company Logo:'}
                    </Label>
                    <div className="flex items-center gap-3">
                      {/* Avatar preview */}
                      <div className="h-10 w-10 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0 shadow-sm">
                        {review.image_url ? (
                          <img
                            src={review.image_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-black text-muted-foreground">
                            {review.avatar_initial || review.name_ar?.charAt(0) || '⭐'}
                          </span>
                        )}
                      </div>

                      {/* Hidden file input */}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={(el) => {
                          fileInputRefs.current[idx] = el
                        }}
                        onChange={(e) => handleImageFileUpload(idx, e)}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingIndex === idx}
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        className="text-xs gap-1.5 h-8 shrink-0"
                      >
                        <Upload className={`h-3.5 w-3.5 ${uploadingIndex === idx ? 'animate-spin' : ''}`} />
                        {uploadingIndex === idx
                          ? isAr ? 'جاري الرفع...' : 'Uploading...'
                          : isAr ? 'رفع صورة' : 'Upload Image'}
                      </Button>

                      <Input
                        value={review.image_url || ''}
                        onChange={(e) => handleUpdateReview(idx, 'image_url', e.target.value)}
                        placeholder={isAr ? 'أو أدخل رابط الصورة المباشر' : 'Or direct image URL'}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Names (AR & EN) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-emerald-500" />
                      {isAr ? 'اسم الشخص أو الشركة (بالعربية) 🇸🇦' : 'Name or Company (Arabic) 🇸🇦'}
                    </Label>
                    <Input
                      value={review.name_ar || ''}
                      onChange={(e) => handleUpdateReview(idx, 'name_ar', e.target.value)}
                      placeholder="مثال: عبدالرحمن الشهري أو متجر لافندر"
                      className="text-xs"
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-blue-500" />
                      {isAr ? 'اسم الشخص أو الشركة (بالإنجليزية) 🇬🇧' : 'Name or Company (English) 🇬🇧'}
                    </Label>
                    <Input
                      value={review.name_en || ''}
                      onChange={(e) => handleUpdateReview(idx, 'name_en', e.target.value)}
                      placeholder="e.g. Abdulrahman Al-Shehri or Lavender Brand"
                      className="text-xs"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Roles / Subtitles (AR & EN) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-purple-500" />
                      {isAr ? 'المسمى الوظيفي أو النشاط (بالعربية) 🇸🇦' : 'Role or Industry (Arabic) 🇸🇦'}
                    </Label>
                    <Input
                      value={review.role_ar || ''}
                      onChange={(e) => handleUpdateReview(idx, 'role_ar', e.target.value)}
                      placeholder="مثال: مؤسس متجر أزياء وعطور (Shopify)"
                      className="text-xs"
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-purple-500" />
                      {isAr ? 'المسمى الوظيفي أو النشاط (بالإنجليزية) 🇬🇧' : 'Role or Industry (English) 🇬🇧'}
                    </Label>
                    <Input
                      value={review.role_en || ''}
                      onChange={(e) => handleUpdateReview(idx, 'role_en', e.target.value)}
                      placeholder="e.g. Founder, Fashion Brand (Shopify)"
                      className="text-xs"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Review Quotes / Comments (AR & EN) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Quote className="h-3.5 w-3.5 text-amber-500" />
                      {isAr ? 'نص المراجعة والتعليق (بالعربية) 🇸🇦' : 'Review & Comment (Arabic) 🇸🇦'}
                    </Label>
                    <Textarea
                      rows={3}
                      value={review.quote_ar || ''}
                      onChange={(e) => handleUpdateReview(idx, 'quote_ar', e.target.value)}
                      placeholder="اكتب هنا رأي العميل أو الشركة وتجربتهم والنتائج التي حققوها..."
                      className="text-xs leading-relaxed"
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Quote className="h-3.5 w-3.5 text-amber-500" />
                      {isAr ? 'نص المراجعة والتعليق (بالإنجليزية) 🇬🇧' : 'Review & Comment (English) 🇬🇧'}
                    </Label>
                    <Textarea
                      rows={3}
                      value={review.quote_en || ''}
                      onChange={(e) => handleUpdateReview(idx, 'quote_en', e.target.value)}
                      placeholder="Write customer feedback, experiences, and measurable ROI here..."
                      className="text-xs leading-relaxed"
                      dir="ltr"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
