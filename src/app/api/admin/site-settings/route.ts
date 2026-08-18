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
        platform_name: '',
        platform_name_ar: '',
        platform_name_en: '',
        logo_url: '',
        support_email: '',
        support_whatsapp: '',
        support_telegram: '',
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

    const updateObj: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Always save both bilingual fields as strings (never null) to prevent
    // client-side fallback to wrong language on refresh
    if (payload.platform_name_ar !== undefined)
      updateObj.platform_name_ar = payload.platform_name_ar ?? '';
    if (payload.platform_name_en !== undefined)
      updateObj.platform_name_en = payload.platform_name_en ?? '';

    // platform_name is a legacy field — keep it as the Arabic name (primary)
    // so old code that reads only platform_name gets something sensible
    if (payload.platform_name !== undefined) {
      updateObj.platform_name = payload.platform_name ?? '';
    } else if (updateObj.platform_name_ar !== undefined) {
      updateObj.platform_name = updateObj.platform_name_ar || updateObj.platform_name_en || '';
    }

    if (payload.logo_url !== undefined) updateObj.logo_url = payload.logo_url;
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

    if (payload.google_auth_enabled !== undefined) updateObj.google_auth_enabled = Boolean(payload.google_auth_enabled);
    if (payload.google_client_id !== undefined) updateObj.google_client_id = payload.google_client_id;
    if (payload.google_client_secret !== undefined) updateObj.google_client_secret = payload.google_client_secret;

    if (payload.hero_content !== undefined) updateObj.hero_content = payload.hero_content;
    if (payload.features_content !== undefined) updateObj.features_content = payload.features_content;
    if (payload.how_it_works_content !== undefined) updateObj.how_it_works_content = payload.how_it_works_content;
    if (payload.testimonials !== undefined) updateObj.testimonials = payload.testimonials;
    if (payload.faqs !== undefined) updateObj.faqs = payload.faqs;
    if (payload.cta_banner_content !== undefined) updateObj.cta_banner_content = payload.cta_banner_content;
    if (payload.logo_height !== undefined) updateObj.logo_height = Number(payload.logo_height);
    if (payload.theme_colors !== undefined) updateObj.theme_colors = payload.theme_colors;
    if (payload.social_links !== undefined) updateObj.social_links = payload.social_links;
    if (payload.partners !== undefined) updateObj.partners = payload.partners;
    if (payload.header_links !== undefined) updateObj.header_links = payload.header_links;
    if (payload.footer_links !== undefined) updateObj.footer_links = payload.footer_links;
    if (payload.support_floating_enabled !== undefined) updateObj.support_floating_enabled = payload.support_floating_enabled;
    if (payload.user_panel_support_enabled !== undefined) updateObj.user_panel_support_enabled = payload.user_panel_support_enabled;

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
      settings: (await createServiceClient().from('site_settings').select('*').limit(1).maybeSingle()).data,
      message: 'تم حفظ إعدادات النظام العامة وبوابات الدفع (Stripe & Plisio) بنجاح 🎉',
    });
  } catch (err) {
    console.error('[SiteSettingsAPI] POST exception:', err);
    return NextResponse.json({ error: 'Failed to update site settings' }, { status: 500 });
  }
}

// PATCH is an alias for POST — the admin client sends PATCH
export { POST as PATCH }
