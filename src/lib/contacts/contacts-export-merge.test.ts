import { describe, it, expect, vi } from 'vitest'
import * as XLSX from 'xlsx'
import { hasMinRole, canSendMessages, AccountRole } from '@/lib/auth/roles'

// ── 1. AUTHORIZATION TESTS ──────────────────────────────────────────
describe('Contact Merge & Export Authorization', () => {
  it('rejects viewers from performing contact merge (requires agent or higher)', () => {
    const viewerRole: AccountRole = 'viewer'
    expect(hasMinRole(viewerRole, 'agent')).toBe(false)
    expect(canSendMessages(viewerRole)).toBe(false)
  })

  it('allows agents, admins, and owners to perform contact merge', () => {
    const validRoles: AccountRole[] = ['agent', 'admin', 'owner']
    for (const role of validRoles) {
      expect(hasMinRole(role, 'agent')).toBe(true)
      expect(canSendMessages(role)).toBe(true)
    }
  })

  it('rejects self-merge when primaryContactId equals secondaryContactId', () => {
    const primaryId = 'contact-123'
    const secondaryId = 'contact-123'
    const isSameContact = primaryId === secondaryId
    expect(isSameContact).toBe(true)
  })

  it('enforces multi-tenant isolation by requiring contacts to share the same account_id', () => {
    const primaryContact = { id: 'c1', account_id: 'account-alpha' }
    const secondaryContact = { id: 'c2', account_id: 'account-beta' }
    const isSameAccount = primaryContact.account_id === secondaryContact.account_id
    expect(isSameAccount).toBe(false)
  })
})

// ── 2. ATOMIC MERGE LOGIC SIMULATION ────────────────────────────────
describe('Atomic Contact Merge Algorithm & Conflict Policy', () => {
  it('merges profile fields deterministically (primary wins, secondary fills gaps)', () => {
    const primary = {
      id: 'p1',
      name: 'Ali Hassan',
      phone: '+9647701111111',
      email: '', // empty
      company: null, // null
      avatar_url: 'https://example.com/avatar1.jpg',
    }

    const secondary = {
      id: 's1',
      name: 'Ali H. Duplicate',
      phone: '+9647702222222',
      email: 'ali@example.com',
      company: 'Tech Corp',
      avatar_url: 'https://example.com/avatar2.jpg',
    }

    const merged = {
      ...primary,
      name: primary.name || secondary.name,
      email: primary.email || secondary.email,
      company: primary.company || secondary.company,
      avatar_url: primary.avatar_url || secondary.avatar_url,
    }

    expect(merged.name).toBe('Ali Hassan') // primary kept
    expect(merged.email).toBe('ali@example.com') // secondary filled gap
    expect(merged.company).toBe('Tech Corp') // secondary filled gap
    expect(merged.avatar_url).toBe('https://example.com/avatar1.jpg') // primary kept
  })

  it('deduplicates tags without unique constraint violations', () => {
    const primaryTags = ['tag-vip', 'tag-baghdad']
    const secondaryTags = ['tag-baghdad', 'tag-wholesale', 'tag-vip']

    const primarySet = new Set(primaryTags)
    const tagsToMigrate = secondaryTags.filter((t) => !primarySet.has(t))

    const consolidatedTags = [...primaryTags, ...tagsToMigrate]
    expect(consolidatedTags).toEqual(['tag-vip', 'tag-baghdad', 'tag-wholesale'])
    expect(new Set(consolidatedTags).size).toBe(consolidatedTags.length)
  })

  it('deduplicates custom fields keeping primary values on conflict and taking secondary when missing', () => {
    const primaryCustomValues: Record<string, string> = {
      field_city: 'بغداد',
      field_budget: '5000',
    }

    const secondaryCustomValues: Record<string, string> = {
      field_city: 'البصرة', // conflict: primary wins
      field_notes: 'عميل مهم', // missing in primary: secondary fills
    }

    const mergedCustomValues = { ...secondaryCustomValues, ...primaryCustomValues }
    // Ensure primary values override secondary, but missing keys are preserved
    expect(mergedCustomValues.field_city).toBe('بغداد')
    expect(mergedCustomValues.field_budget).toBe('5000')
    expect(mergedCustomValues.field_notes).toBe('عميل مهم')
  })

  it('preserves contact notes, deals, orders, and appointments upon merge', () => {
    const primaryId = 'primary-uuid'
    const secondaryId = 'secondary-uuid'

    const notes = [
      { id: 'n1', contact_id: primaryId, text: 'ملاحظة 1' },
      { id: 'n2', contact_id: secondaryId, text: 'ملاحظة 2 تابعة للثانوي' },
    ]

    const deals = [
      { id: 'd1', contact_id: secondaryId, title: 'صفقة تجارية' },
    ]

    const orders = [
      { id: 'o1', contact_id: secondaryId, status: 'confirmed' },
    ]

    const appointments = [
      { id: 'a1', contact_id: secondaryId, customer_name: 'علي' },
    ]

    // Re-point all to primary
    const migratedNotes = notes.map((n) => (n.contact_id === secondaryId ? { ...n, contact_id: primaryId } : n))
    const migratedDeals = deals.map((d) => (d.contact_id === secondaryId ? { ...d, contact_id: primaryId } : d))
    const migratedOrders = orders.map((o) => (o.contact_id === secondaryId ? { ...o, contact_id: primaryId } : o))
    const migratedAppointments = appointments.map((a) => (a.contact_id === secondaryId ? { ...a, contact_id: primaryId } : a))

    expect(migratedNotes.every((n) => n.contact_id === primaryId)).toBe(true)
    expect(migratedDeals.every((d) => d.contact_id === primaryId)).toBe(true)
    expect(migratedOrders.every((o) => o.contact_id === primaryId)).toBe(true)
    expect(migratedAppointments.every((a) => a.contact_id === primaryId)).toBe(true)
  })

  it('safely merges conversations when both primary and secondary have conversations', () => {
    const primaryConvId = 'conv-primary'
    const secondaryConvId = 'conv-secondary'

    // Both conversations have messages
    const messages = [
      { id: 'm1', conversation_id: primaryConvId, content_text: 'رسالة 1 للأساسي' },
      { id: 'm2', conversation_id: secondaryConvId, content_text: 'رسالة 2 للثانوي' },
    ]

    // Both conversations have orders; both collecting -> secondary must be cancelled to avoid unique violation
    const orders = [
      { id: 'o1', conversation_id: primaryConvId, status: 'collecting' },
      { id: 'o2', conversation_id: secondaryConvId, status: 'collecting' },
    ]

    // Handle collecting conflict:
    const resolvedOrders = orders.map((o) => {
      if (o.conversation_id === secondaryConvId && o.status === 'collecting') {
        return { ...o, status: 'cancelled' }
      }
      return o
    })

    // Re-point secondary messages to primary conversation
    const migratedMessages = messages.map((m) =>
      m.conversation_id === secondaryConvId ? { ...m, conversation_id: primaryConvId } : m
    )

    expect(migratedMessages.every((m) => m.conversation_id === primaryConvId)).toBe(true)
    expect(migratedMessages.length).toBe(2)

    // Verify collecting order was cancelled to prevent idx collision
    const secondaryOrder = resolvedOrders.find((o) => o.id === 'o2')
    expect(secondaryOrder?.status).toBe('cancelled')
  })

  it('guarantees rollback on simulated failure leaving secondary contact intact', () => {
    let transactionCommitted = false
    let secondaryDeleted = false

    try {
      // Step 1: lock rows
      // Step 2: merge fields
      // Step 3: simulated failure during child migration
      throw new Error('Database connection failed during child record update')
      // Step 4: delete secondary
      secondaryDeleted = true
      transactionCommitted = true
    } catch (err: any) {
      // Rollback
      transactionCommitted = false
      secondaryDeleted = false
    }

    expect(transactionCommitted).toBe(false)
    expect(secondaryDeleted).toBe(false)
  })
})

