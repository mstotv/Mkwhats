'use client'

import { useEffect, useState } from 'react'
import { UserCheck, LogOut, Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IMPERSONATION_DISPLAY_COOKIE_NAME } from '@/lib/admin-impersonation'

interface ImpersonationDisplayInfo {
  userName: string
  accountName: string
  userEmail?: string
}

export function ImpersonationBanner() {
  const [info, setInfo] = useState<ImpersonationDisplayInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Function to read non-HttpOnly cookie
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return null
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) {
        const val = parts.pop()?.split(';').shift()
        return val ? decodeURIComponent(val) : null
      }
      return null
    }

    const cookieVal = getCookie(IMPERSONATION_DISPLAY_COOKIE_NAME)
    if (cookieVal) {
      try {
        const parsed = JSON.parse(cookieVal)
        setInfo(parsed)
      } catch {
        setInfo(null)
      }
    }
  }, [])

  if (!info) return null

  const handleEndImpersonation = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/impersonate/end', { method: 'POST' })
      const data = await res.json()
      window.location.href = data.redirect || '/admin/dashboard'
    } catch {
      window.location.href = '/admin/dashboard'
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sticky top-0 z-[100] w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-amber-95 px-4 py-2 shadow-md border-b border-amber-400/40">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 text-xs sm:text-sm font-medium">
        <div className="flex items-center gap-2 truncate">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-950/20 shrink-0">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-950" />
          </div>
          <span className="truncate">
            أنت تتصفح حالياً كـ{' '}
            <strong className="font-bold underline underline-offset-2">
              {info.userName}
            </strong>{' '}
            — حساب:{' '}
            <strong className="font-bold underline underline-offset-2">
              {info.accountName}
            </strong>
          </span>
        </div>

        <Button
          onClick={handleEndImpersonation}
          disabled={loading}
          size="sm"
          className="bg-slate-950 text-amber-400 hover:bg-slate-900 hover:text-amber-300 font-semibold text-xs h-7 px-3 shrink-0 shadow-sm border border-amber-400/30 gap-1.5 transition-all"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5" />
          )}
          <span>الخروج من وضع الدخول كمستخدم</span>
        </Button>
      </div>
    </div>
  )
}
