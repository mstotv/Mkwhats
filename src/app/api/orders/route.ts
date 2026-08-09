import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user from session ONLY
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Resolve account_id from user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError || !profile?.account_id) {
      return NextResponse.json(
        { error: 'Profile not linked to an account' },
        { status: 403 }
      )
    }

    const accountId = profile.account_id

    // Parse URL query params
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') // 'all', 'collecting', 'confirmed', 'exported', 'cancelled'

    // 3. Fetch account's form fields for column definitions
    const { data: fields, error: fieldsErr } = await supabase
      .from('order_form_fields')
      .select('field_key, field_label, field_type, choices, is_required, sort_order')
      .eq('account_id', accountId)
      .order('sort_order', { ascending: true })

    if (fieldsErr) {
      console.error('[OrdersAPI] Error fetching form fields:', fieldsErr)
    }

    // 4. Fetch orders
    let query = supabase
      .from('orders')
      .select(`
        id,
        conversation_id,
        contact_id,
        status,
        confirmed_at,
        exported_at,
        created_at,
        updated_at,
        contacts (
          id,
          name,
          phone,
          avatar_url
        ),
        order_field_values (
          field_key,
          field_value
        )
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: orders, error: ordersErr } = await query

    if (ordersErr) {
      console.error('[OrdersAPI] Error fetching orders:', ordersErr)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Formatted response
    const formattedOrders = (orders ?? []).map((order: any) => {
      const fieldValues: Record<string, string> = {}
      if (Array.isArray(order.order_field_values)) {
        order.order_field_values.forEach((fv: any) => {
          if (fv.field_key) {
            fieldValues[fv.field_key] = fv.field_value ?? ''
          }
        })
      }

      return {
        id: order.id,
        conversationId: order.conversation_id,
        contactId: order.contact_id,
        contactName: order.contacts?.name || 'عميل غير معروف',
        contactPhone: order.contacts?.phone || '',
        contactAvatar: order.contacts?.avatar_url || null,
        status: order.status,
        confirmedAt: order.confirmed_at,
        exportedAt: order.exported_at,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        fieldValues,
      }
    })

    return NextResponse.json({
      fields: fields ?? [],
      orders: formattedOrders,
    })
  } catch (err: any) {
    console.error('[OrdersAPI] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
