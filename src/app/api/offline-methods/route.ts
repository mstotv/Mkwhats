import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('offline_payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[OfflineMethodsAPI] Database error:', error);
      return NextResponse.json({ methods: [] });
    }

    return NextResponse.json({ methods: data || [] });
  } catch (err) {
    console.error('[OfflineMethodsAPI] Exception:', err);
    return NextResponse.json({ methods: [] }, { status: 500 });
  }
}
