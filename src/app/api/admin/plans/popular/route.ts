import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard';

export async function POST(req: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { target_plan_id } = await req.json();
    if (!target_plan_id) {
      return NextResponse.json({ error: 'Missing target_plan_id' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Unset all popular flags with explicit WHERE clause
    const { error: resetErr } = await supabase
      .from('plans')
      .update({ is_popular: false })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (resetErr) {
      console.warn('[SetPopularAPI] Reset popular flag note:', resetErr);
    }

    // 2. Set target plan as popular
    const { error: setErr } = await supabase
      .from('plans')
      .update({ is_popular: true })
      .eq('id', target_plan_id);

    if (setErr) {
      console.error('[SetPopularAPI] Set error:', setErr);
      throw setErr;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[SetPopularAPI] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
