'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  Pencil,
  RotateCcw,
  Upload,
  Tag,
  LayoutGrid,
  Globe,
  Type,
  MessageSquare,
  Send,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  uploadAccountMedia,
  MEDIA_MAX_BYTES_BY_KIND,
} from '@/lib/storage/upload-media';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { SettingsPanelHead } from './settings-panel-head';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  MessageTemplate,
  TemplateButton,
  TemplateSampleValues,
} from '@/types';
import { templateStatusConfig } from '@/lib/template-status';
import {
  extractVariableIndices,
  TEMPLATE_LIMITS,
} from '@/lib/whatsapp/template-validators';

const CATEGORIES = ['Marketing', 'Utility', 'Authentication'] as const;
type HeaderFormat = 'none' | 'text' | 'image' | 'video' | 'document';
const HEADER_FORMATS: HeaderFormat[] = ['none', 'text', 'image', 'video', 'document'];

const categoryColors: Record<string, string> = {
  Marketing: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
  Utility: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  Authentication: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
};

interface TemplateFormData {
  name: string;
  category: MessageTemplate['category'];
  language: string;
  header_format: HeaderFormat;
  header_content: string;
  header_media_url: string;
  header_sample: string;
  body_text: string;
  body_samples: string[];
  footer_text: string;
  buttons: TemplateButton[];
}

const emptyForm: TemplateFormData = {
  name: '',
  category: 'Utility',
  language: 'en_US',
  header_format: 'none',
  header_content: '',
  header_media_url: '',
  header_sample: '',
  body_text: '',
  body_samples: [],
  footer_text: '',
  buttons: [],
};

function emptyButton(type: TemplateButton['type']): TemplateButton {
  switch (type) {
    case 'QUICK_REPLY':
      return { type: 'QUICK_REPLY', text: '' };
    case 'URL':
      return { type: 'URL', text: '', url: '' };
    case 'PHONE_NUMBER':
      return { type: 'PHONE_NUMBER', text: '', phone_number: '' };
    case 'COPY_CODE':
      return { type: 'COPY_CODE', text: '', example: '' };
  }
}

