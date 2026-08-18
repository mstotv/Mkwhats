import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Fetch all tickets with accounts and profiles info
    const { data: tickets, error } = await serviceClient
      .from('support_tickets')
      .select(`
        *,
        accounts (
          id,
          name
        )
      `)
      .order('last_reply_at', { ascending: false })

    if (error) {
      console.error('Admin fetch support tickets error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch profile information for each user_id
    const userIds = Array.from(new Set(tickets?.map((t) => t.user_id) || []))
    let profilesMap: Record<string, any> = {}
    
    if (userIds.length > 0) {
      const { data: profiles } = await serviceClient
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds)
      
      if (profiles) {
        profilesMap = profiles.reduce((acc: any, curr: any) => {
          acc[curr.user_id] = curr
          return acc
        }, {})
      }
    }

    const enrichedTickets = (tickets || []).map((t: any) => ({
      ...t,
      user_name: profilesMap[t.user_id]?.full_name || 'مستخدم',
      user_email: profilesMap[t.user_id]?.email || '',
      account_name: t.accounts?.name || 'حساب',
    }))

    return NextResponse.json({ tickets: enrichedTickets })
  } catch (err: any) {
    console.error('Error in admin tickets route:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
