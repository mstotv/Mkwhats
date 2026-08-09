'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertOctagon, CheckCircle2, AlertTriangle, Loader2, X } from 'lucide-react'

interface AccountStatusToggleProps {
  accountId: string
  accountName: string
  currentStatus: string
}

export function AccountStatusToggle({
  accountId,
  accountName,
  currentStatus,
}: AccountStatusToggleProps) {
  const router = useRouter()
  const isSuspended = currentStatus === 'suspended'
  const targetStatus = isSuspended ? 'active' : 'suspended'

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggleStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/accounts/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          status: targetStatus,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'فشل تحديث حالة الحساب')
        setLoading(false)
        return
      }

      setLoading(false)
      setIsConfirmOpen(false)
      router.refresh()
    } catch {
      setError('حدث خطأ في الاتصال بالسيرفر')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Action Button */}
      {isSuspended ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsConfirmOpen(true)}
          className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300 gap-1.5 text-xs h-8 px-3 font-semibold"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          إعادة تفعيل الحساب
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsConfirmOpen(true)}
          className="bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300 gap-1.5 text-xs h-8 px-3 font-semibold"
        >
          <AlertOctagon className="h-3.5 w-3.5" />
          تعليق الحساب
        </Button>
      )}

      {/* Confirmation Dialog Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden space-y-0">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                    isSuspended
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}
                >
                  {isSuspended ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertOctagon className="h-4 w-4" />
                  )}
                </div>
                <h3 className="text-base font-semibold text-slate-50 tracking-tight">
                  {isSuspended ? 'تأكيد إعادة تفعيل الحساب' : 'تأكيد تعليق الحساب'}
                </h3>
              </div>
              <button
                onClick={() => !loading && setIsConfirmOpen(false)}
                disabled={loading}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 font-medium">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              <p className="text-xs text-slate-300 leading-relaxed">
                هل أنت تأكد من رغبتك في{' '}
                <span className="font-bold text-slate-100">{isSuspended ? 'إعادة تفعيل' : 'تعليق'}</span>{' '}
                حساب <span className="font-bold text-amber-400">"{accountName}"</span>؟
              </p>

              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3 text-[11px] text-slate-400">
                {isSuspended
                  ? 'سيتحول وضع الحساب إلى (نشط) ويمكن تعديل بياناته والتفاعل معه بانتظام.'
                  : 'ستتحول حالة الحساب إلى (معلق) في قاعدة البيانات.'}
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800/80">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={loading}
                  className="text-xs h-8 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  إلغاء
                </Button>
                <Button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={loading}
                  className={`text-xs h-8 px-4 font-bold gap-1.5 ${
                    isSuspended
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      : 'bg-rose-500 text-slate-950 hover:bg-rose-400'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      جاري التنفيذ...
                    </>
                  ) : isSuspended ? (
                    'تأكيد التفعيل'
                  ) : (
                    'تأكيد التعليق'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
