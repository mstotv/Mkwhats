'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import type { StorefrontFullConfig, StorefrontItem } from '@/lib/storefront/types'
import { BookingModal } from './booking-modal'
import { OrderDrawer, type CartItem } from './order-drawer'
import { BioStorefront } from './bio-storefront'

export function StorefrontClientView({
  storefront,
  currency = 'USD',
}: {
  storefront: StorefrontFullConfig
  items?: StorefrontItem[]
  currency?: string
}) {
  const primaryColor = storefront.theme_config?.primary_color || '#d4eb3d'

  // Settings Toggles
  const isAppointmentsEnabled = Boolean(storefront.settings?.enable_appointments ?? false)
  const isProductsEnabled = Boolean(storefront.settings?.enable_direct_orders ?? false)

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [bookingService, setBookingService] = useState<StorefrontItem | null>(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingName, setBookingName] = useState('')
  const [bookingPhone, setBookingPhone] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null)

  // Cart State (for direct orders if enabled)
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<any>(null)

  const handleOpenBooking = (service?: StorefrontItem) => {
    setBookingService(service || null)
    setBookingSuccess(null)
    setBookingModalOpen(true)
  }

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId)
      if (!existing) return prev
      const newQty = existing.quantity + delta
      if (newQty <= 0) return prev.filter((i) => i.id !== itemId)
      return prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
    })
  }

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingName.trim() || !bookingPhone.trim() || !bookingDate || !bookingTime) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    try {
      setBookingLoading(true)
      const res = await fetch('/api/storefront/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storefront_id: storefront.id,
          customer_name: bookingName.trim(),
          customer_phone: bookingPhone.trim(),
          service_id: bookingService?.id || null,
          booking_date: bookingDate,
          booking_time: bookingTime,
          notes: bookingNotes.trim() || null,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setBookingSuccess(data.message || 'تم تأكيد حجز الموعد بنجاح')
        toast.success('تم حجز موعدك بنجاح!')
      } else {
        toast.error(data.error || 'تعذر إتمام الحجز')
      }
    } catch {
      toast.error('حدث خطأ أثناء حجز الموعد')
    } finally {
      setBookingLoading(false)
    }
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('يرجى كتابة الاسم ورقم الهاتف')
      return
    }
    if (cart.length === 0) {
      toast.error('السلة فارغة')
      return
    }

    try {
      setOrdering(true)
      const res = await fetch('/api/storefront/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storefront_id: storefront.id,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_address: customerAddress.trim() || null,
          notes: orderNotes.trim() || null,
          items: cart.map((i) => ({
            id: i.id,
            title: i.title,
            price: i.price,
            quantity: i.quantity,
          })),
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setOrderSuccess(data.order)
        setCart([])
        toast.success('تم إرسال طلبك بنجاح!')
      } else {
        toast.error(data.error || 'فشل إتمام الطلب')
      }
    } catch {
      toast.error('حدث خطأ أثناء إرسال الطلب')
    } finally {
      setOrdering(false)
    }
  }

  // 100% Dedicated Bio-Link / Linktree Storefront
  return (
    <>
      <BioStorefront
        storefront={storefront}
        primaryColor={primaryColor}
        isAppointmentsEnabled={isAppointmentsEnabled}
        isProductsEnabled={isProductsEnabled}
        onOpenBooking={() => handleOpenBooking()}
        onOpenCart={() => setCartOpen(true)}
      />

      {isAppointmentsEnabled && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          service={bookingService}
          bookingDate={bookingDate}
          setBookingDate={setBookingDate}
          bookingTime={bookingTime}
          setBookingTime={setBookingTime}
          bookingName={bookingName}
          setBookingName={setBookingName}
          bookingPhone={bookingPhone}
          setBookingPhone={setBookingPhone}
          bookingNotes={bookingNotes}
          setBookingNotes={setBookingNotes}
          loading={bookingLoading}
          successMessage={bookingSuccess}
          onSubmit={handleSubmitBooking}
          primaryColor={primaryColor}
        />
      )}

      {isProductsEnabled && (
        <OrderDrawer
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          cart={cart}
          onUpdateQuantity={updateCartQuantity}
          currency={currency}
          primaryColor={primaryColor}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          customerAddress={customerAddress}
          setCustomerAddress={setCustomerAddress}
          orderNotes={orderNotes}
          setOrderNotes={setOrderNotes}
          ordering={ordering}
          orderSuccess={orderSuccess}
          onClearOrderSuccess={() => setOrderSuccess(null)}
          onSubmitOrder={handleSubmitOrder}
        />
      )}
    </>
  )
}
