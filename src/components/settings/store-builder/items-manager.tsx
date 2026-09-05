'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit2,
  ShoppingBag,
  Stethoscope,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Tag,
  UploadCloud,
} from 'lucide-react'
import type { StorefrontItem } from '@/lib/storefront/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export function ItemsManager({
  businessType,
  currency = 'USD',
}: {
  businessType: string
  currency?: string
}) {
  const [items, setItems] = useState<StorefrontItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'product' | 'service'>('all')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<StorefrontItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Form fields
  const [type, setType] = useState<'product' | 'service'>('product')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [comparePrice, setComparePrice] = useState<number | null>(null)
  const [category, setCategory] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number>(30)
  const [imageUrl, setImageUrl] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/storefront/items')
      const json = await res.json()
      if (json.items) {
        setItems(json.items)
      }
    } catch {
      toast.error('تعذر جلب المنتجات والخدمات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const openAddModal = (defaultType?: 'product' | 'service') => {
    setEditingItem(null)
    setType(defaultType || (businessType === 'clinic' || businessType === 'salon' ? 'service' : 'product'))
    setTitle('')
    setDescription('')
    setPrice(0)
    setComparePrice(null)
    setCategory('')
    setDurationMinutes(30)
    setImageUrl('')
    setIsAvailable(true)
    setModalOpen(true)
  }

  const openEditModal = (item: StorefrontItem) => {
    setEditingItem(item)
    setType(item.type)
    setTitle(item.title)
    setDescription(item.description || '')
    setPrice(item.price)
    setComparePrice(item.compare_at_price || null)
    setCategory(item.category || '')
    setDurationMinutes(item.duration_minutes || 30)
    setImageUrl(item.image_url || '')
    setIsAvailable(item.is_available)
    setModalOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'items')

      const res = await fetch('/api/storefront/upload', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (json.url) {
        setImageUrl(json.url)
        toast.success('تم رفع الصورة بنجاح')
      } else {
        toast.error(json.error || 'فشل رفع الصورة')
      }
    } catch {
      toast.error('خطأ أثناء رفع الصورة')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSaveItem = async () => {
    if (!title.trim()) {
      toast.error('يرجى كتابة اسم المنتج أو الخدمة')
      return
    }

    setSaving(true)
    try {
      const payload = {
        type,
        title: title.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        compare_at_price: comparePrice ? Number(comparePrice) : null,
        category: category.trim() || 'عام',
        duration_minutes: type === 'service' ? Number(durationMinutes) || 30 : null,
        image_url: imageUrl || null,
        is_available: isAvailable,
      }

      if (editingItem) {
        const res = await fetch('/api/storefront/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...payload }),
        })
        const data = await res.json()
        if (data.item) {
          setItems((prev) => prev.map((it) => (it.id === editingItem.id ? data.item : it)))
          toast.success('تم تعديل العنصر بنجاح')
          setModalOpen(false)
        } else {
          toast.error(data.error || 'فشل التعديل')
        }
      } else {
        const res = await fetch('/api/storefront/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.item) {
          setItems((prev) => [data.item, ...prev])
          toast.success('تمت إضافة العنصر بنجاح')
          setModalOpen(false)
        } else {
          toast.error(data.error || 'فشل الإضافة')
        }
      }
    } catch {
      toast.error('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return

    try {
      const res = await fetch(`/api/storefront/items?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id))
        toast.success('تم حذف العنصر')
      } else {
        toast.error('تعذر الحذف')
      }
    } catch {
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  const handleToggleAvailability = async (item: StorefrontItem) => {
    const nextVal = !item.is_available
    try {
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, is_available: nextVal } : it)))
      await fetch('/api/storefront/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_available: nextVal }),
      })
    } catch {
      toast.error('تعذر تحديث الحالة')
    }
  }

  const filteredItems = items.filter((it) => {
    if (activeTab === 'all') return true
    return it.type === activeTab
  })

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/60 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'all' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
            }`}
          >
            الكل ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('product')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
              activeTab === 'product' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            منتجات ({items.filter((i) => i.type === 'product').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('service')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
              activeTab === 'service' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            خدمات ومواعيد ({items.filter((i) => i.type === 'service').length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => openAddModal()}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
          >
            <Plus className="w-4 h-4" />
            إضافة عنصر جديد
          </Button>
        </div>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/20">
          <ShoppingBag className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">لا توجد منتجات أو خدمات مضافة بعد</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            أضف منتجات متجرك أو خدمات وعيادتك وصالونك لتظهر فوراً في الواجهة الرئيسية لزوارك.
          </p>
          <Button
            type="button"
            onClick={() => openAddModal()}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            إضافة أول عنصر الآن
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 bg-card ${
                item.is_available ? 'border-border' : 'border-border/60 opacity-60 bg-muted/30'
              }`}
            >
              {/* Image Thumbnail */}
              <div className="w-16 h-16 rounded-xl bg-muted/60 border border-border/60 overflow-hidden shrink-0 flex items-center justify-center">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                      item.type === 'service'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {item.type === 'service' ? 'خدمة / موعد' : 'منتج'}
                  </span>
                  {item.category && (
                    <span className="text-[10px] text-muted-foreground truncate">
                      • {item.category}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-foreground truncate">{item.title}</h4>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {item.price} {currency}
                  </span>
                  {item.compare_at_price && (
                    <span className="text-xs text-muted-foreground line-through">
                      {item.compare_at_price} {currency}
                    </span>
                  )}
                  {item.type === 'service' && item.duration_minutes && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 mr-auto">
                      <Clock className="w-3 h-3" />
                      {item.duration_minutes} د
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <Switch
                  checked={item.is_available}
                  onCheckedChange={() => handleToggleAvailability(item)}
                  title={item.is_available ? 'متاح' : 'معطل'}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingItem ? 'تعديل العنصر' : 'إضافة منتج أو خدمة جديدة'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type Selector */}
            <div className="space-y-1.5">
              <Label>نوع العنصر</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('product')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    type === 'product'
                      ? 'border-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-border text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  منتج للبيع المباشر
                </button>
                <button
                  type="button"
                  onClick={() => setType('service')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    type === 'service'
                      ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-border text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  خدمة / جلسة / حجز موعد
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="item-title">
                {type === 'service' ? 'اسم الخدمة أو الاستشارة' : 'اسم المنتج'}
              </Label>
              <Input
                id="item-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'service' ? 'مثال: جلسة تنظيف بشرة أو كشف باطنية' : 'مثال: ساعة يد رجالية فاخرة'}
              />
            </div>

            {/* Price & Compare Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="item-price">السعر ({currency})</Label>
                <Input
                  id="item-price"
                  type="number"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-compare">السعر قبل الخصم (اختياري)</Label>
                <Input
                  id="item-compare"
                  type="number"
                  min="0"
                  step="any"
                  value={comparePrice || ''}
                  onChange={(e) => setComparePrice(e.target.value ? Number(e.target.value) : null)}
                  placeholder="مشطوب"
                />
              </div>
            </div>

            {/* Category & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="item-cat">التصنيف</Label>
                <Input
                  id="item-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="مثال: عطور / استشارات"
                />
              </div>

              {type === 'service' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="item-dur">مدة الجلسة (بالدقائق)</Label>
                  <Input
                    id="item-dur"
                    type="number"
                    min="10"
                    step="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between pt-6">
                  <span className="text-xs font-medium">حالة التوفر فوراً</span>
                  <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-1.5">
              <Label>صورة العنصر</Label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border border-border bg-muted/40 overflow-hidden shrink-0 flex items-center justify-center">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                  )}
                </div>

                <div className="flex-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input bg-background hover:bg-muted text-xs font-medium cursor-pointer transition-colors">
                    {uploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingImage ? 'جاري الرفع...' : 'رفع صورة من الجهاز'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                  <div className="text-[11px] text-muted-foreground mt-1">PNG, JPG أو WebP بحد أقصى 5MB.</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="item-desc">الوصف والمميزات</Label>
              <textarea
                id="item-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اكتب نبذة مختصرة عن المنتج أو تفاصيل الخدمة المقدمة..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleSaveItem}
              disabled={saving || !title.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
              {editingItem ? 'حفظ التعديلات' : 'إضافة العنصر'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
