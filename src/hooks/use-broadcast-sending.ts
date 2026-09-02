'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Contact, MessageTemplate } from '@/types';

export type CustomFieldOperator = 'is' | 'is_not' | 'contains';

export interface CustomFieldFilter {
  fieldId: string;
  operator: CustomFieldOperator;
  value: string;
}

export interface AudienceConfig {
  type: 'all' | 'tags' | 'custom_field' | 'csv' | 'manual' | 'date_range';
  tagIds?: string[];
  customField?: CustomFieldFilter;
  csvContacts?: { phone: string; name?: string }[];
  /** Contacts carrying any of these tags are subtracted from the result. */
  excludeTagIds?: string[];
  /** Manually selected contact IDs (for type === 'manual') */
  manualContactIds?: string[];
  /** Date range filter for contacts who sent incoming messages */
  dateRange?: {
    from: string;
    to: string;
  };
}

/**
 * Variable mapping for Meta template placeholders.
 */
export type VariableMapping =
  | { type: 'static'; value: string }
  | { type: 'field'; value: string }
  | { type: 'custom_field'; value: string };

interface BroadcastPayload {
  name: string;
  template?: MessageTemplate | null;
  /** Plain text message for Evolution API broadcasts */
  freeText?: string;
  audience: AudienceConfig;
  variables?: Record<string, VariableMapping>;
  /** Media URL for Meta IMAGE/VIDEO/DOCUMENT headers. */
  headerMediaUrl?: string;
}

interface UseBroadcastSendingReturn {
  createAndSendBroadcast: (payload: BroadcastPayload) => Promise<string>;
  isProcessing: boolean;
  progress: number;
  connectionType: 'meta' | 'evolution';
  estimatedSecondsRemaining: number;
}

/** Meta rate-limit parameters */
const META_BATCH_SIZE = 10;
const META_BATCH_DELAY_MS = 1000;

/** Evolution rate-limit parameters (safer delays to prevent WhatsApp blocks) */
const EVOLUTION_BATCH_SIZE = 5;
const EVOLUTION_MSG_DELAY_MS = 1500;
const EVOLUTION_BATCH_DELAY_MS = 3000;

/** `broadcast_recipients` inserts rate */
const INSERT_BATCH_SIZE = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface BroadcastApiResult {
  phone: string;
  status: 'sent' | 'failed';
  whatsapp_message_id?: string;
  error?: string;
}

type CustomValueIndex = Map<string, Map<string, string>>;

export function resolveVariables(
  variables: Record<string, VariableMapping>,
  contact: Contact,
  customValues?: Map<string, string>,
): string[] {
  const keys = Object.keys(variables).sort((a, b) => {
    const an = Number(a);
    const bn = Number(b);
    if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
    return a.localeCompare(b);
  });

  return keys.map((key) => {
    const v = variables[key];
    if (v.type === 'static') return v.value;

    if (v.type === 'field') {
      const fieldMap: Record<string, string | undefined> = {
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        company: contact.company,
      };
      return fieldMap[v.value] ?? '';
    }

    return customValues?.get(v.value) ?? '';
  });
}

async function fetchCustomValueIndex(
  supabase: ReturnType<typeof createClient>,
  contactIds: string[],
): Promise<CustomValueIndex> {
  const index: CustomValueIndex = new Map();
  if (contactIds.length === 0) return index;

  const PAGE = 500;
  for (let i = 0; i < contactIds.length; i += PAGE) {
    const slice = contactIds.slice(i, i + PAGE);
    const { data } = await supabase
      .from('contact_custom_values')
      .select('contact_id, custom_field_id, value')
      .in('contact_id', slice);

    for (const row of data ?? []) {
      const bucket = index.get(row.contact_id) ?? new Map<string, string>();
      bucket.set(row.custom_field_id, row.value ?? '');
      index.set(row.contact_id, bucket);
    }
  }
  return index;
}

