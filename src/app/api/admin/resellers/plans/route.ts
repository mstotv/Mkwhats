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
    const { data: plans, error } = await supabase
      .from('reseller_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plans: plans || [] });
  } catch (err: any) {
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
      name,
      name_ar,
      slug,
      price_monthly = 0,
      price_yearly = 0,
      max_accounts = 10,
      max_custom_domains = 1,
      features = {},
      is_popular = false,
      is_active = true,
      sort_order = 0,
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    const { data: plan, error } = await supabase
      .from('reseller_plans')
      .insert({
        name,
        name_ar: name_ar || name,
        slug: cleanSlug,
        price_monthly: Number(price_monthly),
        price_yearly: Number(price_yearly),
        max_accounts: Number(max_accounts),
        max_custom_domains: Number(max_custom_domains),
        features,
        is_popular: Boolean(is_popular),
        is_active: Boolean(is_active),
        sort_order: Number(sort_order),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Plan id is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('reseller_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Plan id is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Check if any reseller is currently using this plan
    const { count } = await supabase
      .from('resellers')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete plan because it is currently assigned to one or more resellers' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('reseller_plans').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
