import { NextResponse } from 'next/server'
import { getCurrentAccount, requireRole, toErrorResponse } from '@/lib/auth/account'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

const VALID_TYPES = ['text', 'number', 'choice'] as const
type FieldType = (typeof VALID_TYPES)[number]

function validateFieldType(v: unknown): v is FieldType {
  return typeof v === 'string' && (VALID_TYPES as readonly string[]).includes(v)
}

/**
 * GET /api/ai/order-fields
 *
 * Returns all order_form_fields for the caller's account, ordered by
 * sort_order ASC. Any account member may read (to drive the settings UI).
 */
export async function GET() {
  try {
    const { supabase, accountId } = await getCurrentAccount()

    const { data, error } = await supabase
      .from('order_form_fields')
      .select('id, field_key, field_label, field_type, choices, is_required, sort_order')
      .eq('account_id', accountId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[order-fields GET] error:', error)
      return NextResponse.json(
        { error: 'Failed to load order fields', details: error.message, code: error.code },
        { status: 500 },
      )
    }

    return NextResponse.json({ fields: data ?? [] })
  } catch (err) {
    return toErrorResponse(err)
  }
}

/**
 * POST /api/ai/order-fields  (admin+)
 *
 * Create a new order form field. The `field_key` must be unique per
 * account (enforced by a DB unique constraint); a duplicate returns 409.
 *
 * Body:
 *   field_key    string   snake_case identifier (letters, digits, _)
 *   field_label  string   human-readable label shown to the customer
 *   field_type   'text' | 'number' | 'choice'
 *   choices      string[] required when field_type === 'choice', ignored otherwise
 *   is_required  boolean  defaults to true
 *   sort_order   number   defaults to 0 (lower = asked first)
 */
export async function POST(request: Request) {
  try {
    const { supabase, accountId, userId } = await requireRole('admin')

    const limit = checkRateLimit(`order-fields:${userId}`, RATE_LIMITS.adminAction)
    if (!limit.success) return rateLimitResponse(limit)

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') return bad('Invalid request body')

    const fieldKey =
      typeof body.field_key === 'string'
        ? body.field_key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
        : ''
    if (!fieldKey) return bad('field_key is required')
    if (!/^[a-z][a-z0-9_]*$/.test(fieldKey))
      return bad('field_key must start with a letter and contain only a–z, 0–9, _')

    const fieldLabel = typeof body.field_label === 'string' ? body.field_label.trim() : ''
    if (!fieldLabel) return bad('field_label is required')

    if (!validateFieldType(body.field_type)) {
      return bad('field_type must be "text", "number", or "choice"')
    }
    const fieldType = body.field_type

    let choices: string[] | null = null
    if (fieldType === 'choice') {
      if (!Array.isArray(body.choices) || body.choices.length === 0) {
        return bad('choices is required for field_type "choice"')
      }
      choices = (body.choices as unknown[])
        .filter((c) => typeof c === 'string' && c.trim())
        .map((c) => (c as string).trim())
      if (choices.length < 2) return bad('choices must have at least 2 options')
    }

    const isRequired = body.is_required !== false // default true
    const sortOrder = Number.isFinite(Number(body.sort_order)) ? Math.floor(Number(body.sort_order)) : 0

    // Fetch the account's ai_configs row to get its ai_config_id.
    const { data: aiConfig } = await supabase
      .from('ai_configs')
      .select('id')
      .eq('account_id', accountId)
      .maybeSingle()

    if (!aiConfig) {
      return NextResponse.json(
        { error: 'يرجى حفظ مفتاح الذكاء الاصطناعي (API Key) أولاً قبل إضافة حقول الطلبات.' },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from('order_form_fields')
      .insert({
        account_id: accountId,
        ai_config_id: aiConfig.id,
        field_key: fieldKey,
        field_label: fieldLabel,
        field_type: fieldType,
        choices,
        is_required: isRequired,
        sort_order: sortOrder,
      })
      .select('id, field_key, field_label, field_type, choices, is_required, sort_order')
      .single()

    if (error) {
      // Unique constraint violation → duplicate field_key for this account.
      if (error.code === '23505') {
        return NextResponse.json(
          { error: `A field with key "${fieldKey}" already exists for this account` },
          { status: 409 },
        )
      }
      console.error('[order-fields POST] insert error:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: 'Failed to create field', details: error.message, code: error.code },
        { status: 500 },
      )
    }

    return NextResponse.json({ field: data }, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
