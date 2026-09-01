'use client'

import { useState } from 'react'
import {
  ShoppingBag,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Globe,
  Sparkles,
  ExternalLink,
  Store,
  Layers,
  Image as ImageIcon,
  Tag,
  Eye,
  EyeOff,
  Palette,
  Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  EcommerceSectionContent,
  StoreCard,
  NotificationCard,
  MetricCard,
  DEFAULT_ECOMMERCE_CONTENT,
} from '@/components/landing/landing-ecommerce-section'

interface EcommerceTabProps {
  isAr: boolean
  content: EcommerceSectionContent
  onChange: (updated: EcommerceSectionContent) => void
}

const ACCENT_COLORS = [
  { id: 'purple', label_ar: 'بنفسجي (WooCommerce)', label_en: 'Purple', bg: 'bg-purple-500' },
  { id: 'emerald', label_ar: 'زمردي (Shopify)', label_en: 'Emerald', bg: 'bg-emerald-500' },
  { id: 'teal', label_ar: 'تيل كلاسيكي (Ethos)', label_en: 'Teal', bg: 'bg-[#00685F]' },
  { id: 'blue', label_ar: 'أزرق عصري', label_en: 'Blue', bg: 'bg-blue-500' },
  { id: 'amber', label_ar: 'كهرماني / ذهبي', label_en: 'Amber', bg: 'bg-amber-500' },
  { id: 'indigo', label_ar: 'نيلي داكن', label_en: 'Indigo', bg: 'bg-indigo-500' },
]

