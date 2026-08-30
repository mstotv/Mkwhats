import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkSlotAvailability } from '@/lib/appointments/appointment-service';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = createServiceClient();
    const { data: profile } = await service
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const accountId = profile.account_id;
    const body = await request.json();
    const { scheduled_at, exclude_id } = body;

    if (!scheduled_at) {
      return NextResponse.json(
        { error: 'Missing scheduled_at datetime' },
        { status: 400 }
      );
    }

    const avail = await checkSlotAvailability(
      service,
      accountId,
      scheduled_at,
      exclude_id
    );

    return NextResponse.json(avail);
  } catch (err: any) {
    console.error('[appointments-availability] POST error:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
