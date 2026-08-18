import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    // Normalize: ensure bilingual name fields are always strings (never null)
    // so client-side code never accidentally falls back to the wrong language
    const normalized = data ? {
      ...data,
      platform_name: data.platform_name ?? '',
      platform_name_ar: data.platform_name_ar ?? '',
      platform_name_en: data.platform_name_en ?? '',
      logo_url: data.logo_url ?? '',
    } : {
      platform_name: '',
      platform_name_ar: '',
      platform_name_en: '',
      logo_url: '',
      currency_symbol: '$',
      primary_color: '#10b981',
      support_email: '',
      support_whatsapp: '',
      support_telegram: '',
      maintenance_mode: false,
      plisio_enabled: false,
      stripe_enabled: false,
      stripe_publishable_key: '',
      google_auth_enabled: false,
      google_client_id: '',
    };

    return NextResponse.json({ settings: normalized });
  } catch (err) {
    console.error('[PublicSiteSettingsAPI] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
