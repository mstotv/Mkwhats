import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceClient()

    // Verify Platform Admin
    const { data: adminRow } = await serviceClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRow) {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const {
      subject,
      message_text,
      priority = 'medium',
      category = 'announcement',
      attachments = [],
    } = body

    if (!subject?.trim() || (!message_text?.trim() && (!attachments || attachments.length === 0))) {
      return NextResponse.json({ error: 'Subject and message content are required' }, { status: 400 })
    }

    // Fetch all active accounts
    const { data: accounts, error: accErr } = await serviceClient
      .from('accounts')
      .select('id')
      .eq('is_suspended', false)

    if (accErr || !accounts || accounts.length === 0) {
      return NextResponse.json({ error: 'No active accounts found to notify' }, { status: 400 })
    }

    // Fetch primary profiles for each account
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('user_id, account_id')

    const accountUserMap = new Map<string, string>()
    profiles?.forEach((p) => {
      if (p.account_id && p.user_id && !accountUserMap.has(p.account_id)) {
        accountUserMap.set(p.account_id, p.user_id)
      }
    })

    const now = new Date().toISOString()

    // 1. Create system broadcast campaign record
    let broadcastId: string | null = null
    try {
      const { data: campaign, error: campaignErr } = await serviceClient
        .from('system_broadcasts')
        .insert({
          title: subject.trim(),
          message_text: message_text ? message_text.trim() : '',
          category,
          priority,
          attachments: Array.isArray(attachments) ? attachments : [],
          created_by: user.id,
          created_at: now,
        })
        .select('id')
        .single()

      if (campaignErr) {
        console.warn('System broadcast campaign record creation warning:', campaignErr)
      } else {
        broadcastId = campaign?.id || null
      }
    } catch (cErr) {
      console.warn('System broadcast table not ready yet:', cErr)
    }

    let createdCount = 0

    for (const acc of accounts) {
      const ownerUserId = accountUserMap.get(acc.id) || user.id

      // 2. Create support ticket for account
      let ticketObj: { id: string } | null = null
      let ticketErr: any = null

      const ticketCategory = category && ['announcement', 'offer', 'update'].includes(category) ? category : 'announcement'

      const insertData: any = {
        account_id: acc.id,
        user_id: ownerUserId,
        subject: subject.trim(),
        category: ticketCategory,
        priority: priority,
        status: 'open',
        last_reply_at: now,
        created_at: now,
        updated_at: now,
      }

      if (broadcastId) {
        insertData.broadcast_id = broadcastId
      }

      const resFull = await serviceClient
        .from('support_tickets')
        .insert(insertData)
        .select('id')
        .single()

      ticketObj = resFull.data
      ticketErr = resFull.error

      if (ticketErr) {
        console.warn(`Ticket insert for account ${acc.id} error:`, ticketErr)
      }

      if (!ticketErr && ticketObj?.id) {
        // 3. Insert admin message into ticket
        const { error: msgErr } = await serviceClient.from('support_ticket_messages').insert({
          ticket_id: ticketObj.id,
          sender_type: 'admin',
          sender_id: user.id,
          message_text: message_text ? message_text.trim() : '📢 [إشعار/عرض من الإدارة]',
          attachments: Array.isArray(attachments) ? attachments : [],
          created_at: now,
        })

        if (msgErr) {
          console.error('Error inserting broadcast message into support_ticket_messages:', msgErr)
        } else {
          createdCount++
        }
      } else {
        console.error(`Failed to create ticket for account ${acc.id}:`, ticketErr)
      }
    }

    // Update total_delivered count on campaign record
    if (broadcastId) {
      await serviceClient
        .from('system_broadcasts')
        .update({ total_delivered: createdCount })
        .eq('id', broadcastId)
    }

    return NextResponse.json({
      success: true,
      delivered_count: createdCount,
      message: `تم إرسال الإشعار/العرض بنجاح إلى ${createdCount} حساب`,
    })
  } catch (err: any) {
    console.error('Error sending broadcast notification:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
