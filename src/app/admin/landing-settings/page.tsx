import { createServiceClient } from '@/lib/supabase/service'
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard'
import { redirect } from 'next/navigation'
import { LandingSettingsClient } from './landing-settings-client'

export const dynamic = 'force-dynamic'

export default async function AdminLandingSettingsPage() {
  const isAdmin = await checkIsSuperAdmin()
  if (!isAdmin) {
    redirect('/dashboard')
  }

  const supabase = createServiceClient()
  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  return <LandingSettingsClient initialSettings={settings} />
}
