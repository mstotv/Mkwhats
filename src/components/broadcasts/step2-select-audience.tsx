'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Contact, CustomField, Tag } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Users,
  Tags,
  Filter,
  Upload,
  Loader2,
  ArrowRight,
  ArrowLeft,
  X,
  ListChecks,
  Search,
  CheckSquare,
  Square,
  CalendarDays,
  Calendar,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

type AudienceType = 'all' | 'tags' | 'custom_field' | 'csv' | 'manual' | 'date_range';
type CustomFieldOperator = 'is' | 'is_not' | 'contains';

interface CustomFieldFilter {
  fieldId: string;
  operator: CustomFieldOperator;
  value: string;
}

interface AudienceConfig {
  type: AudienceType;
  tagIds?: string[];
  customField?: CustomFieldFilter;
  csvContacts?: { phone: string; name?: string }[];
  excludeTagIds?: string[];
  /** IDs of manually selected contacts (for type === 'manual') */
  manualContactIds?: string[];
  /** Date range filter for contacts who sent incoming messages */
  dateRange?: {
    from: string;
    to: string;
  };
}

interface Step2Props {
  audience: AudienceConfig;
  onUpdate: (audience: AudienceConfig) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2SelectAudience({
  audience,
  onUpdate,
  onNext,
  onBack,
}: Step2Props) {
  const t = useTranslations('Broadcasts.wizard');

  const OPERATOR_OPTIONS = useMemo<{ value: CustomFieldOperator; label: string }[]>(() => [
    { value: 'is', label: t('selectAudience.operatorIs') },
    { value: 'is_not', label: t('selectAudience.operatorIsNot') },
    { value: 'contains', label: t('selectAudience.operatorContains') },
  ], [t]);

  const audienceOptions = useMemo<{
    type: AudienceType;
    label: string;
    description: string;
    icon: typeof Users;
  }[]>(() => [
    {
      type: 'all',
      label: t('selectAudience.method.all'),
      description: t('selectAudience.allDescLoading'),
      icon: Users,
    },
    {
      type: 'tags',
      label: t('selectAudience.method.tags'),
      description: t('selectAudience.tagDesc'),
      icon: Tags,
    },
    {
      type: 'date_range',
      label: t('selectAudience.method.dateRange'),
      description: t('selectAudience.dateRangeDesc'),
      icon: CalendarDays,
    },
    {
      type: 'custom_field',
      label: t('selectAudience.method.customField'),
      description: t('selectAudience.customFieldDesc'),
      icon: Filter,
    },
    {
      type: 'csv',
      label: t('selectAudience.method.csv'),
      description: t('selectAudience.csvDesc'),
      icon: Upload,
    },
    {
      type: 'manual',
      label: t('selectAudience.method.manual'),
      description: t('selectAudience.manualDesc'),
      icon: ListChecks,
    },
  ], [t]);

  const [tags, setTags] = useState<Tag[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  // Manual selection state
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  useEffect(() => {
    async function fetchTags() {
      setLoadingTags(true);
      try {
        const supabase = createClient();
        const { data } = await supabase.from('tags').select('*').order('name');
        setTags(data ?? []);
      } finally {
        setLoadingTags(false);
      }
    }
    fetchTags();
  }, []);

  useEffect(() => {
    if (audience.type !== 'custom_field') return;
    async function fetchFields() {
      setLoadingFields(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('custom_fields')
          .select('*')
          .order('field_name');
        setCustomFields(data ?? []);
      } finally {
        setLoadingFields(false);
      }
    }
    fetchFields();
  }, [audience.type]);

  // Load all contacts when "manual" type selected
  useEffect(() => {
    if (audience.type !== 'manual') return;
    async function fetchContacts() {
      setLoadingContacts(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('contacts')
          .select('id, name, phone, email')
          .order('name', { ascending: true });
        setAllContacts((data as Contact[]) ?? []);
      } finally {
        setLoadingContacts(false);
      }
    }
    fetchContacts();
  }, [audience.type]);

  const fetchEstimatedCount = useCallback(async () => {
    setLoadingCount(true);
    try {
      const supabase = createClient();

      if (audience.type === 'manual') {
        setEstimatedCount((audience.manualContactIds ?? []).length);
        return;
      }

      let baseIds: Set<string> | null = null;

      if (audience.type === 'all') {
        // Handled below
      } else if (
        audience.type === 'tags' &&
        audience.tagIds &&
        audience.tagIds.length > 0
      ) {
        const { data } = await supabase
          .from('contact_tags')
          .select('contact_id')
          .in('tag_id', audience.tagIds);
        baseIds = new Set((data ?? []).map((r) => r.contact_id));
      } else if (
        audience.type === 'custom_field' &&
        audience.customField?.fieldId &&
        audience.customField.value
      ) {
        const { fieldId, operator, value } = audience.customField;
        let q = supabase
          .from('contact_custom_values')
          .select('contact_id')
          .eq('custom_field_id', fieldId);
        if (operator === 'is') q = q.eq('value', value);
        else if (operator === 'is_not') q = q.neq('value', value);
        else q = q.ilike('value', `%${value}%`);
        const { data } = await q;
        baseIds = new Set((data ?? []).map((r) => r.contact_id));
      } else if (
        audience.type === 'csv' &&
        audience.csvContacts &&
        audience.csvContacts.length > 0
      ) {
        setEstimatedCount(audience.csvContacts.length);
        return;
      } else if (
        audience.type === 'date_range' &&
        audience.dateRange?.from &&
        audience.dateRange?.to
      ) {
        const fromDate = audience.dateRange.from.trim();
        const toDate = audience.dateRange.to.trim();
        if (fromDate && toDate && fromDate <= toDate) {
          const startIso = new Date(`${fromDate}T00:00:00.000`).toISOString();
          const endIso = new Date(`${toDate}T23:59:59.999`).toISOString();

          const { data: messages } = await supabase
            .from('messages')
            .select('conversation_id')
            .eq('sender_type', 'customer')
            .gte('created_at', startIso)
            .lte('created_at', endIso);

          if (messages && messages.length > 0) {
            const conversationIds = [
              ...new Set(messages.map((m) => m.conversation_id).filter(Boolean)),
            ];

            const { data: convos } = await supabase
              .from('conversations')
              .select('contact_id')
              .in('id', conversationIds);

            baseIds = new Set((convos ?? []).map((c) => c.contact_id).filter(Boolean));
          } else {
            baseIds = new Set();
          }
        } else {
          setEstimatedCount(0);
          return;
        }
      } else {
        setEstimatedCount(null);
        return;
      }

      let excludeSet: Set<string> | null = null;
      if (audience.excludeTagIds && audience.excludeTagIds.length > 0) {
        const { data: excludeRows } = await supabase
          .from('contact_tags')
          .select('contact_id')
          .in('tag_id', audience.excludeTagIds);
        excludeSet = new Set((excludeRows ?? []).map((r) => r.contact_id));
      }

      if (baseIds) {
        const effective = [...baseIds].filter(
          (id) => !excludeSet?.has(id),
        );
        setEstimatedCount(effective.length);
      } else {
        const { count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true });
        const total = count ?? 0;
        setEstimatedCount(excludeSet ? Math.max(0, total - excludeSet.size) : total);
      }
    } finally {
      setLoadingCount(false);
    }
  }, [
    audience.type,
    audience.tagIds,
    audience.customField,
    audience.csvContacts,
    audience.excludeTagIds,
    audience.manualContactIds,
    audience.dateRange,
  ]);

  useEffect(() => {
    fetchEstimatedCount();
  }, [fetchEstimatedCount]);

  function toggleTag(tagId: string) {
    const current = audience.tagIds ?? [];
    const updated = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];
    onUpdate({ ...audience, tagIds: updated });
  }

