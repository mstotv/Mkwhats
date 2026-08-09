import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { SiteSettingsClient } from './site-settings-client'

export const dynamic = 'force-dynamic'

export default async function AdminSiteSettingsPage() {
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
    redirect('/admin/login')
  }

  const serviceClient = createServiceClient()
  const { data: adminRow } = await serviceClient
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminRow) {
    redirect('/admin/login')
  }

  // Fetch initial site_settings & content_pages
  const [{ data: settings }, { data: pages }] = await Promise.all([
    serviceClient.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    serviceClient.from('content_pages').select('*').order('created_at', { ascending: true }),
  ])

  return (
    <SiteSettingsClient
      initialSettings={settings || null}
      initialPages={pages || []}
    />
  )
}
