import { NextResponse } from 'next/server'
import {
  requireRole,
  getCurrentAccount,
  toErrorResponse,
} from '@/lib/auth/account'
import { createServiceClient } from '@/lib/supabase/service'
import { validateSubdomain } from '@/lib/storefront/validation'

export async function GET() {
  try {
    const ctx = await getCurrentAccount()

    const { data: storefront, error } = await ctx.supabase
      .from('storefronts')
      .select('*')
      .eq('account_id', ctx.accountId)
      .maybeSingle()

    if (error) {
      console.error('[GET /api/storefront] Query error:', error)
      return NextResponse.json({ error: 'Failed to load storefront settings' }, { status: 500 })
    }

    return NextResponse.json({
      storefront: storefront || null,
      accountName: ctx.account.name,
    })
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireRole('admin')

    const body = (await request.json().catch(() => null)) as {
      subdomain?: unknown
      store_name?: unknown
      is_active?: unknown
    } | null

    const rawSubdomain = typeof body?.subdomain === 'string' ? body.subdomain : ''
    const storeName = typeof body?.store_name === 'string' ? body.store_name.trim() : ctx.account.name
    const isActive = typeof body?.is_active === 'boolean' ? body.is_active : true

    const validation = validateSubdomain(rawSubdomain)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason || 'نطاق فرعي غير صالح' },
        { status: 400 }
      )
    }

    const subdomain = validation.normalized

    // Check availability across other accounts
    const service = createServiceClient()
    const { data: existingSubdomain } = await service
      .from('storefronts')
      .select('id, account_id')
      .eq('subdomain', subdomain)
      .maybeSingle()

    if (existingSubdomain && existingSubdomain.account_id !== ctx.accountId) {
      return NextResponse.json(
        { error: 'اسم النطاق محجوز بالفعل لحساب آخر' },
        { status: 409 }
      )
    }

    const upsertData: Record<string, any> = {
      account_id: ctx.accountId,
      subdomain,
      store_name: storeName || ctx.account.name,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    }

    if (typeof (body as any)?.business_type === 'string') upsertData.business_type = (body as any).business_type
    if ((body as any)?.theme_config) upsertData.theme_config = (body as any).theme_config
    if (typeof (body as any)?.logo_url !== 'undefined') upsertData.logo_url = (body as any).logo_url
    if (typeof (body as any)?.banner_url !== 'undefined') upsertData.banner_url = (body as any).banner_url
    if (typeof (body as any)?.bio !== 'undefined') upsertData.bio = (body as any).bio
    if ((body as any)?.contact_buttons) upsertData.contact_buttons = (body as any).contact_buttons
    if ((body as any)?.sections_order) upsertData.sections_order = (body as any).sections_order
    if ((body as any)?.settings) upsertData.settings = (body as any).settings

    // Upsert storefront record for this account
    const { data: storefront, error: upsertError } = await ctx.supabase
      .from('storefronts')
      .upsert(upsertData, { onConflict: 'account_id' })
      .select('*')
      .single()

    if (upsertError) {
      console.error('[POST /api/storefront] Upsert error:', upsertError)
      return NextResponse.json(
        { error: 'فشل حفظ إعدادات المتجر: ' + upsertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      storefront,
    })
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireRole('admin')

    const body = (await request.json().catch(() => null)) as Record<string, any> | null

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body?.store_name === 'string') updates.store_name = body.store_name.trim()
    if (typeof body?.is_active === 'boolean') updates.is_active = body.is_active
    if (typeof body?.business_type === 'string') updates.business_type = body.business_type
    if (body?.theme_config) updates.theme_config = body.theme_config
    if (typeof body?.logo_url !== 'undefined') updates.logo_url = body.logo_url
    if (typeof body?.banner_url !== 'undefined') updates.banner_url = body.banner_url
    if (typeof body?.bio !== 'undefined') updates.bio = body.bio
    if (body?.contact_buttons) updates.contact_buttons = body.contact_buttons
    if (body?.sections_order) updates.sections_order = body.sections_order
    if (body?.settings) updates.settings = body.settings

    if (typeof body?.subdomain === 'string') {
      const validation = validateSubdomain(body.subdomain)
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.reason || 'نطاق فرعي غير صالح' },
          { status: 400 }
        )
      }

      const subdomain = validation.normalized

      // Check if taken by another account
      const service = createServiceClient()
      const { data: existingSubdomain } = await service
        .from('storefronts')
        .select('id, account_id')
        .eq('subdomain', subdomain)
        .maybeSingle()

      if (existingSubdomain && existingSubdomain.account_id !== ctx.accountId) {
        return NextResponse.json(
          { error: 'اسم النطاق محجوز بالفعل لحساب آخر' },
          { status: 409 }
        )
      }

      updates.subdomain = subdomain
    }

    const { data: storefront, error: updateError } = await ctx.supabase
      .from('storefronts')
      .update(updates)
      .eq('account_id', ctx.accountId)
      .select('*')
      .single()

    if (updateError) {
      console.error('[PATCH /api/storefront] Update error:', updateError)
      return NextResponse.json(
        { error: 'فشل تحديث بيانات المتجر: ' + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      storefront,
    })
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function DELETE() {
  try {
    const ctx = await requireRole('admin')

    const { error: deleteError } = await ctx.supabase
      .from('storefronts')
      .delete()
      .eq('account_id', ctx.accountId)

    if (deleteError) {
      console.error('[DELETE /api/storefront] Delete error:', deleteError)
      return NextResponse.json(
        { error: 'فشل حذف المتجر' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return toErrorResponse(err)
  }
}
