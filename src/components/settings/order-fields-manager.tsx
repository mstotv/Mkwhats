'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  GripVertical,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────

type FieldType = 'text' | 'number' | 'choice';

interface OrderField {
  id: string;
  field_key: string;
  field_label: string;
  field_type: FieldType;
  choices: string[] | null;
  is_required: boolean;
  sort_order: number;
}

interface NewFieldDraft {
  field_label: string;
  field_key: string;
  field_type: FieldType;
  choices_raw: string; // comma-separated raw input
  is_required: boolean;
}

const EMPTY_DRAFT: NewFieldDraft = {
  field_label: '',
  field_key: '',
  field_type: 'text',
  choices_raw: '',
  is_required: true,
};

// Auto-generate a snake_case field_key from the Arabic/English label.
function autoKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

// ── Props ───────────────────────────────────────────────────

interface OrderFieldsManagerProps {
  /** Whether the user has admin rights to edit. */
  canEdit: boolean;
  /** Whether order_collection_enabled is on (shows hint when off). */
  orderCollectionEnabled: boolean;
  onToggleOrderCollection: (enabled: boolean) => void;
  savingToggle: boolean;
}

// ── Component ───────────────────────────────────────────────

export function OrderFieldsManager({
  canEdit,
  orderCollectionEnabled,
  onToggleOrderCollection,
  savingToggle,
}: OrderFieldsManagerProps) {
  const t = useTranslations('Settings.orderFields');
  const [fields, setFields] = useState<OrderField[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNew, setAddingNew] = useState(false);
  const [draft, setDraft] = useState<NewFieldDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  // Per-field editing state: fieldId → partial draft
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<NewFieldDraft> & { id?: string }>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  // ── Data fetching ─────────────────────────────────────────

  const fetchFields = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/order-fields');
      if (!res.ok) { toast.error('تعذّر تحميل حقول الطلب'); return; }
      const data = await res.json();
      setFields(data.fields ?? []);
    } catch {
      toast.error('تعذّر تحميل حقول الطلب');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchFields(); }, [fetchFields]);

  // ── Add field ─────────────────────────────────────────────

  const handleAdd = async () => {
    const label = draft.field_label.trim();
    if (!label) { toast.error('أدخل اسم الحقل'); return; }
    const key = draft.field_key.trim() || autoKey(label);
    if (!key) { toast.error('تعذّر توليد المفتاح — أدخله يدوياً'); return; }

    if (draft.field_type === 'choice') {
      const opts = draft.choices_raw.split(',').map((s) => s.trim()).filter(Boolean);
      if (opts.length < 2) { toast.error('أضف خيارين على الأقل مفصولين بفاصلة'); return; }
    }

    setSaving(true);
    try {
      const choices =
        draft.field_type === 'choice'
          ? draft.choices_raw.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined;

      const res = await fetch('/api/ai/order-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_key: key,
          field_label: label,
          field_type: draft.field_type,
          choices,
          is_required: draft.is_required,
          sort_order: fields.length, // append at end
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'تعذّر إضافة الحقل'); return; }
      toast.success('تمت إضافة الحقل');
      setFields((prev) => [...prev, data.field]);
      setDraft(EMPTY_DRAFT);
      setAddingNew(false);
    } catch {
      toast.error('تعذّر إضافة الحقل');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit field ────────────────────────────────────────────

  const startEdit = (field: OrderField) => {
    setEditingId(field.id);
    setEditDraft({
      id: field.id,
      field_label: field.field_label,
      field_type: field.field_type,
      choices_raw: field.choices?.join(', ') ?? '',
      is_required: field.is_required,
    });
  };

  const handleSaveEdit = async (field: OrderField) => {
    const label = (editDraft.field_label ?? field.field_label).trim();
    if (!label) { toast.error('اسم الحقل مطلوب'); return; }

    const type = editDraft.field_type ?? field.field_type;
    let choices: string[] | undefined;
    if (type === 'choice') {
      choices = (editDraft.choices_raw ?? '').split(',').map((s) => s.trim()).filter(Boolean);
      if (choices.length < 2) { toast.error('أضف خيارين على الأقل'); return; }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/ai/order-fields/${field.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_label: label,
          field_type: type,
          choices,
          is_required: editDraft.is_required ?? field.is_required,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'تعذّر حفظ التعديل'); return; }
      toast.success('تم حفظ التعديل');
      setFields((prev) => prev.map((f) => (f.id === field.id ? data.field : f)));
      setEditingId(null);
    } catch {
      toast.error('تعذّر حفظ التعديل');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete field ──────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/ai/order-fields/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? 'تعذّر الحذف'); return; }
      toast.success('تم حذف الحقل');
      setFields((prev) => prev.filter((f) => f.id !== id));
    } catch {
      toast.error('تعذّر الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Reorder ───────────────────────────────────────────────

  const moveField = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= fields.length) return;

    const reordered = [...fields];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    // Optimistically update UI.
    setFields(reordered);
    setMovingId(reordered[target].id);

    try {
      // Persist the new sort_orders for both swapped fields.
      await Promise.all([
        fetch(`/api/ai/order-fields/${reordered[index].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: index }),
        }),
        fetch(`/api/ai/order-fields/${reordered[target].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: target }),
        }),
      ]);
    } catch {
      // Revert on error.
      toast.error('تعذّر حفظ الترتيب');
      void fetchFields();
    } finally {
      setMovingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────

  const disabled = !canEdit || saving;

  const getTypeLabel = (type: FieldType) => {
    switch (type) {
      case 'text': return t('typeText');
      case 'number': return t('typeNumber');
      case 'choice': return t('typeChoice');
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="h-4 w-4 text-primary" />
          {t('title')}
        </CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Toggle */}
        <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
          <div>
            <p className="text-sm font-medium text-foreground">{t('enableTitle')}</p>
            <p className="text-xs text-muted-foreground">
              {t('enableDesc')}
            </p>
          </div>
          {savingToggle ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              id="order-collection-toggle"
              checked={orderCollectionEnabled}
              onCheckedChange={onToggleOrderCollection}
              disabled={!canEdit}
            />
          )}
        </div>

        {/* Fields table — always visible so the admin can configure before enabling */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {t('fieldsTitle')}
              {fields.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">({fields.length})</span>
              )}
            </p>
            {canEdit && !addingNew && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddingNew(true)}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('addField')}
              </Button>
            )}
          </div>

          {/* Existing fields */}
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : fields.length === 0 && !addingNew ? (
            <div className="rounded-md border border-dashed border-border py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('empty')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-md border border-border">
              {fields.map((field, index) => (
                <div key={field.id} className="px-3 py-2.5">
                  {editingId === field.id ? (
                    /* ── Edit row ── */
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">{t('fieldLabel')}</Label>
                          <Input
                            value={editDraft.field_label ?? field.field_label}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, field_label: e.target.value }))
                            }
                            placeholder={t('labelPlaceholder')}
                            className="h-8 text-sm"
                            disabled={saving}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('type')}</Label>
                          <Select
                            value={editDraft.field_type ?? field.field_type}
                            onValueChange={(v) =>
                              setEditDraft((d) => ({
                                ...d,
                                field_type: v as FieldType,
                                choices_raw: v !== 'choice' ? '' : d.choices_raw,
                              }))
                            }
                            disabled={saving}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(['text', 'number', 'choice'] as FieldType[]).map((k) => (
                                <SelectItem key={k} value={k}>{getTypeLabel(k)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {(editDraft.field_type ?? field.field_type) === 'choice' && (
                        <div className="space-y-1">
                          <Label className="text-xs">{t('choicesLabel')}</Label>
                          <Input
                            value={editDraft.choices_raw ?? (field.choices?.join(', ') ?? '')}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, choices_raw: e.target.value }))
                            }
                            placeholder={t('choicesPlaceholder')}
                            className="h-8 text-sm"
                            disabled={saving}
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`req-edit-${field.id}`}
                            checked={editDraft.is_required ?? field.is_required}
                            onCheckedChange={(v) =>
                              setEditDraft((d) => ({ ...d, is_required: v }))
                            }
                            disabled={saving}
                          />
                          <Label htmlFor={`req-edit-${field.id}`} className="text-xs">
                            {t('required')}
                          </Label>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            disabled={saving}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(field)}
                            disabled={saving}
                          >
                            {saving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            {t('save')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── View row ── */
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />

                      {/* Reorder buttons */}
                      <div className="flex flex-col">
                        <button
                          onClick={() => moveField(index, 'up')}
                          disabled={index === 0 || !!movingId || !canEdit}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                          aria-label={t('moveUp')}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveField(index, 'down')}
                          disabled={index === fields.length - 1 || !!movingId || !canEdit}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                          aria-label={t('moveDown')}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Field info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {field.field_label}
                          </span>
                          <code className="rounded bg-muted px-1 text-xs text-muted-foreground">
                            {field.field_key}
                          </code>
                          <Badge variant="secondary" className="text-xs">
                            {getTypeLabel(field.field_type)}
                          </Badge>
                          {field.is_required && (
                            <Badge variant="outline" className="text-xs text-destructive border-destructive/40">
                              {t('required')}
                            </Badge>
                          )}
                        </div>
                        {field.field_type === 'choice' && field.choices && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {field.choices.join(' · ')}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {canEdit && (
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => startEdit(field)}
                            disabled={!!editingId || !!deletingId}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(field.id)}
                            disabled={deletingId === field.id}
                          >
                            {deletingId === field.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add new field form */}
          {addingNew && (
            <div className="rounded-md border border-primary/30 bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-medium">{t('newField')}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t('fieldLabel')}</Label>
                  <Input
                    value={draft.field_label}
                    onChange={(e) => {
                      const label = e.target.value;
                      setDraft((d) => ({
                        ...d,
                        field_label: label,
                        field_key: d.field_key || autoKey(label),
                      }));
                    }}
                    placeholder={t('labelPlaceholder')}
                    className="h-8 text-sm"
                    disabled={saving}
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('fieldKey')}</Label>
                  <Input
                    value={draft.field_key}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                      }))
                    }
                    placeholder={t('keyPlaceholder')}
                    className="h-8 font-mono text-sm"
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t('type')}</Label>
                  <Select
                    value={draft.field_type}
                    onValueChange={(v) =>
                      setDraft((d) => ({ ...d, field_type: v as FieldType, choices_raw: '' }))
                    }
                    disabled={saving}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['text', 'number', 'choice'] as FieldType[]).map((k) => (
                        <SelectItem key={k} value={k}>{getTypeLabel(k)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {draft.field_type === 'choice' && (
                  <div className="space-y-1">
                    <Label className="text-xs">{t('choicesLabel')}</Label>
                    <Input
                      value={draft.choices_raw}
                      onChange={(e) => setDraft((d) => ({ ...d, choices_raw: e.target.value }))}
                      placeholder={t('choicesPlaceholder')}
                      className="h-8 text-sm"
                      disabled={saving}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="new-field-required"
                    checked={draft.is_required}
                    onCheckedChange={(v) => setDraft((d) => ({ ...d, is_required: v }))}
                    disabled={saving}
                  />
                  <Label htmlFor="new-field-required" className="text-xs">{t('required')}</Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setAddingNew(false); setDraft(EMPTY_DRAFT); }}
                    disabled={saving}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    {t('cancel')}
                  </Button>
                  <Button size="sm" onClick={handleAdd} disabled={disabled}>
                    {saving ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="mr-1 h-3.5 w-3.5" />
                    )}
                    {t('save')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {!orderCollectionEnabled && fields.length > 0 && (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {t('inactiveHint')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
