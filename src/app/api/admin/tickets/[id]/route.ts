import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'

// GET: Fetch ticket details & messages for Admin
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
    const { data: adminRow } = await serviceClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRow) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { data: ticket, error: ticketError } = await serviceClient
      .from('support_tickets')
      .select(`
        *,
        accounts (
          id,
          name
        )
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const { data: userProfile } = await serviceClient
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', ticket.user_id)
      .maybeSingle()

    const { data: messages, error: msgError } = await serviceClient
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 })
    }

    return NextResponse.json({
      ticket: {
        ...ticket,
        user_name: userProfile?.full_name || 'مستخدم',
        user_email: userProfile?.email || '',
        account_name: ticket.accounts?.name || 'حساب',
      },
      messages: messages || [],
    })
  } catch (err: any) {
    console.error('Error fetching admin ticket details:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// POST: Admin reply to ticket
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
    const { data: adminRow } = await serviceClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRow) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Fetch ticket status
    const { data: ticket } = await serviceClient
      .from('support_tickets')
      .select('id, status')
      .eq('id', ticketId)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      return NextResponse.json({ error: 'هذه التذكرة مغلقة وحاسمة نهائياً ولا يمكن إضافة ردود عليها' }, { status: 400 })
    }

    const body = await req.json()
    const { message_text, attachments = [] } = body

    if (!message_text?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Message text or attachment is required' }, { status: 400 })
    }

    // Insert admin reply
    const { data: replyMsg, error: replyError } = await serviceClient
      .from('support_ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_type: 'admin',
        sender_id: user.id,
        message_text: message_text ? message_text.trim() : '📷 [مرفق صورة / ملف]',
        attachments: Array.isArray(attachments) ? attachments : [],
      })
      .select()
      .single()

    if (replyError) {
      console.error('Send admin reply error:', replyError)
      return NextResponse.json({ error: replyError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: replyMsg })
  } catch (err: any) {
    console.error('Error sending admin reply:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Admin change ticket status (e.g., 'resolved'تم حل المشكلة, 'closed'إغلاق التذكرة)
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
    const { data: adminRow } = await serviceClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRow) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { status } = body

    if (!status || !['resolved', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'حالة التذكرة يجب أن تكون حاسمة (resolved أو closed) ولا يمكن إعادة الفتح' }, { status: 400 })
    }

    const { data: updatedTicket, error } = await serviceClient
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .select()
      .single()

    if (error) {
      console.error('Admin update ticket status error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, ticket: updatedTicket })
  } catch (err: any) {
    console.error('Error updating admin ticket status:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