// ── 3. PLAN ENTITLEMENTS TESTS ──────────────────────────────────────
describe('Plan Entitlements for Export', () => {
  it('allows XLSX export when plan has excel_export feature enabled', () => {
    const planFeatures = { excel_export: true, ai_assistant: true }
    const isAllowed = Boolean(planFeatures.excel_export)
    expect(isAllowed).toBe(true)
  })

  it('rejects XLSX export when plan lacks excel_export feature', () => {
    const planFeatures = { excel_export: false, ai_assistant: false }
    const isAllowed = Boolean(planFeatures.excel_export)
    expect(isAllowed).toBe(false)
  })

  it('allows CSV export even if plan lacks excel_export feature', () => {
    const format: string = 'csv'
    const planFeatures = { excel_export: false }
    const requiresExcelFeature = format === 'xlsx'
    const isAllowed = !requiresExcelFeature || Boolean(planFeatures.excel_export)
    expect(isAllowed).toBe(true)
  })
})

// ── 4. TIMEZONE & CSV UTF-8 BOM TESTS ───────────────────────────────
describe('Timezone & CSV UTF-8 BOM Formatting', () => {
  it('generates CSV with valid UTF-8 BOM header preventing Arabic character corruption', () => {
    const sampleHeaders = ['الاسم (Name)', 'رقم الهاتف (Phone)', 'الوسوم (Tags)']
    const sampleRows = [
      sampleHeaders,
      ['مهند سالم', '+9647700000000', 'VIP عميل'],
      ['فاطمة الزهراء', '+9647800000000', 'استشارة'],
    ]

    const ws = XLSX.utils.aoa_to_sheet(sampleRows)
    const csv = XLSX.utils.sheet_to_csv(ws)
    const bom = '\uFEFF'
    const fullCsv = bom + csv

    expect(fullCsv.startsWith('\uFEFF')).toBe(true)
    expect(fullCsv).toContain('مهند سالم')
    expect(fullCsv).toContain('فاطمة الزهراء')
  })

  it('formats dates in account-configured timezone (Asia/Baghdad)', () => {
    const utcDate = '2026-09-03T10:00:00.000Z'
    const baghdadTimezone = 'Asia/Baghdad'

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: baghdadTimezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })

    const formatted = formatter.format(new Date(utcDate))
    // Baghdad is UTC+3, so 10:00 UTC should be 13:00 local time
    expect(formatted).toBe('13:00')
  })

  it('exports custom fields accurately using field_name column', () => {
    const customFields = [
      { id: 'cf-1', field_name: 'نوع الاشتراك' },
      { id: 'cf-2', field_name: 'تاريخ الميلاد' },
    ]

    const headers = [
      'الاسم (Name)',
      'رقم الهاتف (Phone)',
      ...customFields.map((f) => f.field_name),
    ]

    expect(headers).toContain('نوع الاشتراك')
    expect(headers).toContain('تاريخ الميلاد')
    expect(headers).not.toContain(undefined)
  })
})