export function EcommerceTab({ isAr, content, onChange }: EcommerceTabProps) {
  const storeCards = content.store_cards || DEFAULT_ECOMMERCE_CONTENT.store_cards!
  const notifCards = content.notification_cards || DEFAULT_ECOMMERCE_CONTENT.notification_cards!
  const metrics = content.metrics || DEFAULT_ECOMMERCE_CONTENT.metrics!

  // ── Header updates ──
  const updateHeaderField = (field: keyof EcommerceSectionContent, value: any) => {
    onChange({
      ...content,
      [field]: value,
    })
  }

  // ── Store Cards handlers ──
  const handleAddStore = () => {
    const newStore: StoreCard = {
      id: `store-${Date.now()}`,
      visible: true,
      order: storeCards.length + 1,
      store_name: isAr ? 'متجر جديد' : 'New Store',
      api_badge: 'REST API & Webhooks',
      accent_color: 'teal',
      subtitle_ar: 'ربط مباشر وسهل مع منصتك',
      subtitle_en: 'Direct plug-and-play integration',
      status_badge_ar: 'ربط فوري متاح',
      status_badge_en: '1-Click Connect',
      features: [
        { id: `f-${Date.now()}-1`, text_ar: 'تأكيد واستقبال الطلبات لحظياً', text_en: 'Instant order notifications & sync' },
        { id: `f-${Date.now()}-2`, text_ar: 'استرجاع السلات المتروكة تلقائياً', text_en: 'Automated cart abandonment recovery' },
      ],
    }
    onChange({
      ...content,
      store_cards: [...storeCards, newStore],
    })
  }

  const handleUpdateStore = (index: number, field: keyof StoreCard, value: any) => {
    const updated = [...storeCards]
    updated[index] = { ...updated[index], [field]: value }
    onChange({
      ...content,
      store_cards: updated,
    })
  }

  const handleRemoveStore = (index: number) => {
    onChange({
      ...content,
      store_cards: storeCards.filter((_, i) => i !== index),
    })
  }

  const handleMoveStore = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === storeCards.length - 1)
    ) {
      return
    }
    const updated = [...storeCards]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp
    onChange({
      ...content,
      store_cards: updated,
    })
  }

  // Store Features handlers
  const handleAddStoreFeature = (storeIdx: number) => {
    const updated = [...storeCards]
    const currentFeats = updated[storeIdx].features || []
    updated[storeIdx] = {
      ...updated[storeIdx],
      features: [
        ...currentFeats,
        { id: `feat-${Date.now()}`, text_ar: 'ميزة جديدة', text_en: 'New Feature' },
      ],
    }
    onChange({
      ...content,
      store_cards: updated,
    })
  }

  const handleUpdateStoreFeature = (
    storeIdx: number,
    featIdx: number,
    field: 'text_ar' | 'text_en',
    value: string
  ) => {
    const updated = [...storeCards]
    const currentFeats = [...(updated[storeIdx].features || [])]
    currentFeats[featIdx] = { ...currentFeats[featIdx], [field]: value }
    updated[storeIdx] = { ...updated[storeIdx], features: currentFeats }
    onChange({
      ...content,
      store_cards: updated,
    })
  }

  const handleRemoveStoreFeature = (storeIdx: number, featIdx: number) => {
    const updated = [...storeCards]
    const currentFeats = updated[storeIdx].features.filter((_, i) => i !== featIdx)
    updated[storeIdx] = { ...updated[storeIdx], features: currentFeats }
    onChange({
      ...content,
      store_cards: updated,
    })
  }

  // ── Notification Mockup Cards handlers ──
  const handleUpdateNotification = (
    index: number,
    field: keyof NotificationCard,
    value: string
  ) => {
    const updated = [...notifCards]
    updated[index] = { ...updated[index], [field]: value }
    onChange({
      ...content,
      notification_cards: updated,
    })
  }

  // ── Metrics handlers ──
  const handleAddMetric = () => {
    const newMetric: MetricCard = {
      id: `metric-${Date.now()}`,
      visible: true,
      value: '+50%',
      title_ar: 'عنوان الإحصائية',
      title_en: 'Metric Title',
      description_ar: 'وصف توضيحي مختصر للإحصائية',
      description_en: 'Short explanatory description',
      color: 'emerald',
    }
    onChange({
      ...content,
      metrics: [...metrics, newMetric],
    })
  }

  const handleUpdateMetric = (index: number, field: keyof MetricCard, value: any) => {
    const updated = [...metrics]
    updated[index] = { ...updated[index], [field]: value }
    onChange({
      ...content,
      metrics: updated,
    })
  }

  const handleRemoveMetric = (index: number) => {
    onChange({
      ...content,
      metrics: metrics.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-8">
      {/* ── 1. Header & General Section Headlines ── */}
      <Card className="bg-card border-border text-card-foreground shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            {isAr ? 'عناوين وهيدر قسم المتاجر (E-Commerce Header)' : 'E-Commerce Section Header & Titles'}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {isAr
              ? 'تخصيص الشارة العلوية، العنوان الرئيسي مع الجزء المائل الملوّن، والوصف التوضيحي باللغتين.'
              : 'Customize the top badge, main headline with italic accent, and description in Arabic & English.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Badge text */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">{isAr ? 'الشارة العلوية للقسم' : 'Top Section Badge'}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                <Input
                  value={content.badge_text_ar ?? DEFAULT_ECOMMERCE_CONTENT.badge_text_ar}
                  onChange={(e) => updateHeaderField('badge_text_ar', e.target.value)}
                  className="bg-background text-xs"
                  dir="rtl"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                <Input
                  value={content.badge_text_en ?? DEFAULT_ECOMMERCE_CONTENT.badge_text_en}
                  onChange={(e) => updateHeaderField('badge_text_en', e.target.value)}
                  className="bg-background text-xs"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">{isAr ? 'العنوان الرئيسي (بداية النص)' : 'Headline Prefix'}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                <Input
                  value={content.headline_ar ?? DEFAULT_ECOMMERCE_CONTENT.headline_ar}
                  onChange={(e) => updateHeaderField('headline_ar', e.target.value)}
                  className="bg-background text-xs font-bold"
                  dir="rtl"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                <Input
                  value={content.headline_en ?? DEFAULT_ECOMMERCE_CONTENT.headline_en}
                  onChange={(e) => updateHeaderField('headline_en', e.target.value)}
                  className="bg-background text-xs font-bold"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Headline Highlight (Italic accent) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">{isAr ? 'العنوان البارز الملوّن (Highlight)' : 'Highlighted Title Text'}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-emerald-500">🇸🇦 العربية</span>
                <Input
                  value={content.headline_highlight_ar ?? DEFAULT_ECOMMERCE_CONTENT.headline_highlight_ar}
                  onChange={(e) => updateHeaderField('headline_highlight_ar', e.target.value)}
                  className="bg-background text-xs font-bold text-emerald-600 dark:text-emerald-400"
                  dir="rtl"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-emerald-500">🇬🇧 English</span>
                <Input
                  value={content.headline_highlight_en ?? DEFAULT_ECOMMERCE_CONTENT.headline_highlight_en}
                  onChange={(e) => updateHeaderField('headline_highlight_en', e.target.value)}
                  className="bg-background text-xs font-bold text-emerald-600 dark:text-emerald-400"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Subtitle description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">{isAr ? 'النص الوصفي للقسم' : 'Section Subtitle Description'}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                <Textarea
                  value={content.subtitle_ar ?? DEFAULT_ECOMMERCE_CONTENT.subtitle_ar}
                  onChange={(e) => updateHeaderField('subtitle_ar', e.target.value)}
                  rows={2}
                  className="bg-background text-xs leading-relaxed"
                  dir="rtl"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                <Textarea
                  value={content.subtitle_en ?? DEFAULT_ECOMMERCE_CONTENT.subtitle_en}
                  onChange={(e) => updateHeaderField('subtitle_en', e.target.value)}
                  rows={2}
                  className="bg-background text-xs leading-relaxed"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Store Integration Cards (WooCommerce, Shopify, etc.) ── */}
      <Card className="bg-card border-border text-card-foreground shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Store className="h-4 w-4 text-emerald-500" />
              {isAr ? 'بطاقات المتاجر والمنصات المدعومة' : 'Supported Store Cards'}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {isAr
                ? 'إمكانية إضافة أي متجر جديد (مثل سلة، زد، أمازون...) وتعديل ميزاته ونقاطه وترتيبه بحرية تامة.'
                : 'Add new platforms, customize features checklist, colors, badges, and reorder cards freely.'}
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={handleAddStore}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold gap-1.5 text-xs h-9 px-4 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة متجر جديد +' : 'Add New Store +'}
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {storeCards.map((store, sIdx) => {
            const isVisible = store.visible !== false
            return (
              <div
                key={store.id || sIdx}
                className={`p-4 sm:p-5 rounded-xl border transition-all ${
                  isVisible
                    ? 'border-border bg-card/60 shadow-sm'
                    : 'border-dashed border-border/60 bg-muted/20 opacity-60'
                }`}
              >
                {/* Store Card Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/80">
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center">
                      {sIdx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-foreground">
                      {store.store_name || (isAr ? `متجر ${sIdx + 1}` : `Store ${sIdx + 1}`)}
                    </h4>
                    {store.api_badge && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                        {store.api_badge}
                      </span>
                    )}
                  </div>

                  {/* Actions: Reorder, Visibility, Delete */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveStore(sIdx, 'up')}
                      disabled={sIdx === 0}
                      className="h-7 w-7 p-0"
                      title={isAr ? 'تحريك لأعلى' : 'Move Up'}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveStore(sIdx, 'down')}
                      disabled={sIdx === storeCards.length - 1}
                      className="h-7 w-7 p-0"
                      title={isAr ? 'تحريك لأسفل' : 'Move Down'}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <div className="h-4 w-px bg-border mx-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateStore(sIdx, 'visible', !isVisible)}
                      className={`h-7 px-2 text-[11px] gap-1 ${
                        isVisible ? 'text-emerald-600' : 'text-muted-foreground'
                      }`}
                    >
                      {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      <span>{isVisible ? (isAr ? 'معروض' : 'Visible') : (isAr ? 'مخفي' : 'Hidden')}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStore(sIdx)}
                      className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-500/10"
                      title={isAr ? 'حذف البطاقة' : 'Delete Store'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-4 pt-4">
                  {/* Store Name, API Badge, Accent Color */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold">{isAr ? 'اسم المنصة / المتجر' : 'Store Platform Name'}</Label>
                      <Input
                        value={store.store_name}
                        onChange={(e) => handleUpdateStore(sIdx, 'store_name', e.target.value)}
                        placeholder="WooCommerce / Shopify / Salla"
                        className="bg-background text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold">{isAr ? 'شارة نوع الـ API' : 'API Badge'}</Label>
                      <Input
                        value={store.api_badge}
                        onChange={(e) => handleUpdateStore(sIdx, 'api_badge', e.target.value)}
                        placeholder="REST API & Webhooks"
                        className="bg-background text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold flex items-center gap-1">
                        <Palette className="h-3 w-3 text-muted-foreground" />
                        {isAr ? 'لون البطاقة الأساسي' : 'Accent Color'}
                      </Label>
                      <div className="flex items-center gap-1.5 pt-1">
                        {ACCENT_COLORS.map((col) => (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => handleUpdateStore(sIdx, 'accent_color', col.id)}
                            title={isAr ? col.label_ar : col.label_en}
                            className={`h-6 w-6 rounded-full ${col.bg} transition-transform ${
                              store.accent_color === col.id
                                ? 'ring-2 ring-offset-2 ring-primary scale-110'
                                : 'opacity-60 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Subtitle AR & EN */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">{isAr ? 'الوصف الفرعي للمتجر' : 'Subtitle Description'}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        value={store.subtitle_ar}
                        onChange={(e) => handleUpdateStore(sIdx, 'subtitle_ar', e.target.value)}
                        placeholder="ربط مباشر لجميع متاجر ووردبريس"
                        className="bg-background text-xs"
                        dir="rtl"
                      />
                      <Input
                        value={store.subtitle_en}
                        onChange={(e) => handleUpdateStore(sIdx, 'subtitle_en', e.target.value)}
                        placeholder="Direct integration for WordPress stores"
                        className="bg-background text-xs"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Status Badge AR & EN */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">{isAr ? 'نص شارة الحالة (أعلى البطاقة)' : 'Status Badge'}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        value={store.status_badge_ar}
                        onChange={(e) => handleUpdateStore(sIdx, 'status_badge_ar', e.target.value)}
                        placeholder="ربط فوري متاح"
                        className="bg-background text-xs"
                        dir="rtl"
                      />
                      <Input
                        value={store.status_badge_en}
                        onChange={(e) => handleUpdateStore(sIdx, 'status_badge_en', e.target.value)}
                        placeholder="1-Click Connect"
                        className="bg-background text-xs"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Features Points Checklist */}
                  <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        {isAr ? 'نقاط ومميزات الربط (Features Checklist)' : 'Store Feature Points'}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddStoreFeature(sIdx)}
                        className="h-7 text-[11px] gap-1 border-dashed"
                      >
                        <Plus className="h-3 w-3" />
                        {isAr ? 'إضافة نقطة ميزة' : 'Add Feature Point'}
                      </Button>
                    </div>

                    {store.features && store.features.length > 0 ? (
                      <div className="space-y-2">
                        {store.features.map((feat, fIdx) => (
                          <div
                            key={feat.id || fIdx}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-background p-2 rounded-md border border-border"
                          >
                            <div className="sm:col-span-5 space-y-0.5">
                              <span className="text-[9px] font-black text-amber-500">🇸🇦 AR:</span>
                              <Input
                                value={feat.text_ar}
                                onChange={(e) =>
                                  handleUpdateStoreFeature(sIdx, fIdx, 'text_ar', e.target.value)
                                }
                                className="h-7 text-xs"
                                dir="rtl"
                              />
                            </div>
                            <div className="sm:col-span-6 space-y-0.5">
                              <span className="text-[9px] font-black text-sky-500">🇬🇧 EN:</span>
                              <Input
                                value={feat.text_en}
                                onChange={(e) =>
                                  handleUpdateStoreFeature(sIdx, fIdx, 'text_en', e.target.value)
                                }
                                className="h-7 text-xs"
                                dir="ltr"
                              />
                            </div>
                            <div className="sm:col-span-1 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveStoreFeature(sIdx, fIdx)}
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
                        {isAr ? 'لا توجد ميزات مضافة لهذا المتجر.' : 'No features added for this store.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* ── 3. WhatsApp Notification Mockup Cards (3D Frosted Glass Cards) ── */}
      <Card className="bg-card border-border text-card-foreground shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-500" />
            {isAr ? 'محاكاة إشعارات الواتساب ثلاثية الأبعاد (3D Notification Mockups)' : '3D WhatsApp Notification Mockup Cards'}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {isAr
              ? 'التحكم بالبطاقات الثلاث (العلوية الشفافة، الرئيسية المركزية، والسفلية الشفافة)، أسماء العملاء، حالات الطلب، ورابط صورة المنتج.'
              : 'Customize the 3 notification layers (Top Translucent, Center Hero, and Bottom Translucent), customer names, orders, and thumbnail image URLs.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {notifCards.map((notif, nIdx) => {
            const isHero = notif.position === 'hero' || nIdx === 1
            const cardLabel = isHero
              ? (isAr ? 'البطاقة الرئيسية المركزية (HERO Card)' : 'Center Focal Card (Hero)')
              : nIdx === 0
              ? (isAr ? 'البطاقة العلوية المصنفرة (Top Card)' : 'Top Translucent Card')
              : (isAr ? 'البطاقة السفلية المصنفرة (Bottom Card)' : 'Bottom Translucent Card')

            return (
              <div
                key={notif.id || nIdx}
                className={`p-4 sm:p-5 rounded-xl border ${
                  isHero
                    ? 'border-amber-500/40 bg-amber-500/5 ring-1 ring-amber-500/20'
                    : 'border-border bg-card/60'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-border/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-foreground border">
                      {cardLabel}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      #{nIdx + 1}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-3.5">
                  {/* Customer Name AR/EN & Timestamp */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold">{isAr ? 'اسم العميل (عربي)' : 'Customer Name (AR)'}</Label>
                      <Input
                        value={notif.customer_name_ar}
                        onChange={(e) => handleUpdateNotification(nIdx, 'customer_name_ar', e.target.value)}
                        placeholder="سارة"
                        className="bg-background text-xs font-bold"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold">{isAr ? 'اسم العميل (إنجليزي)' : 'Customer Name (EN)'}</Label>
                      <Input
                        value={notif.customer_name_en}
                        onChange={(e) => handleUpdateNotification(nIdx, 'customer_name_en', e.target.value)}
                        placeholder="Sarah"
                        className="bg-background text-xs font-bold"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold">{isAr ? 'الطابع الزمني (عربي / EN)' : 'Timestamp'}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={notif.timestamp_ar}
                          onChange={(e) => handleUpdateNotification(nIdx, 'timestamp_ar', e.target.value)}
                          placeholder="الآن"
                          className="bg-background text-xs"
                          dir="rtl"
                        />
                        <Input
                          value={notif.timestamp_en}
                          onChange={(e) => handleUpdateNotification(nIdx, 'timestamp_en', e.target.value)}
                          placeholder="now"
                          className="bg-background text-xs"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Title / Order Status AR & EN */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">{isAr ? 'عنوان الإشعار / حالة الطلب' : 'Notification Title / Order State'}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        value={notif.title_ar}
                        onChange={(e) => handleUpdateNotification(nIdx, 'title_ar', e.target.value)}
                        placeholder="تم تأكيد الطلب #10482"
                        className="bg-background text-xs font-bold"
                        dir="rtl"
                      />
                      <Input
                        value={notif.title_en}
                        onChange={(e) => handleUpdateNotification(nIdx, 'title_en', e.target.value)}
                        placeholder="Order #10482 Confirmed"
                        className="bg-background text-xs font-bold"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Body / Message Content AR & EN */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">{isAr ? 'نص رسالة الإشعار' : 'Notification Message Body'}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        value={notif.body_ar}
                        onChange={(e) => handleUpdateNotification(nIdx, 'body_ar', e.target.value)}
                        placeholder="شحنتك في الطريق. موعد التوصيل المتوقع: غداً."
                        className="bg-background text-xs"
                        dir="rtl"
                      />
                      <Input
                        value={notif.body_en}
                        onChange={(e) => handleUpdateNotification(nIdx, 'body_en', e.target.value)}
                        placeholder="Your order is In Transit. Estimated delivery: Tomorrow."
                        className="bg-background text-xs"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Product Image URL with preview */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {isAr ? 'رابط صورة المنتج (Product Thumbnail URL)' : 'Product Thumbnail Image URL'}
                    </Label>
                    <div className="flex items-center gap-3">
                      {notif.product_image_url ? (
                        <div className="h-10 w-10 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={notif.product_image_url}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-lg border border-dashed border-border shrink-0 flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                      <Input
                        value={notif.product_image_url}
                        onChange={(e) => handleUpdateNotification(nIdx, 'product_image_url', e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="bg-background text-xs font-mono flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* ── 4. Metrics & Stats Row ── */}
      <Card className="bg-card border-border text-card-foreground shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              {isAr ? 'شريط الإحصائيات والمقاييس السفلية (Metrics Row)' : 'Bottom Metrics & Highlights Row'}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {isAr
                ? 'تعديل الأرقام الكبيرة (+30%, < 1 sec, 100% No-Code) والنصوص وألوان التمييز.'
                : 'Customize the key metrics, titles, short descriptions, and accent colors.'}
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={handleAddMetric}
            variant="outline"
            className="text-xs font-bold gap-1 h-9"
          >
            <Plus className="h-3.5 w-3.5" />
            {isAr ? 'إضافة مقياس +' : 'Add Metric +'}
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.map((metric, mIdx) => {
              const isVis = metric.visible !== false
              return (
                <div
                  key={metric.id || mIdx}
                  className={`p-4 rounded-xl border space-y-3 ${
                    isVis ? 'border-border bg-card/60' : 'border-dashed border-border/60 bg-muted/20 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/80">
                    <span className="text-xs font-bold text-muted-foreground font-mono">
                      #{mIdx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateMetric(mIdx, 'visible', !isVis)}
                        className="h-6 px-1.5 text-[10px]"
                      >
                        {isVis ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMetric(mIdx)}
                        className="h-6 w-6 p-0 text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label className="text-[11px] font-bold">{isAr ? 'القيمة / الرقم البارز' : 'Value / Number'}</Label>
                      <Input
                        value={metric.value}
                        onChange={(e) => handleUpdateMetric(mIdx, 'value', e.target.value)}
                        placeholder="+30% / < 1 sec"
                        className="bg-background text-sm font-bold font-serif text-emerald-600 dark:text-emerald-400"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-bold">{isAr ? 'العنوان (عربي / EN)' : 'Title (AR / EN)'}</Label>
                      <div className="space-y-1">
                        <Input
                          value={metric.title_ar}
                          onChange={(e) => handleUpdateMetric(mIdx, 'title_ar', e.target.value)}
                          placeholder="استعادة مبيعات السلات"
                          className="bg-background text-xs"
                          dir="rtl"
                        />
                        <Input
                          value={metric.title_en}
                          onChange={(e) => handleUpdateMetric(mIdx, 'title_en', e.target.value)}
                          placeholder="Cart Recovery"
                          className="bg-background text-xs"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-[11px] font-bold">{isAr ? 'الوصف (عربي / EN)' : 'Description (AR / EN)'}</Label>
                      <div className="space-y-1">
                        <Textarea
                          value={metric.description_ar}
                          onChange={(e) => handleUpdateMetric(mIdx, 'description_ar', e.target.value)}
                          rows={2}
                          placeholder="إعادة استهداف ذكية لزبائن الـ Checkout..."
                          className="bg-background text-[11px]"
                          dir="rtl"
                        />
                        <Textarea
                          value={metric.description_en}
                          onChange={(e) => handleUpdateMetric(mIdx, 'description_en', e.target.value)}
                          rows={2}
                          placeholder="Re-engage checkout drop-offs..."
                          className="bg-background text-[11px]"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── 5. CTA Button in Simulation Box ── */}
      <Card className="bg-card border-border text-card-foreground shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Link2 className="h-4 w-4 text-emerald-500" />
            {isAr ? 'زر الدعوة للربط داخل صندوق المحاكاة (CTA Button)' : 'Call To Action (CTA Button)'}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {isAr
              ? 'تخصيص نص ورابط الزر الموجود أسفل بطاقات الإشعارات.'
              : 'Customize the text and link for the CTA button placed below the notification stack.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-foreground">{isAr ? 'إظهار زر الدعوة للربط' : 'Display CTA Button'}</span>
              <p className="text-[11px] text-muted-foreground">
                {isAr ? 'إخفاء أو عرض الزر أسفل الإشعارات' : 'Show or hide the CTA button in the mockup'}
              </p>
            </div>
            <Switch
              checked={content.cta_visible !== false}
              onCheckedChange={(checked) => updateHeaderField('cta_visible', checked)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">{isAr ? 'نص الزر' : 'Button Text'}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-amber-500">🇸🇦 العربية</span>
                <Input
                  value={content.cta_text_ar ?? DEFAULT_ECOMMERCE_CONTENT.cta_text_ar}
                  onChange={(e) => updateHeaderField('cta_text_ar', e.target.value)}
                  className="bg-background text-xs font-bold"
                  dir="rtl"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-sky-500">🇬🇧 English</span>
                <Input
                  value={content.cta_text_en ?? DEFAULT_ECOMMERCE_CONTENT.cta_text_en}
                  onChange={(e) => updateHeaderField('cta_text_en', e.target.value)}
                  className="bg-background text-xs font-bold"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">{isAr ? 'رابط الزر (URL للزوار غير المسجلين)' : 'Button URL'}</Label>
            <Input
              value={content.cta_url ?? DEFAULT_ECOMMERCE_CONTENT.cta_url}
              onChange={(e) => updateHeaderField('cta_url', e.target.value)}
              placeholder="/signup or /settings?tab=integrations"
              className="bg-background text-xs font-mono"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
