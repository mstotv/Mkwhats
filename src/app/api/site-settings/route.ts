import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('site_settings')
      .select(`
        platform_name,
        platform_name_ar,
        platform_name_en,
        logo_url,
        logo_height,
        currency_symbol,
        primary_color,
        theme_colors,
        support_email,
        support_whatsapp,
        support_telegram,
        support_floating_enabled,
        user_panel_support_enabled,
        maintenance_mode,
        plisio_enabled,
        stripe_enabled,
        stripe_publishable_key,
        google_auth_enabled,
        google_client_id,
        hero_content,
        features_content,
        how_it_works_content,
        testimonials,
        faqs,
        cta_banner_content,
        social_links,
        partners,
        header_links,
        footer_links
      `)
      .limit(1)
      .maybeSingle();

    // Normalize: ensure bilingual name fields are always strings (never null)
    // and sensitive keys (secret_keys, webhook_secrets) are NEVER exposed to the public
    const normalized = data ? {
      ...data,
      platform_name: data.platform_name ?? '',
      platform_name_ar: data.platform_name_ar ?? '',
      platform_name_en: data.platform_name_en ?? '',
      logo_url: data.logo_url ?? '',
      logo_height: data.logo_height ?? 32,
      currency_symbol: data.currency_symbol ?? '$',
      primary_color: data.primary_color ?? '#00A389',
      maintenance_mode: Boolean(data.maintenance_mode),
      plisio_enabled: Boolean(data.plisio_enabled),
      stripe_enabled: Boolean(data.stripe_enabled),
      stripe_publishable_key: data.stripe_publishable_key ?? '',
      google_auth_enabled: Boolean(data.google_auth_enabled),
      google_client_id: data.google_client_id ?? '',
    } : {
      platform_name: '',
      platform_name_ar: '',
      platform_name_en: '',
      logo_url: '',
      logo_height: 32,
      currency_symbol: '$',
      primary_color: '#00A389',
      support_email: '',
      support_whatsapp: '',
      support_telegram: '',
      support_floating_enabled: true,
      user_panel_support_enabled: true,
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
