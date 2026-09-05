'use client'

import React from 'react'
import { Calendar, CheckCircle2, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { StorefrontItem } from '@/lib/storefront/types'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  service: StorefrontItem | null
  bookingDate: string
  setBookingDate: (date: string) => void
  bookingTime: string
  setBookingTime: (time: string) => void
  bookingName: string
  setBookingName: (name: string) => void
  bookingPhone: string
  setBookingPhone: (phone: string) => void
  bookingNotes: string
  setBookingNotes: (notes: string) => void
  loading: boolean
  successMessage: string | null
  onSubmit: (e: React.FormEvent) => void
  primaryColor: string
}

export function BookingModal({
  isOpen,
  onClose,
  service,
  bookingDate,
  setBookingDate,
  bookingTime,
  setBookingTime,
  bookingName,
  setBookingName,
  bookingPhone,
  setBookingPhone,
  bookingNotes,
  setBookingNotes,
  loading,
  successMessage,
  onSubmit,
  primaryColor,
}: BookingModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-right">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {successMessage ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white">تم تأكيد حجزك بنجاح!</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              {successMessage}
            </p>
            <Button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs mt-3"
            >
              إغلاق النافذة
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-lg text-white">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>حجز موعد {service ? `(${service.title})` : ''}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300">تاريخ الموعد</Label>
                <Input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs h-9 text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300">وقت الموعد المفضل</Label>
                <Input
                  type="time"
                  required
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs h-9 text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300">اسم المريض / العميل</Label>
              <Input
                required
                value={bookingName}
                onChange={(e) => setBookingName(e.target.value)}
                placeholder="مثال: سارة محمد"
                className="bg-slate-950 border-slate-800 text-xs h-9 text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300">رقم الهاتف (الواتساب لتأكيد الحجز)</Label>
              <Input
                required
                value={bookingPhone}
                onChange={(e) => setBookingPhone(e.target.value)}
                placeholder="07701234567"
                dir="ltr"
                className="bg-slate-950 border-slate-800 text-xs h-9 font-mono text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300">ملاحظات للأخصائي أو الطبيب (اختياري)</Label>
              <Input
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="استفسار أو شكوى خاصة..."
                className="bg-slate-950 border-slate-800 text-xs h-9 text-white"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full text-white font-bold text-xs gap-2 shadow-xl"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                <span>تأكيد حجز الموعد الآن</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
