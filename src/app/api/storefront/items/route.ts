import { NextResponse } from 'next/server'
import { requireRole, getCurrentAccount, toErrorResponse } from '@/lib/auth/account'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')

    // 1. Public query by subdomain
    if (subdomain) {
      const service = createServiceClient()
      const { data: storefront } = await service
        .from('storefronts')
        .select('id, is_active')
        .eq('subdomain', subdomain.toLowerCase())
        .maybeSingle()

      if (!storefront || !storefront.is_active) {
        return NextResponse.json({ items: [] })
      }

      const { data: items, error } = await service
        .from('storefront_items')
        .select('*')
        .eq('storefront_id', storefront.id)
        .eq('is_available', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[GET /api/storefront/items] Public query error:', error)
        return NextResponse.json({ items: [] })
      }

      return NextResponse.json({ items: items || [] })
    }

    // 2. Authenticated query for account management
    const ctx = await getCurrentAccount()
    const { data: items, error } = await ctx.supabase
      .from('storefront_items')
      .select('*')
      .eq('account_id', ctx.accountId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/storefront/items] Account query error:', error)
      return NextResponse.json({ error: 'Failed to load items' }, { status: 500 })
    }

    return NextResponse.json({ items: items || [] })
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireRole('admin')
    const body = await request.json().catch(() => null)

    if (!body?.title || typeof body.title !== 'string') {
      return NextResponse.json({ error: 'اسم المنتج أو الخدمة مطلوب' }, { status: 400 })
    }

    // Get account's storefront_id
    const { data: storefront } = await ctx.supabase
      .from('storefronts')
      .select('id')
      .eq('account_id', ctx.accountId)
      .maybeSingle()

    const type = body.type === 'service' ? 'service' : 'product'
    const price = Number(body.price) || 0
    const comparePrice = body.compare_at_price ? Number(body.compare_at_price) : null
    const duration = type === 'service' ? (Number(body.duration_minutes) || 30) : null

    const { data: newItem, error: insertError } = await ctx.supabase
      .from('storefront_items')
      .insert({
        account_id: ctx.accountId,
        storefront_id: storefront?.id || null,
        type,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        price,
        compare_at_price: comparePrice,
        image_url: body.image_url || null,
        category: body.category?.trim() || 'عام',
        duration_minutes: duration,
        is_available: body.is_available !== false,
        sort_order: Number(body.sort_order) || 0,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('[POST /api/storefront/items] Insert error:', insertError)
      return NextResponse.json({ error: 'فشل إضافة العنصر: ' + insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: newItem })
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireRole('admin')
    const body = await request.json().catch(() => null)

    const itemId = body?.id
    if (!itemId) {
      return NextResponse.json({ error: 'معرّف العنصر مطلوب' }, { status: 400 })
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.title === 'string') updates.title = body.title.trim()
    if (typeof body.description !== 'undefined') updates.description = body.description
    if (typeof body.price !== 'undefined') updates.price = Number(body.price) || 0
    if (typeof body.compare_at_price !== 'undefined') updates.compare_at_price = body.compare_at_price ? Number(body.compare_at_price) : null
    if (typeof body.image_url !== 'undefined') updates.image_url = body.image_url
    if (typeof body.category !== 'undefined') updates.category = body.category
    if (typeof body.is_available === 'boolean') updates.is_available = body.is_available
    if (typeof body.duration_minutes !== 'undefined') updates.duration_minutes = Number(body.duration_minutes) || 30
    if (typeof body.sort_order !== 'undefined') updates.sort_order = Number(body.sort_order) || 0

    const { data: updatedItem, error: updateError } = await ctx.supabase
      .from('storefront_items')
      .update(updates)
      .eq('id', itemId)
      .eq('account_id', ctx.accountId)
      .select('*')
      .single()

    if (updateError) {
      console.error('[PATCH /api/storefront/items] Update error:', updateError)
      return NextResponse.json({ error: 'فشل تعديل العنصر: ' + updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: updatedItem })
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requireRole('admin')
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')

    if (!itemId) {
      return NextResponse.json({ error: 'معرّف العنصر مطلوب' }, { status: 400 })
    }

    const { error: deleteError } = await ctx.supabase
      .from('storefront_items')
      .delete()
      .eq('id', itemId)
      .eq('account_id', ctx.accountId)

    if (deleteError) {
      console.error('[DELETE /api/storefront/items] Delete error:', deleteError)
      return NextResponse.json({ error: 'فشل حذف العنصر' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return toErrorResponse(err)
  }
}
