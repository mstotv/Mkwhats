import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard';

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'global_config')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[SiteSettingsAPI] GET error:', error);
    }

    return NextResponse.json({
      settings: data ?? {
        platform_name: 'wacrm',
        support_email: 'support@wacrm.com',
        support_whatsapp: '+966500000000',
        support_telegram: '@wacrm_support',
        currency_symbol: '$',
        primary_color: '#10b981',
        maintenance_mode: false,
        plisio_enabled: false,
        plisio_secret_key: '',
        plisio_merchant_id: '',
      },
    });
  } catch (err) {
    console.error('[SiteSettingsAPI] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const payload = await req.json();
    const supabase = createServiceClient();

    const { error } = await supabase.from('site_settings').upsert({
      id: 'global_config',
      platform_name: payload.platform_name || 'wacrm',
      support_email: payload.support_email || 'support@wacrm.com',
      support_whatsapp: payload.support_whatsapp || '',
      support_telegram: payload.support_telegram || '',
      currency_symbol: payload.currency_symbol || '$',
      primary_color: payload.primary_color || '#10b981',
      maintenance_mode: Boolean(payload.maintenance_mode),
      plisio_enabled: Boolean(payload.plisio_enabled),
      plisio_secret_key: payload.plisio_secret_key || '',
      plisio_merchant_id: payload.plisio_merchant_id || '',
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[SiteSettingsAPI] Upsert error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, message: 'تم حفظ إعدادات النظام العامة وبوابة الدفع بنجاح ✅' });
  } catch (err) {
    console.error('[SiteSettingsAPI] POST exception:', err);
    return NextResponse.json({ error: 'Failed to update site settings' }, { status: 500 });
  }
}
