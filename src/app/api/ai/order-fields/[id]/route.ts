import { NextResponse } from 'next/server'
import { requireRole, toErrorResponse } from '@/lib/auth/account'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

function notFound() {
  return NextResponse.json({ error: 'Field not found' }, { status: 404 })
}

const VALID_TYPES = ['text', 'number', 'choice'] as const
type FieldType = (typeof VALID_TYPES)[number]

function validateFieldType(v: unknown): v is FieldType {
  return typeof v === 'string' && (VALID_TYPES as readonly string[]).includes(v)
}

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/ai/order-fields/[id]  (admin+)
 *
 * Partial update — only send the fields you want to change.
 * `field_key` is immutable after creation (it's referenced by
 * order_field_values); send any other combination of:
 *   field_label, field_type, choices, is_required, sort_order
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const { supabase, accountId, userId } = await requireRole('admin')

    const limit = checkRateLimit(`order-fields:${userId}`, RATE_LIMITS.adminAction)
    if (!limit.success) return rateLimitResponse(limit)

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') return bad('Invalid request body')

    // Verify ownership before updating.
    const { data: existing } = await supabase
      .from('order_form_fields')
      .select('id, field_type')
      .eq('id', id)
      .eq('account_id', accountId)
      .maybeSingle()
    if (!existing) return notFound()

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.field_label === 'string' && body.field_label.trim()) {
      patch.field_label = body.field_label.trim()
    }

    const newType = 'field_type' in body ? body.field_type : existing.field_type
    if ('field_type' in body) {
      if (!validateFieldType(body.field_type)) {
        return bad('field_type must be "text", "number", or "choice"')
      }
      patch.field_type = body.field_type
    }

    // Re-validate choices whenever type is (or becomes) 'choice'.
    if (newType === 'choice') {
      if ('choices' in body) {
        if (!Array.isArray(body.choices) || body.choices.length < 2) {
          return bad('choices must have at least 2 options for type "choice"')
        }
        patch.choices = (body.choices as unknown[])
          .filter((c) => typeof c === 'string' && c.trim())
          .map((c) => (c as string).trim())
      }
    } else {
      // Switching away from 'choice' — clear any stored choices.
      if ('field_type' in body && body.field_type !== 'choice') {
        patch.choices = null
      }
    }

    if ('is_required' in body) {
      patch.is_required = body.is_required !== false
    }

    if ('sort_order' in body && Number.isFinite(Number(body.sort_order))) {
      patch.sort_order = Math.floor(Number(body.sort_order))
    }

    const { data, error } = await supabase
      .from('order_form_fields')
      .update(patch)
      .eq('id', id)
      .eq('account_id', accountId)
      .select('id, field_key, field_label, field_type, choices, is_required, sort_order')
      .single()

    if (error) {
      console.error('[order-fields PATCH] error:', error)
      return NextResponse.json({ error: 'Failed to update field' }, { status: 500 })
    }

    return NextResponse.json({ field: data })
  } catch (err) {
    return toErrorResponse(err)
  }
}

/**
 * DELETE /api/ai/order-fields/[id]  (admin+)
 *
 * Removes the field definition. Existing order_field_values that
 * reference this field_key are left intact (historical data) — only
 * future orders will no longer ask for it.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const { supabase, accountId, userId } = await requireRole('admin')

    const limit = checkRateLimit(`order-fields:${userId}`, RATE_LIMITS.adminAction)
    if (!limit.success) return rateLimitResponse(limit)

    const { error } = await supabase
      .from('order_form_fields')
      .delete()
      .eq('id', id)
      .eq('account_id', accountId)

    if (error) {
      console.error('[order-fields DELETE] error:', error)
      return NextResponse.json({ error: 'Failed to delete field' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return toErrorResponse(err)
  }
}
