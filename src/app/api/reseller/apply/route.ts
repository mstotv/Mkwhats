import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      plan_id,
      brand_name,
      subdomain,
      whatsapp_number,
      notes,
    } = body;

    if (!plan_id || !brand_name || !subdomain) {
      return NextResponse.json(
        { error: 'Plan, brand name, and subdomain are required' },
        { status: 400 }
      );
    }

    const cleanSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanSubdomain || cleanSubdomain.length < 3) {
      return NextResponse.json(
        { error: 'Subdomain must be at least 3 characters' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Check if subdomain is taken
    const { data: existing } = await serviceClient
      .from('resellers')
      .select('id')
      .eq('subdomain', cleanSubdomain)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Subdomain is already taken' },
        { status: 400 }
      );
    }

    // Get user's account
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('account_id, email, full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.account_id) {
      return NextResponse.json(
        { error: 'User does not have an active account' },
        { status: 400 }
      );
    }

    // Check if account is already a reseller
    const { data: alreadyReseller } = await serviceClient
      .from('resellers')
      .select('id')
      .eq('owner_account_id', profile.account_id)
      .maybeSingle();

    if (alreadyReseller) {
      return NextResponse.json(
        { error: 'Your account is already registered as a reseller partner' },
        { status: 400 }
      );
    }

    // Create Reseller with status = 'pending_setup'
    const { data: newReseller, error: insertErr } = await serviceClient
      .from('resellers')
      .insert({
        owner_account_id: profile.account_id,
        plan_id,
        subdomain: cleanSubdomain,
        display_name: brand_name,
        display_name_ar: brand_name,
        status: 'pending_setup',
        support_email: profile.email,
        support_whatsapp: whatsapp_number || null,
        custom_settings: {
          application_notes: notes || '',
          applied_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertErr) {
      console.error('[ResellerApplyAPI] Error:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Add user as reseller_admin owner
    await serviceClient
      .from('reseller_admins')
      .upsert(
        {
          reseller_id: newReseller.id,
          user_id: user.id,
          role: 'owner',
        },
        { onConflict: 'reseller_id,user_id', ignoreDuplicates: true }
      );

    return NextResponse.json({
      success: true,
      reseller: newReseller,
      message: 'Application submitted successfully. Platform admin will review and activate your portal.',
    });
  } catch (err: any) {
    console.error('[ResellerApplyAPI] Server error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
