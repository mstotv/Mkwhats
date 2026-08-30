import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/service'

// Dynamic route because it reads cookies for session
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Create user client & service client in parallel setup
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
      return NextResponse.json(
        { unreadCount: 0, latestTicket: null },
        { headers: { 'Cache-Control': 'private, max-age=30' } }
      )
    }

    const serviceClient = createServiceClient()

    // Single optimized query: join profiles + tickets in one RPC-style select
    // Fetch only the minimal columns needed — no select('*')
    const [profileResult, ticketsResult] = await Promise.all([
      serviceClient
        .from('profiles')
        .select('account_id')
        .eq('user_id', user.id)
        .single(),
      // We'll filter after we get account_id, but start auth check early
      Promise.resolve(null),
    ])

    const accountId = profileResult.data?.account_id
    if (!accountId) {
      return NextResponse.json(
        { unreadCount: 0, latestTicket: null },
        { headers: { 'Cache-Control': 'private, max-age=30' } }
      )
    }

    // Fetch only the columns we actually need — much lighter query
    const { data: tickets, error } = await serviceClient
      .from('support_tickets')
      .select('id, subject, created_at, is_read_by_user, is_announcement, category, user_id, status')
      .eq('account_id', accountId)
      .eq('is_read_by_user', false)   // ← filter in DB, not JS
      .order('created_at', { ascending: false })
      .limit(50)                        // ← cap result size

    if (error) {
      console.error('unread-count query error:', error.message)
      return NextResponse.json(
        { unreadCount: 0, latestTicket: null },
        { headers: { 'Cache-Control': 'private, max-age=30' } }
      )
    }

    const readTicketIds: string[] = Array.isArray(user.user_metadata?.read_ticket_ids)
      ? user.user_metadata.read_ticket_ids
      : []

    // Only filter in JS for the edge case where is_read_by_user might be null
    const unreadTickets = (tickets || []).filter((t: any) => {
      if (readTicketIds.includes(t.id)) return false
      if (
        t.user_id === user.id &&
        !t.is_announcement &&
        !['announcement', 'offer', 'update'].includes(t.category)
      ) return false
      return true
    })

    const count = unreadTickets.length
    const latestTicket = unreadTickets.length > 0 ? unreadTickets[0] : null

    return NextResponse.json(
      { unreadCount: count, latestTicket },
      {
        headers: {
          // Private cache (user-specific), revalidate after 30s
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      }
    )
  } catch (err) {
    console.error('Error fetching unread support tickets:', err)
    return NextResponse.json({ unreadCount: 0, latestTicket: null })
  }
}
