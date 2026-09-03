import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account'
import { checkAccountFeature } from '@/lib/plans/check-usage-limit'

export const maxDuration = 60

/**
 * GET /api/appointments/export
 *
 * Exports appointments in XLSX format.
 * Enforces multi-tenant isolation, plan entitlement (excel_export),
 * and formats times using account's configured timezone.
 */
export async function GET() {
  try {
    // 1. Authenticate & obtain account context
    const ctx = await getCurrentAccount()
    const { supabase, accountId } = ctx

    // 2. Plan Entitlement: XLSX requires 'excel_export' feature
    const featureCheck = await checkAccountFeature(accountId, 'excel_export')
    if (!featureCheck.allowed) {
      return NextResponse.json(
        { error: featureCheck.reason || 'تصدير Excel غير متاح في خطتك الحالية. يرجى الترقية.' },
        { status: 403 }
      )
    }

    // 3. Fetch timezone from appointment_settings
    const { data: settings } = await supabase
      .from('appointment_settings')
      .select('timezone')
      .eq('account_id', accountId)
      .maybeSingle()

    const timezone = settings?.timezone || 'Asia/Baghdad'

    // 4. Fetch appointments for this account
    const { data: appointments, error: apptsErr } = await supabase
      .from('appointments')
      .select(`
        id,
        customer_name,
        customer_phone,
        service_name,
        scheduled_at,
        duration_minutes,
        status,
        notes,
        created_at
      `)
      .eq('account_id', accountId)
      .order('scheduled_at', { ascending: false })

    if (apptsErr) {
      console.error('[appointments/export] Error fetching appointments:', apptsErr)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ error: 'No appointments to export' }, { status: 404 })
    }

    // 5. Build localized headers and rows
    const headers = [
      'اسم العميل',
      'رقم الهاتف',
      'الخدمة',
      'تاريخ ووقت الموعد',
      'المدة (دقيقة)',
      'الحالة',
      'ملاحظات',
      'تاريخ الإنشاء',
    ]

    const statusTranslations: Record<string, string> = {
      pending: 'قيد الانتظار',
      confirmed: 'مؤكد',
      cancelled: 'ملغي',
      no_show: 'لم يحضر',
    }

    const rows: (string | number)[][] = [headers]

    for (const a of appointments) {
      let formattedDate = ''
      try {
        formattedDate = new Intl.DateTimeFormat('ar-IQ', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: timezone,
        }).format(new Date(a.scheduled_at))
      } catch {
        formattedDate = new Date(a.scheduled_at).toLocaleString('ar-IQ')
      }

      let formattedCreatedAt = ''
      if (a.created_at) {
        try {
          formattedCreatedAt = new Intl.DateTimeFormat('ar-IQ', {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: timezone,
          }).format(new Date(a.created_at))
        } catch {
          formattedCreatedAt = new Date(a.created_at).toLocaleString('ar-IQ')
        }
      }

      const row: (string | number)[] = [
        a.customer_name || '',
        a.customer_phone || '',
        a.service_name || '-',
        formattedDate,
        a.duration_minutes || 60,
        statusTranslations[a.status] || a.status,
        a.notes || '',
        formattedCreatedAt,
      ]

      rows.push(row)
    }

    // 6. Generate XLSX with styling
    const ws = XLSX.utils.aoa_to_sheet(rows)

    ws['!cols'] = [
      { wch: 22 }, // customer_name
      { wch: 18 }, // customer_phone
      { wch: 22 }, // service_name
      { wch: 30 }, // scheduled_at
      { wch: 15 }, // duration_minutes
      { wch: 15 }, // status
      { wch: 30 }, // notes
      { wch: 22 }, // created_at
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'المواعيد')

    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    const timestamp = new Date().toISOString().slice(0, 10)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="appointments_${timestamp}.xlsx"`,
      },
    })
  } catch (err) {
    return toErrorResponse(err)
  }
}