export function TemplateManager() {
  const t = useTranslations('Settings.templates');
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] =
    useState<MessageTemplate | null>(null);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [connectionType, setConnectionType] = useState<'meta' | 'evolution'>('meta');

  const [form, setForm] = useState<TemplateFormData>(emptyForm);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const bodyVarCount = useMemo(() => {
    return extractVariableIndices(form.body_text).length;
  }, [form.body_text]);

  useEffect(() => {
    setForm((prev) => {
      if (prev.body_samples.length === bodyVarCount) return prev;
      const next = prev.body_samples.slice(0, bodyVarCount);
      while (next.length < bodyVarCount) next.push('');
      return { ...prev, body_samples: next };
    });
  }, [bodyVarCount]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchTemplates(user.id);
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  async function fetchConfig() {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_id')
        .eq('user_id', user?.id)
        .maybeSingle();
      if (!profile?.account_id) return;

      const { data: config } = await supabase
        .from('whatsapp_config')
        .select('connection_type')
        .eq('account_id', profile.account_id)
        .maybeSingle();

      if (config?.connection_type === 'evolution') {
        setConnectionType('evolution');
      } else {
        setConnectionType('meta');
      }
    } catch (err) {
      console.error('Failed to fetch whatsapp config connection_type:', err);
    }
  }

  async function fetchTemplates(userId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      toast.error(t('toastLoadFailed'));
    } finally {
      setLoading(false);
    }
  }

  function buildSubmitPayload() {
    const sample_values: TemplateSampleValues = {};
    if (form.body_samples.some((v) => v.trim())) {
      sample_values.body = form.body_samples.map((v) => v.trim());
    }
    if (form.header_format === 'text' && form.header_sample.trim()) {
      sample_values.header = [form.header_sample.trim()];
    }

    return {
      name: form.name.trim(),
      category: form.category,
      language: form.language.trim() || 'en_US',
      header_type: form.header_format === 'none' ? undefined : form.header_format,
      header_content:
        form.header_format === 'text' ? form.header_content.trim() : undefined,
      header_media_url:
        form.header_format !== 'none' && form.header_format !== 'text'
          ? form.header_media_url.trim() || undefined
          : undefined,
      body_text: form.body_text.trim(),
      footer_text: form.footer_text.trim() || undefined,
      buttons: form.buttons.length > 0 ? form.buttons : undefined,
      sample_values:
        Object.keys(sample_values).length > 0 ? sample_values : undefined,
    };
  }

  function openEdit(template: MessageTemplate) {
    setEditingId(template.id);
    setForm({
      name: template.name,
      category: template.category,
      language: template.language || 'en_US',
      header_format: (template.header_type ?? 'none') as HeaderFormat,
      header_content: template.header_content ?? '',
      header_media_url: template.header_media_url ?? '',
      header_sample: template.sample_values?.header?.[0] ?? '',
      body_text: template.body_text,
      body_samples: template.sample_values?.body ?? [],
      footer_text: template.footer_text ?? '',
      buttons: template.buttons ?? [],
    });
    setDialogOpen(true);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const payload = buildSubmitPayload();
      const url = editingId
        ? `/api/whatsapp/templates/${editingId}`
        : '/api/whatsapp/templates/submit';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Submit failed (HTTP ${res.status})`);
      }

      await fetchTemplates(user.id);
      toast.success(
        editingId
          ? t('toastSubmitEditSuccess')
          : t('toastSubmitNewSuccess'),
      );
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err instanceof Error ? err.message : t('toastSubmitFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSyncFromMeta() {
    if (!user) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/whatsapp/templates/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Sync failed (HTTP ${res.status})`);
      }
      toast.success(
        t('toastSyncCount', { total: data.syncedCount ?? data.total ?? 0 }),
      );
      await fetchTemplates(user.id);
    } catch (err) {
      console.error('Template sync error:', err);
      toast.error(err instanceof Error ? err.message : t('toastSyncError'));
    } finally {
      setSyncing(false);
    }
  }

  async function confirmDelete() {
    const target = templateToDelete;
    if (!target || deletingId) return;
    setDeletingId(target.id);
    try {
      const res = await fetch(`/api/whatsapp/templates/${target.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Delete failed (HTTP ${res.status})`);
      }
      toast.success(t('toastDeleteSuccess'));
      setTemplates((prev) => prev.filter((t) => t.id !== target.id));
      setTemplateToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err instanceof Error ? err.message : t('toastDeleteError'));
    } finally {
      setDeletingId(null);
    }
  }

  function addButton(type: TemplateButton['type']) {
    if (form.buttons.length >= TEMPLATE_LIMITS.maxButtonsTotal) {
      toast.error(t('toastMaxButtons', { max: TEMPLATE_LIMITS.maxButtonsTotal }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      buttons: [...prev.buttons, emptyButton(type)],
    }));
  }

  function removeButton(index: number) {
    setForm((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index),
    }));
  }

  type ButtonPatch = {
    text?: string;
    url?: string;
    phone_number?: string;
    example?: string;
  };
  function updateButton(index: number, patch: ButtonPatch) {
    setForm((prev) => {
      const current = prev.buttons[index];
      if (!current) return prev;
      const next = [...prev.buttons];
      switch (current.type) {
        case 'QUICK_REPLY':
          next[index] = {
            ...current,
            ...(patch.text !== undefined && { text: patch.text }),
          };
          break;
        case 'URL':
          next[index] = {
            ...current,
            ...(patch.text !== undefined && { text: patch.text }),
            ...(patch.url !== undefined && { url: patch.url }),
            ...(patch.example !== undefined && { example: patch.example }),
          };
          break;
        case 'PHONE_NUMBER':
          next[index] = {
            ...current,
            ...(patch.text !== undefined && { text: patch.text }),
            ...(patch.phone_number !== undefined && {
              phone_number: patch.phone_number,
            }),
          };
          break;
        case 'COPY_CODE':
          next[index] = {
            ...current,
            ...(patch.text !== undefined && { text: patch.text }),
            ...(patch.example !== undefined && { example: patch.example }),
          };
          break;
      }
      return { ...prev, buttons: next };
    });
  }

  function changeButtonType(index: number, type: TemplateButton['type']) {
    setForm((prev) => {
      const next = [...prev.buttons];
      next[index] = emptyButton(type);
      return { ...prev, buttons: next };
    });
  }

  async function handleHeaderImageFile(file: File) {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error(t('toastInvalidImage'));
      return;
    }
    if (file.size > MEDIA_MAX_BYTES_BY_KIND.image) {
      toast.error(
        t('toastImageTooLarge', { size: (file.size / 1024 / 1024).toFixed(1) }),
      );
      return;
    }
    setUploadingHeader(true);
    try {
      const { publicUrl } = await uploadAccountMedia('chat-media', file);
      setForm((f) => ({ ...f, header_media_url: publicUrl }));
      toast.success(t('toastUploadSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toastUploadFailed'));
    } finally {
      setUploadingHeader(false);
    }
  }

  return (
    <section className="animate-in fade-in-50 space-y-4 duration-200">
      <SettingsPanelHead
        title={t('title')}
        description={t('description')}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSyncFromMeta}
              disabled={syncing}
              title={t('syncTitle')}
            >
              <RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? t('syncing') : t('syncFromMeta')}
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              {t('newTemplate')}
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-sm">{t('noTemplates')}</p>
            <p className="text-muted-foreground text-xs mt-1">
              {t('createFirst')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {templates.map((template) => {
            const statusKey = template.status || 'DRAFT';
            const statusCfg = templateStatusConfig[statusKey];

            return (
              <Card key={template.id} className="relative overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-sm">
                          {template.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={
                            categoryColors[template.category] ??
                            categoryColors.Utility
                          }
                        >
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Language: {template.language || 'en_US'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={`${statusCfg.classes} text-xs font-medium`}
                      >
                        {statusCfg.label}
                      </Badge>
                    </div>
                  </div>

                  {template.body_text && (
                    <div className="bg-muted/50 rounded-lg p-3 text-xs text-foreground font-mono whitespace-pre-wrap line-clamp-4">
                      {template.body_text}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
                    <span className="text-[11px] text-muted-foreground">
                      Header: {template.header_type || 'none'}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(template)}
                        title="Edit template"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setTemplateToDelete(template)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Delete template"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6 border-border/60 bg-card">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-xl font-bold text-foreground">
              {editingId
                ? t('dialogEditTitle')
                : connectionType === 'evolution'
                  ? 'New Message Template (Local)'
                  : t('dialogNewTitle')}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingId
                ? t('dialogEditDesc')
                : connectionType === 'evolution'
                  ? 'Build a template and save it locally for your Evolution API connection. You can use it in broadcasts and inbox.'
                  : t('dialogNewDesc')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-3">
            {/* Template Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-foreground">
                {t('templateName')}
              </Label>
              <div className="relative mt-1.5">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder={t('namePlaceholder')}
                  disabled={!!editingId}
                  required
                  className="pl-9 bg-background/50 border-border/80 focus-visible:ring-emerald-500"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t('nameHint')}
              </p>
            </div>

            {/* Category & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-sm font-medium text-foreground">
                  {t('category')}
                </Label>
                <div className="relative mt-1.5">
                  <Select
                    value={form.category}
                    onValueChange={(val) =>
                      setForm((f) => ({
                        ...f,
                        category: val as MessageTemplate['category'],
                      }))
                    }
                  >
                    <SelectTrigger id="category" className="w-full bg-background/50 border-border/80 focus:ring-emerald-500 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4 text-emerald-500 shrink-0" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="language" className="text-sm font-medium text-foreground">
                  {t('language')}
                </Label>
                <div className="relative mt-1.5">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                  <Input
                    id="language"
                    value={form.language}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, language: e.target.value }))
                    }
                    placeholder="en_US"
                    required
                    className="pl-9 w-full bg-background/50 border-border/80 focus-visible:ring-emerald-500"
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Must match the exact code on Meta — en_US and en are distinct.
                </p>
              </div>
            </div>

            {/* Header */}
            <div>
              <Label htmlFor="header_format" className="text-sm font-medium text-foreground">
                {t('header')}
              </Label>
              <div className="relative mt-1.5">
                <Select
                  value={form.header_format}
                  onValueChange={(val) =>
                    setForm((f) => ({ ...f, header_format: val as HeaderFormat }))
                  }
                >
                  <SelectTrigger id="header_format" className="w-full bg-background/50 border-border/80 focus:ring-emerald-500 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-emerald-500 shrink-0" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {HEADER_FORMATS.map((fmt) => (
                      <SelectItem key={fmt} value={fmt}>
                        {fmt.charAt(0).toUpperCase() + fmt.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.header_format === 'text' && (
              <div>
                <Input
                  id="header_content"
                  value={form.header_content}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, header_content: e.target.value }))
                  }
                  placeholder={t('headerTextPlaceholder')}
                  className="mt-1.5 bg-background/50 border-border/80 focus-visible:ring-emerald-500"
                />
              </div>
            )}

            {['image', 'video', 'document'].includes(form.header_format) && (
              <div>
                <Label htmlFor="header_media_url" className="text-sm font-medium text-foreground">Header Media URL</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="header_media_url"
                    value={form.header_media_url}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, header_media_url: e.target.value }))
                    }
                    placeholder="https://..."
                    className="bg-background/50 border-border/80 focus-visible:ring-emerald-500"
                  />
                  {form.header_format === 'image' && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleHeaderImageFile(file);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingHeader}
                      >
                        {uploadingHeader ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Upload className="size-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Body Text */}
            <div>
              <Label htmlFor="body_text" className="text-sm font-medium text-foreground">
                {t('bodyText')}
              </Label>
              <div className="relative mt-1.5">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-emerald-500" />
                <Textarea
                  id="body_text"
                  rows={3}
                  value={form.body_text}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, body_text: e.target.value }))
                  }
                  placeholder={t('bodyPlaceholder')}
                  required
                  className="pl-9 bg-background/50 border-border/80 focus-visible:ring-emerald-500 font-sans text-sm resize-y"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Use {'{{1}}'}, {'{{2}}'} for variables (must be contiguous starting at {'{{1}}'}).
              </p>
            </div>

            {/* Footer Text */}
            <div>
              <Label htmlFor="footer_text" className="text-sm font-medium text-foreground">
                {t('footer')}
              </Label>
              <Input
                id="footer_text"
                value={form.footer_text}
                onChange={(e) =>
                  setForm((f) => ({ ...f, footer_text: e.target.value }))
                }
                placeholder={t('footerPlaceholder')}
                className="mt-1.5 bg-background/50 border-border/80 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Buttons Section */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">
                  {t('buttons')}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addButton('QUICK_REPLY')}
                  className="h-8 text-xs font-medium border-border/80 hover:bg-muted"
                >
                  <Plus className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                  {t('addButton')}
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Up to 10 buttons. QUICK_REPLY buttons must come before URL / phone / copy-code buttons.
              </p>

              {form.buttons.length > 0 && (
                <div className="mt-3 space-y-2">
                  {form.buttons.map((btn, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-lg border border-border/60 p-2.5 bg-background/30">
                      <Select
                        value={btn.type}
                        onValueChange={(v) => changeButtonType(idx, v as TemplateButton['type'])}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QUICK_REPLY">Quick Reply</SelectItem>
                          <SelectItem value="URL">URL</SelectItem>
                          <SelectItem value="PHONE_NUMBER">Phone</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={btn.text}
                        onChange={(e) => updateButton(idx, { text: e.target.value })}
                        placeholder="Button label"
                        className="h-8 text-xs bg-background"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeButton(idx)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <DialogFooter className="pt-4 border-t border-border/60 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="bg-muted/40 border-border/80 hover:bg-muted text-foreground font-medium"
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-5 flex items-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin mr-1" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {editingId
                  ? 'Update Template'
                  : connectionType === 'evolution'
                    ? 'Save Template'
                    : 'Submit for Approval'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!templateToDelete}
        onOpenChange={(open) => !open && setTemplateToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete template &quot;{templateToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTemplateToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!!deletingId}
            >
              {deletingId && <Loader2 className="size-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
