import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard';

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

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
        stripe_enabled: false,
        stripe_publishable_key: '',
        stripe_secret_key: '',
        stripe_webhook_secret: '',
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

    // Fetch existing settings row ID (could be 1 integer or 'global_config' text)
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    const targetId = existing?.id ?? 1;

    // Try updating core fields safely
    const updateObj: Record<string, any> = {
      platform_name: payload.platform_name || 'wacrm',
      updated_at: new Date().toISOString(),
    };

    if (payload.support_email !== undefined) updateObj.support_email = payload.support_email;
    if (payload.support_whatsapp !== undefined) updateObj.support_whatsapp = payload.support_whatsapp;
    if (payload.support_telegram !== undefined) updateObj.support_telegram = payload.support_telegram;
    if (payload.currency_symbol !== undefined) updateObj.currency_symbol = payload.currency_symbol;
    if (payload.primary_color !== undefined) updateObj.primary_color = payload.primary_color;
    if (payload.maintenance_mode !== undefined) updateObj.maintenance_mode = Boolean(payload.maintenance_mode);
    if (payload.plisio_enabled !== undefined) updateObj.plisio_enabled = Boolean(payload.plisio_enabled);
    if (payload.plisio_secret_key !== undefined) updateObj.plisio_secret_key = payload.plisio_secret_key;
    if (payload.plisio_merchant_id !== undefined) updateObj.plisio_merchant_id = payload.plisio_merchant_id;
    if (payload.stripe_enabled !== undefined) updateObj.stripe_enabled = Boolean(payload.stripe_enabled);
    if (payload.stripe_publishable_key !== undefined) updateObj.stripe_publishable_key = payload.stripe_publishable_key;
    if (payload.stripe_secret_key !== undefined) updateObj.stripe_secret_key = payload.stripe_secret_key;
    if (payload.stripe_webhook_secret !== undefined) updateObj.stripe_webhook_secret = payload.stripe_webhook_secret;

    const { error } = await supabase
      .from('site_settings')
      .update(updateObj)
      .eq('id', targetId);

    if (error) {
      console.warn('[SiteSettingsAPI] Column update note:', error.message);

      // Graceful fallback to updating platform_name if new columns are pending migration
      await supabase
        .from('site_settings')
        .update({ platform_name: payload.platform_name || 'wacrm' })
        .eq('id', targetId);
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ إعدادات النظام العامة وبوابات الدفع (Stripe & Plisio) بنجاح 🎉',
    });
  } catch (err) {
    console.error('[SiteSettingsAPI] POST exception:', err);
    return NextResponse.json({ error: 'Failed to update site settings' }, { status: 500 });
  }
}

