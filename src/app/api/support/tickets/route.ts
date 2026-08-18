import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'

// GET: Fetch account's tickets
export async function GET(req: NextRequest) {
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
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const { data: tickets, error } = await serviceClient
      .from('support_tickets')
      .select('*')
      .eq('account_id', profile.account_id)
      .order('last_reply_at', { ascending: false })

    const readTicketIds: string[] = Array.isArray(user.user_metadata?.read_ticket_ids)
      ? user.user_metadata.read_ticket_ids
      : []

    const normalizedTickets = (tickets || []).map((t: any) => ({
      ...t,
      is_read_by_user:
        t.is_read_by_user === true ||
        readTicketIds.includes(t.id) ||
        (t.user_id === user.id && !t.is_announcement && !['announcement', 'offer', 'update'].includes(t.category)),
    }))

    return NextResponse.json({ tickets: normalizedTickets })
  } catch (err: any) {
    console.error('Error fetching support tickets:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a new ticket with initial message & attachments
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
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const body = await req.json()
    const { subject, category = 'general', priority = 'medium', message_text, attachments = [] } = body

    if (!subject?.trim() || !message_text?.trim()) {
      return NextResponse.json({ error: 'Subject and message text are required' }, { status: 400 })
    }

    // 1. Create ticket
    const { data: ticket, error: ticketError } = await serviceClient
      .from('support_tickets')
      .insert({
        account_id: profile.account_id,
        user_id: user.id,
        subject: subject.trim(),
        category,
        priority,
        status: 'open',
      })
      .select()
      .single()

    if (ticketError || !ticket) {
      console.error('Create ticket error:', ticketError)
      return NextResponse.json({ error: ticketError?.message || 'Failed to create ticket' }, { status: 500 })
    }

    // 2. Create initial message
    const { data: initialMsg, error: msgError } = await serviceClient
      .from('support_ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_type: 'user',
        sender_id: user.id,
        message_text: message_text.trim(),
        attachments: Array.isArray(attachments) ? attachments : [],
      })
      .select()
      .single()

    if (msgError) {
      console.error('Create initial message error:', msgError)
    }

    return NextResponse.json({ ticket, message: initialMsg })
  } catch (err: any) {
    console.error('Error creating support ticket:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
