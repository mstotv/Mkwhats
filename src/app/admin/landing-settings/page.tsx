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
  const [{ data: settings }, { data: dbPartners }] = await Promise.all([
    supabase.from('site_settings').select('*').limit(1).maybeSingle(),
    supabase.from('partners').select('*').order('display_order', { ascending: true }),
  ])

  const initialPartners = (Array.isArray(settings?.partners) && settings.partners.length > 0)
    ? settings.partners
    : ((dbPartners && dbPartners.length > 0) ? dbPartners : [
        { name: 'Shopify', logo_url: 'https://cdn.simpleicons.org/shopify/96bf48' },
        { name: 'WooCommerce', logo_url: 'https://cdn.simpleicons.org/woocommerce/96588a' },
        { name: 'Meta', logo_url: 'https://cdn.simpleicons.org/meta/0668E1' },
        { name: 'Stripe', logo_url: 'https://cdn.simpleicons.org/stripe/635BFF' },
        { name: 'WhatsApp', logo_url: 'https://cdn.simpleicons.org/whatsapp/25D366' },
        { name: 'Telegram', logo_url: 'https://cdn.simpleicons.org/telegram/26A5E4' },
        { name: 'n8n', logo_url: 'https://cdn.simpleicons.org/n8n/EA4B71' },
        { name: 'Zapier', logo_url: 'https://cdn.simpleicons.org/zapier/FF4A00' },
        { name: 'AliExpress', logo_url: 'https://cdn.simpleicons.org/aliexpress/FF4747' },
        { name: 'Alibaba', logo_url: 'https://cdn.simpleicons.org/alibabadotcom/FF6600' },
        { name: 'Instagram', logo_url: 'https://cdn.simpleicons.org/instagram/E4405F' },
        { name: 'Facebook', logo_url: 'https://cdn.simpleicons.org/facebook/1877F2' },
        { name: 'Google', logo_url: 'https://cdn.simpleicons.org/google/4285F4' },
        { name: 'Amazon', logo_url: 'https://cdn.simpleicons.org/amazon/FF9900' },
        { name: 'Salesforce', logo_url: 'https://cdn.simpleicons.org/salesforce/00A1E0' },
        { name: 'PayPal', logo_url: 'https://cdn.simpleicons.org/paypal/00457C' },
      ])

  const formattedSettings = settings ? {
    ...settings,
    partners: initialPartners,
    ecommerce_content: settings.ecommerce_content || settings.how_it_works_content,
  } : {
    partners: initialPartners,
  }

  return <LandingSettingsClient initialSettings={formattedSettings} />
}
