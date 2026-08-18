import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/service'

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
    const { data: adminRow } = await serviceClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRow) {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 })
    }

    // Fetch system broadcasts
    const { data: campaigns, error } = await serviceClient
      .from('system_broadcasts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching broadcasts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch users list to map user_metadata read_ticket_ids
    const readMap = new Map<string, string[]>()
    try {
      const { data: usersData } = await serviceClient.auth.admin.listUsers()
      for (const u of usersData?.users || []) {
        const readIds = Array.isArray(u.user_metadata?.read_ticket_ids) ? u.user_metadata.read_ticket_ids : []
        readMap.set(u.id, readIds)
      }
    } catch (uErr) {
      console.warn('Could not fetch user_metadata read IDs:', uErr)
    }

    // Fetch all support tickets once for accurate matching
    const { data: allTickets } = await serviceClient
      .from('support_tickets')
      .select('id, user_id, subject, broadcast_id, is_read_by_user')

    const ticketListAll = allTickets || []

    // Calculate open stats per campaign
    const campaignsWithMetrics = await Promise.all(
      (campaigns || []).map(async (c) => {
        const matchedTickets = ticketListAll.filter(
          (t) => t.broadcast_id === c.id || t.subject?.trim() === c.title?.trim()
        )

        // Auto-link any tickets missing broadcast_id
        const unlinkedIds = matchedTickets.filter((t) => !t.broadcast_id).map((t) => t.id)
        if (unlinkedIds.length > 0) {
          await serviceClient
            .from('support_tickets')
            .update({ broadcast_id: c.id, is_announcement: true })
            .in('id', unlinkedIds)
        }

        const openedCount = matchedTickets.filter((t: any) => {
          const userReads = readMap.get(t.user_id) || []
          return Boolean(t.is_read_by_user) || userReads.includes(t.id)
        }).length

        const totalDelivered = Math.max(matchedTickets.length, c.total_delivered || 0)
        const totalOpened = openedCount
        const openRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0

        return {
          ...c,
          total_delivered: totalDelivered,
          total_opened: totalOpened,
          open_rate: openRate,
        }
      })
    )

    return NextResponse.json({
      campaigns: campaignsWithMetrics,
    })
  } catch (err: any) {
    console.error('Error in broadcasts API:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
