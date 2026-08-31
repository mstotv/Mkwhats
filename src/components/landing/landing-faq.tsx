'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useLocale } from 'next-intl'

export interface FAQItem {
  id?: string
  question: string
  answer: string
}

const DEFAULT_FAQS_AR: FAQItem[] = [
  {
    question: 'كيف أربط رقم الواتساب بالمنصة (Meta API الرسمية أم QR Code)؟',
    answer:
      'يمكنك الربط بسهولة عبر مسح رمز الاستجابة السريعة (QR Code) من تطبيق الواتساب بجوالك تماماً مثل WhatsApp Web في أقل من 30 ثانية بدون أي تعقيد، أو الربط عبر Meta Cloud API الرسمية للمؤسسات الكبرى.',
  },
  {
    question: 'ما هي نماذج الذكاء الاصطناعي التي تدير المحادثات التلقائية؟',
    answer:
      'نوفر دمجاً أصيلاً مع Google Gemini AI (Gemini 2.5/3.6 Flash) و OpenAI (GPT-4o). يمكنك تغذية المساعد بمعلومات متجرك وسياساتك ليرد على الاستفسارات ويوصي بالمنتجات بدقة متناهية.',
  },
  {
    question: 'كيف يعمل تجميع الطلبات الآلي للمتاجر (الملابس، الأحذية، الإلكترونيات)؟',
    answer:
      'يستخرج الذكاء الاصطناعي تلقائياً تفاصيل الطلب من محادثة العميل (الاسم، رقم الهاتف، العنوان، المقاس، اللون، والكمية) ويقوم بمزامنتها وتوثيقها فوراً في جدول Google Sheets أو ملف Excel.',
  },
  {
    question: 'كيف يعمل نظام تنبيهات تيليجرام الفورية للطلبات والمواعيد؟',
    answer:
      'فور تأكيد العميل للطلب أو حجز الموعد، يرسل النظام إشعاراً فورياً منسقاً إلى قناتك أو مجموعتك الخاصة في Telegram يحتوي على كافة بيانات العميل والطلب بنقرة زر.',
  },
  {
    question: 'هل يمكن للنظام إدارة وتنسيق مواعيد العملاء والعيادات والمراكز؟',
    answer:
      'نعم! يفحص النظام أوقات العمل والتوفر الذري، ويحجز الموعد تلقائياً، ويرسل رسائل تذكير للعملاء عبر الواتساب قبل موعدهم مع تنبيه فريق العمل.',
  },
  {
    question: 'هل هناك أي مخاطر لتعرض رقم الواتساب للحظر؟',
    answer:
      'نظامنا مصمم بأحدث تقنيات الفواصل الزمنية الذكية (Smart Rate Limits) ومحاكاة الكتابة الطبيعية لضمان حماية أرقامك والامتثال الكامل لسياسات Meta.',
  },
]

const DEFAULT_FAQS_EN: FAQItem[] = [
  {
    question: 'How do I connect my WhatsApp number (Meta API vs QR Code)?',
    answer:
      'You can connect via the Official Meta Cloud API for high-volume enterprise compliance, or simply scan a QR Code using your existing WhatsApp account in less than 30 seconds—no developer approvals or complicated verification required.',
  },
  {
    question: 'Which AI models power the automated conversations?',
    answer:
      'We provide native dual integration with Google Gemini AI and OpenAI (GPT-4o). You can easily supply your business details, FAQ, and product catalogs so the AI accurately handles customer inquiries, recommends sizes, and checks inventory contextually.',
  },
  {
    question: 'How does automated order capturing work for stores (clothing, shoes, electronics)?',
    answer:
      'When a customer chats on WhatsApp, the AI automatically identifies, parses, and extracts essential order details—including Customer Name, Phone Number, City/Shipping Address, Product Model, Size, Color, and Quantity. This structured data is instantly synced to your connected Google Sheet or Excel workbook.',
  },
  {
    question: 'How does the Telegram bot alert system work for orders and bookings?',
    answer:
      'Whenever a buyer confirms an order or a client schedules an appointment (for clinics, barbershops, or salons), a webhook instantly pings your private Telegram channel or staff group with the customer\'s full details, ordered items, and scheduled time slot in real-time.',
  },
  {
    question: 'Can the system handle appointments and booking schedules?',
    answer:
      'Yes. The bot handles date and time slot selection, gathers client notes, verifies availability, and books the reservation directly into your system, triggering instant confirmation messages on WhatsApp and staff notifications via Telegram.',
  },
  {
    question: 'Is there any risk of getting my WhatsApp number banned?',
    answer:
      'Our engine employs humanized message typing delays, randomized response intervals, and follows Meta rate-limit protocols. Combined with official API options, it ensures your campaigns and automated bots remain secure and compliant.',
  },
]

interface LandingFAQProps {
  items?: FAQItem[]
}

const isArabicText = (text: string) => /[\u0600-\u06FF]/.test(text || '')

export function LandingFAQ({ items }: LandingFAQProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  let faqList = items && items.length > 0 ? items : (isAr ? DEFAULT_FAQS_AR : DEFAULT_FAQS_EN)

  if (!isAr) {
    if (!items || items.length === 0 || isArabicText(items[0]?.question)) {
      faqList = DEFAULT_FAQS_EN
    }
  } else {
    if (!items || items.length === 0 || (!isArabicText(items[0]?.question) && !isArabicText(items[0]?.answer))) {
      faqList = DEFAULT_FAQS_AR
    }
  }

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-3.5">
      {faqList.map((faq, index) => {
        const isOpen = openIndex === index
        return (
          <div
            key={index}
            className="rounded-2xl bg-[#1C1C1E] dark:bg-[#141416] border border-neutral-800/80 transition-all duration-300 overflow-hidden shadow-sm"
          >
            <button
              type="button"
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-5 sm:p-6 text-start text-white hover:text-emerald-400 transition-colors gap-4 cursor-pointer"
            >
              <span className="font-serif text-base sm:text-lg font-medium text-neutral-100">
                {faq.question}
              </span>
              <div className="h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 transition-colors">
                <Plus
                  className={`h-5 w-5 text-emerald-400 transition-transform duration-300 ${
                    isOpen ? 'rotate-45 text-emerald-300' : ''
                  }`}
                />
              </div>
            </button>

            {isOpen && (
              <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans border-t border-neutral-800/50">
                {faq.answer}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

