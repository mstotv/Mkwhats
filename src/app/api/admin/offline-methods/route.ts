import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard';

export async function GET() {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('offline_payment_methods')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AdminOfflineMethods] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch methods' }, { status: 500 });
    }

    return NextResponse.json({ methods: data || [] });
  } catch (err) {
    console.error('[AdminOfflineMethods] GET Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      name_ar,
      name_en,
      account_name,
      account_number,
      logo_url,
      instructions,
      instructions_ar,
      instructions_en,
      is_active = true,
      display_order = 0,
    } = body || {};

    if (!name || !account_number) {
      return NextResponse.json({ error: 'يرجى تقديم اسم طريقة الدفع ورقم الحساب' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('offline_payment_methods')
      .insert({
        name,
        name_ar: name_ar || name,
        name_en: name_en || name,
        account_name: account_name || null,
        account_number,
        logo_url: logo_url || null,
        instructions: instructions || null,
        instructions_ar: instructions_ar || instructions || null,
        instructions_en: instructions_en || instructions || null,
        is_active: Boolean(is_active),
        display_order: Number(display_order) || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[AdminOfflineMethods] POST error:', error);
      return NextResponse.json({ error: 'فشل إضافة طريقة الدفع' }, { status: 500 });
    }

    return NextResponse.json({ success: true, method: data });
  } catch (err) {
    console.error('[AdminOfflineMethods] POST Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body || {};

    if (!id) {
      return NextResponse.json({ error: 'Missing method ID' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('offline_payment_methods')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[AdminOfflineMethods] PUT error:', error);
      return NextResponse.json({ error: 'فشل تحديث بيانات طريقة الدفع' }, { status: 500 });
    }

    return NextResponse.json({ success: true, method: data });
  } catch (err) {
    console.error('[AdminOfflineMethods] PUT Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing method ID' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { error } = await serviceClient
      .from('offline_payment_methods')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[AdminOfflineMethods] DELETE error:', error);
      return NextResponse.json({ error: 'فشل حذف طريقة الدفع' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[AdminOfflineMethods] DELETE Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
