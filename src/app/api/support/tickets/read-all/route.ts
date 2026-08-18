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

    let ticketIdsToMark: string[] = []
    try {
      const body = await req.json()
      if (Array.isArray(body?.ticketIds)) {
        ticketIdsToMark = body.ticketIds
      } else if (typeof body?.ticketId === 'string') {
        ticketIdsToMark = [body.ticketId]
      }
    } catch (_) {}

    const serviceClient = createServiceClient()
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // 1. Try DB column update if exists
    try {
      await serviceClient
        .from('support_tickets')
        .update({ is_read_by_user: true })
        .eq('account_id', profile.account_id)
    } catch (_) {}

    // 2. Fetch all tickets for account to get their IDs if not provided
    if (ticketIdsToMark.length === 0) {
      const { data: allTickets } = await serviceClient
        .from('support_tickets')
        .select('id')
        .eq('account_id', profile.account_id)
      ticketIdsToMark = (allTickets || []).map((t) => t.id)
    }

    // 3. Persist in user_metadata so read status survives refreshes (F5) across devices
    const existingReadIds: string[] = Array.isArray(user.user_metadata?.read_ticket_ids)
      ? user.user_metadata.read_ticket_ids
      : []
    const updatedReadIds = Array.from(new Set([...existingReadIds, ...ticketIdsToMark]))

    await serviceClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        read_ticket_ids: updatedReadIds,
      },
    })

    return NextResponse.json({ success: true, read_ticket_ids: updatedReadIds })
  } catch (err: any) {
    console.error('Error marking all tickets as read:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
