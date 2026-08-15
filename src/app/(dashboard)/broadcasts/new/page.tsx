'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { MessageTemplate } from '@/types';
import { Step1ChooseTemplate } from '@/components/broadcasts/step1-choose-template';
import { Step2SelectAudience } from '@/components/broadcasts/step2-select-audience';
import { Step3Personalize } from '@/components/broadcasts/step3-personalize';
import { Step4ScheduleSend } from '@/components/broadcasts/step4-schedule-send';
import { useBroadcastSending } from '@/hooks/use-broadcast-sending';
import { Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function NewBroadcastPage() {
  const router = useRouter();
  const t = useTranslations('Broadcasts.new');
  const { accountId } = useAuth();
  const { createAndSendBroadcast, isProcessing, progress, estimatedSecondsRemaining } = useBroadcastSending();

  const [connectionType, setConnectionType] = useState<'meta' | 'evolution'>('meta');
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [currentStep, setCurrentStep] = useState(0);
  const [template, setTemplate] = useState<MessageTemplate | null>(null);
  const [freeText, setFreeText] = useState('');
  const [audience, setAudience] = useState<{
    type: 'all' | 'tags' | 'custom_field' | 'csv';
    tagIds?: string[];
    customField?: {
      fieldId: string;
      operator: 'is' | 'is_not' | 'contains';
      value: string;
    };
    csvContacts?: { phone: string; name?: string }[];
    excludeTagIds?: string[];
  }>({ type: 'all' });
  const [variables, setVariables] = useState<
    Record<string, { type: 'static' | 'field' | 'custom_field'; value: string }>
  >({});
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [name, setName] = useState('');

  // Fetch account WhatsApp connection type on load
  useEffect(() => {
    async function loadConfig() {
      if (!accountId) return;
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('whatsapp_config')
          .select('connection_type')
          .eq('account_id', accountId)
          .maybeSingle();

        if (data?.connection_type === 'evolution') {
          setConnectionType('evolution');
        } else {
          setConnectionType('meta');
        }
      } catch (err) {
        console.error('Failed to load whatsapp config:', err);
      } finally {
        setLoadingConfig(false);
      }
    }

    loadConfig();
  }, [accountId]);

  const steps = connectionType === 'evolution'
    ? [
        { label: 'template', key: 'message' },
        { label: 'audience', key: 'audience' },
        { label: 'send', key: 'send' },
      ]
    : [
        { label: 'template', key: 'template' },
        { label: 'audience', key: 'audience' },
        { label: 'personalize', key: 'personalize' },
        { label: 'send', key: 'send' },
      ];

  async function handleSend() {
    if (connectionType === 'meta' && !template) return;
    if (connectionType === 'evolution' && !freeText.trim()) return;

    try {
      const broadcastId = await createAndSendBroadcast({
        name,
        template,
        freeText,
        audience: {
          type: audience.type,
          tagIds: audience.tagIds,
          customField: audience.customField,
          csvContacts: audience.csvContacts,
          excludeTagIds: audience.excludeTagIds,
        },
        variables,
        headerMediaUrl,
      });
      router.push(`/broadcasts/${broadcastId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Broadcast failed';
      console.error('Broadcast failed:', err);
      toast.error(message);
    }
  }

  async function handleSaveDraft() {
    if (!name.trim()) {
      toast.error(t('toastGiveName'));
      return;
    }
    if (connectionType === 'meta' && !template) {
      toast.error(t('toastChooseTemplate'));
      return;
    }
    if (connectionType === 'evolution' && !freeText.trim()) {
      toast.error('يرجى كتابة نص الرسالة لحفظ المسودة');
      return;
    }

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user || !accountId) {
      toast.error(t('toastNotSignedIn'));
      return;
    }

    const { error } = await supabase.from('broadcasts').insert({
      user_id: user.id,
      account_id: accountId,
      name: name.trim(),
      template_name: connectionType === 'meta' ? template?.name : 'Evolution Text',
      template_language: connectionType === 'meta' ? template?.language ?? 'en_US' : 'ar',
      template_variables: connectionType === 'evolution' ? { free_text: freeText } : variables,
      audience_filter: {
        type: audience.type,
        tagIds: audience.tagIds,
      },
      status: 'draft',
      total_recipients: 0,
      sent_count: 0,
      delivered_count: 0,
      read_count: 0,
      replied_count: 0,
      failed_count: 0,
    });

    if (error) {
      toast.error(t('toastFailedDraft', { error: error.message }));
      return;
    }
    toast.success(t('toastDraftSaved'));
    router.push('/broadcasts');
  }

  if (loadingConfig) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isActive
                        ? 'border-2 border-primary bg-primary/10 text-primary'
                        : 'border border-border bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={`hidden text-sm font-medium sm:block ${
                    isActive ? 'text-foreground' : isCompleted ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {t(`steps.${step.label}`)}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-3 h-px flex-1 ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="relative min-h-[400px]">
        <div
          className="transition-all duration-300 ease-in-out"
          style={{
            opacity: isProcessing ? 0.6 : 1,
            pointerEvents: isProcessing ? 'none' : 'auto',
          }}
        >
          {currentStep === 0 && (
            <Step1ChooseTemplate
              connectionType={connectionType}
              selectedTemplate={template}
              onSelect={setTemplate}
              freeText={freeText}
              onFreeTextChange={setFreeText}
              onNext={() => setCurrentStep(1)}
              onBack={() => router.push('/broadcasts')}
            />
          )}

          {currentStep === 1 && (
            <Step2SelectAudience
              audience={audience}
              onUpdate={setAudience}
              onNext={() => setCurrentStep(connectionType === 'evolution' ? 2 : 2)}
              onBack={() => setCurrentStep(0)}
            />
          )}

          {/* Meta Only: Personalize Step */}
          {connectionType === 'meta' && currentStep === 2 && template && (
            <Step3Personalize
              template={template}
              variables={variables}
              onUpdate={setVariables}
              headerMediaUrl={headerMediaUrl}
              onHeaderMediaUrlChange={setHeaderMediaUrl}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {/* Send Step */}
          {((connectionType === 'meta' && currentStep === 3) ||
            (connectionType === 'evolution' && currentStep === 2)) && (
            <Step4ScheduleSend
              connectionType={connectionType}
              name={name}
              onNameChange={setName}
              template={template}
              freeText={freeText}
              audience={audience}
              onSend={handleSend}
              onSaveDraft={handleSaveDraft}
              onBack={() => setCurrentStep(connectionType === 'evolution' ? 1 : 2)}
              isProcessing={isProcessing}
              progress={progress}
              estimatedSecondsRemaining={estimatedSecondsRemaining}
            />
          )}
        </div>
      </div>
    </div>
  );
}
