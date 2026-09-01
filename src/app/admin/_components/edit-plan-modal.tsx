'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save, Bot, FileSpreadsheet, Send, ShoppingBag, Zap, Workflow, Mic } from 'lucide-react'

export interface Plan {
  id: string
  name: string
  name_en?: string
  description?: string
  description_en?: string
  slug: string
  price_monthly: number
  price_yearly: number
  max_users: number
  max_whatsapp_instances: number
  max_contacts: number
  max_messages_monthly?: number
  max_broadcasts_monthly?: number
  features?: {
    ai_assistant?: boolean
    voice_transcription?: boolean
    excel_export?: boolean
    telegram_bot?: boolean
    automations?: boolean
    flows_builder?: boolean
    woocommerce_integration?: boolean
    shopify_integration?: boolean
  }
  is_active: boolean
  subscriber_count?: number
}

interface EditPlanModalProps {
  plan: Plan | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditPlanModal({
  plan,
  open,
  onOpenChange,
  onSuccess,
}: EditPlanModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    description_en: '',
    price_monthly: 0,
    price_yearly: 0,
    max_users: 1,
    max_whatsapp_instances: 1,
    max_contacts: 1000,
    max_messages_monthly: 1000,
    max_broadcasts_monthly: 10,
    features: {
      ai_assistant: true,
      voice_transcription: false,
      excel_export: true,
      telegram_bot: false,
      automations: false,
      flows_builder: false,
      woocommerce_integration: false,
      shopify_integration: false,
    },
    is_active: true,
  })

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        name_en: plan.name_en || '',
        description: plan.description || '',
        description_en: plan.description_en || '',
        price_monthly: plan.price_monthly ?? 0,
        price_yearly: plan.price_yearly ?? 0,
        max_users: plan.max_users ?? 1,
        max_whatsapp_instances: plan.max_whatsapp_instances ?? 1,
        max_contacts: plan.max_contacts ?? 1000,
        max_messages_monthly: plan.max_messages_monthly ?? 1000,
        max_broadcasts_monthly: plan.max_broadcasts_monthly ?? 10,
        features: {
          ai_assistant: Boolean(plan.features?.ai_assistant),
          voice_transcription: Boolean(plan.features?.voice_transcription),
          excel_export: Boolean(plan.features?.excel_export),
          telegram_bot: Boolean(plan.features?.telegram_bot),
          automations: Boolean(plan.features?.automations),
          flows_builder: Boolean(plan.features?.flows_builder),
          woocommerce_integration: Boolean(plan.features?.woocommerce_integration),
          shopify_integration: Boolean(plan.features?.shopify_integration),
        },
        is_active: plan.is_active ?? true,
      })
      setError(null)
    }
  }, [plan])

  if (!plan) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'فشل تحديث الخطة')
        return
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التحديث')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-slate-100 dir-rtl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-right">
          <DialogTitle className="text-lg font-semibold text-slate-100">
            تعديل الخطة ({plan.slug})
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Plan Name AR & EN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">اسم الخطة بالعربية 🇸🇦</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: المحترف"
                required
                className="bg-slate-950 border-slate-800 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Plan Name in English 🇬🇧</Label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="e.g. Pro"
                className="bg-slate-950 border-slate-800 text-xs dir-ltr"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">السعر الشهري ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price_monthly}
                onChange={(e) =>
                  setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })
                }
                className="bg-slate-950 border-slate-800 text-slate-100 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">السعر السنوي ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price_yearly}
                onChange={(e) =>
                  setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })
                }
                className="bg-slate-950 border-slate-800 text-slate-100 text-sm"
                required
              />
            </div>
          </div>

          {/* Numeric Limits Row 1: Users, Instances, Contacts */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">الأعضاء (-1 لا محدود)</Label>
              <Input
                type="number"
                value={formData.max_users}
                onChange={(e) =>
                  setFormData({ ...formData, max_users: parseInt(e.target.value) || 0 })
                }
                className="bg-slate-950 border-slate-800 text-slate-100 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">أجهزة الواتساب</Label>
              <Input
                type="number"
                min="1"
                value={formData.max_whatsapp_instances}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_whatsapp_instances: parseInt(e.target.value) || 1,
                  })
                }
                className="bg-slate-950 border-slate-800 text-slate-100 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">جهات الاتصال</Label>
              <Input
                type="number"
                min="1"
                value={formData.max_contacts}
                onChange={(e) =>
                  setFormData({ ...formData, max_contacts: parseInt(e.target.value) || 0 })
                }
                className="bg-slate-950 border-slate-800 text-slate-100 text-sm"
                required
              />
            </div>
          </div>

          {/* Monthly Quota Limits Row 2: Messages & Broadcasts */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">الرسائل الشهرية (-1 لا محدود)</Label>
              <Input
                type="number"
                value={formData.max_messages_monthly}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_messages_monthly: parseInt(e.target.value) || 0,
                  })
                }
                className="bg-slate-950 border-slate-800 text-slate-100 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">الحملات الشهرية (-1 لا محدود)</Label>
              <Input
                type="number"
                value={formData.max_broadcasts_monthly}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_broadcasts_monthly: parseInt(e.target.value) || 0,
                  })
                }
                className="bg-slate-950 border-slate-800 text-slate-100 text-sm"
                required
              />
            </div>
          </div>

          {/* Feature Toggles Section */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <Label className="text-xs font-semibold text-indigo-400">ميزات الخطة المفعّلة (Features)</Label>
            <div className="space-y-2">
              {/* AI Assistant */}
              <div className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-indigo-400" />
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium text-slate-200">مساعد الردود الذكي (AI Assistant)</Label>
                  </div>
                </div>
                <Switch
                  checked={formData.features.ai_assistant}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, ai_assistant: checked },
                    })
                  }
                />
              </div>

              {/* Voice Transcription STT */}
              <div className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-rose-400" />
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium text-slate-200">فهم الرسائل الصوتية (Voice STT)</Label>
                  </div>
                </div>
                <Switch
                  checked={formData.features.voice_transcription}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, voice_transcription: checked },
                    })
                  }
                />
              </div>

              {/* Excel Export */}
              <div className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-indigo-400" />
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium text-slate-200">تصدير تقارير Excel</Label>
                  </div>
                </div>
                <Switch
                  checked={formData.features.excel_export}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, excel_export: checked },
                    })
                  }
                />
              </div>

              {/* Telegram Bot */}
              <div className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-indigo-400" />
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium text-slate-200">تكامل بوت Telegram</Label>
                  </div>
                </div>
                <Switch
                  checked={formData.features.telegram_bot}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, telegram_bot: checked },
                    })
                  }
                />
              </div>

              {/* Automations */}
              <div className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium text-slate-200">الأتمتة والردود الذكية</Label>
                  </div>
                </div>
                <Switch
                  checked={formData.features.automations}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, automations: checked },
                    })
                  }
                />
              </div>

              {/* Flows Builder */}
              <div className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-cyan-400" />
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium text-slate-200">منشئ مسارات العمل (Flows)</Label>
                  </div>
                </div>
                <Switch
                  checked={formData.features.flows_builder}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, flows_builder: checked },
                    })
                  }
                />
              </div>

              {/* WooCommerce Integration */}
              <div className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-purple-400" />
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium text-slate-200">ربط ووكومرس (WooCommerce)</Label>
                  </div>
                </div>
                <Switch
                  checked={formData.features.woocommerce_integration}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, woocommerce_integration: checked },
                    })
                  }
                />
              </div>

              {/* Shopify Integration */}
              <div className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-emerald-400" />
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium text-slate-200">ربط شوبيفاي (Shopify)</Label>
                  </div>
                </div>
                <Switch
                  checked={formData.features.shopify_integration}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, shopify_integration: checked },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-slate-800/80 p-3 mt-3">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium text-slate-200">حالة الخطة (is_active)</Label>
              <p className="text-[11px] text-slate-400">
                الخطط المفعّلة فقط تظهر عند الترقية أو التخصيص
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>

          <DialogFooter className="pt-3 border-t border-slate-800 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="border border-slate-800 text-slate-400 hover:bg-slate-800 text-xs"
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