  function toggleExcludeTag(tagId: string) {
    const current = audience.excludeTagIds ?? [];
    const updated = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];
    onUpdate({ ...audience, excludeTagIds: updated });
  }

  function updateCustomField(patch: Partial<CustomFieldFilter>) {
    const prev = audience.customField ?? {
      fieldId: '',
      operator: 'is' as CustomFieldOperator,
      value: '',
    };
    onUpdate({ ...audience, customField: { ...prev, ...patch } });
  }

  function toggleManualContact(contactId: string) {
    const current = audience.manualContactIds ?? [];
    const updated = current.includes(contactId)
      ? current.filter((id) => id !== contactId)
      : [...current, contactId];
    onUpdate({ ...audience, manualContactIds: updated });
  }

  function selectAllFiltered() {
    const filteredIds = filteredContacts.map((c) => c.id);
    const existing = audience.manualContactIds ?? [];
    // Union: add all filtered that aren't already selected
    const merged = [...new Set([...existing, ...filteredIds])];
    onUpdate({ ...audience, manualContactIds: merged });
  }

  function deselectAllFiltered() {
    const filteredIds = new Set(filteredContacts.map((c) => c.id));
    const updated = (audience.manualContactIds ?? []).filter((id) => !filteredIds.has(id));
    onUpdate({ ...audience, manualContactIds: updated });
  }

  function setDatePreset(daysAgo: number) {
    const to = new Date().toISOString().split('T')[0];
    const fromDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const from = fromDate.toISOString().split('T')[0];
    onUpdate({
      ...audience,
      dateRange: { from, to },
    });
  }

  function setThisMonthPreset() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const from = firstDay.toISOString().split('T')[0];
    const to = now.toISOString().split('T')[0];
    onUpdate({
      ...audience,
      dateRange: { from, to },
    });
  }

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return allContacts;
    return allContacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q),
    );
  }, [allContacts, contactSearch]);

  const selectedIds = useMemo(
    () => new Set(audience.manualContactIds ?? []),
    [audience.manualContactIds],
  );

  const allFilteredSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((c) => selectedIds.has(c.id));

  const isDateRangeValid =
    audience.type === 'date_range' &&
    !!audience.dateRange?.from &&
    !!audience.dateRange?.to &&
    audience.dateRange.from <= audience.dateRange.to;

  const isValid =
    audience.type === 'all' ||
    (audience.type === 'tags' && audience.tagIds && audience.tagIds.length > 0) ||
    (audience.type === 'custom_field' &&
      !!audience.customField?.fieldId &&
      audience.customField.value.length > 0) ||
    (audience.type === 'csv' &&
      audience.csvContacts &&
      audience.csvContacts.length > 0) ||
    (audience.type === 'manual' &&
      audience.manualContactIds &&
      audience.manualContactIds.length > 0) ||
    isDateRangeValid;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t('selectAudience.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('selectAudience.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {audienceOptions.map((option) => {
          const isSelected = audience.type === option.type;
          const Icon = option.icon;
          return (
            <button
              key={option.type}
              onClick={() => {
                const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const defaultTo = new Date().toISOString().split('T')[0];
                onUpdate({
                  ...audience,
                  type: option.type,
                  tagIds: option.type === 'tags' ? audience.tagIds : undefined,
                  customField:
                    option.type === 'custom_field'
                      ? audience.customField
                      : undefined,
                  csvContacts:
                    option.type === 'csv' ? audience.csvContacts : undefined,
                  manualContactIds:
                    option.type === 'manual' ? audience.manualContactIds : undefined,
                  dateRange:
                    option.type === 'date_range'
                      ? audience.dateRange ?? { from: defaultFrom, to: defaultTo }
                      : undefined,
                });
              }}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border bg-card/50 hover:border-border'
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isSelected
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{option.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {audience.type === 'tags' && (
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <p className="mb-3 text-sm font-medium text-foreground">{t('selectAudience.selectTags')}</p>
          {loadingTags ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : tags.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t('selectAudience.noTagsFound')}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = audience.tagIds?.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border bg-muted text-muted-foreground hover:border-border'
                    }`}
                  >
                    <span
                      className="mr-1.5 h-2 w-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Date range picker ────────────────────────────────────── */}
      {audience.type === 'date_range' && (
        <div className="space-y-4 rounded-xl border border-border bg-card/50 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t('selectAudience.dateRangeTitle')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('selectAudience.dateRangeSubtitle')}
                </p>
              </div>
            </div>
            {/* Quick presets pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDatePreset(0)}
                className="rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted hover:border-primary/40 transition-colors"
              >
                {t('selectAudience.presetToday')}
              </button>
              <button
                type="button"
                onClick={() => setDatePreset(7)}
                className="rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted hover:border-primary/40 transition-colors"
              >
                {t('selectAudience.presetLast7Days')}
              </button>
              <button
                type="button"
                onClick={() => setDatePreset(30)}
                className="rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted hover:border-primary/40 transition-colors"
              >
                {t('selectAudience.presetLast30Days')}
              </button>
              <button
                type="button"
                onClick={setThisMonthPreset}
                className="rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted hover:border-primary/40 transition-colors"
              >
                {t('selectAudience.presetThisMonth')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <span>{t('selectAudience.dateFrom')}</span>
              </label>
              <input
                type="date"
                value={audience.dateRange?.from ?? ''}
                onChange={(e) =>
                  onUpdate({
                    ...audience,
                    dateRange: {
                      from: e.target.value,
                      to: audience.dateRange?.to ?? new Date().toISOString().split('T')[0],
                    },
                  })
                }
                className="h-10 w-full rounded-lg border border-border bg-muted px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <span>{t('selectAudience.dateTo')}</span>
              </label>
              <input
                type="date"
                value={audience.dateRange?.to ?? ''}
                onChange={(e) =>
                  onUpdate({
                    ...audience,
                    dateRange: {
                      from: audience.dateRange?.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      to: e.target.value,
                    },
                  })
                }
                className="h-10 w-full rounded-lg border border-border bg-muted px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Validation warning if from > to */}
          {audience.dateRange?.from &&
            audience.dateRange?.to &&
            audience.dateRange.from > audience.dateRange.to && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400">
                {t('selectAudience.dateRangeErrorOrder')}
              </p>
            )}

          {/* Real-time status feedback */}
          {audience.dateRange?.from &&
            audience.dateRange?.to &&
            audience.dateRange.from <= audience.dateRange.to && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-foreground">
                {loadingCount ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span className="text-muted-foreground">{t('selectAudience.dateRangeCalculating')}</span>
                  </>
                ) : estimatedCount && estimatedCount > 0 ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-primary">{t('selectAudience.dateRangeFoundCount', { count: estimatedCount })}</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">{t('selectAudience.dateRangeNoneFound')}</span>
                  </>
                )}
              </div>
            )}
        </div>
      )}

      {audience.type === 'custom_field' && (
        <div className="space-y-3 rounded-xl border border-border bg-card/50 p-4">
          <p className="text-sm font-medium text-foreground">{t('selectAudience.method.customField')}</p>
          {loadingFields ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : customFields.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t('selectAudience.errorLoadFields')}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)]">
              <select
                value={audience.customField?.fieldId ?? ''}
                onChange={(e) => updateCustomField({ fieldId: e.target.value })}
                className="h-9 rounded-lg border border-border bg-muted px-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">{t('selectAudience.selectField')}</option>
                {customFields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.field_name}
                  </option>
                ))}
              </select>
              <select
                value={audience.customField?.operator ?? 'is'}
                onChange={(e) =>
                  updateCustomField({
                    operator: e.target.value as CustomFieldOperator,
                  })
                }
                className="h-9 rounded-lg border border-border bg-muted px-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {OPERATOR_OPTIONS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={audience.customField?.value ?? ''}
                onChange={(e) => updateCustomField({ value: e.target.value })}
                placeholder={t('selectAudience.valuePlaceholder')}
                className="h-9 rounded-lg border border-border bg-muted px-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Manual contact picker ───────────────────────────────── */}
      {audience.type === 'manual' && (
        <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">
                اختيار جهات الاتصال
              </p>
              {selectedIds.size > 0 && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {selectedIds.size} محدد
                </span>
              )}
            </div>
            {filteredContacts.length > 0 && (
              <button
                onClick={allFilteredSelected ? deselectAllFiltered : selectAllFiltered}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                {allFilteredSelected ? (
                  <>
                    <CheckSquare className="h-3.5 w-3.5" />
                    إلغاء تحديد الكل
                  </>
                ) : (
                  <>
                    <Square className="h-3.5 w-3.5" />
                    تحديد الكل
                  </>
                )}
              </button>
            )}
          </div>

          {/* Search */}
          <div className="border-b border-border px-3 py-2">
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الرقم أو الإيميل..."
                className="w-full rounded-lg border border-border bg-muted py-1.5 pr-8 pl-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Contact list */}
          <div className="max-h-72 overflow-y-auto">
            {loadingContacts ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex h-24 items-center justify-center">
                <p className="text-xs text-muted-foreground">
                  {contactSearch ? 'لا توجد نتائج للبحث' : 'لا توجد جهات اتصال'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filteredContacts.map((contact) => {
                  const isChecked = selectedIds.has(contact.id);
                  return (
                    <li key={contact.id}>
                      <button
                        onClick={() => toggleManualContact(contact.id)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                          isChecked
                            ? 'bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        {/* Checkbox visual */}
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                            isChecked
                              ? 'border-primary bg-primary'
                              : 'border-border bg-transparent'
                          }`}
                        >
                          {isChecked && (
                            <svg
                              className="h-3 w-3 text-primary-foreground"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2 6l3 3 5-5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {(contact.name || contact.phone || '?').charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {contact.name || <span className="text-muted-foreground">بدون اسم</span>}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {contact.phone}
                          </p>
                        </div>

                        {/* Status badge */}
                        {isChecked && (
                          <span className="shrink-0 text-[10px] font-medium text-primary">✓ محدد</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer summary */}
          {selectedIds.size > 0 && (
            <div className="border-t border-border bg-primary/5 px-4 py-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                تم تحديد{' '}
                <span className="font-semibold text-foreground">{selectedIds.size}</span>
                {' '}من{' '}
                <span className="font-semibold text-foreground">{allContacts.length}</span>
                {' '}جهة اتصال
              </span>
              <button
                onClick={() => onUpdate({ ...audience, manualContactIds: [] })}
                className="text-xs text-red-400 hover:underline"
              >
                إلغاء الكل
              </button>
            </div>
          )}
        </div>
      )}

      {/* Exclude tags — not shown for manual selection (user controls exactly who to include) */}
      {audience.type !== 'manual' && (
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <X className="h-4 w-4 text-red-400" />
            <p className="text-sm font-medium text-foreground">
              {t('selectAudience.excludeTags')}
            </p>
          </div>
          {tags.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('selectAudience.noTagsFound')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isExcluded = audience.excludeTagIds?.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleExcludeTag(tag.id)}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      isExcluded
                        ? 'border-red-500/30 bg-red-500/10 text-red-300'
                        : 'border-border bg-muted text-muted-foreground hover:border-border'
                    }`}
                  >
                    <span
                      className="mr-1.5 h-2 w-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Audience Summary */}
      <div className="rounded-xl border border-border bg-card/50 p-4">
        <p className="mb-2 text-sm font-medium text-foreground">Audience Summary</p>
        {loadingCount ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Calculating…</span>
          </div>
        ) : estimatedCount !== null ? (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground">
              {estimatedCount.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">estimated recipients</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Select an audience type to see the estimate.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-border text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {t('next')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
