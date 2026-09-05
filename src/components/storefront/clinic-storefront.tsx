'use client'

import React from 'react'
import {
  Stethoscope,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle,
  MessageCircle,
  Phone,
  MapPin,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { StorefrontFullConfig, StorefrontItem } from '@/lib/storefront/types'

interface ClinicStorefrontProps {
  storefront: StorefrontFullConfig
  items: StorefrontItem[]
  currency: string
  primaryColor: string
  isAppointmentsEnabled: boolean
  onOpenBooking: (service?: StorefrontItem) => void
}

export function ClinicStorefront({
  storefront,
  items,
  currency,
  primaryColor,
  isAppointmentsEnabled,
  onOpenBooking,
}: ClinicStorefrontProps) {
  const displayName = storefront.store_name || 'العيادة الطبية التخصصية'
  const contact = storefront.contact_buttons || {
    whatsapp_enabled: true,
    whatsapp_number: '',
    phone_enabled: true,
    phone_number: '',
  }

  const services = items.filter((it) => it.type === 'service' || it.type === 'product')
  const clinicColor = primaryColor || '#059669'

  const sampleSlots = ['09:30 ص', '11:00 ص', '01:30 م', '04:00 م', '06:30 م', '08:00 م']

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 relative pb-28 selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Medical Ambient Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 blur-3xl opacity-20 pointer-events-none rounded-full"
        style={{ backgroundColor: clinicColor }}
      />

      {/* Top Banner Cover */}
      {storefront.banner_url ? (
        <div className="w-full h-44 sm:h-64 relative overflow-hidden">
          <img src={storefront.banner_url} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#030712]" />
        </div>
      ) : (
        <div
          className="w-full h-36 sm:h-48 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${clinicColor}33, #020617)`,
          }}
        />
      )}

      {/* Header Profile */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-16 z-20">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 text-center sm:text-right">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-950 border-2 border-emerald-500/30 shadow-xl overflow-hidden shrink-0 flex items-center justify-center">
              {storefront.logo_url ? (
                <img src={storefront.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Stethoscope className="w-10 h-10 text-emerald-400" />
              )}
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{displayName}</h1>
                <span title="عيادة مرخصة وموثوقة">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-lg leading-relaxed">
                {storefront.bio || 'رعاية صحية واستشارية متكاملة بأحدث الأجهزة الطبية والكوادر التخصصية المعتمدة.'}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-emerald-400/80 mt-2 font-mono" dir="ltr">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{storefront.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'domain.com'}</span>
              </div>
            </div>
          </div>

          {/* Quick Contact */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {contact.whatsapp_enabled && contact.whatsapp_number && (
              <a
                href={`https://wa.me/${contact.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `مرحباً دكتور، أود الاستفسار بخصوص المواعيد في ${displayName}!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-transform active:scale-95"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle className="w-4 h-4" />
                <span>واتساب الاستشارات</span>
              </a>
            )}

            {contact.phone_enabled && contact.phone_number && (
              <a
                href={`tel:${contact.phone_number}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>اتصال مباشر</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Clinic Layout */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-7">
        {/* 1. Medical Hero Banner */}
        <section
          className="p-6 sm:p-8 rounded-3xl border border-emerald-500/30 text-center relative overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(2, 6, 23, 0.9) 100%)',
          }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{storefront.settings?.hero_badge || 'رعاية طبية تخصصية ومواعيد مؤكدة'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            {storefront.settings?.hero_headline || 'صحتكم وراحتكم هي أولويتنا الأولى'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed mb-5">
            {storefront.settings?.hero_subtitle || 'فريق طبي متكامل بخبرة واسعة لتقديم أفضل التشخيصات والاستشارات العلاجية الدقيقة.'}
          </p>

          {/* 2. Prominent Full-Width Booking CTA (Only if enabled) */}
          {isAppointmentsEnabled && (
            <div className="max-w-md mx-auto">
              <Button
                onClick={() => onOpenBooking()}
                size="lg"
                className="w-full py-6 text-white font-extrabold text-sm sm:text-base gap-2 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                style={{ backgroundColor: clinicColor }}
              >
                <Calendar className="w-5 h-5" />
                <span>{storefront.settings?.appointment_button_text || 'احجز كشفك الطبي الآن أونلاين'}</span>
              </Button>
            </div>
          )}
        </section>

        {/* 3. Inline Time Picker & Schedule Widget (Only if appointments enabled) */}
        {isAppointmentsEnabled && (
          <section className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>أوقات الكشف المتاحة اليوم وغداً</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                حجز فوري متاح
              </span>
            </div>

            <p className="text-xs text-slate-400">
              اختر الوقت المناسب لك لتأكيد الحجز المباشر واستلام إشعار التأكيد فوراً عبر الواتساب:
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {sampleSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onOpenBooking()}
                  className="py-2.5 px-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 text-xs font-semibold text-slate-200 hover:text-emerald-400 text-center transition-all hover:scale-105 active:scale-95"
                >
                  {slot}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 4. Medical Services & Consultations Grid (2 columns) */}
        {services.length > 0 && (
          <section className="space-y-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {storefront.settings?.services_title || 'الاستشارات والخدمات الطبية المتاحة'}
              </h3>
              <p className="text-xs text-slate-400">
                {storefront.settings?.services_subtitle || 'اختر الخدمة أو الكشف المطلوب للاطلاع على التفاصيل وحجز الجلسة'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between shadow-lg"
                >
                  <div>
                    {service.image_url ? (
                      <div className="w-full h-36 rounded-xl overflow-hidden mb-3 bg-slate-950">
                        <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {service.category || 'كشف طبي'}
                      </span>
                      {service.duration_minutes ? (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          {service.duration_minutes} دقيقة
                        </span>
                      ) : null}
                    </div>

                    <h4 className="font-bold text-base text-white mb-1.5">{service.title}</h4>
                    {service.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between mt-3">
                    <span className="text-base font-extrabold text-emerald-400">
                      {service.price} {currency}
                    </span>

                    {/* ONLY SHOW BOOKING BUTTON IF APPOINTMENTS ARE ENABLED */}
                    {isAppointmentsEnabled && (
                      <Button
                        onClick={() => onOpenBooking(service)}
                        size="sm"
                        className="text-white text-xs font-semibold gap-1.5 shadow-md"
                        style={{ backgroundColor: clinicColor }}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{storefront.settings?.appointment_button_text || 'حجز الكشف'}</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Clinic Info & Location Bento */}
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="text-center">
            <h4 className="font-bold text-white">معلومات العيادة وساعات العمل</h4>
            <p className="text-xs text-slate-400 mt-0.5">يسعدنا استقبالكم خلال ساعات الدوام الرسمي</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {contact.whatsapp_number && (
              <a
                href={`https://wa.me/${contact.whatsapp_number.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 hover:scale-[1.02] transition-transform"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-right min-w-0">
                  <div className="text-xs font-bold text-white">واتساب الاستقبال</div>
                  <div className="text-[11px] text-emerald-400 font-mono truncate" dir="ltr">{contact.whatsapp_number}</div>
                </div>
              </a>
            )}

            {contact.phone_number && (
              <a
                href={`tel:${contact.phone_number}`}
                className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3 hover:scale-[1.02] transition-transform"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-right min-w-0">
                  <div className="text-xs font-bold text-white">هاتف العيادة</div>
                  <div className="text-[11px] text-blue-400 font-mono truncate" dir="ltr">{contact.phone_number}</div>
                </div>
              </a>
            )}

            {contact.maps_url && (
              <a
                href={contact.maps_url}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 hover:scale-[1.02] transition-transform"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-right min-w-0">
                  <div className="text-xs font-bold text-white">موقع العيادة</div>
                  <div className="text-[11px] text-amber-400 truncate">عرض على الخريطة</div>
                </div>
              </a>
            )}
          </div>
        </section>
      </main>

      {/* Floating Action Button (Only for booking if enabled) */}
      {isAppointmentsEnabled && (
        <div className="fixed bottom-5 right-5 z-40">
          <Button
            onClick={() => onOpenBooking()}
            className="flex items-center gap-2 px-5 py-6 rounded-full text-white font-extrabold text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all"
            style={{ backgroundColor: clinicColor }}
          >
            <Calendar className="w-5 h-5" />
            <span>{storefront.settings?.appointment_button_text || 'حجز كشف'}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
