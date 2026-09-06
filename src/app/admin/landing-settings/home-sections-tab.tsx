'use client'

import { useState } from 'react'
import {
  SplitSquareVertical,
  Zap,
  Calculator,
  BarChart3,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RotateCcw,
  ShoppingBag,
  Mic,
  Globe,
  Bot,
  Shield,
  Clock,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  HomeContent,
  DEFAULT_HOME_CONTENT,
  HomeComparisonPoint,
  HomePillarItem,
  HomeMetricItem,
} from '@/lib/types/home-cms'

interface HomeSectionsTabProps {
  isAr: boolean
  content: HomeContent
  onChange: (updated: HomeContent) => void
}

export function HomeSectionsTab({ isAr, content, onChange }: HomeSectionsTabProps) {
  // Ensure all keys exist with fallback to defaults
  const data: HomeContent = {
    comparison: content?.comparison || DEFAULT_HOME_CONTENT.comparison,
    pillars: content?.pillars || DEFAULT_HOME_CONTENT.pillars,
    roi_calculator: content?.roi_calculator || DEFAULT_HOME_CONTENT.roi_calculator,
    metrics_proof: content?.metrics_proof || DEFAULT_HOME_CONTENT.metrics_proof,
    final_cta: content?.final_cta || DEFAULT_HOME_CONTENT.final_cta,
  }

  const updateComparison = (field: keyof typeof data.comparison, value: any) => {
    onChange({
      ...data,
      comparison: { ...data.comparison, [field]: value },
    })
  }

  const updatePillars = (field: keyof typeof data.pillars, value: any) => {
    onChange({
      ...data,
      pillars: { ...data.pillars, [field]: value },
    })
  }

  const updateRoi = (field: keyof typeof data.roi_calculator, value: any) => {
    onChange({
      ...data,
      roi_calculator: { ...data.roi_calculator, [field]: value },
    })
  }

  const updateMetrics = (field: keyof typeof data.metrics_proof, value: any) => {
    onChange({
      ...data,
      metrics_proof: { ...data.metrics_proof, [field]: value },
    })
  }

  const updateFinalCta = (field: keyof typeof data.final_cta, value: any) => {
    onChange({
      ...data,
      final_cta: { ...data.final_cta, [field]: value },
    })
  }

  return (
    <div className="space-y-6">
      {/* Overview Notice */}
      <Card className="border-border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Layers className="h-5 w-5 text-emerald-500 shrink-0" />
              {isAr ? 'التحكم الكامل بأقسام الصفحة الرئيسية (Home CMS)' : 'Home Page Marketing Sections CMS'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isAr
                ? 'تحكم بجميع نصوص ومحتويات أقسام الصفحة الرئيسية: المقارنة، أعمدة القيمة، حاسبة الأرباح، الإحصائيات، والبانر الختامي باللغتين العربية والإنجليزية.'
                : 'Manage all marketing content on the Home page: Pain vs Solution comparison, Value Pillars, ROI Calculator, Key Metrics, and Final CTA.'}
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm(isAr ? 'استعادة الإعدادات الافتراضية لجميع أقسام الرئيسية؟' : 'Reset all home sections?')) {
                onChange(DEFAULT_HOME_CONTENT)
              }
            }}
            className="text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {isAr ? 'استعادة الافتراضي' : 'Reset Defaults'}
          </Button>
        </CardHeader>
      </Card>

      {/* Sub-Tabs for the 5 Home Sections */}
      <Tabs defaultValue="comparison" className="w-full space-y-5">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 bg-muted p-1 rounded-xl gap-1">
          <TabsTrigger value="comparison" className="text-xs font-bold gap-1.5">
            <SplitSquareVertical className="h-3.5 w-3.5 text-rose-500" />
            {isAr ? 'المقارنة الفاصلة' : 'Comparison'}
          </TabsTrigger>

          <TabsTrigger value="pillars" className="text-xs font-bold gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            {isAr ? 'أعمدة القيمة (4)' : 'Value Pillars'}
          </TabsTrigger>

          <TabsTrigger value="roi" className="text-xs font-bold gap-1.5">
            <Calculator className="h-3.5 w-3.5 text-[#00685F] dark:text-[#6BD8CB]" />
            {isAr ? 'حاسبة العائد' : 'ROI Calculator'}
          </TabsTrigger>

          <TabsTrigger value="metrics" className="text-xs font-bold gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-purple-500" />
            {isAr ? 'الأرقام والإحصائيات' : 'Key Metrics'}
          </TabsTrigger>

          <TabsTrigger value="cta" className="text-xs font-bold gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            {isAr ? 'البانر الختامي' : 'Final CTA'}
          </TabsTrigger>
        </TabsList>

        {/* ─── 1. COMPARISON TAB ─── */}
        <TabsContent value="comparison" className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <SplitSquareVertical className="h-4 w-4 text-rose-500" />
                {isAr ? 'ترويسة قسم المقارنة الفاصلة' : 'Comparison Header'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شارة القسم (عربي) 🇸🇦</Label>
                  <Input
                    value={data.comparison.badge_ar || ''}
                    onChange={(e) => updateComparison('badge_ar', e.target.value)}
                    className="text-xs"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شارة القسم (إنجليزي) 🇬🇧</Label>
                  <Input
                    value={data.comparison.badge_en || ''}
                    onChange={(e) => updateComparison('badge_en', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">عنوان القسم الرئيسي (عربي) 🇸🇦</Label>
                  <Input
                    value={data.comparison.title_ar || ''}
                    onChange={(e) => updateComparison('title_ar', e.target.value)}
                    className="text-xs"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">عنوان القسم الرئيسي (إنجليزي) 🇬🇧</Label>
                  <Input
                    value={data.comparison.title_en || ''}
                    onChange={(e) => updateComparison('title_en', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">الوصف الفرعي (عربي) 🇸🇦</Label>
                  <Textarea
                    rows={2}
                    value={data.comparison.subtitle_ar || ''}
                    onChange={(e) => updateComparison('subtitle_ar', e.target.value)}
                    className="text-xs"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">الوصف الفرعي (إنجليزي) 🇬🇧</Label>
                  <Textarea
                    rows={2}
                    value={data.comparison.subtitle_en || ''}
                    onChange={(e) => updateComparison('subtitle_en', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pain Points vs Solution Points */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pain Points */}
            <Card className="border-rose-500/20 bg-rose-500/5">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" />
                  {isAr ? 'نقاط الألم والمعاناة التقليدية' : 'Pain Points (The Old Way)'}
                </CardTitle>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 gap-1 border-rose-500/30 text-rose-600"
                  onClick={() => {
                    const newPoint: HomeComparisonPoint = {
                      id: `p-${Date.now()}`,
                      title_ar: 'نقطة معاناة جديدة',
                      title_en: 'New Pain Point',
                      desc_ar: 'وصف المعاناة أو الخسارة الناتجة عنها...',
                      desc_en: 'Description of the bottleneck...',
                    }
                    updateComparison('pain_points', [...data.comparison.pain_points, newPoint])
                  }}
                >
                  <Plus className="h-3 w-3" />
                  {isAr ? 'إضافة نقطة' : 'Add Point'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.comparison.pain_points.map((pt, pIdx) => (
                  <div key={pt.id || pIdx} className="bg-background/80 p-3 rounded-lg border border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-500">#{pIdx + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-rose-500"
                        onClick={() => {
                          const updated = data.comparison.pain_points.filter((_, i) => i !== pIdx)
                          updateComparison('pain_points', updated)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Input
                      value={pt.title_ar || ''}
                      onChange={(e) => {
                        const updated = [...data.comparison.pain_points]
                        updated[pIdx] = { ...updated[pIdx], title_ar: e.target.value }
                        updateComparison('pain_points', updated)
                      }}
                      placeholder="العنوان بالعربي"
                      className="text-xs h-8"
                      dir="rtl"
                    />
                    <Input
                      value={pt.title_en || ''}
                      onChange={(e) => {
                        const updated = [...data.comparison.pain_points]
                        updated[pIdx] = { ...updated[pIdx], title_en: e.target.value }
                        updateComparison('pain_points', updated)
                      }}
                      placeholder="Title in English"
                      className="text-xs h-8"
                      dir="ltr"
                    />
                    <Textarea
                      rows={2}
                      value={pt.desc_ar || ''}
                      onChange={(e) => {
                        const updated = [...data.comparison.pain_points]
                        updated[pIdx] = { ...updated[pIdx], desc_ar: e.target.value }
                        updateComparison('pain_points', updated)
                      }}
                      placeholder="الشرح بالعربي"
                      className="text-xs"
                      dir="rtl"
                    />
                    <Textarea
                      rows={2}
                      value={pt.desc_en || ''}
                      onChange={(e) => {
                        const updated = [...data.comparison.pain_points]
                        updated[pIdx] = { ...updated[pIdx], desc_en: e.target.value }
                        updateComparison('pain_points', updated)
                      }}
                      placeholder="Description in English"
                      className="text-xs"
                      dir="ltr"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Solution Points */}
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {isAr ? 'حلول وقوة MK Whats والذكاء الاصطناعي' : 'MK Whats Solutions & Power'}
                </CardTitle>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 gap-1 border-emerald-500/30 text-emerald-600"
                  onClick={() => {
                    const newPoint: HomeComparisonPoint = {
                      id: `s-${Date.now()}`,
                      title_ar: 'حل فوري ذكي',
                      title_en: 'Smart Solution Point',
                      desc_ar: 'وصف كيف تقوم المنصة بحل المشكلة...',
                      desc_en: 'How the platform solves it...',
                    }
                    updateComparison('solution_points', [...data.comparison.solution_points, newPoint])
                  }}
                >
                  <Plus className="h-3 w-3" />
                  {isAr ? 'إضافة حل' : 'Add Solution'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.comparison.solution_points.map((st, sIdx) => (
                  <div key={st.id || sIdx} className="bg-background/80 p-3 rounded-lg border border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-500">#{sIdx + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-rose-500"
                        onClick={() => {
                          const updated = data.comparison.solution_points.filter((_, i) => i !== sIdx)
                          updateComparison('solution_points', updated)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Input
                      value={st.title_ar || ''}
                      onChange={(e) => {
                        const updated = [...data.comparison.solution_points]
                        updated[sIdx] = { ...updated[sIdx], title_ar: e.target.value }
                        updateComparison('solution_points', updated)
                      }}
                      placeholder="العنوان بالعربي"
                      className="text-xs h-8"
                      dir="rtl"
                    />
                    <Input
                      value={st.title_en || ''}
                      onChange={(e) => {
                        const updated = [...data.comparison.solution_points]
                        updated[sIdx] = { ...updated[sIdx], title_en: e.target.value }
                        updateComparison('solution_points', updated)
                      }}
                      placeholder="Title in English"
                      className="text-xs h-8"
                      dir="ltr"
                    />
                    <Textarea
                      rows={2}
                      value={st.desc_ar || ''}
                      onChange={(e) => {
                        const updated = [...data.comparison.solution_points]
                        updated[sIdx] = { ...updated[sIdx], desc_ar: e.target.value }
                        updateComparison('solution_points', updated)
                      }}
                      placeholder="الشرح بالعربي"
                      className="text-xs"
                      dir="rtl"
                    />
                    <Textarea
                      rows={2}
                      value={st.desc_en || ''}
                      onChange={(e) => {
                        const updated = [...data.comparison.solution_points]
                        updated[sIdx] = { ...updated[sIdx], desc_en: e.target.value }
                        updateComparison('solution_points', updated)
                      }}
                      placeholder="Description in English"
                      className="text-xs"
                      dir="ltr"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── 2. VALUE PILLARS TAB ─── */}
        <TabsContent value="pillars" className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                {isAr ? 'ترويسة قسم محركات القيمة' : 'Value Pillars Header'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شارة القسم (عربي) 🇸🇦</Label>
                  <Input
                    value={data.pillars.badge_ar || ''}
                    onChange={(e) => updatePillars('badge_ar', e.target.value)}
                    className="text-xs"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شارة القسم (إنجليزي) 🇬🇧</Label>
                  <Input
                    value={data.pillars.badge_en || ''}
                    onChange={(e) => updatePillars('badge_en', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">عنوان القسم (عربي) 🇸🇦</Label>
                  <Input
                    value={data.pillars.title_ar || ''}
                    onChange={(e) => updatePillars('title_ar', e.target.value)}
                    className="text-xs"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">عنوان القسم (إنجليزي) 🇬🇧</Label>
                  <Input
                    value={data.pillars.title_en || ''}
                    onChange={(e) => updatePillars('title_en', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">الوصف الفرعي (عربي) 🇸🇦</Label>
                  <Textarea
                    rows={2}
                    value={data.pillars.subtitle_ar || ''}
                    onChange={(e) => updatePillars('subtitle_ar', e.target.value)}
                    className="text-xs"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">الوصف الفرعي (إنجليزي) 🇬🇧</Label>
                  <Textarea
                    rows={2}
                    value={data.pillars.subtitle_en || ''}
                    onChange={(e) => updatePillars('subtitle_en', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pillars List */}
          <div className="space-y-4">
            {data.pillars.items.map((pillar, pIdx) => (
              <Card key={pillar.id || pIdx} className="border-border">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted">
                        #{pIdx + 1}
                      </span>
                      <span className="text-sm font-bold">{pillar.title_ar || pillar.title_en}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {pillar.visible !== false ? (isAr ? 'ظاهر' : 'Active') : (isAr ? 'مخفي' : 'Hidden')}
                      </span>
                      <Switch
                        checked={pillar.visible !== false}
                        onCheckedChange={(v) => {
                          const updated = [...data.pillars.items]
                          updated[pIdx] = { ...updated[pIdx], visible: v }
                          updatePillars('items', updated)
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">شارة البطاقة (عربي) 🇸🇦</Label>
                      <Input
                        value={pillar.badge_ar || ''}
                        onChange={(e) => {
                          const updated = [...data.pillars.items]
                          updated[pIdx] = { ...updated[pIdx], badge_ar: e.target.value }
                          updatePillars('items', updated)
                        }}
                        className="text-xs"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">شارة البطاقة (إنجليزي) 🇬🇧</Label>
                      <Input
                        value={pillar.badge_en || ''}
                        onChange={(e) => {
                          const updated = [...data.pillars.items]
                          updated[pIdx] = { ...updated[pIdx], badge_en: e.target.value }
                          updatePillars('items', updated)
                        }}
                        className="text-xs"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">عنوان الركيزة (عربي) 🇸🇦</Label>
                      <Input
                        value={pillar.title_ar || ''}
                        onChange={(e) => {
                          const updated = [...data.pillars.items]
                          updated[pIdx] = { ...updated[pIdx], title_ar: e.target.value }
                          updatePillars('items', updated)
                        }}
                        className="text-xs"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">عنوان الركيزة (إنجليزي) 🇬🇧</Label>
                      <Input
                        value={pillar.title_en || ''}
                        onChange={(e) => {
                          const updated = [...data.pillars.items]
                          updated[pIdx] = { ...updated[pIdx], title_en: e.target.value }
                          updatePillars('items', updated)
                        }}
                        className="text-xs"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">الوصف (عربي) 🇸🇦</Label>
                      <Textarea
                        rows={2}
                        value={pillar.desc_ar || ''}
                        onChange={(e) => {
                          const updated = [...data.pillars.items]
                          updated[pIdx] = { ...updated[pIdx], desc_ar: e.target.value }
                          updatePillars('items', updated)
                        }}
                        className="text-xs"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">الوصف (إنجليزي) 🇬🇧</Label>
                      <Textarea
                        rows={2}
                        value={pillar.desc_en || ''}
                        onChange={(e) => {
                          const updated = [...data.pillars.items]
                          updated[pIdx] = { ...updated[pIdx], desc_en: e.target.value }
                          updatePillars('items', updated)
                        }}
                        className="text-xs"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-3 rounded-lg border border-border/40">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">النقاط الفرعية (عربي - افصل بينها بفاصلة أو سطر جديد)</Label>
                      <Textarea
                        rows={3}
                        value={Array.isArray(pillar.highlights_ar) ? pillar.highlights_ar.join('\n') : ''}
                        onChange={(e) => {
                          const updated = [...data.pillars.items]
                          updated[pIdx] = {
                            ...updated[pIdx],
                            highlights_ar: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                          }
                          updatePillars('items', updated)
                        }}
                        className="text-xs"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Bullet points (English - one per line)</Label>
                      <Textarea
                        rows={3}
                        value={Array.isArray(pillar.highlights_en) ? pillar.highlights_en.join('\n') : ''}
                        onChange={(e) => {
                          const updated = [...data.pillars.items]
                          updated[pIdx] = {
                            ...updated[pIdx],
                            highlights_en: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                          }
                          updatePillars('items', updated)
                        }}
                        className="text-xs"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── 3. ROI CALCULATOR TAB ─── */}
        <TabsContent value="roi" className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calculator className="h-4 w-4 text-[#00685F] dark:text-[#6BD8CB]" />
                {isAr ? 'إعدادات حاسبة العائد الاستثماري التفاعلية' : 'ROI Calculator Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شارة الحاسبة (عربي) 🇸🇦</Label>
                  <Input
                    value={data.roi_calculator.badge_ar || ''}
                    onChange={(e) => updateRoi('badge_ar', e.target.value)}
                    className="text-xs"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شارة الحاسبة (إنجليزي) 🇬🇧</Label>
                  <Input
                    value={data.roi_calculator.badge_en || ''}
                    onChange={(e) => updateRoi('badge_en', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">عنوان الحاسبة (عربي) 🇸🇦</Label>
                  <Input
                    value={data.roi_calculator.title_ar || ''}
                    onChange={(e) => updateRoi('title_ar', e.target.value)}
                    className="text-xs"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">عنوان الحاسبة (إنجليزي) 🇬🇧</Label>
                  <Input
                    value={data.roi_calculator.title_en || ''}
                    onChange={(e) => updateRoi('title_en', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">الوصف الفرعي (عربي) 🇸🇦</Label>
                  <Textarea
                    rows={2}
                    value={data.roi_calculator.subtitle_ar || ''}
                    onChange={(e) => updateRoi('subtitle_ar', e.target.value)}
                    className="text-xs"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">الوصف الفرعي (إنجليزي) 🇬🇧</Label>
                  <Textarea
                    rows={2}
                    value={data.roi_calculator.subtitle_en || ''}
                    onChange={(e) => updateRoi('subtitle_en', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border border-border/40">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">العدد الافتراضي للرسائل الشهرية</Label>
                  <Input
                    type="number"
                    value={data.roi_calculator.default_messages || 3000}
                    onChange={(e) => updateRoi('default_messages', Number(e.target.value))}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">متوسط قيمة الطلب الافتراضي ($ USD)</Label>
                  <Input
                    type="number"
                    value={data.roi_calculator.default_aov || 35}
                    onChange={(e) => updateRoi('default_aov', Number(e.target.value))}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نص زر الحاسبة (عربي) 🇸🇦</Label>
                  <Input
                    value={data.roi_calculator.cta_text_ar || ''}
                    onChange={(e) => updateRoi('cta_text_ar', e.target.value)}
                    className="text-xs"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نص زر الحاسبة (إنجليزي) 🇬🇧</Label>
                  <Input
                    value={data.roi_calculator.cta_text_en || ''}
                    onChange={(e) => updateRoi('cta_text_en', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">رابط زر الحاسبة</Label>
                  <Input
                    value={data.roi_calculator.cta_url || ''}
                    onChange={(e) => updateRoi('cta_url', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── 4. KEY METRICS PROOF TAB ─── */}
        <TabsContent value="metrics" className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                {isAr ? 'ترويسة قسم الأرقام والإحصائيات' : 'Metrics Proof Header'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شارة القسم (عربي) 🇸🇦</Label>
                  <Input
                    value={data.metrics_proof.badge_ar || ''}
                    onChange={(e) => updateMetrics('badge_ar', e.target.value)}
                    className="text-xs"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شارة القسم (إنجليزي) 🇬🇧</Label>
                  <Input
                    value={data.metrics_proof.badge_en || ''}
                    onChange={(e) => updateMetrics('badge_en', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">عنوان القسم (عربي) 🇸🇦</Label>
                  <Input
                    value={data.metrics_proof.title_ar || ''}
                    onChange={(e) => updateMetrics('title_ar', e.target.value)}
                    className="text-xs"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">عنوان القسم (إنجليزي) 🇬🇧</Label>
                  <Input
                    value={data.metrics_proof.title_en || ''}
                    onChange={(e) => updateMetrics('title_en', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics 4 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.metrics_proof.metrics.map((metric, mIdx) => (
              <Card key={metric.id || mIdx} className="border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-bold text-muted-foreground">#{mIdx + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {metric.visible !== false ? (isAr ? 'ظاهر' : 'Active') : (isAr ? 'مخفي' : 'Hidden')}
                      </span>
                      <Switch
                        checked={metric.visible !== false}
                        onCheckedChange={(v) => {
                          const updated = [...data.metrics_proof.metrics]
                          updated[mIdx] = { ...updated[mIdx], visible: v }
                          updateMetrics('metrics', updated)
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">القيمة / الرقم (مثال: 98% أو &lt; 3s)</Label>
                    <Input
                      value={metric.value || ''}
                      onChange={(e) => {
                        const updated = [...data.metrics_proof.metrics]
                        updated[mIdx] = { ...updated[mIdx], value: e.target.value }
                        updateMetrics('metrics', updated)
                      }}
                      className="text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Input
                      value={metric.title_ar || ''}
                      onChange={(e) => {
                        const updated = [...data.metrics_proof.metrics]
                        updated[mIdx] = { ...updated[mIdx], title_ar: e.target.value }
                        updateMetrics('metrics', updated)
                      }}
                      placeholder="العنوان (عربي)"
                      className="text-xs"
                      dir="rtl"
                    />
                    <Input
                      value={metric.title_en || ''}
                      onChange={(e) => {
                        const updated = [...data.metrics_proof.metrics]
                        updated[mIdx] = { ...updated[mIdx], title_en: e.target.value }
                        updateMetrics('metrics', updated)
                      }}
                      placeholder="Title (English)"
                      className="text-xs"
                      dir="ltr"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Textarea
                      rows={2}
                      value={metric.desc_ar || ''}
                      onChange={(e) => {
                        const updated = [...data.metrics_proof.metrics]
                        updated[mIdx] = { ...updated[mIdx], desc_ar: e.target.value }
                        updateMetrics('metrics', updated)
                      }}
                      placeholder="الوصف (عربي)"
                      className="text-xs"
                      dir="rtl"
                    />
                    <Textarea
                      rows={2}
                      value={metric.desc_en || ''}
                      onChange={(e) => {
                        const updated = [...data.metrics_proof.metrics]
                        updated[mIdx] = { ...updated[mIdx], desc_en: e.target.value }
                        updateMetrics('metrics', updated)
                      }}
                      placeholder="Description (English)"
                      className="text-xs"
                      dir="ltr"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── 5. FINAL CTA TAB ─── */}
        <TabsContent value="cta" className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                {isAr ? 'إعدادات البانر الختامي للتحويل' : 'Final CTA Banner Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شارة البانر (عربي) 🇸🇦</Label>
                  <Input
                    value={data.final_cta.badge_ar || ''}
                    onChange={(e) => updateFinalCta('badge_ar', e.target.value)}
                    className="text-xs"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">شارة البانر (إنجليزي) 🇬🇧</Label>
                  <Input
                    value={data.final_cta.badge_en || ''}
                    onChange={(e) => updateFinalCta('badge_en', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">العنوان الرئيسي (عربي) 🇸🇦</Label>
                  <Input
                    value={data.final_cta.title_ar || ''}
                    onChange={(e) => updateFinalCta('title_ar', e.target.value)}
                    className="text-xs"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">العنوان الرئيسي (إنجليزي) 🇬🇧</Label>
                  <Input
                    value={data.final_cta.title_en || ''}
                    onChange={(e) => updateFinalCta('title_en', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">الوصف الفرعي (عربي) 🇸🇦</Label>
                  <Textarea
                    rows={2}
                    value={data.final_cta.subtitle_ar || ''}
                    onChange={(e) => updateFinalCta('subtitle_ar', e.target.value)}
                    className="text-xs"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">الوصف الفرعي (إنجليزي) 🇬🇧</Label>
                  <Textarea
                    rows={2}
                    value={data.final_cta.subtitle_en || ''}
                    onChange={(e) => updateFinalCta('subtitle_en', e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border border-border/40">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-emerald-600">الزر الرئيسي (Primary CTA)</Label>
                  <Input
                    value={data.final_cta.primary_btn_text_ar || ''}
                    onChange={(e) => updateFinalCta('primary_btn_text_ar', e.target.value)}
                    placeholder="النص بالعربي"
                    className="text-xs"
                    dir="rtl"
                  />
                  <Input
                    value={data.final_cta.primary_btn_text_en || ''}
                    onChange={(e) => updateFinalCta('primary_btn_text_en', e.target.value)}
                    placeholder="Text in English"
                    className="text-xs"
                    dir="ltr"
                  />
                  <Input
                    value={data.final_cta.primary_btn_url || ''}
                    onChange={(e) => updateFinalCta('primary_btn_url', e.target.value)}
                    placeholder="الرابط URL"
                    className="text-xs"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-blue-600">الزر الثانوي (Secondary CTA)</Label>
                  <Input
                    value={data.final_cta.secondary_btn_text_ar || ''}
                    onChange={(e) => updateFinalCta('secondary_btn_text_ar', e.target.value)}
                    placeholder="النص بالعربي"
                    className="text-xs"
                    dir="rtl"
                  />
                  <Input
                    value={data.final_cta.secondary_btn_text_en || ''}
                    onChange={(e) => updateFinalCta('secondary_btn_text_en', e.target.value)}
                    placeholder="Text in English"
                    className="text-xs"
                    dir="ltr"
                  />
                  <Input
                    value={data.final_cta.secondary_btn_url || ''}
                    onChange={(e) => updateFinalCta('secondary_btn_url', e.target.value)}
                    placeholder="الرابط URL"
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
