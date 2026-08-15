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
import { useTranslations } from 'next-intl'

export function TelegramSettingsPanel() {
  const t = useTranslations('Settings.telegram')
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
        setPlanReason(data.error || t('featureDisabledDesc'))
        setLoading(false)
        return
      }

      if (!res.ok) {
        throw new Error(data.error || t('saveError'))
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
      setAlertMessage({ type: 'error', text: err.message || t('saveError') })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!chatId.trim()) {
      setAlertMessage({ type: 'error', text: t('enterChatIdFirst') })
      return
    }
    if (!botToken.trim()) {
      setAlertMessage({ type: 'error', text: t('enterTokenFirst') })
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
          text: data.error || t('testFailed'),
        })
      } else {
        setAlertMessage({
          type: 'success',
          text: data.message || t('testSuccess', { username: data.botUsername || '' }),
        })
      }
    } catch (err: any) {
      console.error('[TelegramSettingsPanel] handleTestConnection error:', err)
      setAlertMessage({ type: 'error', text: t('testError') })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!chatId.trim()) {
      setAlertMessage({ type: 'error', text: t('enterChatIdFirst') })
      return
    }
    if (!botToken.trim()) {
      setAlertMessage({ type: 'error', text: t('enterTokenFirst') })
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
        throw new Error(data.error || t('saveError'))
      }

      setAlertMessage({ type: 'success', text: t('saveSuccess') })
      setHasExistingConfig(true)
      await fetchConfig()
    } catch (err: any) {
      console.error('[TelegramSettingsPanel] handleSave error:', err)
      setAlertMessage({ type: 'error', text: err.message || t('saveError') })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete'))) return

    setDeleting(true)
    setAlertMessage(null)

    try {
      const res = await fetch('/api/telegram/config', { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || t('deleteError'))
      }

      setBotToken('')
      setChatId('')
      setIsActive(true)
      setHasExistingConfig(false)
      setAlertMessage({ type: 'success', text: t('deleteSuccess') })
    } catch (err: any) {
      console.error('[TelegramSettingsPanel] handleDelete error:', err)
      setAlertMessage({ type: 'error', text: err.message || t('deleteError') })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
        <p className="text-sm text-muted-foreground">{t('loadingSettings')}</p>
      </Card>
    )
  }

  if (!featureAllowed) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50">
        <CardHeader>
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
            <CardTitle>{t('featureDisabledTitle')}</CardTitle>
          </div>
          <CardDescription className="text-amber-800 dark:text-amber-300/80">
            {planReason || t('featureDisabledDesc')}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">{t('title')}</CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </div>
          </div>
          {hasExistingConfig && (
            <Badge variant={isActive ? 'default' : 'secondary'} className="px-3 py-1 text-xs">
              {isActive ? t('active') : t('paused')}
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
              {t('botTokenLabel')}
            </Label>
            <div className="relative">
              <Input
                id="botToken"
                type={showToken ? 'text' : 'password'}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="pl-10 rtl:pl-3 rtl:pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('botTokenHint')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chatId" className="font-medium">
              {t('chatIdLabel')}
            </Label>
            <Input
              id="chatId"
              type="text"
              placeholder="-1001234567890"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {t('chatIdHint')}
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
            <div className="space-y-0.5">
              <Label className="font-medium">{t('enableAutoNotify')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('enableAutoNotifyDesc')}
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-6">
          <div>
            {hasExistingConfig && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                disabled={deleting || saving || testing}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs gap-1.5"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {t('deleteSettings')}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || saving || deleting}
              className="w-full sm:w-auto text-xs gap-1.5"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
              {t('testConnection')}
            </Button>

            <Button
              type="submit"
              disabled={saving || testing || deleting}
              className="w-full sm:w-auto text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {t('saveSettings')}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
