'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ShieldCheck, Lock, AlertTriangle } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'فشل تسجيل الدخول')
        setLoading(false)
        return
      }

      // Hard redirect to clear browser state and ensure cookies are sent to middleware
      window.location.href = data.redirect || '/admin/dashboard'
    } catch {
      setError('حدث خطأ غير متوقع في الاتصال بالسيرفر.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
        <CardHeader className="items-center text-center pb-2">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-50">
            لوحة تحكم المنصة (Super Admin)
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm mt-1">
            تسجيل الدخول مخصص فقط لإدارة المنصة كـ Super Admin
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{error}</div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-email" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                البريد الإلكتروني للأدمن
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@platform.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-password" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                كلمة المرور
              </Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 h-11"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 focus-visible:ring-amber-500/50 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  جاري التحقق...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  دخول لوحة الأدمن
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
