'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, UserCog, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

export interface MemberToEdit {
  user_id: string
  full_name: string
  email: string
}

interface EditMemberModalProps {
  member: MemberToEdit | null
  isOpen: boolean
  onClose: () => void
}

export function EditMemberModal({ member, isOpen, onClose }: EditMemberModalProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(member?.full_name || '')
  const [email, setEmail] = useState(member?.email || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Reset inputs when selected member changes
  useEffect(() => {
    if (member) {
      setFullName(member.full_name)
      setEmail(member.email)
      setError(null)
      setSuccess(null)
    }
  }, [member?.user_id])

  if (!isOpen || !member) return null

  const handleClose = () => {
    setError(null)
    setSuccess(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch('/api/admin/members/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: member.user_id,
          fullName,
          email,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'فشل تحديث بيانات العضو')
        setLoading(false)
        return
      }

      setSuccess('تم تحديث البيانات بنجاح')
      setTimeout(() => {
        setLoading(false)
        handleClose()
        router.refresh()
      }, 700)
    } catch {
      setError('حدث خطأ في الاتصال بالسيرفر')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans">
      <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 border border-slate-700/50 text-amber-400">
              <UserCog className="h-4 w-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-50 tracking-tight">
              تعديل بيانات العضو
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 font-medium leading-relaxed">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <div>{success}</div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="member-fullname" className="text-xs text-slate-300 font-medium">
              الاسم الكامل
            </Label>
            <Input
              id="member-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="مثال: أحمد محمد"
              className="border-slate-800 bg-slate-950 text-slate-100 text-xs h-9 focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="member-email" className="text-xs text-slate-300 font-medium">
              البريد الإلكتروني
            </Label>
            <Input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              placeholder="user@example.com"
              className="border-slate-800 bg-slate-950 text-slate-100 text-xs h-9 font-mono focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
            />
            <p className="text-[11px] text-slate-500">
              ملاحظة: يتغير البريد مباشرة للمستخدم ويُعتمد فوراً في نظام التسجيل.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800/80">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
              className="text-xs h-8 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 text-xs h-8 px-4 gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ التغييرات'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
