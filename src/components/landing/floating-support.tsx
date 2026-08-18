'use client'

import { useState } from 'react'
import { MessageSquare, Send, Mail, Headphones, X, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react'

interface FloatingSupportProps {
  whatsapp?: string
  telegram?: string
  email?: string
  enabled?: {
    whatsapp?: boolean
    telegram?: boolean
    email?: boolean
  }
  locale?: 'ar' | 'en'
}

type SupportChannel = 'whatsapp' | 'telegram' | 'email'

export function FloatingSupport({
  whatsapp = '',
  telegram = '',
  email = '',
  enabled = { whatsapp: true, telegram: true, email: true },
  locale = 'ar',
}: FloatingSupportProps) {
  const isAr = locale === 'ar'

  const [isOpen, setIsOpen] = useState(false)
  const [userMessage, setUserMessage] = useState('')

  const hasWhatsapp = Boolean(whatsapp && whatsapp.trim() && enabled.whatsapp !== false)
  const hasTelegram = Boolean(telegram && telegram.trim() && enabled.telegram !== false)
  const hasEmail = Boolean(email && email.trim() && enabled.email !== false)

  const availableChannels: SupportChannel[] = []
  if (hasWhatsapp) availableChannels.push('whatsapp')
  if (hasTelegram) availableChannels.push('telegram')
  if (hasEmail) availableChannels.push('email')

  const [activeChannel, setActiveChannel] = useState<SupportChannel>(
    availableChannels[0] || 'whatsapp'
  )

  if (availableChannels.length === 0) {
    return null
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    const defaultMsg = isAr
      ? 'مرحباً، أود الاستفسار عن منصتكم وتفاصيل الخدمات'
      : 'Hello, I would like to inquire about your platform and service details'
    const textToSend = userMessage.trim() || defaultMsg

    if (activeChannel === 'whatsapp' && hasWhatsapp) {
      const cleanPhone = (whatsapp || '').replace(/[^\d+]/g, '').replace(/^\+/, '')
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textToSend)}`
      window.open(url, '_blank')
    } else if (activeChannel === 'telegram' && hasTelegram) {
      const cleanTelegram = (telegram || '').replace('@', '').trim()
      const url = `https://t.me/${cleanTelegram}`
      window.open(url, '_blank')
    } else if (activeChannel === 'email' && hasEmail) {
      const subject = isAr ? 'استفسار حول المنصة' : 'Platform Inquiry'
      const url = `mailto:${email.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textToSend)}`
      window.location.href = url
    }

    setUserMessage('')
  }

  const channelLabel = (ch: SupportChannel) => {
    if (ch === 'whatsapp') return isAr ? 'الواتساب' : 'WhatsApp'
    if (ch === 'telegram') return isAr ? 'التلغرام' : 'Telegram'
    return isAr ? 'البريد الفني' : 'Email'
  }

  const getPlaceholder = () => {
    if (activeChannel === 'whatsapp')
      return isAr
        ? 'اكتب رسالتك هنا... وسيتم تجهيزها في الواتساب تلقائياً 💬'
        : 'Type your message here… it will be pre-filled in WhatsApp 💬'
    if (activeChannel === 'telegram')
      return isAr
        ? 'اكتب رسالتك هنا... وسيتم فتح التلغرام مباشرة 🚀'
        : 'Type your message here… Telegram will open instantly 🚀'
    return isAr
      ? 'اكتب رسالتك هنا... وسيتم تجهيز بريدك الإلكتروني 📩'
      : 'Type your message here… your email client will open 📩'
  }

  const getContactInfo = () => {
    if (activeChannel === 'whatsapp') return `${isAr ? 'الواتساب' : 'WhatsApp'}: ${whatsapp}`
    if (activeChannel === 'telegram') return `${isAr ? 'التلغرام' : 'Telegram'}: ${telegram}`
    return `${isAr ? 'البريد' : 'Email'}: ${email}`
  }

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`fixed bottom-6 z-50 flex flex-col font-cairo ${isAr ? 'left-6 items-start' : 'right-6 items-end'}`}
    >
      {/* Expanded Interactive Live Support Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl shadow-emerald-500/10 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden flex flex-col">

          {/* Support Widget Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950/60 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                  <Headphones className="h-5 w-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-white">
                    {isAr ? 'الدعم الفني المباشر' : 'Live Technical Support'}
                  </h4>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  {isAr ? 'متصل الآن لاستقبال رسائلك' : 'Online now to receive your messages'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Channel Selector Pills */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
            {hasWhatsapp && (
              <button
                type="button"
                onClick={() => setActiveChannel('whatsapp')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                  activeChannel === 'whatsapp'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" /> {channelLabel('whatsapp')}
              </button>
            )}

            {hasTelegram && (
              <button
                type="button"
                onClick={() => setActiveChannel('telegram')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                  activeChannel === 'telegram'
                    ? 'bg-sky-500 text-white shadow-md font-black'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Send className="h-3.5 w-3.5" /> {channelLabel('telegram')}
              </button>
            )}

            {hasEmail && (
              <button
                type="button"
                onClick={() => setActiveChannel('email')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                  activeChannel === 'email'
                    ? 'bg-purple-600 text-white shadow-md font-black'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail className="h-3.5 w-3.5" /> {channelLabel('email')}
              </button>
            )}
          </div>

          {/* Chat Conversation Thread */}
          <div className="p-4 space-y-3 max-h-60 overflow-y-auto text-xs">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold shrink-0 text-[10px]">
                🤖
              </div>
              <div className="rounded-2xl rounded-tr-none bg-slate-800/90 border border-slate-700/80 p-3 text-slate-200 leading-relaxed shadow-sm max-w-[85%]">
                {isAr ? 'مرحباً بك في منصتنا! 👋 كيف يمكننا مساعدتك اليوم؟' : 'Welcome to our platform! 👋 How can we help you today?'}
                <br />
                <span className="text-[10px] text-slate-400 block mt-1">
                  {isAr
                    ? <>اكتب رسالتك وسنربطك فوراً بمسؤول الدعم عبر{' '}<span className="text-emerald-400 font-bold">{channelLabel(activeChannel)}</span>.</>
                    : <>Write your message and we&apos;ll connect you with a support agent via{' '}<span className="text-emerald-400 font-bold">{channelLabel(activeChannel)}</span>.</>
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Message Input & Action Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
            <textarea
              rows={2}
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 font-mono">
                {getContactInfo()}
              </span>

              <button
                type="submit"
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95 ${
                  activeChannel === 'whatsapp'
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : activeChannel === 'telegram'
                    ? 'bg-sky-500 text-white hover:bg-sky-400'
                    : 'bg-purple-600 text-white hover:bg-purple-500'
                }`}
              >
                {isAr ? 'إرسال وتحويل' : 'Send & Connect'} <ArrowIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#00E785] via-emerald-400 to-teal-400 px-5 py-3.5 text-xs font-black text-slate-950 shadow-2xl shadow-[#00E785]/30 hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200"
        title={isAr ? 'تواصل مع الدعم الفني المباشر' : 'Contact Live Support'}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <div className="relative">
              <Headphones className="h-5 w-5 text-slate-950" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-white animate-ping" />
            </div>
            <span className="hidden sm:inline">
              {isAr ? 'الدعم الفني المباشر' : 'Live Support'}
            </span>
          </>
        )}
      </button>
    </div>
  )
}
