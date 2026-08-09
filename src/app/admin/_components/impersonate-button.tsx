'use client'

import { useState } from 'react'
import { UserCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImpersonateButtonProps {
  targetUserId: string
  targetUserName: string
  accountId: string
  accountName: string
}

export function ImpersonateButton({
  targetUserId,
  targetUserName,
  accountId,
}: ImpersonateButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleImpersonate = async () => {
    if (
      !confirm(
        `هل أنت تأكد من إجراء الدخول كمستخدم (${targetUserName})؟\nسيتم تسجيل هذه العملية في سجل التدقيق (Audit Log).`
      )
    ) {
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: targetUserId,
          account_id: accountId,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        alert(data.error || 'فشل البدء في وضع الدخول كمستخدم')
        setLoading(false)
        return
      }

      window.location.href = data.redirect || '/dashboard'
    } catch (err) {
      alert('حدث خطأ غير متوقع عند بدء الدخول كمستخدم')
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleImpersonate}
      disabled={loading}
      className="h-7 text-xs px-2.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1 border border-amber-500/30 hover:border-amber-500/50 transition-colors"
      title="الدخول كمستخدم للدعم الفني"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
      ) : (
        <UserCheck className="h-3 w-3 text-amber-400" />
      )}
      <span>دخول كمستخدم</span>
    </Button>
  )
}
