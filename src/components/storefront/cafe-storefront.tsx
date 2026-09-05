'use client'

import React from 'react'
import {
  Coffee,
  ShoppingBag,
  Calendar,
  Sparkles,
  Clock,
  Plus,
  MessageCircle,
  Phone,
  MapPin,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { StorefrontFullConfig, StorefrontItem } from '@/lib/storefront/types'

interface CafeStorefrontProps {
  storefront: StorefrontFullConfig
  items: StorefrontItem[]
  currency: string
  primaryColor: string
  isAppointmentsEnabled: boolean
  isProductsEnabled: boolean
  cartItemsCount: number
  onOpenCart: () => void
  onOpenBooking: (service?: StorefrontItem) => void
  onAddToCart: (item: StorefrontItem) => void
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

export function CafeStorefront({
  storefront,
  items,
  currency,
  primaryColor,
  isAppointmentsEnabled,
  isProductsEnabled,
  cartItemsCount,
  onOpenCart,
  onOpenBooking,
  onAddToCart,
}: CafeStorefrontProps) {
  const displayName = storefront.store_name || 'كافيه القهوة المختصة'
  const contact = storefront.contact_buttons || {
    whatsapp_enabled: true,
    whatsapp_number: '',
    phone_enabled: true,
    phone_number: '',
  }

  const drinksList = items.filter((it) => it.type === 'service' || it.category?.includes('مشروب') || it.category?.includes('قهوة'))
  const bakeryList = items.filter((it) => it.type === 'product' || !drinksList.some(d => d.id === it.id))

  return (
    <div className="min-h-screen bg-[#120b08] text-amber-50 relative pb-28 selection:bg-amber-600 selection:text-white" dir="rtl">
      {/* Warm Ambient Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 blur-3xl opacity-25 pointer-events-none rounded-full"
        style={{ backgroundColor: primaryColor || '#d97706' }}
      />

      {/* Top Banner Cover */}
      {storefront.banner_url ? (
        <div className="w-full h-48 sm:h-72 relative overflow-hidden">
          <img src={storefront.banner_url} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#120b08]" />
        </div>
      ) : (
        <div
          className="w-full h-36 sm:h-52 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #78350f44, #1c100a)',
          }}
        />
      )}

      {/* Navigation & Header */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-16 z-20">
        <div className="bg-[#1c100a]/90 backdrop-blur-xl border border-[#3a2215] rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 text-center sm:text-right">
          {/* Logo & Info */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#26160e] border-2 border-[#4d2d1d] shadow-xl overflow-hidden shrink-0 flex items-center justify-center">
              {storefront.logo_url ? (
                <img src={storefront.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Coffee className="w-10 h-10 text-amber-500" />
              )}
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-100">{displayName}</h1>
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              </div>

              <p className="text-xs sm:text-sm text-amber-200/70 mt-1.5 max-w-lg leading-relaxed">
                {storefront.bio || 'نقدم أجود أنواع القهوة المختصة والمخبوزات الطازجة يومياً بحب وإتقان.'}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-amber-400/80 mt-2 font-mono" dir="ltr">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>{storefront.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'domain.com'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {contact.whatsapp_enabled && contact.whatsapp_number && (
              <a
                href={`https://wa.me/${contact.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `مرحباً، أود الطلب أو الاستفسار من ${displayName}!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle className="w-4 h-4" />
                <span>واتساب</span>
              </a>
            )}

            {isProductsEnabled && (
              <button
                type="button"
                onClick={onOpenCart}
                className="relative inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-transform active:scale-95"
                style={{ backgroundColor: primaryColor || '#d97706' }}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>الطلبات</span>
                {cartItemsCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-white text-slate-900 text-[10px] font-extrabold flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Cafe Bento Layout */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* 1. Cafe Hero Card */}
        <section
          className="p-6 sm:p-10 rounded-3xl border border-[#3a2215] text-center relative overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #2a150c 0%, #150b06 100%)',
          }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{storefront.settings?.hero_badge || 'قهوة مختصة ومخبوزات طازجة يومياً'}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-amber-100 mb-2.5">
            {storefront.settings?.hero_headline || 'تذوق سحر القهوة بنكهات استثنائية'}
          </h2>

          <p className="text-xs sm:text-sm text-amber-200/70 max-w-lg mx-auto leading-relaxed">
            {storefront.settings?.hero_subtitle || 'حبوب منتقاة بعناية من أرقى مزارع البن العالمية، محمصة ومحضرة طازجة خصيصاً لك.'}
          </p>
        </section>

        {/* 2. Bento Action Cards (Order Online & Book Table) */}
        <div className={`grid ${isAppointmentsEnabled ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-4`}>
          {isProductsEnabled && (
            <div
              onClick={onOpenCart}
              className="p-5 rounded-2xl bg-[#1d120c] border border-[#3a2215] hover:border-amber-600/60 transition-all cursor-pointer flex items-center justify-between group shadow-lg"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-base text-amber-100">اطلب الآن أونلاين</div>
                  <div className="text-xs text-amber-200/60">تصفح المنيو واستلم طلبك طازجاً</div>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
            </div>
          )}

          {isAppointmentsEnabled && (
            <div
              onClick={() => onOpenBooking()}
              className="p-5 rounded-2xl bg-[#1d120c] border border-[#3a2215] hover:border-amber-600/60 transition-all cursor-pointer flex items-center justify-between group shadow-lg"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#451a03] text-amber-400 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform border border-amber-600/30">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-base text-amber-100">
                    {storefront.settings?.appointment_button_text || 'حجز طاولة مسبقاً'}
                  </div>
                  <div className="text-xs text-amber-200/60">احجز جلستك لتجربة استثنائية هادئة</div>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
            </div>
          )}
        </div>

        {/* 3. Horizontal Scrollable Menu for Drinks */}
        {drinksList.length > 0 && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-amber-100">
                  {storefront.settings?.services_title || 'قائمة المشروبات والقهوة المختصة'}
                </h3>
                <p className="text-xs text-amber-200/60">اسحب أفقياً لتصفح الخيارات المتاحة</p>
              </div>
            </div>

            <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x">
              {drinksList.map((drink) => (
                <div
                  key={drink.id}
                  className="w-56 sm:w-64 shrink-0 snap-start p-4 rounded-2xl bg-[#1d120c] border border-[#3a2215] flex flex-col justify-between shadow-md hover:border-amber-500/50 transition-all"
                >
                  {drink.image_url ? (
                    <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-[#2a170e]">
                      <img src={drink.image_url} alt={drink.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-24 rounded-xl bg-[#2a170e] flex items-center justify-center mb-3 text-amber-500">
                      <Coffee className="w-8 h-8 opacity-70" />
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-sm text-amber-100 line-clamp-1">{drink.title}</h4>
                    {drink.description && (
                      <p className="text-[11px] text-amber-200/60 line-clamp-2 mt-1 leading-relaxed">
                        {drink.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#3a2215] flex items-center justify-between mt-3">
                    <span className="text-sm font-extrabold text-amber-400">
                      {drink.price} {currency}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddToCart(drink)}
                      className="p-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-md active:scale-95 transition-transform"
                      title="إضافة للطلب"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Products Grid (Bakery & Sweets) */}
        {isProductsEnabled && bakeryList.length > 0 && (
          <section className="space-y-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-amber-100">
                {storefront.settings?.products_title || 'المخبوزات والحلويات الطازجة'}
              </h3>
              <p className="text-xs text-amber-200/60">تُخبز يومياً في معملنا بمكونات عضوية</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {bakeryList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-[#1d120c] border border-[#3a2215] overflow-hidden flex flex-col justify-between shadow-md hover:border-amber-600/50 transition-all"
                >
                  <div className="w-full aspect-square bg-[#26150e] relative overflow-hidden flex items-center justify-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    ) : (
                      <Coffee className="w-8 h-8 text-amber-600/60" />
                    )}
                  </div>

                  <div className="p-3 flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-amber-100 truncate">{item.title}</h4>
                      {item.description && (
                        <p className="text-[10px] text-amber-200/60 line-clamp-1 mt-0.5">{item.description}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#3a2215] flex items-center justify-between mt-2">
                      <span className="text-xs sm:text-sm font-extrabold text-amber-400">
                        {item.price} {currency}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAddToCart(item)}
                        className="w-7 h-7 rounded-lg bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center shadow-xs active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Contact & Social Bento */}
        <section className="p-6 rounded-3xl bg-[#1c100a] border border-[#3a2215] space-y-4 shadow-xl">
          <div className="text-center">
            <h4 className="font-bold text-amber-100">تفضل بزيارتنا أو تواصل معنا</h4>
            <p className="text-xs text-amber-200/60 mt-0.5">جاهزون لاستقبالكم وخدمتكم بكل ود</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {contact.whatsapp_number && (
              <a
                href={`https://wa.me/${contact.whatsapp_number.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 hover:scale-[1.02] transition-transform"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-amber-100">واتساب مباشر</div>
                  <div className="text-[10px] text-emerald-400 font-mono" dir="ltr">{contact.whatsapp_number}</div>
                </div>
              </a>
            )}

            {contact.phone_number && (
              <a
                href={`tel:${contact.phone_number}`}
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 hover:scale-[1.02] transition-transform"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-amber-100">اتصال هاتف</div>
                  <div className="text-[10px] text-amber-400 font-mono" dir="ltr">{contact.phone_number}</div>
                </div>
              </a>
            )}

            {contact.maps_url && (
              <a
                href={contact.maps_url}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-amber-700/10 border border-amber-700/20 flex items-center gap-2.5 hover:scale-[1.02] transition-transform"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-700 text-white flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-amber-100">موقع الكافيه</div>
                  <div className="text-[10px] text-amber-300">عرض على خرائط Google</div>
                </div>
              </a>
            )}
          </div>
        </section>
      </main>

      {/* Floating Cart Button (Desktop/Mobile) */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-5 left-5 z-40">
          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-2 px-5 py-3 rounded-full text-white font-bold text-sm shadow-2xl bg-amber-600 hover:bg-amber-500 transition-transform hover:scale-105 active:scale-95"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>الطلبات ({cartItemsCount})</span>
          </button>
        </div>
      )}
    </div>
  )
}
