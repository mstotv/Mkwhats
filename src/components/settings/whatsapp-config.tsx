'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Zap,
  AlertTriangle,
  RotateCcw,
  QrCode,
  Building2,
  Smartphone,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SettingsPanelHead } from './settings-panel-head';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import type { WhatsAppConfig as WhatsAppConfigType, WhatsAppConnectionType } from '@/types';

const MASKED_TOKEN = '••••••••••••••••';

type ConnectionStatus = 'connected' | 'disconnected' | 'unknown';
type ResetReason = 'token_corrupted' | 'meta_api_error' | null;

export function WhatsAppConfig() {
  const t = useTranslations('Settings.whatsapp');
  const supabase = createClient();
  const { user, accountId, loading: authLoading, profileLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfigType | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');
  const [resetReason, setResetReason] = useState<ResetReason>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const loadedAccountIdRef = useRef<string | null>(null);

  // Method selection: 'meta' or 'evolution'
  const [selectedMethod, setSelectedMethod] = useState<WhatsAppConnectionType>('meta');

  // ── Meta API State ──────────────────────────────────────────
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [pin, setPin] = useState('');
  const [tokenEdited, setTokenEdited] = useState(false);

  const isRegistered = Boolean(config?.registered_at);
  const lastRegistrationError = config?.last_registration_error ?? null;

  const [verifyingRegistration, setVerifyingRegistration] = useState(false);
  type RegistrationProbe = {
    live: boolean;
    checks: Record<string, boolean | null>;
    errors?: string[];
    last_registration_error?: string | null;
    registered_at?: string | null;
    subscribed_apps_at?: string | null;
  };
  const [registrationProbe, setRegistrationProbe] = useState<RegistrationProbe | null>(null);

  // ── Evolution API State ──────────────────────────────────────
  const [evolutionQr, setEvolutionQr] = useState<string | null>(null);
  const [evolutionConnected, setEvolutionConnected] = useState(false);
  const [evolutionPhone, setEvolutionPhone] = useState<string | null>(null);
  const [evolutionCreating, setEvolutionCreating] = useState(false);
  const [evolutionDeleting, setEvolutionDeleting] = useState(false);
  const [evolutionLoadingQr, setEvolutionLoadingQr] = useState(false);

  // 3 Form fields for Evolution creation
  const [evolutionInputName, setEvolutionInputName] = useState('');
  const [evolutionInputToken, setEvolutionInputToken] = useState('');
  const [evolutionInputNumber, setEvolutionInputNumber] = useState('');

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/whatsapp/webhook`
      : '';

  // ── Evolution API Callbacks ──────────────────────────────────
  const fetchEvolutionStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/evolution/status', { method: 'GET' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.connected) {
        setEvolutionConnected(true);
        setEvolutionPhone(data.phone || null);
        setConnectionStatus('connected');
      } else {
        setEvolutionConnected(false);
        setEvolutionPhone(null);
        setConnectionStatus('disconnected');
      }
    } catch (err) {
      console.error('fetchEvolutionStatus error:', err);
    }
  }, []);

  const fetchEvolutionQr = useCallback(async () => {
    try {
      setEvolutionLoadingQr(true);
      const res = await fetch('/api/whatsapp/evolution/qr', { method: 'GET' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.connected) {
        setEvolutionConnected(true);
        setEvolutionQr(null);
        fetchEvolutionStatus();
      } else if (data.qrBase64) {
        // Handle raw Base64 or prefixed data URI
        const qrSrc = data.qrBase64.startsWith('data:')
          ? data.qrBase64
          : `data:image/png;base64,${data.qrBase64}`;
        setEvolutionQr(qrSrc);
      } else {
        setEvolutionQr(null);
      }
    } catch (err) {
      console.error('fetchEvolutionQr error:', err);
    } finally {
      setEvolutionLoadingQr(false);
    }
  }, [fetchEvolutionStatus]);

  // ── Load Config ─────────────────────────────────────────────
  const fetchConfig = useCallback(async (acctId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('account_id', acctId)
        .maybeSingle();

      if (error) {
        console.error('Failed to load config row:', error);
      }

      if (data) {
        setConfig(data);
        const connectionType: WhatsAppConnectionType = data.connection_type || 'meta';
        setSelectedMethod(connectionType);

        if (connectionType === 'evolution') {
          setEvolutionPhone(data.evolution_connected_phone || null);
          const isConn = data.status === 'connected';
          setEvolutionConnected(isConn);
          setConnectionStatus(isConn ? 'connected' : 'disconnected');
          if (!isConn) {
            void fetchEvolutionQr();
          }
        } else {
          // Meta configuration
          setPhoneNumberId(data.phone_number_id || '');
          setWabaId(data.waba_id || '');
          setAccessToken(MASKED_TOKEN);
          setVerifyToken('');
          setPin('');
          setTokenEdited(false);
        }
      } else {
        setConfig(null);
        setSelectedMethod('meta');
        setPhoneNumberId('');
        setWabaId('');
        setAccessToken('');
        setVerifyToken('');
        setPin('');
        setTokenEdited(false);
        setEvolutionQr(null);
        setEvolutionConnected(false);
        setEvolutionPhone(null);
        setConnectionStatus('disconnected');
      }
      setRegistrationProbe(null);

      // Meta health check if method is Meta and config exists
      if (data && (data.connection_type || 'meta') === 'meta') {
        try {
          const res = await fetch('/api/whatsapp/config', { method: 'GET' });
          const payload = await res.json();

          if (payload.connected) {
            setConnectionStatus('connected');
            setResetReason(null);
            setStatusMessage('');
          } else {
            setConnectionStatus('disconnected');
            setResetReason(payload.needs_reset ? 'token_corrupted' : payload.reason === 'meta_api_error' ? 'meta_api_error' : null);
            setStatusMessage(payload.message || '');
          }
        } catch (err) {
          console.error('Health check failed:', err);
          setConnectionStatus('disconnected');
        }
      }
    } catch (err) {
      console.error('fetchConfig error:', err);
      toast.error('Failed to load WhatsApp configuration');
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchEvolutionQr, fetchEvolutionStatus]);

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!user || !accountId) {
      loadedAccountIdRef.current = null;
      setLoading(false);
      return;
    }
    if (loadedAccountIdRef.current === accountId) return;
    loadedAccountIdRef.current = accountId;
    fetchConfig(accountId);
  }, [authLoading, profileLoading, user?.id, accountId, fetchConfig]);

  // Polling for Evolution QR code & connection status when connecting
  useEffect(() => {
    if (selectedMethod !== 'evolution' || evolutionConnected) return;
    const interval = setInterval(() => {
      void fetchEvolutionQr();
      void fetchEvolutionStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedMethod, evolutionConnected, fetchEvolutionQr, fetchEvolutionStatus]);

  // ── Evolution Actions ────────────────────────────────────────
  async function handleCreateEvolutionInstance() {
    if (!evolutionInputName.trim()) {
      toast.error('يرجى إدخال اسم الـ Instance (Name)');
      return;
    }

    try {
      setEvolutionCreating(true);
      const res = await fetch('/api/whatsapp/evolution/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceName: evolutionInputName.trim(),
          token: evolutionInputToken.trim() || undefined,
          number: evolutionInputNumber.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to create Evolution instance');
        return;
      }

      toast.success('Evolution instance created. Generating QR Code...');
      if (data.qrBase64) {
        const qrSrc = data.qrBase64.startsWith('data:')
          ? data.qrBase64
          : `data:image/png;base64,${data.qrBase64}`;
        setEvolutionQr(qrSrc);
      }
      if (accountId) await fetchConfig(accountId);
    } catch (err) {
      console.error('handleCreateEvolutionInstance error:', err);
      toast.error('Failed to create Evolution instance');
    } finally {
      setEvolutionCreating(false);
    }
  }

  async function handleDeleteEvolutionInstance() {
    if (!confirm('Are you sure you want to disconnect and remove this Evolution connection?')) {
      return;
    }
    try {
      setEvolutionDeleting(true);
      const res = await fetch('/api/whatsapp/evolution/instance', {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to disconnect Evolution instance');
        return;
      }

      toast.success('Evolution connection removed');
      setConfig(null);
      setEvolutionQr(null);
      setEvolutionConnected(false);
      setEvolutionPhone(null);
      setConnectionStatus('disconnected');
      if (accountId) await fetchConfig(accountId);
    } catch (err) {
      console.error('handleDeleteEvolutionInstance error:', err);
      toast.error('Failed to disconnect Evolution instance');
    } finally {
      setEvolutionDeleting(false);
    }
  }

  // ── Meta Actions ────────────────────────────────────────────
  async function handleSave() {
    if (!phoneNumberId.trim()) {
      toast.error('Phone Number ID is required');
      return;
    }
    if (!config && (!accessToken.trim() || !tokenEdited)) {
      toast.error('Access Token is required for initial setup');
      return;
    }

    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        phone_number_id: phoneNumberId.trim(),
        waba_id: wabaId.trim() || null,
        verify_token: verifyToken.trim() || null,
        pin: pin.trim() || null,
      };

      if (tokenEdited && accessToken !== MASKED_TOKEN && accessToken.trim()) {
        payload.access_token = accessToken.trim();
      } else if (config) {
        toast.error('Please re-enter the Access Token to save changes');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to save configuration');
        setSaving(false);
        return;
      }

      if (data.registered === false && data.registration_error) {
        toast.error(
          `Saved, but Meta couldn't register the number: ${data.registration_error}`,
          { duration: 12000 },
        );
      } else if (data.registration_skipped) {
        toast.success(
          'Credentials saved and verified. Inbound registration was skipped (no PIN) — see Registration status below.',
          { duration: 10000 },
        );
        setPin('');
      } else {
        toast.success(
          data.phone_info?.verified_name
            ? `Live — ${data.phone_info.verified_name} can now receive events.`
            : 'WhatsApp connected. Events will start flowing within a minute.',
        );
        setPin('');
      }

      if (accountId) await fetchConfig(accountId);
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    try {
      setTesting(true);
      const res = await fetch('/api/whatsapp/config', { method: 'GET' });
      const payload = await res.json();

      if (payload.connected) {
        setConnectionStatus('connected');
        setResetReason(null);
        setStatusMessage('');
        toast.success(
          payload.phone_info?.verified_name
            ? `Connected to ${payload.phone_info.verified_name}`
            : 'API connection successful'
        );
      } else {
        setConnectionStatus('disconnected');
        setResetReason(payload.needs_reset ? 'token_corrupted' : payload.reason === 'meta_api_error' ? 'meta_api_error' : null);
        setStatusMessage(payload.message || '');
        toast.error(payload.message || 'API connection failed');
      }
    } catch (err) {
      console.error('Test connection error:', err);
      setConnectionStatus('disconnected');
      toast.error('Connection test failed. Check network and try again.');
    } finally {
      setTesting(false);
    }
  }

  async function handleVerifyRegistration() {
    setVerifyingRegistration(true);
    setRegistrationProbe(null);
    try {
      const res = await fetch('/api/whatsapp/config/verify-registration', {
        method: 'GET',
      });
      const data = (await res.json()) as RegistrationProbe;
      setRegistrationProbe(data);
      if (data.live) {
        toast.success('Number is fully wired — Meta is delivering events.');
      } else {
        toast.error(
          'Number is not fully registered. See the checks below for which step failed.',
          { duration: 8000 },
        );
      }
      if (accountId) await fetchConfig(accountId);
    } catch (err) {
      console.error('verify-registration failed:', err);
      toast.error('Could not reach the verification endpoint.');
    } finally {
      setVerifyingRegistration(false);
    }
  }

  async function handleReset() {
    if (!confirm('This will delete the current WhatsApp config so you can re-enter it. Continue?')) {
      return;
    }

    try {
      setResetting(true);
      const res = await fetch('/api/whatsapp/config', { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to reset configuration');
        return;
      }

      toast.success('Configuration cleared. You can now re-enter your credentials.');
      setConfig(null);
      setPhoneNumberId('');
      setWabaId('');
      setAccessToken('');
      setVerifyToken('');
      setTokenEdited(false);
      setConnectionStatus('disconnected');
      setResetReason(null);
      setStatusMessage('');
    } catch (err) {
      console.error('Reset error:', err);
      toast.error('Failed to reset configuration');
    } finally {
      setResetting(false);
    }
  }

  function handleCopyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied to clipboard');
  }

  if (loading) {
    return (
      <section className="animate-in fade-in-50 duration-200">
        <SettingsPanelHead
          title={t("title")}
          description={t("description")}
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  const showResetBanner = resetReason === 'token_corrupted';

  return (
    <section className="animate-in fade-in-50 duration-200">
      <SettingsPanelHead
        title={t("title")}
        description={t("description")}
      />

      {/* ── Connection Method Selector ────────────────────────── */}
      {!config && (
        <Card className="mb-6 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              اختر طريقة ربط الواتساب (WhatsApp Connection Method)
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              اختر إحدى الطريقتين لربط حساب الواتساب الخاص بك بالتطبيق.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Option 1: Meta Cloud API */}
              <div
                onClick={() => setSelectedMethod('meta')}
                className={`relative flex cursor-pointer flex-col justify-between rounded-lg border p-4 transition-all hover:border-primary/60 ${
                  selectedMethod === 'meta'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-5 text-primary" />
                      <span className="font-semibold text-foreground text-sm">
                        Meta Business API
                      </span>
                    </div>
                    {selectedMethod === 'meta' && (
                      <CheckCircle2 className="size-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    الربط السحابي الرسمي من Meta. يحتاج حساب Meta Business وحساب WABA وتوكن الوصول.
                  </p>
                </div>
              </div>

              {/* Option 2: Evolution API */}
              <div
                onClick={() => setSelectedMethod('evolution')}
                className={`relative flex cursor-pointer flex-col justify-between rounded-lg border p-4 transition-all hover:border-primary/60 ${
                  selectedMethod === 'evolution'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="size-5 text-emerald-500" />
                      <span className="font-semibold text-foreground text-sm">
                        Evolution API (QR Code)
                      </span>
                    </div>
                    {selectedMethod === 'evolution' && (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    ربط مباشر وسريع عبر مسح رمز QR من هاتفك المحمول دون الحاجة لاشتراك Meta Business.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Active Connection Badge (If Saved) ────────────────── */}
      {config && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            {config.connection_type === 'evolution' ? (
              <QrCode className="size-5 text-emerald-500" />
            ) : (
              <Building2 className="size-5 text-primary" />
            )}
            <div>
              <span className="text-sm font-medium text-foreground">
                طريقة الربط النشطة:{' '}
                {config.connection_type === 'evolution'
                  ? 'Evolution API (QR Code)'
                  : 'Meta Business API'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── EVOLUTION API PANEL ───────────────────────────────── */}
      {selectedMethod === 'evolution' && (
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2 text-lg">
                <QrCode className="size-5 text-emerald-500" />
                ربط الواتساب عبر Evolution API
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                قم بإنشاء الاتصال ثم مسح رمز QR Code برقم هاتفك لربطه بالنظام مباشرة.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Status Alert */}
              <Alert
                className={
                  evolutionConnected
                    ? 'bg-emerald-950/30 border-emerald-700/50'
                    : 'bg-amber-950/30 border-amber-700/50'
                }
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    {evolutionConnected ? (
                      <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="size-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <AlertTitle className="text-foreground font-semibold mb-0">
                        {evolutionConnected ? 'متصل بنجاح (Connected)' : 'غير متصل (Disconnected)'}
                      </AlertTitle>
                      {evolutionPhone && (
                        <p className="text-xs text-emerald-300 mt-0.5">
                          الرقم المقترن: <span className="font-mono font-bold">{evolutionPhone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {evolutionConnected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteEvolutionInstance}
                      disabled={evolutionDeleting}
                      className="border-red-900 text-red-400 hover:bg-red-950/40 hover:text-red-300"
                    >
                      {evolutionDeleting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                      إلغاء الربط (Disconnect)
                    </Button>
                  )}
                </div>
              </Alert>

              {/* Connected Info */}
              {evolutionConnected ? (
                <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-6 text-center space-y-3">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <Smartphone className="size-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-emerald-200">
                    الواتساب جاهز وتعمل الرسائل عبر Evolution API
                  </h3>
                  <p className="text-xs text-emerald-400/80 max-w-md mx-auto">
                    يتم استقبال وتوجيه كافة الرسائل الواردة والصادرة تلقائياً عبر محركات الأتمتة والـ Flows والذكاء الاصطناعي.
                  </p>
                </div>
              ) : (
                /* Not Connected: Display QR or Create Button */
                <div className="space-y-6">
                  {!config ? (
                    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-foreground">بيانات الاتصال بـ Evolution API</h4>
                        <p className="text-xs text-muted-foreground">
                          قم بتعبئة البيانات أدناه لإنشاء الـ Instance وجلب رمز الـ QR Code لمسحه.
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3 pt-2">
                        {/* 1. Name */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-foreground font-medium">
                            اسم الـ Instance (Name) <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            placeholder="e.g. mussaaa"
                            value={evolutionInputName}
                            onChange={(e) => setEvolutionInputName(e.target.value)}
                            className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
                          />
                        </div>

                        {/* 2. Token */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-foreground font-medium">
                            رمز الأمان (Token) <span className="text-muted-foreground text-[10px]">(اختياري)</span>
                          </Label>
                          <Input
                            placeholder="e.g. Mustafa12345"
                            value={evolutionInputToken}
                            onChange={(e) => setEvolutionInputToken(e.target.value)}
                            className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
                          />
                        </div>

                        {/* 3. Number */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-foreground font-medium">
                            رقم الهاتف (Number) <span className="text-muted-foreground text-[10px]">(اختياري)</span>
                          </Label>
                          <Input
                            placeholder="e.g. 966501234567"
                            value={evolutionInputNumber}
                            onChange={(e) => setEvolutionInputNumber(e.target.value)}
                            className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Button
                          onClick={handleCreateEvolutionInstance}
                          disabled={evolutionCreating || !evolutionInputName.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6"
                        >
                          {evolutionCreating ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              جاري إنشاء الاتصال...
                            </>
                          ) : (
                            <>
                              <QrCode className="size-4" />
                              متابعة وإنشاء الـ QR Code
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 items-center">
                      {/* QR Display */}
                      <div className="flex flex-col items-center justify-center space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                        {evolutionQr ? (
                          <div className="relative p-2 bg-white rounded-lg shadow-md">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={evolutionQr}
                              alt="WhatsApp QR Code"
                              className="size-64 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex size-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card">
                            <Loader2 className="size-8 animate-spin text-emerald-500" />
                            <span className="text-xs text-muted-foreground">جاري تحديث الـ QR Code...</span>
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={fetchEvolutionQr}
                          disabled={evolutionLoadingQr}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          <RefreshCw className={`size-3.5 ${evolutionLoadingQr ? 'animate-spin' : ''}`} />
                          تحديث رمز الـ QR يدويّاً
                        </Button>
                      </div>

                      {/* Instructions */}
                      <div className="space-y-4">
                        <h4 className="text-base font-semibold text-foreground">خطوات الربط:</h4>
                        <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside leading-relaxed">
                          <li>افتح تطبيق <strong>WhatsApp</strong> على هاتفك المحمول.</li>
                          <li>انتقل إلى <strong>الإعدادات (Settings)</strong> ← <strong>الأجهزة المرتبطة (Linked Devices)</strong>.</li>
                          <li>اضغط على <strong>ربط جهاز (Link a Device)</strong>.</li>
                          <li>وجه كاميرا الهاتف نحو رمز الـ <strong>QR Code</strong> الظاهر على الشاشة.</li>
                        </ol>
                        <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-800/40 p-3 rounded-md">
                          ⏳ يتحدث الـ QR Code تلقائياً كل بضع ثوانٍ. بمجرد المسح سيتعرف النظام فوراً ويتحول الوضع إلى متصل.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── META BUSINESS API PANEL ───────────────────────────── */}
      {selectedMethod === 'meta' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Main config form */}
          <div className="space-y-6">
            {/* Corrupted-token reset banner */}
            {showResetBanner && (
              <Alert className="bg-amber-950/40 border-amber-600/40">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 text-amber-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <AlertTitle className="text-amber-200 mb-1">
                      Stored token can&apos;t be decrypted
                    </AlertTitle>
                    <AlertDescription className="text-amber-100/80 text-sm">
                      {statusMessage}
                    </AlertDescription>
                    <Button
                      onClick={handleReset}
                      disabled={resetting}
                      size="sm"
                      className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {resetting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {t('resetting')}
                        </>
                      ) : (
                        <>
                          <RotateCcw className="size-4" />
                          {t('resetConfig')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Alert>
            )}

            {/* Connection Status */}
            <Alert className="bg-card border-border">
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' ? (
                  <CheckCircle2 className="size-4 text-primary" />
                ) : (
                  <XCircle className="size-4 text-red-500" />
                )}
                <AlertTitle className="text-foreground mb-0">
                  {connectionStatus === 'connected' ? t('credentialsValid') : t('notConnected')}
                </AlertTitle>
              </div>
              <AlertDescription className="text-muted-foreground">
                {connectionStatus === 'connected'
                  ? t('connectedDesc')
                  : statusMessage ||
                    t('notConnectedDesc')}
              </AlertDescription>
            </Alert>

            {/* Registration Status */}
            {config && (
              <Alert
                className={
                  isRegistered
                    ? 'bg-emerald-950/30 border-emerald-700/50'
                    : 'bg-amber-950/30 border-amber-700/50'
                }
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {isRegistered ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="size-4 text-amber-400" />
                    )}
                    <AlertTitle
                      className={
                        'mb-0 ' + (isRegistered ? 'text-emerald-200' : 'text-amber-200')
                      }
                    >
                      {isRegistered
                        ? t('registered')
                        : t('notRegistered')}
                    </AlertTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVerifyRegistration}
                    disabled={verifyingRegistration}
                    className="border-border bg-transparent text-foreground hover:bg-muted h-7"
                  >
                    {verifyingRegistration ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Zap className="size-3.5" />
                    )}
                    {t('verifyWithMeta')}
                  </Button>
                </div>
                <AlertDescription className="text-muted-foreground mt-2 text-xs leading-relaxed">
                  {isRegistered ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: t('subscribedSince', {
                          date: config.registered_at
                            ? new Date(config.registered_at).toLocaleString()
                            : t('unknownDate'),
                        }),
                      }}
                    />
                  ) : lastRegistrationError ? (
                    <>
                      {t('lastAttemptFailed')}
                      <span className="text-red-300">
                        &quot;{lastRegistrationError}&quot;
                      </span>
                      . {t('retryHint')}
                    </>
                  ) : (
                    <>{t('noRegistrationHint')}</>
                  )}
                </AlertDescription>

                {registrationProbe && (
                  <div className="mt-3 rounded border border-border bg-card/60 px-3 py-2 space-y-1.5 text-[11px]">
                    <p className="font-medium text-foreground">
                      {t('diagnosticLastRun')}
                      <span className={registrationProbe.live ? 'text-emerald-400' : 'text-amber-400'}>
                        {registrationProbe.live ? t('live') : t('notLive')}
                      </span>
                    </p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      {Object.entries(registrationProbe.checks).map(([k, v]) => (
                        <li key={k} className="flex items-center gap-1.5">
                          {v === true ? (
                            <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                          ) : v === false ? (
                            <XCircle className="size-3 text-red-400 shrink-0" />
                          ) : (
                            <span className="size-3 rounded-full border border-border shrink-0" />
                          )}
                          <code className="text-muted-foreground">{k}</code>
                        </li>
                      ))}
                    </ul>
                    {(registrationProbe.errors ?? []).length > 0 && (
                      <ul className="pt-1 space-y-0.5 text-red-300">
                        {registrationProbe.errors?.map((e, i) => (
                          <li key={i}>• {e}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Alert>
            )}

            {/* API Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">{t('apiCredentialsTitle')}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t('apiCredentialsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t('phoneNumberId')}</Label>
                  <Input
                    placeholder="e.g. 100234567890123"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t('wabaId')}</Label>
                  <Input
                    placeholder="e.g. 100234567890456"
                    value={wabaId}
                    onChange={(e) => setWabaId(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t('accessToken')}</Label>
                  <div className="relative">
                    <Input
                      type={showToken ? 'text' : 'password'}
                      placeholder={t('accessTokenPlaceholder')}
                      value={accessToken}
                      onChange={(e) => {
                        setAccessToken(e.target.value);
                        setTokenEdited(true);
                      }}
                      onFocus={() => {
                        if (accessToken === MASKED_TOKEN) {
                          setAccessToken('');
                          setTokenEdited(true);
                        }
                      }}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {config && !tokenEdited && (
                    <p className="text-xs text-muted-foreground">
                      {t('tokenHidden')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t('webhookVerifyToken')}</Label>
                  <Input
                    placeholder={t('webhookVerifyTokenPlaceholder')}
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('webhookVerifyTokenHint')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    {t('twoStepPin')}
                    <span className="ml-1 text-muted-foreground">{t('optional')}</span>
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder={t('pinPlaceholder')}
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span dangerouslySetInnerHTML={{ __html: t('pinHint') }} />
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Webhook URL */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">{t('webhookTitle')}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t('webhookDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t('webhookUrl')}</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={webhookUrl}
                      className="bg-muted border-border text-muted-foreground font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyWebhookUrl}
                      className="shrink-0 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  t('saveConfig')
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !config}
                className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                {testing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t('testing')}
                  </>
                ) : (
                  <>
                    <Zap className="size-4" />
                    {t('testConnection')}
                  </>
                )}
              </Button>
              {config && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={resetting}
                  className="border-red-900 text-red-400 hover:text-red-300 hover:bg-red-950/40"
                >
                  {resetting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t('resetting')}
                    </>
                  ) : (
                    <>
                      <RotateCcw className="size-4" />
                      {t('resetConfig')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Setup Instructions Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground text-base">{t('setupInstructions')}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t('setupInstructionsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion>
                  <AccordionItem className="border-border">
                    <AccordionTrigger className="text-muted-foreground hover:text-foreground hover:no-underline">
                      <span className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                        {t('step1')}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li dangerouslySetInnerHTML={{ __html: t.raw('step1_1') }} />
                        <li>{t('step1_2')}</li>
                        <li>{t('step1_3')}</li>
                        <li>{t('step1_4')}</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem className="border-border">
                    <AccordionTrigger className="text-muted-foreground hover:text-foreground hover:no-underline">
                      <span className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                        {t('step2')}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>{t('step2_1')}</li>
                        <li>{t('step2_2')}</li>
                        <li>{t('step2_3')}</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem className="border-border">
                    <AccordionTrigger className="text-muted-foreground hover:text-foreground hover:no-underline">
                      <span className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                        {t('step3')}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>{t('step3_1')}</li>
                        <li dangerouslySetInnerHTML={{ __html: t.raw('step3_2') }} />
                        <li dangerouslySetInnerHTML={{ __html: t.raw('step3_3') }} />
                        <li dangerouslySetInnerHTML={{ __html: t.raw('step3_4') }} />
                      </ol>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem className="border-border">
                    <AccordionTrigger className="text-muted-foreground hover:text-foreground hover:no-underline">
                      <span className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">4</span>
                        {t('step4')}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>{t('step4_1')}</li>
                        <li>{t('step4_2')}</li>
                        <li dangerouslySetInnerHTML={{ __html: t.raw('step4_3') }} />
                        <li dangerouslySetInnerHTML={{ __html: t.raw('step4_4') }} />
                        <li>{t('step4_5')}</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="mt-4 pt-4 border-t border-border">
                  <a
                    href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="size-3.5" />
                    {t('metaDocs')}
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}
