import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planId } = await params
    const cookieStore = await cookies()

    // 1. Verify caller session with Supabase Auth
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
      data: { user: adminUser },
    } = await supabase.auth.getUser()

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify platform super-admin role
    const serviceClient = createServiceClient()
    const { data: adminRow } = await serviceClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', adminUser.id)
      .maybeSingle()

    if (!adminRow) {
      return NextResponse.json(
        { error: 'Forbidden: Super-admin access required.' },
        { status: 403 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const {
      name,
      price_monthly,
      price_yearly,
      max_users,
      max_whatsapp_instances,
      max_contacts,
      max_messages_monthly,
      max_broadcasts_monthly,
      features,
      is_active,
    } = body || {}

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) updateData.name = String(name)
    if (price_monthly !== undefined) updateData.price_monthly = Number(price_monthly)
    if (price_yearly !== undefined) updateData.price_yearly = Number(price_yearly)
    if (max_users !== undefined) updateData.max_users = Number(max_users)
    if (max_whatsapp_instances !== undefined)
      updateData.max_whatsapp_instances = Number(max_whatsapp_instances)
    if (max_contacts !== undefined) updateData.max_contacts = Number(max_contacts)
    if (max_messages_monthly !== undefined)
      updateData.max_messages_monthly = Number(max_messages_monthly)
    if (max_broadcasts_monthly !== undefined)
      updateData.max_broadcasts_monthly = Number(max_broadcasts_monthly)
    if (features !== undefined) updateData.features = features
    if (is_active !== undefined) updateData.is_active = Boolean(is_active)

    // 4. Update Plan in Database
    const { data: updatedPlan, error: updateError } = await serviceClient
      .from('plans')
      .update(updateData)
      .eq('id', planId)
      .select('*')
      .single()

    if (updateError) {
      console.error('[AdminPlansPatchAPI] Error updating plan:', updateError)
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
    }

    return NextResponse.json({ success: true, plan: updatedPlan })
  } catch (err: any) {
    console.error('[AdminPlansPatchAPI] Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
