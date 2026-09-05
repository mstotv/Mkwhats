'use client'

import React from 'react'
import { CheckCircle2, Loader2, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface CartItem {
  id: string
  title: string
  price: number
  quantity: number
  imageUrl?: string | null
}

interface OrderDrawerProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  onUpdateQuantity: (id: string, delta: number) => void
  currency: string
  primaryColor: string
  customerName: string
  setCustomerName: (name: string) => void
  customerPhone: string
  setCustomerPhone: (phone: string) => void
  customerAddress: string
  setCustomerAddress: (address: string) => void
  orderNotes: string
  setOrderNotes: (notes: string) => void
  ordering: boolean
  orderSuccess: string | null
  onClearOrderSuccess: () => void
  onSubmitOrder: (e: React.FormEvent) => void
}

export function OrderDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  currency,
  primaryColor,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerAddress,
  setCustomerAddress,
  orderNotes,
  setOrderNotes,
  ordering,
  orderSuccess,
  onClearOrderSuccess,
  onSubmitOrder,
}: OrderDrawerProps) {
  if (!isOpen) return null

  const cartTotal = cart.reduce((acc, it) => acc + it.price * it.quantity, 0)
  const cartItemsCount = cart.reduce((acc, it) => acc + it.quantity, 0)

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end" dir="rtl">
      <div className="w-full max-w-md bg-slate-900 h-full p-6 flex flex-col justify-between border-r border-slate-800 animate-slide-in-right overflow-y-auto text-right">
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-lg text-white">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <span>سلة المشتريات ({cartItemsCount})</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Order Success State */}
          {orderSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white">تم استلام طلبك بنجاح!</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                رقم الطلب: <span className="font-mono text-emerald-400 font-bold">#{orderSuccess}</span>
                <br />
                تم إرسال رسالة تأكيد فورية إلى رقمك عبر الواتساب. سنتواصل معك لتأكيد الشحن والتسليم.
              </p>
              <Button
                onClick={() => {
                  onClearOrderSuccess()
                  onClose()
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs mt-4"
              >
                متابعة التصفح
              </Button>
            </div>
          ) : cart.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-700" />
              <p className="text-sm">سلة المشتريات فارغة</p>
              <Button onClick={onClose} variant="ghost" size="sm" className="text-xs text-slate-400">
                تصفح المنتجات الآن
              </Button>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {/* Cart Items List */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-xs text-white truncate">{item.title}</h4>
                      <div className="text-xs text-emerald-400 font-bold mt-0.5">
                        {(item.price * item.quantity).toFixed(2)} {currency}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Form */}
              <form onSubmit={onSubmitOrder} className="space-y-3 pt-4 border-t border-slate-800">
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>بيانات المستلم لإتمام الطلب</span>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-300">الاسم الكامل</Label>
                  <Input
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="محمد أحمد"
                    className="bg-slate-950 border-slate-800 text-xs h-9 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-300">رقم الهاتف (الواتساب لتأكيد الطلب)</Label>
                  <Input
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="07701234567"
                    dir="ltr"
                    className="bg-slate-950 border-slate-800 text-xs h-9 font-mono text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-300">عنوان التوصيل (المدينة والمنطقة)</Label>
                  <Input
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="بغداد - المنصور"
                    className="bg-slate-950 border-slate-800 text-xs h-9 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-300">ملاحظات إضافية (اختياري)</Label>
                  <Input
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="وقت التوصيل المفضل..."
                    className="bg-slate-950 border-slate-800 text-xs h-9 text-white"
                  />
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-sm font-bold text-white mb-3">
                    <span>إجمالي الطلب:</span>
                    <span className="text-emerald-400 text-base">{cartTotal.toFixed(2)} {currency}</span>
                  </div>

                  <Button
                    type="submit"
                    disabled={ordering}
                    className="w-full py-3 text-white font-bold text-xs gap-2 shadow-xl"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {ordering ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>تأكيد الطلب الآن</span>
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
