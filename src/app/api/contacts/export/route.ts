import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account'
import { checkAccountFeature } from '@/lib/plans/check-usage-limit'

export const maxDuration = 60

/**
 * POST /api/contacts/export
 *
 * Exports contacts in either XLSX or CSV format with:
 * - Multi-tenant isolation (scoped to accountId)
 * - Plan entitlement check: XLSX requires 'excel_export' feature
 * - CSV includes UTF-8 BOM (\uFEFF) for native Excel Arabic character support
 * - Dynamic custom fields from `custom_fields.field_name`
 * - Localized timestamps using account's configured timezone
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate & obtain account context
    const ctx = await getCurrentAccount()
    const { supabase, accountId } = ctx

    // 2. Parse request options
    let body: {
      format?: 'xlsx' | 'csv'
      contactIds?: string[]
      tagIds?: string[]
      search?: string
    } = {}

    try {
      body = await request.json()
    } catch {
      // Empty body is allowed, defaults to all contacts in xlsx
    }

    const format = body.format === 'csv' ? 'csv' : 'xlsx'
    const contactIds = Array.isArray(body.contactIds) && body.contactIds.length > 0 ? body.contactIds : null
    const tagIds = Array.isArray(body.tagIds) && body.tagIds.length > 0 ? body.tagIds : null
    const search = body.search?.trim() || ''

    // 3. Plan Entitlement: XLSX requires 'excel_export' feature
    if (format === 'xlsx') {
      const featureCheck = await checkAccountFeature(accountId, 'excel_export')
      if (!featureCheck.allowed) {
        return NextResponse.json(
          { error: featureCheck.reason || 'تصدير Excel غير متاح في خطتك الحالية. يرجى الترقية.' },
          { status: 403 }
        )
      }
    }

    // 4. Fetch account timezone from appointment_settings
    const { data: settings } = await supabase
      .from('appointment_settings')
      .select('timezone')
      .eq('account_id', accountId)
      .maybeSingle()

    const accountTimezone = settings?.timezone || 'Asia/Baghdad'

    // 5. Fetch custom fields definitions for this account (using field_name)
    const { data: customFields } = await supabase
      .from('custom_fields')
      .select('id, field_name')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true })

    const fieldsList = (customFields || []) as Array<{ id: string; field_name: string }>

    // 6. Query contacts
    let contactsQuery = supabase
      .from('contacts')
      .select(`
        id,
        name,
        phone,
        email,
        company,
        created_at,
        contact_tags (
          tags (
            id,
            name
          )
        ),
        contact_custom_values (
          custom_field_id,
          value
        )
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })

    if (contactIds) {
      contactsQuery = contactsQuery.in('id', contactIds)
    }

    if (search) {
      contactsQuery = contactsQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`)
    }

    const { data: contactsData, error: contactsErr } = await contactsQuery

    if (contactsErr) {
      console.error('[contacts/export] Error fetching contacts:', contactsErr)
      return NextResponse.json({ error: 'Failed to fetch contacts for export' }, { status: 500 })
    }

    let contacts = contactsData ?? []

    // If tagIds provided, filter contacts having at least one of the tags
    if (tagIds && tagIds.length > 0) {
      const tagSet = new Set(tagIds)
      contacts = contacts.filter((c) => {
        const ctList = (c as any).contact_tags ?? []
        return ctList.some((ct: any) => ct.tags && tagSet.has(ct.tags.id))
      })
    }

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts found to export' }, { status: 404 })
    }

    // 7. Build Headers and Data Rows
    const headers = [
      'الاسم (Name)',
      'رقم الهاتف (Phone)',
      'البريد الإلكتروني (Email)',
      'الشركة (Company)',
      'الوسوم (Tags)',
      'تاريخ الإنشاء (Created At)',
      ...fieldsList.map((f) => f.field_name),
    ]

    const rows: (string | number)[][] = [headers]

    for (const c of contacts) {
      // Format tags as comma-separated
      const rawTags = (c as any).contact_tags ?? []
      const tagNames = rawTags
        .map((ct: any) => ct.tags?.name)
        .filter(Boolean)
        .join(', ')

      // Format custom values map
      const rawVals = (c as any).contact_custom_values ?? []
      const valMap = new Map<string, string>()
      for (const rv of rawVals) {
        if (rv.custom_field_id && rv.value !== undefined) {
          valMap.set(rv.custom_field_id, String(rv.value))
        }
      }

      let formattedCreatedAt = ''
      if (c.created_at) {
        try {
          formattedCreatedAt = new Intl.DateTimeFormat('ar-IQ', {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: accountTimezone,
          }).format(new Date(c.created_at))
        } catch {
          formattedCreatedAt = new Date(c.created_at).toLocaleString('ar-IQ')
        }
      }

      const row: (string | number)[] = [
        c.name || '',
        c.phone || '',
        c.email || '',
        c.company || '',
        tagNames,
        formattedCreatedAt,
        ...fieldsList.map((f) => valMap.get(f.id) || ''),
      ]

      rows.push(row)
    }

    // 8. Output XLSX or CSV
    const timestamp = new Date().toISOString().slice(0, 10)

    if (format === 'csv') {
      // Create CSV with UTF-8 BOM for Arabic support in Excel
      const ws = XLSX.utils.aoa_to_sheet(rows)
      const csvContent = XLSX.utils.sheet_to_csv(ws)
      const bom = '\uFEFF' // Byte Order Mark for UTF-8
      const fullContent = bom + csvContent

      return new NextResponse(fullContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="contacts_${timestamp}.csv"`,
        },
      })
    }

    // XLSX format
    const ws = XLSX.utils.aoa_to_sheet(rows)

    // Set column widths
    ws['!cols'] = [
      { wch: 22 }, // Name
      { wch: 18 }, // Phone
      { wch: 26 }, // Email
      { wch: 20 }, // Company
      { wch: 25 }, // Tags
      { wch: 20 }, // Created At
      ...fieldsList.map(() => ({ wch: 20 })),
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'جهات الاتصال')

    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="contacts_${timestamp}.xlsx"`,
      },
    })
  } catch (err) {
    return toErrorResponse(err)
  }
}
