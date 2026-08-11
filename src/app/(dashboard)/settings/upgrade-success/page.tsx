'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2,
  Loader2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Calendar,
} from 'lucide-react'
import { fireConfetti } from '@/lib/confetti'

interface StatusResponse {
  status: 'completed' | 'pending' | 'failed'
  plan_name?: string
  billing_cycle?: 'monthly' | 'yearly'
  amount?: number | null
  expires_at?: string | null
  error?: string
  message?: string
}

function UpgradeSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const requestId = searchParams.get('request_id')

  const [state, setState] = useState<'checking' | 'success' | 'pending_timeout' | 'error'>('checking')
  const [data, setData] = useState<StatusResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [attempts, setAttempts] = useState(0)

  const hasFiredConfetti = useRef(false)

  useEffect(() => {
    if (!requestId) {
      setState('error')
      setErrorMessage('معرّف طلب الترقية مفقود في الرابط.')
      return
    }

    let isMounted = true
    let timerId: NodeJS.Timeout | null = null

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/account/upgrade-status?request_id=${encodeURIComponent(requestId)}`)
        const json: StatusResponse = await res.json()

        if (!isMounted) return

        if (!res.ok) {
          setState('error')
          setErrorMessage(json.error || 'حدث خطأ أثناء فحص حالة الطلب.')
          return
        }

        if (json.status === 'completed') {
          setData(json)
          setState('success')
          if (!hasFiredConfetti.current) {
            hasFiredConfetti.current = true
            fireConfetti()
          }
          return
        }

        if (json.status === 'failed') {
          setState('error')
          setErrorMessage(json.error || 'تم رفض طلب الترقية.')
          return
        }

        // Still pending
        setAttempts((prev) => {
          const next = prev + 1
          if (next >= 20) {
            // ~60 seconds timeout (20 attempts * 3s)
            setState('pending_timeout')
          } else {
            timerId = setTimeout(checkStatus, 3000)
          }
          return next
        })
      } catch (err) {
        console.error('[UpgradeSuccessPage] Check status error:', err)
        if (isMounted) {
          setState('error')
          setErrorMessage('تعذر الاتصال بالخادم لمتابعة التفعيل.')
        }
      }
    }

    checkStatus()

    return () => {
      isMounted = false
      if (timerId) clearTimeout(timerId)
    }
  }, [requestId])

  const handleManualRecheck = () => {
    setState('checking')
    setAttempts(0)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 dir-rtl">
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Background Subtle Accent Glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none" />

        {/* ── 1. CHECKING STATE ────────────────────────────────── */}
        {state === 'checking' && (
          <div className="text-center space-y-6 py-6">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-md animate-pulse" />
              <div className="h-20 w-20 rounded-2xl bg-slate-800/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 relative z-10 shadow-inner">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                جاري التحقق من عملية الدفع...
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                نحن نتحقق من تأكيد شبكة الكريبتو وتفعيل اشتراكك الجديد تلقائياً.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-400">
              <Clock className="h-3.5 w-3.5 animate-pulse text-indigo-400" />
              <span>محاولة التحقق ({attempts + 1} / 20)</span>
            </div>
          </div>
        )}

        {/* ── 2. SUCCESS STATE ────────────────────────────────── */}
        {state === 'success' && data && (
          <div className="text-center space-y-6 py-2">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-xl animate-pulse" />
              <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 relative z-10 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-10 w-10" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                تفعيل فوري بنجاح
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                تم الاشتراك بنجاح!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                شكراً لك! تم تفعيل خطتك الجديدة بنجاح في حسابك وأصبحت ميزاتها متاحة لك الآن.
              </p>
            </div>

            {/* Summary Box */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 text-right space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs sm:text-sm">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> الخطة الجديدة:
                </span>
                <span className="font-bold text-white text-sm sm:text-base">
                  {data.plan_name}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-slate-400" /> المبلغ المدفوع:
                </span>
                <span className="font-semibold text-emerald-400">
                  {data.amount !== null && data.amount !== undefined
                    ? `$${data.amount}`
                    : 'مدفوع بالكامل'}
                  <span className="text-[11px] text-slate-500 font-normal mr-1">
                    ({data.billing_cycle === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري'})
                  </span>
                </span>
              </div>

              {data.expires_at && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs sm:text-sm">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" /> صلاحية الاشتراك حتى:
                  </span>
                  <span className="font-medium text-slate-200 dir-ltr">
                    {new Date(data.expires_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <LayoutDashboard className="h-4 w-4" />
                الذهاب إلى لوحة التحكم
              </Link>

              <Link
                href="/settings?tab=plan"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                عرض تفاصيل الخطة والاستخدام <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* ── 3. PENDING TIMEOUT STATE ────────────────────────── */}
        {state === 'pending_timeout' && (
          <div className="text-center space-y-6 py-4">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-lg animate-pulse" />
              <div className="h-20 w-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 relative z-10">
                <Clock className="h-10 w-10" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                جاري معالجة تأكيد عملية الدفع
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                تم استلام الدفع بنجاح، لكن تأكيد التحويل في شبكة الكريبتو يستغرق بضع دقائق إضافية. سيتم تفعيل خطتك أوتوماتيكياً فور وصول التأكيد النهائي.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 text-right leading-relaxed">
              💡 يمكنك إغلاق هذه الصفحة والعودة لاستخدام المنصة، وسيتم تحديث الخطة في خلفية النظام دون أي إجراء إضافي منك.
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleManualRecheck}
                className="w-full py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
              >
                إعادة التحقق الآن
              </button>

              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                الذهاب إلى لوحة التحكم
              </Link>
            </div>
          </div>
        )}

        {/* ── 4. ERROR STATE ──────────────────────────────────── */}
        {state === 'error' && (
          <div className="text-center space-y-6 py-4">
            <div className="relative inline-flex items-center justify-center">
              <div className="h-20 w-20 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertCircle className="h-10 w-10" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                تعذر التحقق من حالة الاشتراك
              </h2>
              <p className="text-xs sm:text-sm text-rose-300 max-w-xs mx-auto leading-relaxed">
                {errorMessage || 'حدث خطأ غير متوقع أثناء معالجة بيانات الطلب.'}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/settings?tab=plan"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
              >
                العودة لإعدادات الخطة والاشتراك
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <UpgradeSuccessContent />
    </Suspense>
  )
}
