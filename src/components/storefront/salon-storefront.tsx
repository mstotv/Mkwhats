'use client'

import React from 'react'
import {
  Scissors,
  Calendar,
  Sparkles,
  Clock,
  MessageCircle,
  Phone,
  MapPin,
  Camera,
  Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { StorefrontFullConfig, StorefrontItem } from '@/lib/storefront/types'

interface SalonStorefrontProps {
  storefront: StorefrontFullConfig
  items: StorefrontItem[]
  currency: string
  primaryColor: string
  isAppointmentsEnabled: boolean
  onOpenBooking: (service?: StorefrontItem) => void
}

function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

const SAMPLE_GALLERY = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=400&q=80',
]

export function SalonStorefront({
  storefront,
  items,
  currency,
  primaryColor,
  isAppointmentsEnabled,
  onOpenBooking,
}: SalonStorefrontProps) {
  const displayName = storefront.store_name || 'صالون الأناقة والجمال'
  const contact = storefront.contact_buttons || {
    whatsapp_enabled: true,
    whatsapp_number: '',
    phone_enabled: true,
    phone_number: '',
  }

  const services = items.filter((it) => it.type === 'service' || it.type === 'product')
  const salonColor = primaryColor || '#e11d48'

  return (
    <div className="min-h-screen bg-[#140810] text-rose-50 relative pb-28 selection:bg-rose-600 selection:text-white" dir="rtl">
      {/* Rose Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 blur-3xl opacity-20 pointer-events-none rounded-full"
        style={{ backgroundColor: salonColor }}
      />

      {/* Top Banner Cover */}
      {storefront.banner_url ? (
        <div className="w-full h-48 sm:h-72 relative overflow-hidden">
          <img src={storefront.banner_url} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#140810]" />
        </div>
      ) : (
        <div
          className="w-full h-36 sm:h-52 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.25), #1f0b18)',
          }}
        />
      )}

      {/* Header Profile */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-16 z-20">
        <div className="bg-[#220d1c]/90 backdrop-blur-xl border border-[#4a1c3b] rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 text-center sm:text-right">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#301227] border-2 border-rose-500/40 shadow-xl overflow-hidden shrink-0 flex items-center justify-center">
              {storefront.logo_url ? (
                <img src={storefront.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Scissors className="w-10 h-10 text-rose-400" />
              )}
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-rose-100">{displayName}</h1>
                <Heart className="w-5 h-5 text-rose-400 fill-rose-400 shrink-0" />
              </div>

              <p className="text-xs sm:text-sm text-rose-200/70 mt-1.5 max-w-lg leading-relaxed">
                {storefront.bio || 'وجهتكم الأولى للتألق والجمال، جلسات عناية متكاملة بأيدي خبيرات محترفات.'}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-rose-400/80 mt-2 font-mono" dir="ltr">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <span>{storefront.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'domain.com'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {contact.whatsapp_enabled && contact.whatsapp_number && (
              <a
                href={`https://wa.me/${contact.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `مرحباً، أود حجز جلسة في ${displayName}!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white shadow-md transition-transform active:scale-95"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle className="w-4 h-4" />
                <span>واتساب الصالون</span>
              </a>
            )}

            {contact.instagram && (
              <a
                href={contact.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md transition-transform active:scale-95"
              >
                <InstagramIcon className="w-4 h-4" />
                <span>أعمالنا بالإنستا</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Salon Layout */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* 1. Salon Luxury Hero */}
        <section
          className="p-6 sm:p-10 rounded-3xl border border-[#4a1c3b] text-center relative overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #2d0e24 0%, #150811 100%)',
          }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold mb-3 border border-rose-500/30">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>{storefront.settings?.hero_badge || 'عناية فائقة وتجربة جمال استثنائية'}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-rose-100 mb-2.5">
            {storefront.settings?.hero_headline || 'تألقي بإطلالة ساحرة تليق بكِ'}
          </h2>

          <p className="text-xs sm:text-sm text-rose-200/70 max-w-lg mx-auto leading-relaxed mb-6">
            {storefront.settings?.hero_subtitle || 'نقدم لكِ أرقى باقات العناية بالشعر والبشرة والأظافر بأفضل المنتجات العالمية.'}
          </p>

          {/* 2. Rounded Pill CTA (Only if appointments enabled) */}
          {isAppointmentsEnabled && (
            <div className="max-w-xs mx-auto">
              <Button
                onClick={() => onOpenBooking()}
                size="lg"
                className="w-full py-6 rounded-full text-white font-extrabold text-sm sm:text-base gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all"
                style={{ backgroundColor: salonColor }}
              >
                <Calendar className="w-5 h-5" />
                <span>{storefront.settings?.appointment_button_text || 'احجزي موعدكِ الآن'}</span>
              </Button>
            </div>
          )}
        </section>

        {/* 3. Services 3-Column Grid */}
        {services.length > 0 && (
          <section className="space-y-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-rose-100">
                {storefront.settings?.services_title || 'باقات وجلسات العناية والتجميل'}
              </h3>
              <p className="text-xs text-rose-200/60">
                {storefront.settings?.services_subtitle || 'اختاري الجلسة المناسبة لكِ مع إمكانية تحديد موعد مباشر'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-4 rounded-3xl bg-[#220d1c] border border-[#4a1c3b] hover:border-rose-500/50 transition-all flex flex-col justify-between shadow-lg"
                >
                  <div>
                    {service.image_url ? (
                      <div className="w-full h-32 rounded-2xl overflow-hidden mb-3 bg-[#2d0e24]">
                        <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        {service.category || 'جلسة جمال'}
                      </span>
                      {service.duration_minutes ? (
                        <span className="text-[11px] text-rose-200/70 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-rose-400" />
                          {service.duration_minutes} دقيقة
                        </span>
                      ) : null}
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-rose-100 mb-1">{service.title}</h4>
                    {service.description && (
                      <p className="text-[11px] text-rose-200/60 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#4a1c3b] flex items-center justify-between mt-3">
                    <span className="text-sm sm:text-base font-extrabold text-rose-300">
                      {service.price} {currency}
                    </span>

                    {/* Only show booking button if appointments enabled */}
                    {isAppointmentsEnabled && (
                      <button
                        type="button"
                        onClick={() => onOpenBooking(service)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-md active:scale-95 transition-all"
                        style={{ backgroundColor: salonColor }}
                      >
                        حجز الجلسة
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Instagram-Style Gallery Grid (3x2) - EXCLUSIVE TO SALON */}
        <section className="p-6 rounded-3xl bg-[#220d1c] border border-[#4a1c3b] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-rose-400" />
              <div>
                <h4 className="font-bold text-rose-100 text-sm sm:text-base">معرض إبداعاتنا وإطلالات عميلاتنا</h4>
                <p className="text-[11px] text-rose-200/60">شاهدي نتائج جلسات العناية والتسريحات الاحترافية</p>
              </div>
            </div>
            {contact.instagram && (
              <a
                href={contact.instagram}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
              >
                <span>المزيد على إنستا</span>
                <InstagramIcon className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
            {SAMPLE_GALLERY.map((imgUrl, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-2xl overflow-hidden bg-[#301227] border border-[#4a1c3b] relative group"
              >
                <img
                  src={imgUrl}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </section>

        {/* 5. Contact & Booking Information */}
        <section className="p-6 rounded-3xl bg-[#1f0b18] border border-[#4a1c3b] space-y-4">
          <div className="text-center">
            <h4 className="font-bold text-rose-100">تفضلي بزيارتنا أو تواصلي للاستفسار</h4>
            <p className="text-xs text-rose-200/60 mt-0.5">أوقات العمل واستقبال الزائرات</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {contact.whatsapp_number && (
              <a
                href={`https://wa.me/${contact.whatsapp_number.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 hover:scale-[1.02] transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-right min-w-0">
                  <div className="text-xs font-bold text-rose-100">واتساب الصالون</div>
                  <div className="text-[11px] text-emerald-400 font-mono truncate" dir="ltr">{contact.whatsapp_number}</div>
                </div>
              </a>
            )}

            {contact.phone_number && (
              <a
                href={`tel:${contact.phone_number}`}
                className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 hover:scale-[1.02] transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-right min-w-0">
                  <div className="text-xs font-bold text-rose-100">هاتف الاستقبال</div>
                  <div className="text-[11px] text-rose-300 font-mono truncate" dir="ltr">{contact.phone_number}</div>
                </div>
              </a>
            )}

            {contact.maps_url && (
              <a
                href={contact.maps_url}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center gap-3 hover:scale-[1.02] transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-pink-600 text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-right min-w-0">
                  <div className="text-xs font-bold text-rose-100">موقع الصالون</div>
                  <div className="text-[11px] text-pink-300 truncate">عرض على الخريطة</div>
                </div>
              </a>
            )}
          </div>
        </section>
      </main>

      {/* Floating Appointment Pill (Only if appointments enabled) */}
      {isAppointmentsEnabled && (
        <div className="fixed bottom-5 right-5 z-40">
          <Button
            onClick={() => onOpenBooking()}
            className="flex items-center gap-2 px-6 py-6 rounded-full text-white font-extrabold text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all"
            style={{ backgroundColor: salonColor }}
          >
            <Calendar className="w-5 h-5" />
            <span>{storefront.settings?.appointment_button_text || 'حجز موعد'}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