export function useBroadcastSending(): UseBroadcastSendingReturn {
  const { accountId } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [connectionType, setConnectionType] = useState<'meta' | 'evolution'>('meta');
  const [estimatedSecondsRemaining, setEstimatedSecondsRemaining] = useState(0);

  async function resolveAudience(audience: AudienceConfig): Promise<Contact[]> {
    const supabase = createClient();
    let contacts: Contact[] = [];

    if (audience.type === 'all') {
      const { data, error } = await supabase.from('contacts').select('*');
      if (error) throw new Error(`Failed to fetch contacts: ${error.message}`);
      contacts = data ?? [];
    } else if (
      audience.type === 'tags' &&
      audience.tagIds &&
      audience.tagIds.length > 0
    ) {
      const { data: contactTags, error: tagError } = await supabase
        .from('contact_tags')
        .select('contact_id')
        .in('tag_id', audience.tagIds);

      if (tagError)
        throw new Error(`Failed to fetch contact tags: ${tagError.message}`);

      if (contactTags && contactTags.length > 0) {
        const uniqueContactIds = [
          ...new Set(contactTags.map((ct) => ct.contact_id)),
        ];
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .in('id', uniqueContactIds);
        if (error) throw new Error(`Failed to fetch contacts: ${error.message}`);
        contacts = data ?? [];
      }
    } else if (audience.type === 'custom_field' && audience.customField) {
      contacts = await resolveCustomFieldAudience(supabase, audience.customField);
    } else if (audience.type === 'csv' && audience.csvContacts) {
      contacts = await upsertCsvContacts(supabase, audience.csvContacts);
    } else if (
      audience.type === 'manual' &&
      audience.manualContactIds &&
      audience.manualContactIds.length > 0
    ) {
      // Manual selection: fetch exactly the chosen contacts
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .in('id', audience.manualContactIds);
      if (error) throw new Error(`Failed to fetch manual contacts: ${error.message}`);
      contacts = data ?? [];
    } else if (
      audience.type === 'date_range' &&
      audience.dateRange?.from &&
      audience.dateRange?.to
    ) {
      const fromDate = audience.dateRange.from.trim();
      const toDate = audience.dateRange.to.trim();
      const startIso = new Date(`${fromDate}T00:00:00.000`).toISOString();
      const endIso = new Date(`${toDate}T23:59:59.999`).toISOString();

      // Find all customer inbound messages within date range
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('conversation_id')
        .eq('sender_type', 'customer')
        .gte('created_at', startIso)
        .lte('created_at', endIso);

      if (msgError) {
        throw new Error(`Failed to fetch messages for date range: ${msgError.message}`);
      }

      if (messages && messages.length > 0) {
        const conversationIds = [
          ...new Set(messages.map((m) => m.conversation_id).filter(Boolean)),
        ];

        const CHUNK = 500;
        const allContactIds: string[] = [];

        for (let i = 0; i < conversationIds.length; i += CHUNK) {
          const slice = conversationIds.slice(i, i + CHUNK);
          const { data: convos, error: convError } = await supabase
            .from('conversations')
            .select('contact_id')
            .in('id', slice);

          if (convError) {
            throw new Error(`Failed to fetch conversations: ${convError.message}`);
          }

          for (const c of convos ?? []) {
            if (c.contact_id) allContactIds.push(c.contact_id);
          }
        }

        const uniqueContactIds = [...new Set(allContactIds)];

        if (uniqueContactIds.length > 0) {
          for (let i = 0; i < uniqueContactIds.length; i += CHUNK) {
            const slice = uniqueContactIds.slice(i, i + CHUNK);
            const { data, error } = await supabase
              .from('contacts')
              .select('*')
              .in('id', slice);

            if (error) {
              throw new Error(`Failed to fetch contacts: ${error.message}`);
            }
            contacts = contacts.concat(data ?? []);
          }
        }
      }
    }

    if (audience.excludeTagIds && audience.excludeTagIds.length > 0) {
      const { data: excludeRows } = await supabase
        .from('contact_tags')
        .select('contact_id')
        .in('tag_id', audience.excludeTagIds);
      const excludedIds = new Set((excludeRows ?? []).map((r) => r.contact_id));
      contacts = contacts.filter((c) => !excludedIds.has(c.id));
    }

    return contacts;
  }

  async function upsertCsvContacts(
    supabase: ReturnType<typeof createClient>,
    csvRows: { phone: string; name?: string }[],
  ): Promise<Contact[]> {
    if (csvRows.length === 0) return [];

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user || !accountId) {
      throw new Error('Signed-in user with linked account is required.');
    }

    const uniqueByPhone = new Map<string, { phone: string; name?: string }>();
    for (const row of csvRows) {
      if (row.phone) uniqueByPhone.set(row.phone, row);
    }
    const phones = [...uniqueByPhone.keys()];

    const { data: existing, error: lookupErr } = await supabase
      .from('contacts')
      .select('*')
      .eq('account_id', accountId)
      .in('phone', phones);
    if (lookupErr) {
      throw new Error(`Failed to look up CSV contacts: ${lookupErr.message}`);
    }

    const byPhone = new Map<string, Contact>();
    for (const c of (existing ?? []) as Contact[]) {
      if (c.phone) byPhone.set(c.phone, c);
    }

    const missing = phones
      .filter((p) => !byPhone.has(p))
      .map((phone) => ({
        user_id: user.id,
        account_id: accountId,
        phone,
        name: uniqueByPhone.get(phone)?.name ?? null,
      }));

    const INSERT_CHUNK = 200;
    for (let i = 0; i < missing.length; i += INSERT_CHUNK) {
      const chunk = missing.slice(i, i + INSERT_CHUNK);
      const { data: inserted, error: insertErr } = await supabase
        .from('contacts')
        .insert(chunk)
        .select();
      if (insertErr) {
        throw new Error(`Failed to create CSV contacts: ${insertErr.message}`);
      }
      for (const c of (inserted ?? []) as Contact[]) {
        if (c.phone) byPhone.set(c.phone, c);
      }
    }

    return phones
      .map((p) => byPhone.get(p))
      .filter((c): c is Contact => Boolean(c));
  }

  async function resolveCustomFieldAudience(
    supabase: ReturnType<typeof createClient>,
    filter: CustomFieldFilter,
  ): Promise<Contact[]> {
    const { fieldId, operator, value } = filter;
    let query = supabase
      .from('contact_custom_values')
      .select('contact_id')
      .eq('custom_field_id', fieldId);

    if (operator === 'is') query = query.eq('value', value);
    else if (operator === 'is_not') query = query.neq('value', value);
    else if (operator === 'contains') query = query.ilike('value', `%${value}%`);

    const { data: matches, error: matchErr } = await query;
    if (matchErr) throw new Error(`Custom-field filter failed: ${matchErr.message}`);

    const contactIds = [...new Set((matches ?? []).map((m) => m.contact_id))];
    if (contactIds.length === 0) return [];

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .in('id', contactIds);
    if (error) throw new Error(`Failed to fetch contacts: ${error.message}`);
    return data ?? [];
  }

  async function createAndSendBroadcast(payload: BroadcastPayload): Promise<string> {
    setIsProcessing(true);
    setProgress(0);
    setEstimatedSecondsRemaining(0);

    const supabase = createClient();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || !accountId) {
        throw new Error('Signed-in user with linked account is required.');
      }

      // ── Step 0: Check account WhatsApp connection type ─────────────
      const { data: config } = await supabase
        .from('whatsapp_config')
        .select('connection_type')
        .eq('account_id', accountId)
        .maybeSingle();

      const isEvolution = config?.connection_type === 'evolution';
      const connType: 'meta' | 'evolution' = isEvolution ? 'evolution' : 'meta';
      setConnectionType(connType);

      // ── Step 1: Resolve audience contacts ─────────────────────────
      setProgress(5);
      const contacts = await resolveAudience(payload.audience);

      if (contacts.length === 0) {
        throw new Error('No contacts found for this audience.');
      }

      // Calculate initial estimated remaining seconds
      const totalRecipients = contacts.length;
      const initialEstSeconds = isEvolution
        ? Math.ceil(totalRecipients * (EVOLUTION_MSG_DELAY_MS / 1000) + (totalRecipients / EVOLUTION_BATCH_SIZE) * (EVOLUTION_BATCH_DELAY_MS / 1000))
        : Math.ceil((totalRecipients / META_BATCH_SIZE) * (META_BATCH_DELAY_MS / 1000 + 0.3));
      setEstimatedSecondsRemaining(initialEstSeconds);

      // ── Step 2: Create broadcast row ──────────────────────────────
      setProgress(10);
      const { data: broadcast, error: broadcastError } = await supabase
        .from('broadcasts')
        .insert({
          user_id: user.id,
          account_id: accountId,
          name: payload.name,
          template_name: payload.template?.name || 'free_text',
          template_language: payload.template?.language ?? 'en_US',
          template_variables: payload.variables ?? {},
          audience_filter: {
            type: payload.audience.type,
            tagIds: payload.audience.tagIds,
            customField: payload.audience.customField,
            excludeTagIds: payload.audience.excludeTagIds,
            dateRange: payload.audience.dateRange,
          },
          status: 'sending',
          total_recipients: totalRecipients,
          sent_count: 0,
          delivered_count: 0,
          read_count: 0,
          replied_count: 0,
          failed_count: 0,
        })
        .select()
        .single();

      if (broadcastError || !broadcast) {
        throw new Error(
          `Failed to create broadcast: ${broadcastError?.message ?? 'unknown error'}`,
        );
      }

      // ── Step 3: Insert recipient rows ─────────────────────────────
      setProgress(20);
      const recipientRows = contacts.map((contact) => ({
        broadcast_id: broadcast.id,
        contact_id: contact.id,
        status: 'pending' as const,
      }));

      for (let i = 0; i < recipientRows.length; i += INSERT_BATCH_SIZE) {
        const batch = recipientRows.slice(i, i + INSERT_BATCH_SIZE);
        const { error: recipientError } = await supabase
          .from('broadcast_recipients')
          .insert(batch);
        if (recipientError) {
          await supabase
            .from('broadcasts')
            .update({
              status: 'failed',
              failed_count: contacts.length,
            })
            .eq('id', broadcast.id);
          throw new Error(
            `Failed to insert recipient batch: ${recipientError.message}`,
          );
        }
      }

      // ── Step 4: Fetch recipients & Fan-out ─────────────────────────
      setProgress(30);
      const { data: recipients, error: recipientsFetchError } = await supabase
        .from('broadcast_recipients')
        .select('*, contact:contacts(*)')
        .eq('broadcast_id', broadcast.id);

      if (recipientsFetchError || !recipients) {
        throw new Error('Failed to fetch broadcast recipients');
      }

      const contactIds = recipients
        .map((r) => r.contact?.id)
        .filter((id): id is string => Boolean(id));

      const customValueIndex = isEvolution
        ? new Map()
        : await fetchCustomValueIndex(supabase, contactIds);

      let failedCount = 0;
      const batchSize = isEvolution ? EVOLUTION_BATCH_SIZE : META_BATCH_SIZE;

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);

        const apiRecipients = batch
          .filter((r) => r.contact?.phone)
          .map((r) => {
            if (isEvolution) {
              return {
                phone: r.contact!.phone as string,
                text: payload.freeText,
              };
            }
            const headerType = payload.template?.header_type;
            const isMediaHeader =
              headerType === 'image' ||
              headerType === 'video' ||
              headerType === 'document';
            const headerMediaUrl = payload.headerMediaUrl?.trim();
            const messageParams =
              isMediaHeader && headerMediaUrl ? { headerMediaUrl } : undefined;

            return {
              phone: r.contact!.phone as string,
              params: r.contact && payload.variables
                ? resolveVariables(
                    payload.variables,
                    r.contact,
                    customValueIndex.get(r.contact.id),
                  )
                : [],
              ...(messageParams ? { messageParams } : {}),
            };
          });

        if (apiRecipients.length > 0) {
          try {
            const bodyPayload: Record<string, unknown> = {
              recipients: apiRecipients,
            };
            if (isEvolution) {
              bodyPayload.free_text = payload.freeText;
            } else if (payload.template) {
              bodyPayload.template_name = payload.template.name;
              bodyPayload.template_language = payload.template.language ?? 'en_US';
            }

            const res = await fetch('/api/whatsapp/broadcast', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(bodyPayload),
            });

            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || 'Broadcast API request failed');
            }

            const resultsByPhone = new Map<string, BroadcastApiResult>();
            for (const r of (data.results ?? []) as BroadcastApiResult[]) {
              resultsByPhone.set(r.phone, r);
            }

            for (const recipient of batch) {
              const phone = recipient.contact?.phone;
              const result = phone ? resultsByPhone.get(phone) : undefined;

              if (!result) {
                failedCount++;
                await supabase
                  .from('broadcast_recipients')
                  .update({
                    status: 'failed',
                    error_message: 'No phone number on contact',
                  })
                  .eq('id', recipient.id);
                continue;
              }

              if (result.status === 'sent') {
                await supabase
                  .from('broadcast_recipients')
                  .update({
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    whatsapp_message_id: result.whatsapp_message_id ?? null,
                    error_message: null,
                  })
                  .eq('id', recipient.id);
              } else {
                failedCount++;
                await supabase
                  .from('broadcast_recipients')
                  .update({
                    status: 'failed',
                    error_message: result.error ?? 'Unknown error',
                  })
                  .eq('id', recipient.id);
              }
            }
          } catch (err) {
            for (const recipient of batch) {
              failedCount++;
              await supabase
                .from('broadcast_recipients')
                .update({
                  status: 'failed',
                  error_message: err instanceof Error ? err.message : 'Unknown error',
                })
                .eq('id', recipient.id);
            }
          }
        }

        const completedCount = i + batch.length;
        const progressPct = 30 + Math.round((completedCount / totalRecipients) * 60);
        setProgress(progressPct);

        const remainingRecipients = totalRecipients - completedCount;
        const remainingSeconds = isEvolution
          ? Math.ceil(remainingRecipients * (EVOLUTION_MSG_DELAY_MS / 1000) + (remainingRecipients / EVOLUTION_BATCH_SIZE) * (EVOLUTION_BATCH_DELAY_MS / 1000))
          : Math.ceil((remainingRecipients / META_BATCH_SIZE) * (META_BATCH_DELAY_MS / 1000 + 0.3));
        setEstimatedSecondsRemaining(remainingSeconds);

        if (i + batchSize < recipients.length) {
          const delay = isEvolution ? EVOLUTION_BATCH_DELAY_MS : META_BATCH_DELAY_MS;
          await sleep(delay);
        }
      }

      // ── Step 5: Finalize status ───────────────────────────────────
      setProgress(95);
      setEstimatedSecondsRemaining(0);
      const finalStatus = failedCount === totalRecipients ? 'failed' : 'sent';
      await supabase
        .from('broadcasts')
        .update({ status: finalStatus })
        .eq('id', broadcast.id);

      setProgress(100);
      return broadcast.id;
    } finally {
      setIsProcessing(false);
    }
  }

  return { createAndSendBroadcast, isProcessing, progress, connectionType, estimatedSecondsRemaining };
}
