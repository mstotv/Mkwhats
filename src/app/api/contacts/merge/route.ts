import { NextResponse } from 'next/server'
import { requireRole, toErrorResponse } from '@/lib/auth/account'

export const maxDuration = 60

interface MergeRequestBody {
  primaryContactId: string
  secondaryContactId: string
}

/**
 * POST /api/contacts/merge
 *
 * Atomically merges a secondary contact into a primary contact via PostgreSQL RPC.
 * Enforces role check (requires agent or higher) and strict multi-tenant isolation.
 */
export async function POST(request: Request) {
  try {
    // 1. Enforce minimum role of 'agent' (viewers cannot merge or delete contacts)
    const ctx = await requireRole('agent')
    const accountId = ctx.accountId

    // 2. Validate request payload
    let body: MergeRequestBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'بيانات الطلب غير صالحة' }, { status: 400 })
    }

    const { primaryContactId, secondaryContactId } = body

    if (!primaryContactId || !secondaryContactId) {
      return NextResponse.json(
        { error: 'يجب تحديد جهة الاتصال الأساسية وجهة الاتصال الثانوية' },
        { status: 400 }
      )
    }

    if (primaryContactId === secondaryContactId) {
      return NextResponse.json(
        { error: 'لا يمكن دمج جهة الاتصال مع نفسها' },
        { status: 400 }
      )
    }

    // 3. Execute atomic PostgreSQL RPC merge
    const { data: result, error: rpcError } = await ctx.supabase.rpc('merge_contacts', {
      p_account_id: accountId,
      p_primary_id: primaryContactId,
      p_secondary_id: secondaryContactId,
    })

    if (rpcError) {
      console.error('[contacts/merge] RPC Error:', rpcError)
      const msg = rpcError.message || ''

      if (msg.includes('Cannot merge a contact with itself')) {
        return NextResponse.json({ error: 'لا يمكن دمج جهة الاتصال مع نفسها' }, { status: 400 })
      }
      if (msg.includes('not found in account')) {
        return NextResponse.json(
          { error: 'إحدى جهات الاتصال غير موجودة في هذا الحساب' },
          { status: 404 }
        )
      }
      if (msg.includes('Insufficient permissions')) {
        return NextResponse.json({ error: 'ليس لديك صلاحية كافية لتنفيذ هذا الإجراء' }, { status: 403 })
      }

      return NextResponse.json({ error: 'فشل دمج جهتي الاتصال، لم يتم إجراء أي تغيير' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'تم دمج جهتي الاتصال بنجاح',
      data: result,
    })
  } catch (err) {
    return toErrorResponse(err)
  }
}
