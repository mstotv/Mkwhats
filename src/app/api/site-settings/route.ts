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
        favicon_url,
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
        plisio_secret_key,
        stripe_enabled,
        stripe_publishable_key,
        stripe_secret_key,
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
      platform_name: data.platform_name ?? '',
      platform_name_ar: data.platform_name_ar ?? '',
      platform_name_en: data.platform_name_en ?? '',
      logo_url: data.logo_url ?? '',
      favicon_url: data.favicon_url ?? '',
      logo_height: data.logo_height ?? 32,
      currency_symbol: data.currency_symbol ?? '$',
      primary_color: data.primary_color ?? '#00A389',
      maintenance_mode: Boolean(data.maintenance_mode),
      plisio_enabled: Boolean(data.plisio_enabled && data.plisio_secret_key?.trim()),
      stripe_enabled: Boolean(data.stripe_enabled && data.stripe_secret_key?.trim()),
      stripe_publishable_key: data.stripe_publishable_key ?? '',
      google_auth_enabled: Boolean(data.google_auth_enabled),
      google_client_id: data.google_client_id ?? '',
      support_email: data.support_email ?? '',
      support_whatsapp: data.support_whatsapp ?? '',
      support_telegram: data.support_telegram ?? '',
      support_floating_enabled: data.support_floating_enabled ?? true,
      user_panel_support_enabled: data.user_panel_support_enabled ?? true,
      hero_content: data.hero_content ?? null,
      features_content: data.features_content ?? null,
      how_it_works_content: data.how_it_works_content ?? null,
      testimonials: data.testimonials ?? null,
      faqs: data.faqs ?? null,
      cta_banner_content: data.cta_banner_content ?? null,
      social_links: data.social_links ?? null,
      partners: data.partners ?? null,
      header_links: data.header_links ?? null,
      footer_links: data.footer_links ?? null,
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
