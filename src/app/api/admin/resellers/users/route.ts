import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard';

export async function GET(request: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const resellerId = searchParams.get('reseller_id');

    const supabase = createServiceClient();

    // 1. Fetch sub-accounts query
    let query = supabase
      .from('accounts')
      .select(`
        id,
        name,
        created_at,
        is_suspended,
        reseller_id,
        reseller:resellers!reseller_id (
          id,
          display_name,
          display_name_ar,
          subdomain
        ),
        profiles (
          id,
          user_id,
          email,
          full_name,
          account_role
        ),
        subscriptions (
          id,
          status,
          billing_cycle,
          plan:plans (
            id,
            name
          )
        )
      `)
      .not('reseller_id', 'is', null)
      .order('created_at', { ascending: false });

    if (resellerId) {
      query = query.eq('reseller_id', resellerId);
    }

    const { data: accounts, error: accError } = await query;
    if (accError) {
      return NextResponse.json({ error: accError.message }, { status: 500 });
    }

    // 2. Fetch reseller admins
    let adminsQuery = supabase
      .from('reseller_admins')
      .select(`
        id,
        reseller_id,
        user_id,
        role,
        created_at,
        reseller:resellers (
          id,
          display_name,
          subdomain
        )
      `)
      .order('created_at', { ascending: false });

    if (resellerId) {
      adminsQuery = adminsQuery.eq('reseller_id', resellerId);
    }

    const { data: admins, error: adminErr } = await adminsQuery;
    if (adminErr) {
      return NextResponse.json({ error: adminErr.message }, { status: 500 });
    }

    return NextResponse.json({ accounts: accounts || [], admins: admins || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
