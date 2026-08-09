'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  Sparkles,
  Bot,
} from 'lucide-react'

export function TelegramSettingsPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [showToken, setShowToken] = useState(false)
  const [hasExistingConfig, setHasExistingConfig] = useState(false)

  const [featureAllowed, setFeatureAllowed] = useState(true)
  const [planReason, setPlanReason] = useState<string | null>(null)

  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setLoading(true)
    setAlertMessage(null)
    try {
      const res = await fetch('/api/telegram/config')
      const data = await res.json()

      if (res.status === 403) {
        setFeatureAllowed(false)
        setPlanReason(data.error || 'ميزة بوت التيليجرام غير متاحة في خطتك الحالية')
        setLoading(false)
        return
      }

      if (!res.ok) {
        throw new Error(data.error || 'فشل جلب الإعدادات')
      }

      if (data.config) {
        setBotToken(data.config.botTokenMasked || '')
        setChatId(data.config.chatId || '')
        setIsActive(Boolean(data.config.isActive))
        setHasExistingConfig(true)
      } else {
        setHasExistingConfig(false)
      }
    } catch (err: any) {
      console.error('[TelegramSettingsPanel] fetchConfig error:', err)
      setAlertMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء تحميل الإعدادات' })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!chatId.trim()) {
      setAlertMessage({ type: 'error', text: 'يرجى كتابة معرف المحادثة (Chat ID) أولاً' })
      return
    }
    if (!botToken.trim()) {
      setAlertMessage({ type: 'error', text: 'يرجى كتابة رمز البوت (Bot Token) أولاً' })
      return
    }

    setTesting(true)
    setAlertMessage(null)

    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, chatId }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setAlertMessage({
          type: 'error',
          text: data.error || 'فشل الاتصال بالبوت. تأكد من صحة التوكن والـ Chat ID.',
        })
      } else {
        setAlertMessage({
          type: 'success',
          text: data.message || `تم اختبار الاتصال بنجاح مع البوت ${data.botUsername}!`,
        })
      }
    } catch (err: any) {
      console.error('[TelegramSettingsPanel] handleTestConnection error:', err)
      setAlertMessage({ type: 'error', text: 'حدث خطأ أثناء اختبار الاتصال' })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!chatId.trim()) {
      setAlertMessage({ type: 'error', text: 'يرجى كتابة معرف المحادثة (Chat ID)' })
      return
    }
    if (!botToken.trim()) {
      setAlertMessage({ type: 'error', text: 'يرجى كتابة رمز البوت (Bot Token)' })
      return
    }

    setSaving(true)
    setAlertMessage(null)

    try {
      const res = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, chatId, isActive }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل حفظ الإعدادات')
      }

      setAlertMessage({ type: 'success', text: 'تم حفظ إعدادات بوت التيليجرام بنجاح!' })
      setHasExistingConfig(true)
      await fetchConfig()
    } catch (err: any) {
      console.error('[TelegramSettingsPanel] handleSave error:', err)
      setAlertMessage({ type: 'error', text: err.message || 'فشل الحفظ' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('هل أنت تأكد من رغبتك في إزالة إعدادات بوت تيليجرام؟')) return

    setDeleting(true)
    setAlertMessage(null)

    try {
      const res = await fetch('/api/telegram/config', { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل الحذف')
      }

      setBotToken('')
      setChatId('')
      setIsActive(true)
      setHasExistingConfig(false)
      setAlertMessage({ type: 'success', text: 'تم حذف إعدادات تيليجرام بنجاح' })
    } catch (err: any) {
      console.error('[TelegramSettingsPanel] handleDelete error:', err)
      setAlertMessage({ type: 'error', text: err.message || 'فشل الحذف' })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Card dir="rtl" className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
        <p className="text-sm text-muted-foreground">جاري تحميل إعدادات التيليجرام...</p>
      </Card>
    )
  }

  if (!featureAllowed) {
    return (
      <Card dir="rtl" className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50">
        <CardHeader>
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
            <CardTitle>ميزة بوت تيليجرام غير متاحة في خطتك الحالية</CardTitle>
          </div>
          <CardDescription className="text-amber-800 dark:text-amber-300/80">
            {planReason || 'يرجى ترقية خطة الاشتراك للاستفادة من الإشعارات الفورية للطلبات عبر بوت التيليجرام.'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card dir="rtl" className="max-w-3xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">إشعارات بوت تيليجرام (Telegram Bot)</CardTitle>
              <CardDescription>
                استلم إشعاراً فورياً على حسابك أو مجموعتك في تيليجرام بمجرد تأكيد أي طلب جديد.
              </CardDescription>
            </div>
          </div>
          {hasExistingConfig && (
            <Badge variant={isActive ? 'default' : 'secondary'} className="px-3 py-1 text-xs">
              {isActive ? 'مفعّل' : 'متوقف مؤقتاً'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <form onSubmit={handleSave}>
        <CardContent className="space-y-6">
          {alertMessage && (
            <div
              className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                alertMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300'
                  : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300'
              }`}
            >
              {alertMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <span>{alertMessage.text}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="botToken" className="font-medium">
              رمز البوت (Bot Token)
            </Label>
            <div className="relative">
              <Input
                id="botToken"
                type={showToken ? 'text' : 'password'}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                dir="ltr"
                className="pl-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              احصل عليه من بوت <code className="bg-muted px-1.5 py-0.5 rounded">@BotFather</code> في تيليجرام عند إنشاء بوت جديد.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chatId" className="font-medium">
              معرف المحادثة أو القناة (Chat ID)
            </Label>
            <Input
              id="chatId"
              type="text"
              placeholder="-1001234567890 أو 123456789"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              dir="ltr"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              يمكنك معرفة الـ Chat ID بإرسال رسالة إلى <code className="bg-muted px-1.5 py-0.5 rounded">@userinfobot</code> أو إضافة البوت لمجموعتك.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
            <div className="space-y-0.5">
              <Label className="font-medium">تفعيل الإشعارات التلقائية</Label>
              <p className="text-xs text-muted-foreground">
                عند تفعيله، سيتم إرسال كل طلب مؤكد فوراً إلى بوت التيليجرام.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={saving || testing}
              className="gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              حفظ الإعدادات
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={saving || testing}
              className="gap-2"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
              اختبار الاتصال
            </Button>
          </div>

          {hasExistingConfig && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleting || saving || testing}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Trash2 className="w-4 h-4 ml-2" />
              )}
              إزالة الإعدادات
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
