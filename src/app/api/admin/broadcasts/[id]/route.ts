import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: campaignId } = await params
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

    const { data: campaign } = await serviceClient
      .from('system_broadcasts')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
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

    // Fetch all support tickets linked to this broadcast
    const { data: tickets } = await serviceClient
      .from('support_tickets')
      .select('id, account_id, user_id, is_read_by_user, created_at, updated_at, accounts(name), profiles(full_name, email)')
      .or(`broadcast_id.eq.${campaignId},subject.eq.${campaign.title}`)

    const recipientList = (tickets || []).map((t: any) => {
      const userReads = readMap.get(t.user_id) || []
      const isRead = Boolean(t.is_read_by_user) || userReads.includes(t.id)
      return {
        ticket_id: t.id,
        account_id: t.account_id,
        account_name: t.accounts?.name || 'حساب',
        user_name: t.profiles?.full_name || 'مستخدم',
        user_email: t.profiles?.email || '',
        is_read: isRead,
        read_status: isRead ? 'مقروءة ✅' : 'لم تُفتح بعد ⏳',
        delivered_at: t.created_at,
      }
    })

    const totalDelivered = recipientList.length
    const totalOpened = recipientList.filter((r) => r.is_read).length
    const openRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0

    return NextResponse.json({
      campaign: {
        ...campaign,
        total_delivered: totalDelivered,
        total_opened: totalOpened,
        open_rate: openRate,
      },
      recipients: recipientList,
    })
  } catch (err: any) {
    console.error('Error fetching broadcast campaign details:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
