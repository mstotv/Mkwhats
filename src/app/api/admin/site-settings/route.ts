import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  try {
    const serviceClient = createServiceClient()
    const { data: settings, error } = await serviceClient
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    if (error) {
      console.error('[AdminSiteSettingsAPI] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch site settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (err: any) {
    console.error('[AdminSiteSettingsAPI] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // 1. Authenticate super admin
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

    const body = await request.json()
    const { platform_name, logo_url, social_links, partners, plisio_api_key, plisio_enabled } = body || {}

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (platform_name !== undefined) updateData.platform_name = String(platform_name)
    if (logo_url !== undefined) updateData.logo_url = logo_url ? String(logo_url) : null
    if (social_links !== undefined) updateData.social_links = social_links
    if (partners !== undefined) updateData.partners = partners
    if (plisio_api_key !== undefined) updateData.plisio_api_key = plisio_api_key ? String(plisio_api_key) : null
    if (plisio_enabled !== undefined) updateData.plisio_enabled = Boolean(plisio_enabled)

    const { data: updatedSettings, error: updateError } = await serviceClient
      .from('site_settings')
      .update(updateData)
      .eq('id', 1)
      .select('*')
      .single()

    if (updateError) {
      console.error('[AdminSiteSettingsAPI] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update site settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings: updatedSettings })
  } catch (err: any) {
    console.error('[AdminSiteSettingsAPI] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
