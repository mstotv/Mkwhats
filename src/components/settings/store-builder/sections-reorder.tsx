'use client'

import React, { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Sparkles,
  ShoppingBag,
  Stethoscope,
  Calendar,
  PhoneCall,
  ChevronDown,
  ChevronUp,
  Settings2,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { StorefrontSettings } from '@/lib/storefront/types'

export interface SectionItem {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  enabled: boolean
}

export const ALL_SECTIONS_DEF: Record<string, Omit<SectionItem, 'id' | 'enabled'>> = {
  hero: {
    label: 'البانر الترويجي والعروض (Hero Banner)',
    description: 'شعار المتجر، العناوين الرئيسية، وزر اتخاذ إجراء مباشر',
    icon: Sparkles,
  },
  services: {
    label: 'الخدمات والاستشارات (Services & Packages)',
    description: 'قائمة باقات وخدمات العيادة، الصالون أو المركز',
    icon: Stethoscope,
  },
  products: {
    label: 'المنتجات وقائمة الطلب (Products Grid)',
    description: 'عرض الكتالوج، الأسعار، وإضافة المنتجات لسلة الشراء',
    icon: ShoppingBag,
  },
  appointments: {
    label: 'حجز المواعيد المباشر (Appointments)',
    description: 'تقويم اختيار اليوم والوقت لحجز جلسة أو موعد كشف',
    icon: Calendar,
  },
  contact: {
    label: 'معلومات التواصل والموقع (Contact & Social)',
    description: 'رقم الواتساب، الهاتف، روابط انستغرام وتيك توك، والخريطة',
    icon: PhoneCall,
  },
}

function SortableSectionRow({
  item,
  onToggle,
  settings,
  onSettingsChange,
}: {
  item: SectionItem
  onToggle: (id: string, enabled: boolean) => void
  settings?: StorefrontSettings
  onSettingsChange?: React.Dispatch<React.SetStateAction<StorefrontSettings>>
}) {
  const [expanded, setExpanded] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : 1,
  }

  const Icon = item.icon
  const hasCustomFields = ['hero', 'appointments', 'products', 'services'].includes(item.id)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border transition-all ${
        item.enabled
          ? 'bg-card border-border shadow-xs'
          : 'bg-muted/40 border-dashed border-border/60 opacity-60'
      } ${isDragging ? 'shadow-lg ring-2 ring-emerald-500/50' : ''}`}
      dir="rtl"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between p-3.5 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground touch-none"
            title="اسحب لإعادة الترتيب"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {item.label}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {item.description}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {hasCustomFields && item.enabled && onSettingsChange && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition-colors"
              title="تعديل العناوين والنصوص والأزرار"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>نصوص وزر القسم</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          <Switch
            checked={item.enabled}
            onCheckedChange={(checked) => onToggle(item.id, checked)}
          />
        </div>
      </div>

      {/* Expandable Section Customization Panel */}
      {expanded && item.enabled && onSettingsChange && settings && (
        <div className="p-4 border-t border-border/60 bg-muted/20 rounded-b-2xl space-y-3 animate-in fade-in-50 duration-200">
          {item.id === 'appointments' && (
            <>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">عنوان قسم المواعيد الرئيسي</Label>
                <Input
                  value={settings.appointment_headline ?? ''}
                  onChange={(e) =>
                    onSettingsChange((prev) => ({ ...prev, appointment_headline: e.target.value }))
                  }
                  placeholder="مثال: هل تود تحديد موعد كشف أو استشارة خاصة؟"
                  className="text-xs h-9 bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">الوصف التوضيحي للقسم</Label>
                <Input
                  value={settings.appointment_subheadline ?? ''}
                  onChange={(e) =>
                    onSettingsChange((prev) => ({ ...prev, appointment_subheadline: e.target.value }))
                  }
                  placeholder="مثال: يمكنك اختيار اليوم والساعة المناسبة لك، وسيتكفل النظام بإرسال تأكيد الحجز فوراً."
                  className="text-xs h-9 bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  نص زر حجز الموعد
                </Label>
                <Input
                  value={settings.appointment_button_text ?? ''}
                  onChange={(e) =>
                    onSettingsChange((prev) => ({ ...prev, appointment_button_text: e.target.value }))
                  }
                  placeholder="مثال: احجز الآن أونلاين (أو: حجز موعد كشف)"
                  className="text-xs h-9 bg-background font-medium"
                />
              </div>
            </>
          )}

          {item.id === 'hero' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">شارة البانر الترويجي العلوية</Label>
                  <Input
                    value={settings.hero_badge ?? ''}
                    onChange={(e) =>
                      onSettingsChange((prev) => ({ ...prev, hero_badge: e.target.value }))
                    }
                    placeholder="مثال: تصفح واطلب مباشرة مع خدمة التوصيل"
                    className="text-xs h-9 bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    نص زر الإجراء في البانر
                  </Label>
                  <Input
                    value={settings.hero_button_text ?? ''}
                    onChange={(e) =>
                      onSettingsChange((prev) => ({ ...prev, hero_button_text: e.target.value }))
                    }
                    placeholder="مثال: احجز موعدك الآن أونلاين أو تسوق الآن"
                    className="text-xs h-9 bg-background font-medium"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">العنوان الترحيبي الرئيسي</Label>
                <Input
                  value={settings.hero_headline ?? ''}
                  onChange={(e) =>
                    onSettingsChange((prev) => ({ ...prev, hero_headline: e.target.value }))
                  }
                  placeholder="اتركه فارغاً للاستخدام الافتراضي: أهلاً بك في [اسم المتجر]"
                  className="text-xs h-9 bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">الوصف الترحيبي</Label>
                <Input
                  value={settings.hero_subtitle ?? ''}
                  onChange={(e) =>
                    onSettingsChange((prev) => ({ ...prev, hero_subtitle: e.target.value }))
                  }
                  placeholder="نسعد بخدمتكم وتوفير تجربة سريعة مدعومة بإشعارات الواتساب."
                  className="text-xs h-9 bg-background"
                />
              </div>
            </>
          )}

          {item.id === 'products' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">عنوان قسم المنتجات</Label>
                <Input
                  value={settings.products_title ?? ''}
                  onChange={(e) =>
                    onSettingsChange((prev) => ({ ...prev, products_title: e.target.value }))
                  }
                  placeholder="مثال: المنتجات المميزة"
                  className="text-xs h-9 bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">الوصف التوضيحي للمنتجات</Label>
                <Input
                  value={settings.products_subtitle ?? ''}
                  onChange={(e) =>
                    onSettingsChange((prev) => ({ ...prev, products_subtitle: e.target.value }))
                  }
                  placeholder="مثال: تصفح المنتجات وأضفها للسلة للشراء المباشر"
                  className="text-xs h-9 bg-background"
                />
              </div>
            </div>
          )}

          {item.id === 'services' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">عنوان قسم الخدمات</Label>
                <Input
                  value={settings.services_title ?? ''}
                  onChange={(e) =>
                    onSettingsChange((prev) => ({ ...prev, services_title: e.target.value }))
                  }
                  placeholder="مثال: الخدمات والباقات المتاحة"
                  className="text-xs h-9 bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">الوصف التوضيحي للخدمات</Label>
                <Input
                  value={settings.services_subtitle ?? ''}
                  onChange={(e) =>
                    onSettingsChange((prev) => ({ ...prev, services_subtitle: e.target.value }))
                  }
                  placeholder="مثال: اختر الخدمة واحجز موعدك مباشرة بالأوقات المتاحة"
                  className="text-xs h-9 bg-background"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function SectionsReorder({
  sectionsOrder,
  onChange,
  settings,
  onSettingsChange,
}: {
  sectionsOrder: string[]
  onChange: (newOrder: string[]) => void
  settings?: StorefrontSettings
  onSettingsChange?: React.Dispatch<React.SetStateAction<StorefrontSettings>>
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  // Merge full definitions with current order
  const orderList = Array.from(new Set([...sectionsOrder, ...Object.keys(ALL_SECTIONS_DEF)]))
  const items: SectionItem[] = orderList
    .filter((id) => ALL_SECTIONS_DEF[id])
    .map((id) => ({
      id,
      ...ALL_SECTIONS_DEF[id],
      enabled: sectionsOrder.includes(id),
    }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)

    const reordered = arrayMove(items, oldIndex, newIndex)
    // Persist all enabled items in new order
    const updatedOrder = reordered.filter((i) => i.enabled).map((i) => i.id)
    onChange(updatedOrder)
  }

  const handleToggle = (id: string, enabled: boolean) => {
    let next: string[]
    if (enabled) {
      next = [...sectionsOrder, id]
    } else {
      next = sectionsOrder.filter((item) => item !== id)
    }
    onChange(next)

    // Synchronize explicit settings toggles
    if (onSettingsChange) {
      if (id === 'appointments') {
        onSettingsChange((prev) => ({ ...prev, enable_appointments: enabled }))
      }
      if (id === 'products') {
        onSettingsChange((prev) => ({ ...prev, enable_direct_orders: enabled }))
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>اسحب المقبض ⠿ لإعادة ترتيب تسلسل الأقسام، أو اضغط (نصوص وزر القسم) لتخصيص العناوين</span>
        <span>تفعيل/إخفاء</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
            {items.map((item) => (
              <SortableSectionRow
                key={item.id}
                item={item}
                onToggle={handleToggle}
                settings={settings}
                onSettingsChange={onSettingsChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
