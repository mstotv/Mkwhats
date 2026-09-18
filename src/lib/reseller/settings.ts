import { headers } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { extractResellerHostInfo } from './subdomain';

export interface EffectiveSiteSettings {
  platform_name: string;
  platform_name_ar: string;
  platform_name_en: string;
  logo_url: string;
  favicon_url: string;
  logo_height: number;
  currency_symbol: string;
  primary_color: string;
  theme_colors?: any;
  support_email: string;
  support_whatsapp: string;
  support_telegram?: string;
  support_floating_enabled?: boolean;
  user_panel_support_enabled?: boolean;
  maintenance_mode?: boolean;
  plisio_enabled?: boolean;
  stripe_enabled?: boolean;
  stripe_publishable_key?: string;
  google_auth_enabled?: boolean;
  google_client_id?: string;
  hero_content?: any;
  features_content?: any;
  how_it_works_content?: any;
  home_content?: any;
  testimonials?: any;
  faqs?: any;
  cta_banner_content?: any;
  social_links?: any;
  partners?: any;
  header_links?: any;
  footer_links?: any;
  is_reseller_portal: boolean;
  reseller_id?: string;
  reseller_subdomain?: string;
}

/**
 * Resolves effective site settings by inspecting the incoming request host/headers.
 * If the request originates from a White-Label Reseller tenant (subdomain or custom domain),
 * the reseller's custom branding (name, logo, favicon, color, contacts) overrides the platform defaults.
 */
export async function getEffectiveSiteSettings(): Promise<EffectiveSiteSettings> {
  const serviceClient = createServiceClient();

  // 1. Fetch base platform settings
  const { data: base } = await serviceClient
    .from('site_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  const defaultSettings: EffectiveSiteSettings = {
    platform_name: base?.platform_name || 'MK Whats',
    platform_name_ar: base?.platform_name_ar || base?.platform_name || 'واتساب أوتوميشن',
    platform_name_en: base?.platform_name_en || base?.platform_name || 'MK Whats',
    logo_url: base?.logo_url || '',
    favicon_url: base?.favicon_url || '',
    logo_height: base?.logo_height || 32,
    currency_symbol: base?.currency_symbol || '$',
    primary_color: base?.primary_color || '#00A389',
    theme_colors: base?.theme_colors,
    support_email: base?.support_email || '',
    support_whatsapp: base?.support_whatsapp || '',
    support_telegram: base?.support_telegram || '',
    support_floating_enabled: base?.support_floating_enabled ?? true,
    user_panel_support_enabled: base?.user_panel_support_enabled ?? true,
    maintenance_mode: Boolean(base?.maintenance_mode),
    plisio_enabled: Boolean(base?.plisio_enabled && base?.plisio_secret_key?.trim()),
    stripe_enabled: Boolean(base?.stripe_enabled && base?.stripe_secret_key?.trim()),
    stripe_publishable_key: base?.stripe_publishable_key || '',
    google_auth_enabled: Boolean(base?.google_auth_enabled),
    google_client_id: base?.google_client_id || '',
    hero_content: base?.hero_content,
    features_content: base?.features_content,
    how_it_works_content: base?.how_it_works_content,
    home_content: base?.home_content,
    testimonials: base?.testimonials,
    faqs: base?.faqs,
    cta_banner_content: base?.cta_banner_content,
    social_links: base?.social_links,
    partners: base?.partners,
    header_links: base?.header_links,
    footer_links: base?.footer_links,
    is_reseller_portal: false,
  };

  try {
    const headerList = await headers();
    const hostHeader = headerList.get('x-forwarded-host') || headerList.get('host');
    const resellerIdHeader = headerList.get('x-reseller-id');

    let resellerRow: any = null;

    if (resellerIdHeader) {
      const { data } = await serviceClient
        .from('resellers')
        .select('*')
        .eq('id', resellerIdHeader)
        .maybeSingle();
      resellerRow = data;
    } else {
      const hostInfo = extractResellerHostInfo(hostHeader);
      if (!hostInfo.isMainPlatform && (hostInfo.subdomain || hostInfo.customDomain)) {
        let q = serviceClient.from('resellers').select('*');
        if (hostInfo.subdomain) {
          q = q.eq('subdomain', hostInfo.subdomain);
        } else if (hostInfo.customDomain) {
          q = q.eq('custom_domain', hostInfo.customDomain);
        }
        const { data } = await q.maybeSingle();
        resellerRow = data;
      }
    }

    if (resellerRow) {
      // Also fetch reseller_site_settings if available for more overrides
      const { data: resSettings } = await serviceClient
        .from('reseller_site_settings')
        .select('*')
        .eq('reseller_id', resellerRow.id)
        .maybeSingle();

      const nameEn = resSettings?.platform_name_en || resellerRow.display_name || defaultSettings.platform_name_en;
      const nameAr = resSettings?.platform_name_ar || resellerRow.display_name_ar || resellerRow.display_name || defaultSettings.platform_name_ar;

      return {
        ...defaultSettings,
        platform_name: nameEn,
        platform_name_en: nameEn,
        platform_name_ar: nameAr,
        logo_url: resSettings?.logo_url || resellerRow.logo_url || defaultSettings.logo_url,
        favicon_url: resSettings?.favicon_url || resellerRow.favicon_url || defaultSettings.favicon_url,
        primary_color: resSettings?.primary_color || resellerRow.primary_color || defaultSettings.primary_color,
        support_email: resSettings?.support_email || resellerRow.support_email || defaultSettings.support_email,
        support_whatsapp: resSettings?.support_whatsapp || resellerRow.support_whatsapp || defaultSettings.support_whatsapp,
        is_reseller_portal: true,
        reseller_id: resellerRow.id,
        reseller_subdomain: resellerRow.subdomain,
      };
    }
  } catch (err) {
    console.error('[getEffectiveSiteSettings] Error checking reseller context:', err);
  }

  return defaultSettings;
}
