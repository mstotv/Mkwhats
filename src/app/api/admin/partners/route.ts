import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard';

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.warn('[PartnersAPI] Query error fallback:', error);
    }

    return NextResponse.json({ partners: data ?? [] });
  } catch (err) {
    console.error('[PartnersAPI] GET error:', err);
    return NextResponse.json({ partners: [] });
  }
}

export async function POST(req: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, logo_url } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'يرجى كتابة اسم الشريك/الشركة' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('partners')
      .insert({
        name: name.trim(),
        logo_url: logo_url || '',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, partner: data });
  } catch (err) {
    console.error('[PartnersAPI] POST error:', err);
    return NextResponse.json({ error: 'فشل إضافة الشريك' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { partner_id } = await req.json();
    if (!partner_id) {
      return NextResponse.json({ error: 'Missing partner_id' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from('partners').delete().eq('id', partner_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PartnersAPI] DELETE error:', err);
    return NextResponse.json({ error: 'فشل حذف الشريك' }, { status: 500 });
  }
}
