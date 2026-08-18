'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { useLocale } from 'next-intl'

export interface FAQItem {
  id?: string
  question: string
  answer: string
}

const DEFAULT_FAQS_AR: FAQItem[] = [
  {
    question: 'هل يحتاج ربط حساب الواتساب إلى خبرة برمجة؟',
    answer:
      'لا على الإطلاق! الربط يتم بسهولة فائقة عن طريق مسح رمز الاستجابة السريعة (QR Code) من تطبيق الواتساب بجوالك تماماً مثل فتح WhatsApp Web، وتعمل المنصة فوراً خلال أقل من دقيقتين.',
  },
  {
    question: 'هل المنصة آمنة وتدعم حماية رقم الواتساب من الحظر؟',
    answer:
      'نعم، تم تصميم محرك المنصة بتقنيات أمان متقدمة تضمن إرسال الرسائل بمعدلات زمنية متدرجة وطبيعية (Safe Rate Limits)، مما يرفع كفاءة وصول الرسائل ويحمي حسابك بأمان تام.',
  },
  {
    question: 'كيف يعمل مساعد الذكاء الاصطناعي (Gemini AI) في الرد على العملاء؟',
    answer:
      'يمكنك تغذية المساعد الذكي بمعلومات منتجاتك، سياسة المبيعات، ومصطلحات الدعم الخاص بك. يقوم المساعد بقراءة استفسارات العميل وفهمها ثم الرد بدقة بالغة واستخراج بيانات الطلبات تلقائياً.',
  },
  {
    question: 'هل يمكنني تجربة المنصة مجاناً قبل الاشتراك في الخطة المدفوعة؟',
    answer:
      'بالتأكيد! نوفر خطة تجريبية مجانية تتيح لك اختبار كافة الخصائص، ربط الحساب، وإرسال الرسائل والتجربة الكاملة دون الحاجة لإدخال أي بطاقة ائتمانية.',
  },
  {
    question: 'ما هي طرق الدفع المتاحة للترقية والاشتراك؟',
    answer:
      'ندعم جميع البطاقات الائتمانية والمدى إضافة للحوالات والعملات الرقمية المشفرة المباشرة عبر منصات الدفع الآمنة.',
  },
]

const DEFAULT_FAQS_EN: FAQItem[] = [
  {
    question: 'Does connecting WhatsApp require coding experience?',
    answer:
      'Not at all! Linking is done seamlessly by scanning a QR Code from your WhatsApp mobile app, just like opening WhatsApp Web. The platform starts working in less than 2 minutes.',
  },
  {
    question: 'Is the platform safe and protects my WhatsApp number from bans?',
    answer:
      'Yes, the platform engine is engineered with safe rate limits and natural sending intervals, maximizing deliverability while fully safeguarding your WhatsApp account.',
  },
  {
    question: 'How does the Gemini AI assistant work for automatic replies?',
    answer:
      'You can train the AI assistant with your product info, sales rules, and support policies. It reads customer inquiries, understands intent, replies accurately, and extracts order data automatically.',
  },
  {
    question: 'Can I try the platform for free before subscribing?',
    answer:
      'Absolutely! We offer a free trial plan allowing you to test all features, link your account, send messages, and evaluate everything without requiring a credit card.',
  },
  {
    question: 'What payment methods are supported for upgrades?',
    answer:
      'We accept all major credit cards, debit cards, local cards, bank transfers, and direct cryptocurrency checkout via secure gateways.',
  },
]

interface LandingFAQProps {
  items?: FAQItem[]
}

const isArabicText = (text: string) => /[\u0600-\u06FF]/.test(text || '')

export function LandingFAQ({ items }: LandingFAQProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  let faqList = items && items.length > 0 ? items : (isAr ? DEFAULT_FAQS_AR : DEFAULT_FAQS_EN)

  if (!isAr) {
    // If locale is English and DB items contain Arabic text, fallback to DEFAULT_FAQS_EN
    if (!items || items.length === 0 || isArabicText(items[0]?.question)) {
      faqList = DEFAULT_FAQS_EN
    }
  } else {
    // If locale is Arabic and DB items contain English text, fallback to DEFAULT_FAQS_AR
    if (!items || items.length === 0 || (!isArabicText(items[0]?.question) && !isArabicText(items[0]?.answer))) {
      faqList = DEFAULT_FAQS_AR
    }
  }

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {faqList.map((faq, index) => {
        const isOpen = openIndex === index
        return (
          <div
            key={index}
            className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
              isOpen
                ? 'border-emerald-500/50 bg-card shadow-lg'
                : 'border-border bg-card/60 hover:border-border/80'
            }`}
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-6 text-start font-bold text-foreground hover:text-emerald-500 transition-colors"
            >
              <span className="flex items-center gap-3 text-sm sm:text-base">
                <HelpCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                {faq.question}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform duration-300 shrink-0 ${
                  isOpen ? 'rotate-180 text-emerald-500' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-6 pb-6 pt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 font-medium">
                {faq.answer}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
