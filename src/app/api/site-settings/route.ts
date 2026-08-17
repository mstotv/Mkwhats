import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('site_settings')
      .select(`
        platform_name,
        currency_symbol,
        primary_color,
        support_email,
        support_whatsapp,
        support_telegram,
        maintenance_mode,
        plisio_enabled,
        stripe_enabled,
        stripe_publishable_key
      `)
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      settings: data ?? {
        platform_name: 'wacrm',
        currency_symbol: '$',
        primary_color: '#10b981',
        support_email: 'support@wacrm.com',
        support_whatsapp: '+966500000000',
        support_telegram: '@wacrm_support',
        maintenance_mode: false,
        plisio_enabled: false,
        stripe_enabled: false,
        stripe_publishable_key: '',
      },
    });
  } catch (err) {
    console.error('[PublicSiteSettingsAPI] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
