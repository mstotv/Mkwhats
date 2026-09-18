import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // 1. Check if user is in reseller_admins
    const { data: adminRecord } = await serviceClient
      .from('reseller_admins')
      .select('reseller_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    let resellerId = adminRecord?.reseller_id;

    // 2. If not found in reseller_admins, check if user's account owns a reseller
    if (!resellerId) {
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('account_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.account_id) {
        const { data: ownedReseller } = await serviceClient
          .from('resellers')
          .select('id')
          .eq('owner_account_id', profile.account_id)
          .maybeSingle();

        if (ownedReseller) {
          resellerId = ownedReseller.id;
        }
      }
    }

    // 3. If NOT a reseller -> return plans for the onboarding/showcase view
    if (!resellerId) {
      const { data: plans } = await serviceClient
        .from('reseller_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      return NextResponse.json({
        isReseller: false,
        plans: plans || [],
      });
    }

    // 4. User IS a reseller -> fetch all details
    const [
      { data: reseller, error: resError },
      { data: siteSettings },
      { data: subAccounts },
    ] = await Promise.all([
      serviceClient
        .from('resellers')
        .select(`
          id,
          subdomain,
          custom_domain,
          display_name,
          display_name_ar,
          logo_url,
          favicon_url,
          primary_color,
          support_email,
          support_whatsapp,
          status,
          subscription_expires_at,
          grace_period_ends_at,
          custom_max_accounts,
          plan:reseller_plans (
            id,
            name,
            name_ar,
            price_monthly,
            price_yearly,
            max_accounts,
            max_custom_domains,
            features
          )
        `)
        .eq('id', resellerId)
        .single(),
      serviceClient
        .from('reseller_site_settings')
        .select('*')
        .eq('reseller_id', resellerId)
        .maybeSingle(),
      serviceClient
        .from('accounts')
        .select(`
          id,
          name,
          created_at,
          is_suspended,
          profiles ( id, email, full_name )
        `)
        .eq('reseller_id', resellerId)
        .order('created_at', { ascending: false }),
    ]);

    if (resError || !reseller) {
      return NextResponse.json({ error: 'Reseller record not found' }, { status: 404 });
    }

    const maxAllowed = reseller.custom_max_accounts || (reseller.plan as any)?.max_accounts || 10;
    const subCount = subAccounts?.length || 0;

    return NextResponse.json({
      isReseller: true,
      role: adminRecord?.role || 'owner',
      reseller,
      settings: siteSettings || {},
      subAccounts: subAccounts || [],
      stats: {
        subCount,
        maxAllowed,
        usagePercent: Math.min(100, Math.round((subCount / maxAllowed) * 100)),
      },
    });
  } catch (err: any) {
    console.error('[ResellerPortalAPI] Error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reseller_id, settings, branding } = body;

    if (!reseller_id) {
      return NextResponse.json({ error: 'reseller_id is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Verify user is an owner/manager of this reseller
    const { data: adminRecord } = await serviceClient
      .from('reseller_admins')
      .select('role')
      .eq('reseller_id', reseller_id)
      .eq('user_id', user.id)
      .maybeSingle();

    let isAllowed = adminRecord && ['owner', 'manager'].includes(adminRecord.role);

    if (!isAllowed) {
      // Check if user owns the account linked to this reseller
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('account_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.account_id) {
        const { data: owned } = await serviceClient
          .from('resellers')
          .select('id')
          .eq('id', reseller_id)
          .eq('owner_account_id', profile.account_id)
          .maybeSingle();

        if (owned) isAllowed = true;
      }
    }

    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Update Reseller Table (display_name, colors, contact)
    if (branding) {
      const resellerUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (branding.display_name) resellerUpdates.display_name = branding.display_name;
      if (branding.display_name_ar) resellerUpdates.display_name_ar = branding.display_name_ar;
      if (branding.primary_color) resellerUpdates.primary_color = branding.primary_color;
      if (branding.logo_url !== undefined) resellerUpdates.logo_url = branding.logo_url;
      if (branding.favicon_url !== undefined) resellerUpdates.favicon_url = branding.favicon_url;
      if (branding.support_email !== undefined) resellerUpdates.support_email = branding.support_email;
      if (branding.support_whatsapp !== undefined) resellerUpdates.support_whatsapp = branding.support_whatsapp;
      if (branding.custom_domain !== undefined) resellerUpdates.custom_domain = branding.custom_domain ? branding.custom_domain.trim().toLowerCase() : null;

      await serviceClient
        .from('resellers')
        .update(resellerUpdates)
        .eq('id', reseller_id);
    }

    // 2. Update Reseller Site Settings (Platform Name, Payment Gateways)
    if (settings) {
      const siteSettingsUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (settings.platform_name) siteSettingsUpdates.platform_name = settings.platform_name;
      if (settings.platform_name_ar) siteSettingsUpdates.platform_name_ar = settings.platform_name_ar;
      if (settings.logo_url !== undefined) siteSettingsUpdates.logo_url = settings.logo_url;
      if (settings.favicon_url !== undefined) siteSettingsUpdates.favicon_url = settings.favicon_url;
      if (settings.primary_color) siteSettingsUpdates.primary_color = settings.primary_color;
      if (settings.support_email !== undefined) siteSettingsUpdates.support_email = settings.support_email;
      if (settings.support_whatsapp !== undefined) siteSettingsUpdates.support_whatsapp = settings.support_whatsapp;
      if (settings.telegram_handle !== undefined) siteSettingsUpdates.telegram_handle = settings.telegram_handle;

      // Payment gateways
      if (settings.stripe_enabled !== undefined) siteSettingsUpdates.stripe_enabled = Boolean(settings.stripe_enabled);
      if (settings.stripe_publishable_key !== undefined) siteSettingsUpdates.stripe_publishable_key = settings.stripe_publishable_key;
      if (settings.stripe_secret_key !== undefined) siteSettingsUpdates.stripe_secret_key = settings.stripe_secret_key;
      if (settings.plisio_enabled !== undefined) siteSettingsUpdates.plisio_enabled = Boolean(settings.plisio_enabled);
      if (settings.plisio_api_key !== undefined) siteSettingsUpdates.plisio_api_key = settings.plisio_api_key;
      if (settings.offline_payment_enabled !== undefined) siteSettingsUpdates.offline_payment_enabled = Boolean(settings.offline_payment_enabled);
      if (settings.offline_payment_instructions !== undefined) siteSettingsUpdates.offline_payment_instructions = settings.offline_payment_instructions;
      if (settings.offline_payment_instructions_ar !== undefined) siteSettingsUpdates.offline_payment_instructions_ar = settings.offline_payment_instructions_ar;

      await serviceClient
        .from('reseller_site_settings')
        .upsert(
          { reseller_id, ...siteSettingsUpdates },
          { onConflict: 'reseller_id' }
        );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[ResellerPortalPatchAPI] Error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
