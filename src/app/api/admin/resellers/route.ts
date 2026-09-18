import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard';

export async function GET() {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceClient();

    // 1. Fetch all resellers with plans and owner accounts
    const { data: resellers, error: resError } = await supabase
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
        custom_settings,
        created_at,
        updated_at,
        plan:reseller_plans (
          id,
          name,
          name_ar,
          slug,
          price_monthly,
          price_yearly,
          max_accounts,
          max_custom_domains,
          features
        ),
        owner_account:accounts!owner_account_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (resError) {
      console.error('[AdminResellersAPI] Error fetching resellers:', resError);
      return NextResponse.json({ error: resError.message }, { status: 500 });
    }

    // 2. Fetch account counts per reseller
    const { data: subAccounts, error: accError } = await supabase
      .from('accounts')
      .select('id, reseller_id')
      .not('reseller_id', 'is', null);

    const accountCountMap: Record<string, number> = {};
    if (subAccounts) {
      for (const acc of subAccounts) {
        if (acc.reseller_id) {
          accountCountMap[acc.reseller_id] = (accountCountMap[acc.reseller_id] || 0) + 1;
        }
      }
    }

    // 3. Fetch available plans for modal creation
    const { data: plans } = await supabase
      .from('reseller_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    // 4. Fetch available candidate accounts for assigning owner
    const { data: candidateAccounts } = await supabase
      .from('accounts')
      .select('id, name')
      .order('name', { ascending: true })
      .limit(100);

    // 5. Calculate KPIs
    const totalResellers = resellers?.length || 0;
    let activeCount = 0;
    let graceCount = 0;
    let suspendedCount = 0;
    let totalSubAccounts = subAccounts?.length || 0;
    let estimatedMrr = 0;

    const enrichedResellers = (resellers || []).map((r) => {
      const subCount = accountCountMap[r.id] || 0;
      if (r.status === 'active') {
        activeCount++;
        const planPrice = Number((r.plan as any)?.price_monthly || 0);
        estimatedMrr += planPrice;
      } else if (r.status === 'grace_period') {
        graceCount++;
      } else if (r.status === 'suspended') {
        suspendedCount++;
      }

      return {
        ...r,
        sub_accounts_count: subCount,
      };
    });

    return NextResponse.json({
      resellers: enrichedResellers,
      plans: plans || [],
      accounts: candidateAccounts || [],
      stats: {
        totalResellers,
        activeCount,
        graceCount,
        suspendedCount,
        totalSubAccounts,
        estimatedMrr,
      },
    });
  } catch (err: any) {
    console.error('[AdminResellersAPI] Server error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      display_name,
      display_name_ar,
      subdomain,
      custom_domain,
      plan_id,
      owner_account_id,
      support_email,
      support_whatsapp,
      primary_color,
      status = 'active',
      subscription_months = 1,
      custom_max_accounts,
    } = body;

    if (!display_name || !subdomain || !plan_id) {
      return NextResponse.json(
        { error: 'display_name, subdomain, and plan_id are required' },
        { status: 400 }
      );
    }

    // Clean and validate subdomain
    const cleanSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanSubdomain || cleanSubdomain.length < 3) {
      return NextResponse.json(
        { error: 'Subdomain must be at least 3 alphanumeric characters' },
        { status: 400 }
      );
    }

    // Reserved subdomains check
    const reserved = ['admin', 'api', 'app', 'www', 'mail', 'store', 'portal', 'dashboard', 'auth'];
    if (reserved.includes(cleanSubdomain)) {
      return NextResponse.json(
        { error: 'This subdomain is reserved by the platform' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check if subdomain already exists
    const { data: existing } = await supabase
      .from('resellers')
      .select('id')
      .eq('subdomain', cleanSubdomain)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Subdomain is already in use by another reseller' },
        { status: 400 }
      );
    }

    // Calculate expiration date
    const now = new Date();
    const expiresAt = new Date(now.getTime() + subscription_months * 30 * 24 * 60 * 60 * 1000);

    // Insert reseller
    const { data: newReseller, error: insertError } = await supabase
      .from('resellers')
      .insert({
        display_name,
        display_name_ar: display_name_ar || display_name,
        subdomain: cleanSubdomain,
        custom_domain: custom_domain ? custom_domain.trim().toLowerCase() : null,
        plan_id,
        owner_account_id: owner_account_id || null,
        support_email: support_email || null,
        support_whatsapp: support_whatsapp || null,
        primary_color: primary_color || '#10b981',
        status,
        subscription_expires_at: expiresAt.toISOString(),
        custom_max_accounts: custom_max_accounts ? Number(custom_max_accounts) : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[AdminResellersAPI] Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // If owner account was provided, also assign its owner user as reseller_admin
    if (owner_account_id) {
      const { data: acc } = await supabase
        .from('accounts')
        .select('owner_user_id')
        .eq('id', owner_account_id)
        .maybeSingle();

      if (acc?.owner_user_id) {
        await supabase
          .from('reseller_admins')
          .upsert(
            {
              reseller_id: newReseller.id,
              user_id: acc.owner_user_id,
              role: 'owner',
            },
            { onConflict: 'reseller_id,user_id', ignoreDuplicates: true }
          );
      }
    }

    return NextResponse.json({ success: true, reseller: newReseller });
  } catch (err: any) {
    console.error('[AdminResellersAPI] Create error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
