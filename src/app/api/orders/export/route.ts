import { createClient } from '@/lib/supabase/server'
import { checkAccountFeature } from '@/lib/plans/check-usage-limit'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
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

    // 3. Check plan feature 'excel_export'
    const featureCheck = await checkAccountFeature(accountId, 'excel_export')
    if (!featureCheck.allowed) {
      return NextResponse.json(
        { error: featureCheck.reason || 'تصدير Excel غير متاح في خطتك الحالية' },
        { status: 403 }
      )
    }

    // 4. Fetch order form fields definition for dynamic columns
    const { data: formFields, error: fieldsErr } = await supabase
      .from('order_form_fields')
      .select('field_key, field_label')
      .eq('account_id', accountId)
      .order('sort_order', { ascending: true })

    if (fieldsErr) {
      console.error('[OrdersExport] Error fetching form fields:', fieldsErr)
    }

    const fields = formFields ?? []

    // 5. Fetch confirmed and exported orders
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        confirmed_at,
        exported_at,
        created_at,
        contacts (
          name,
          phone
        ),
        order_field_values (
          field_key,
          field_value
        )
      `)
      .eq('account_id', accountId)
      .in('status', ['confirmed', 'exported'])
      .order('created_at', { ascending: false })

    if (ordersErr) {
      console.error('[OrdersExport] Error fetching orders:', ordersErr)
      return NextResponse.json({ error: 'فشل جلب الطلبات للتصدير' }, { status: 500 })
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'لا توجد طلبات مؤكدة للتصدير' },
        { status: 404 }
      )
    }

    // 6. Build Headers and Data Rows
    // Fixed headers first, followed by custom form fields
    const headers = [
      'اسم العميل',
      'رقم الهاتف',
      'الحالة',
      'تاريخ التأكيد',
      'تاريخ التصدير',
      ...fields.map((f) => f.field_label || f.field_key),
    ]

    const nowIso = new Date().toISOString()

    const rows = orders.map((order: any) => {
      const fieldValues: Record<string, string> = {}
      if (Array.isArray(order.order_field_values)) {
        order.order_field_values.forEach((fv: any) => {
          if (fv.field_key) {
            fieldValues[fv.field_key] = fv.field_value ?? ''
          }
        })
      }

      const contactName = order.contacts?.name || 'غير معروف'
      const contactPhone = order.contacts?.phone || ''
      const statusLabel = order.status === 'confirmed' ? 'مؤكد' : 'مصدّر'
      const confirmedDate = order.confirmed_at
        ? new Date(order.confirmed_at).toLocaleString('ar-SA')
        : ''
      const exportedDate = order.exported_at
        ? new Date(order.exported_at).toLocaleString('ar-SA')
        : new Date(nowIso).toLocaleString('ar-SA')

      const customValues = fields.map((f) => fieldValues[f.field_key] || '')

      return [
        contactName,
        contactPhone,
        statusLabel,
        confirmedDate,
        exportedDate,
        ...customValues,
      ]
    })

    // 7. Create Excel Worksheet & Workbook
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])

    // Auto-fit column widths (minimum width 15)
    const colWidths = headers.map((header, colIdx) => {
      let maxLen = header.length
      rows.forEach((row) => {
        const valStr = String(row[colIdx] || '')
        if (valStr.length > maxLen) maxLen = valStr.length
      })
      return { wch: Math.max(maxLen + 4, 15) }
    })
    worksheet['!cols'] = colWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلبات')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // 8. Update confirmed orders to 'exported' & record exported_at
    const confirmedOrdersToUpdate = orders
      .filter((o: any) => o.status === 'confirmed')
      .map((o: any) => o.id)

    if (confirmedOrdersToUpdate.length > 0) {
      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          status: 'exported',
          exported_at: nowIso,
        })
        .in('id', confirmedOrdersToUpdate)

      if (updateErr) {
        console.error('[OrdersExport] Error updating order status:', updateErr)
      }
    }

    // 9. Return binary file response
    const dateStr = new Date().toISOString().slice(0, 10)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="orders_${dateStr}.xlsx"`,
      },
    })
  } catch (err: any) {
    console.error('[OrdersExport] Unexpected error:', err)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تصدير الملف' },
      { status: 500 }
    )
  }
}
