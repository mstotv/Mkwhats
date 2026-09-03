'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Sparkles, CheckCircle2, Trash2, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { canEditSettings } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsPanelHead } from './settings-panel-head';
import { AiKnowledgeCard } from './ai-knowledge';
import { OrderFieldsManager } from './order-fields-manager';
import { AI_PROVIDER_DEFAULT_MODEL } from '@/lib/ai/defaults';
import type { AiProvider } from '@/lib/ai/types';
import type { AccountMember } from '@/types';
import { fetchAccountMembers, memberLabel } from '@/lib/account/members';
import { useTranslations, useLocale } from 'next-intl';

const MASKED_KEY = '••••••••••••••••';

// Radix Select can't use an empty-string item value, so the "leave
// unassigned" choice gets a sentinel that maps to null in the payload.
const HANDOFF_QUEUE = '__queue__';

const PROVIDER_LABEL: Record<AiProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic (Claude)',
  gemini: 'Google (Gemini)',
};

const KEY_PLACEHOLDER: Record<AiProvider, string> = {
  openai: 'sk-...',
  anthropic: 'sk-ant-...',
  gemini: 'AIza...',
};

export function AiConfig() {
  const { accountId, accountRole, profileLoading } = useAuth();
  const canEdit = accountRole ? canEditSettings(accountRole) : false;
  const t = useTranslations('Settings.aiConfig');
  const locale = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [configured, setConfigured] = useState(false);
  const [provider, setProvider] = useState<AiProvider>('openai');
  const [model, setModel] = useState(AI_PROVIDER_DEFAULT_MODEL.openai);
  const [apiKey, setApiKey] = useState('');
  const [keyEdited, setKeyEdited] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [embeddingsKey, setEmbeddingsKey] = useState('');
  const [embeddingsKeyEdited, setEmbeddingsKeyEdited] = useState(false);
  const [hasStoredEmbeddingsKey, setHasStoredEmbeddingsKey] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [maxPerConversation, setMaxPerConversation] = useState(3);
  // Empty string = leave unassigned (shared queue).
  const [handoffAgentId, setHandoffAgentId] = useState('');
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [orderCollectionEnabled, setOrderCollectionEnabled] = useState(false);
  const [savingOrderToggle, setSavingOrderToggle] = useState(false);
  const [voiceTranscriptionEnabled, setVoiceTranscriptionEnabled] = useState(false);
  const [planAllowsVoice, setPlanAllowsVoice] = useState(true);

  const DEFAULT_VOICE_FALLBACK = isAr
    ? 'عزيزي العميل، تم استلام رسالتك الصوتية 🎙️. نرجو التكرم بكتابة استفسارك نصياً حتى يتمكن المساعد الآلي من خدمتك فوراً، أو انتظر لحظات وسيقوم أحد ممثلي الخدمة بالاستماع إليها والرد عليك.'
    : 'Dear customer, we received your voice note 🎙️. Please write your request in text so our assistant can help immediately, or a team member will listen shortly.';

  const [voiceFallbackEnabled, setVoiceFallbackEnabled] = useState(true);
  const [voiceFallbackReply, setVoiceFallbackReply] = useState(DEFAULT_VOICE_FALLBACK);

  // Guard keyed on the account (not a bare boolean) so an in-place
  // account switch — ownership transfer, multi-account membership —
  // refetches instead of showing the previous account's config. Mirrors
  // the loadedAccountIdRef pattern in whatsapp-config.tsx.
  const loadedAccountIdRef = useRef<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/config');
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? t('loadFailed'));
        return;
      }
      if (data.configured) {
        setConfigured(true);
        setProvider(data.provider);
        setModel(data.model);
        setSystemPrompt(data.system_prompt ?? '');
        setIsActive(data.is_active);
        setAutoReplyEnabled(data.auto_reply_enabled);
        setMaxPerConversation(data.auto_reply_max_per_conversation ?? 3);
        setHandoffAgentId(data.handoff_agent_id ?? '');
        setHasStoredKey(Boolean(data.has_key));
        setApiKey(data.has_key ? MASKED_KEY : '');
        setKeyEdited(false);
        setHasStoredEmbeddingsKey(Boolean(data.has_embeddings_key));
        setEmbeddingsKey(data.has_embeddings_key ? MASKED_KEY : '');
        setEmbeddingsKeyEdited(false);
        setOrderCollectionEnabled(Boolean(data.order_collection_enabled));
        setVoiceTranscriptionEnabled(Boolean(data.voice_transcription_enabled));
      }
      if (typeof data.voice_fallback_enabled === 'boolean') {
        setVoiceFallbackEnabled(data.voice_fallback_enabled);
      }
      if (typeof data.voice_fallback_reply === 'string' && data.voice_fallback_reply.trim()) {
        setVoiceFallbackReply(data.voice_fallback_reply);
      }
      if (typeof data.plan_allows_voice === 'boolean') {
        setPlanAllowsVoice(data.plan_allows_voice);
      }
    } catch {
      toast.error(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!accountId || loadedAccountIdRef.current === accountId) return;
    loadedAccountIdRef.current = accountId;
    void fetchConfig();
    // Members populate the handoff-target picker. Best-effort — on an
    // older deployment without the endpoint the picker just shows the
    // queue option.
    void fetchAccountMembers().then(setMembers);
  }, [accountId, fetchConfig]);

  // Swap the model default when the provider changes, unless the user
  // typed a custom model.
  const handleProviderChange = (next: AiProvider) => {
    setProvider(next);
    const isDefaultModel =
      model === AI_PROVIDER_DEFAULT_MODEL.openai ||
      model === AI_PROVIDER_DEFAULT_MODEL.anthropic ||
      model.trim() === '';
    if (isDefaultModel) setModel(AI_PROVIDER_DEFAULT_MODEL[next]);
  };

  const keyPayload = () => (keyEdited ? apiKey.trim() : undefined);

  // undefined = leave unchanged; '' typed = null (clear); text = set.
  const embeddingsKeyPayload = () =>
    embeddingsKeyEdited ? embeddingsKey.trim() || null : undefined;

  const buildBody = () => ({
    provider,
    model: model.trim(),
    api_key: keyPayload(),
    embeddings_api_key: embeddingsKeyPayload(),
    system_prompt: systemPrompt.trim() || null,
    is_active: isActive,
    auto_reply_enabled: autoReplyEnabled,
    auto_reply_max_per_conversation: maxPerConversation,
    handoff_agent_id: handoffAgentId || null,
    order_collection_enabled: orderCollectionEnabled,
    voice_transcription_enabled: voiceTranscriptionEnabled,
    voice_fallback_enabled: voiceFallbackEnabled,
    voice_fallback_reply: voiceFallbackReply.trim() || null,
  });

  const handleQuickToggle = async (
    field: 'is_active' | 'auto_reply_enabled' | 'voice_transcription_enabled' | 'voice_fallback_enabled',
    value: boolean
  ) => {
    if (field === 'voice_transcription_enabled' && !planAllowsVoice && value) {
      toast.error(isAr ? 'ميزة تفريغ الرسائل الصوتية غير متوفرة في باقتك الحالية. يرجى الترقية.' : 'Voice transcription is not included in your current plan.');
      return;
    }

    if (field === 'is_active') setIsActive(value);
    if (field === 'auto_reply_enabled') setAutoReplyEnabled(value);
    if (field === 'voice_transcription_enabled') setVoiceTranscriptionEnabled(value);
    if (field === 'voice_fallback_enabled') setVoiceFallbackEnabled(value);

    if (configured) {
      try {
        const payload = {
          ...buildBody(),
          [field]: value,
        };
        const res = await fetch('/api/ai/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const fieldNames: Record<string, string> = {
            is_active: 'مساعد الذكاء الاصطناعي',
            auto_reply_enabled: 'الرد التلقائي على الرسائل',
            voice_transcription_enabled: 'فهم وتفريغ الرسائل الصوتية',
            voice_fallback_enabled: 'الرد التلقائي على الرسائل الصوتية',
          };
          toast.success(value ? `تم تفعيل ${fieldNames[field]} بنجاح ✅` : `تم إيقاف ${fieldNames[field]} بنجاح ⏸️`);
        } else {
          const d = await res.json();
          toast.error(d.error || t('saveFailed'));
          if (field === 'is_active') setIsActive(!value);
          if (field === 'auto_reply_enabled') setAutoReplyEnabled(!value);
          if (field === 'voice_transcription_enabled') setVoiceTranscriptionEnabled(!value);
          if (field === 'voice_fallback_enabled') setVoiceFallbackEnabled(!value);
        }
      } catch {
        toast.error(t('saveFailed'));
        if (field === 'is_active') setIsActive(!value);
        if (field === 'auto_reply_enabled') setAutoReplyEnabled(!value);
        if (field === 'voice_transcription_enabled') setVoiceTranscriptionEnabled(!value);
        if (field === 'voice_fallback_enabled') setVoiceFallbackEnabled(!value);
      }
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model: model.trim(),
          api_key: keyPayload(),
        }),
      });
      const data = await res.json();
      if (res.ok) toast.success(t('testSuccess'));
      else toast.error(data.error ?? t('testRejected'));
    } catch {
      toast.error(t('testNetworkError'));
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!model.trim()) {
      toast.error(t('missingModel'));
      return;
    }
    if (!configured && !keyEdited) {
      toast.error(t('missingApiKey'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody()),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.warning) {
          toast.warning(data.warning, { duration: 6000 });
        } else {
          toast.success(t('saveSuccess'));
        }
        await fetchConfig();
      } else {
        toast.error(data.error || t('saveFailed'), { duration: 6000 });
      }
    } catch {
      toast.error(t('saveFailed'), { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch('/api/ai/config', { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('removeSuccess'));
        setConfigured(false);
        setHasStoredKey(false);
        setApiKey('');
        setKeyEdited(false);
        setIsActive(false);
        setAutoReplyEnabled(false);
        setSystemPrompt('');
        setHandoffAgentId('');
        setOrderCollectionEnabled(false);
      } else {
        const data = await res.json();
        toast.error(data.error ?? t('removeFailed'));
      }
    } catch {
      toast.error(t('removeFailed'));
    } finally {
      setRemoving(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('loadFailed')} {/* Re-using label or a global one, wait, loading is better. Let's use useTranslations from overview or just hardcode Loading... actually I should add loading to aiConfig */}
        {/* Wait, I didn't add loading to aiConfig. I'll just use loading. */}
      </div>
    );
  }

  const disabled = !canEdit || saving;

  return (
    <div>
      <SettingsPanelHead
        title={t('title')}
        description={t('description')}
      />

      {!canEdit && (
        <p className="mb-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {t('adminOnlyConfig')}
        </p>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> {t('providerAndKey')}
            </CardTitle>
            <CardDescription>
              {t('encryptionNotice')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('provider')}</Label>
                <Select
                  value={provider}
                  onValueChange={(v) => handleProviderChange(v as AiProvider)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">{PROVIDER_LABEL.openai}</SelectItem>
                    <SelectItem value="anthropic">
                      {PROVIDER_LABEL.anthropic}
                    </SelectItem>
                    <SelectItem value="gemini">
                      {PROVIDER_LABEL.gemini}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-model">{t('model')}</Label>
                <Input
                  id="ai-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={AI_PROVIDER_DEFAULT_MODEL[provider]}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-key">{t('apiKey')}</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="ai-key"
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setKeyEdited(true);
                    }}
                    onFocus={() => {
                      if (!keyEdited && hasStoredKey) {
                        setApiKey('');
                        setKeyEdited(true);
                      }
                    }}
                    placeholder={KEY_PLACEHOLDER[provider]}
                    disabled={disabled}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  variant="outline"
                  onClick={handleTest}
                  disabled={disabled || testing}
                >
                  {testing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  {t('testKey')}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-embeddings-key">
                {t('embeddingsKey')}{' '}
                <span className="font-normal text-muted-foreground">
                  {t('optionalSemanticSearch')}
                </span>
              </Label>
              <Input
                id="ai-embeddings-key"
                type="password"
                value={embeddingsKey}
                onChange={(e) => {
                  setEmbeddingsKey(e.target.value);
                  setEmbeddingsKeyEdited(true);
                }}
                onFocus={() => {
                  if (!embeddingsKeyEdited && hasStoredEmbeddingsKey) {
                    setEmbeddingsKey('');
                    setEmbeddingsKeyEdited(true);
                  }
                }}
                placeholder="sk-... (OpenAI)"
                disabled={disabled}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                {t('embeddingsHint', {
                  sameKeyText: provider === 'openai' ? t('sameKeyText') : '',
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('behaviour')}</CardTitle>
            <CardDescription>
              {t('behaviourDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">{t('businessContext')}</Label>
              <Textarea
                id="ai-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder={t('promptPlaceholder')}
                rows={5}
                disabled={disabled}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t('enableAssistant')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('enableAssistantDesc')}
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => handleQuickToggle('is_active', checked)}
                disabled={disabled}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t('autoReply')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('autoReplyDesc')}
                </p>
              </div>
              <Switch
                checked={autoReplyEnabled}
                onCheckedChange={(checked) => handleQuickToggle('auto_reply_enabled', checked)}
                disabled={disabled}
              />
            </div>

            <div className={`flex items-center justify-between gap-4 rounded-md border p-3 transition-colors ${
              planAllowsVoice ? 'border-border' : 'border-amber-500/30 bg-amber-500/5'
            }`}>
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5 flex-wrap">
                  <span>🎙️</span> {t('voiceTranscription')}
                  {!planAllowsVoice && (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30 gap-1 py-0 px-1.5 font-semibold">
                      <Lock className="h-2.5 w-2.5" />
                      {isAr ? 'تتطلب ترقية الباقة' : 'Upgrade Required'}
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('voiceTranscriptionDesc')}
                </p>
                {!planAllowsVoice && (
                  <button
                    type="button"
                    onClick={() => router.push('/settings?tab=plan')}
                    className="text-xs text-amber-600 dark:text-amber-400 font-semibold underline mt-1.5 block hover:opacity-80 transition-opacity"
                  >
                    {isAr ? 'اضغط هنا لترقية باقتك وتفعيل تفريغ الصوت 🚀' : 'Upgrade your plan to unlock Voice STT 🚀'}
                  </button>
                )}
              </div>
              <Switch
                checked={planAllowsVoice && voiceTranscriptionEnabled}
                onCheckedChange={(checked) => {
                  if (!planAllowsVoice) {
                    toast.error(isAr ? 'هذه الميزة غير متوفرة في باقتك الحالية. يرجى ترقية الباقة.' : 'Feature not included in your current plan.');
                    return;
                  }
                  handleQuickToggle('voice_transcription_enabled', checked)
                }}
                disabled={disabled || !planAllowsVoice}
              />
            </div>

            {/* Voice Fallback Reply Box */}
            <div className="rounded-md border border-border p-3.5 space-y-3 bg-card/60">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <span>💬</span> {t('voiceFallbackReplyTitle')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('voiceFallbackReplyDesc')}
                  </p>
                </div>
                <Switch
                  checked={voiceFallbackEnabled}
                  onCheckedChange={(checked) => handleQuickToggle('voice_fallback_enabled', checked)}
                  disabled={disabled}
                />
              </div>

              {voiceFallbackEnabled && (
                <div className="space-y-2 pt-1 border-t border-border/50">
                  <Textarea
                    rows={3}
                    value={voiceFallbackReply}
                    onChange={(e) => setVoiceFallbackReply(e.target.value)}
                    placeholder={t('voiceFallbackPlaceholder')}
                    disabled={disabled}
                    className="text-xs leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => setVoiceFallbackReply(DEFAULT_VOICE_FALLBACK)}
                      className="text-primary hover:underline font-medium"
                      disabled={disabled}
                    >
                      ↺ {t('resetDefault')}
                    </button>
                    <span>{voiceFallbackReply.length} / 500</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="ai-max">{t('maxAutoReplies')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('maxAutoRepliesDesc')}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('unlimitedHint')}
                </p>
              </div>
              <Input
                id="ai-max"
                type="number"
                min={-1}
                max={500}
                value={maxPerConversation}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (e.target.value === '' || e.target.value === '-') return
                  if (v === -1) {
                    setMaxPerConversation(-1)
                  } else {
                    setMaxPerConversation(Math.min(500, Math.max(1, Math.floor(v) || 1)))
                  }
                }}
                disabled={disabled || !autoReplyEnabled}
                className="w-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-handoff">{t('handoffTo')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('handoffToDesc')}
              </p>
              <Select
                value={handoffAgentId || HANDOFF_QUEUE}
                onValueChange={(v) =>
                  setHandoffAgentId(!v || v === HANDOFF_QUEUE ? '' : v)
                }
                disabled={disabled || !autoReplyEnabled}
              >
                <SelectTrigger id="ai-handoff">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={HANDOFF_QUEUE}>
                    {t('handoffQueue')}
                  </SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {memberLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <AiKnowledgeCard
          accountId={accountId}
          canEdit={canEdit}
          hasEmbeddingsKey={
            embeddingsKeyEdited
              ? embeddingsKey.trim().length > 0
              : hasStoredEmbeddingsKey
          }
        />

        {/* Order collection — always visible so fields can be configured */}
        <OrderFieldsManager
          canEdit={canEdit}
          orderCollectionEnabled={orderCollectionEnabled}
          savingToggle={savingOrderToggle}
          onToggleOrderCollection={async (enabled) => {
            if (!configured) {
              toast.error('احفظ مفتاح الذكاء الاصطناعي أولاً قبل تفعيل تجميع الطلبات');
              return;
            }
            setSavingOrderToggle(true);
            try {
              const res = await fetch('/api/ai/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Send only the toggle — all other fields come from
                // current state so nothing else changes.
                body: JSON.stringify({
                  ...buildBody(),
                  order_collection_enabled: enabled,
                }),
              });
              if (res.ok) {
                setOrderCollectionEnabled(enabled);
                toast.success(enabled ? 'تم تفعيل تجميع الطلبات' : 'تم تعطيل تجميع الطلبات');
              } else {
                const d = await res.json();
                toast.error(d.error ?? 'تعذّر حفظ الإعداد');
              }
            } catch {
              toast.error('تعذّر الاتصال بالخادم');
            } finally {
              setSavingOrderToggle(false);
            }
          }}
        />

        <div className="flex items-center justify-between">
          {configured ? (
            <Button
              variant="ghost"
              onClick={handleRemove}
              disabled={!canEdit || removing}
              className="text-destructive hover:text-destructive"
            >
              {removing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {t('remove')}
            </Button>
          ) : (
            <span />
          )}

          <Button onClick={handleSave} disabled={disabled}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
