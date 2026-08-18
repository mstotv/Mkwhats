import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'

// GET: Fetch ticket details & all messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: ticketId } = await params
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
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const { data: ticket, error: ticketError } = await serviceClient
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('account_id', profile.account_id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Automatically mark as read by user when details are fetched
    if (!ticket.is_read_by_user) {
      await serviceClient
        .from('support_tickets')
        .update({ is_read_by_user: true })
        .eq('id', ticketId)
        .eq('account_id', profile.account_id)
    }

    const { data: messages, error: msgError } = await serviceClient
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (msgError) {
      console.error('Fetch ticket messages error:', msgError)
      return NextResponse.json({ error: msgError.message }, { status: 500 })
    }

    return NextResponse.json({ ticket, messages: messages || [] })
  } catch (err: any) {
    console.error('Error fetching ticket details:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// POST: Send reply from user
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: ticketId } = await params
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
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const { data: ticket } = await serviceClient
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('account_id', profile.account_id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Strict rule 1: System Broadcast Announcements are Read-Only for Users
    if (ticket.is_announcement || ticket.category === 'announcement' || ticket.category === 'offer' || ticket.category === 'update') {
      return NextResponse.json(
        { error: 'هذا إشعار إداري رسمي للعرض والإطلاع فقط، ولا يمكن الرد عليه' },
        { status: 400 }
      )
    }

    // Strict rule 2: If ticket is closed or resolved, users cannot send further replies
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      return NextResponse.json(
        { error: 'هذه التذكرة مغلقة ولا يمكن إضافة ردود عليها. يرجى فتح تذكرة دعم جديدة' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { message_text, attachments = [] } = body

    if (!message_text?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Message text or attachment is required' }, { status: 400 })
    }

    // Insert user message
    const { data: replyMsg, error: replyError } = await serviceClient
      .from('support_ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_type: 'user',
        sender_id: user.id,
        message_text: message_text ? message_text.trim() : '📷 [مرفق صورة / ملف]',
        attachments: Array.isArray(attachments) ? attachments : [],
      })
      .select()
      .single()

    if (replyError) {
      console.error('Send user reply error:', replyError)
      return NextResponse.json({ error: replyError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: replyMsg })
  } catch (err: any) {
    console.error('Error sending user reply:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// PATCH: User status update (e.g. close or reopen ticket)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: ticketId } = await params
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
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const body = await req.json()
    const { status } = body

    if (!['open', 'resolved', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data: updatedTicket, error } = await serviceClient
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .eq('account_id', profile.account_id)
      .select()
      .single()

    if (error) {
      console.error('Update ticket status error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, ticket: updatedTicket })
  } catch (err: any) {
    console.error('Error updating ticket status:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
