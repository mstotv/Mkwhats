import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { BusinessHour } from '@/lib/appointments/types';

const DEFAULT_DAYS: BusinessHour[] = [
  { day_of_week: 0, is_open: true, open_time: '09:00:00', close_time: '17:00:00' }, // Sunday
  { day_of_week: 1, is_open: true, open_time: '09:00:00', close_time: '17:00:00' }, // Monday
  { day_of_week: 2, is_open: true, open_time: '09:00:00', close_time: '17:00:00' }, // Tuesday
  { day_of_week: 3, is_open: true, open_time: '09:00:00', close_time: '17:00:00' }, // Wednesday
  { day_of_week: 4, is_open: true, open_time: '09:00:00', close_time: '17:00:00' }, // Thursday
  { day_of_week: 5, is_open: false, open_time: '09:00:00', close_time: '17:00:00' }, // Friday (Weekend)
  { day_of_week: 6, is_open: true, open_time: '09:00:00', close_time: '17:00:00' }, // Saturday
];

export async function GET() {
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

    const { data: hours, error } = await service
      .from('business_hours')
      .select('*')
      .eq('account_id', accountId)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('[business-hours] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no records in DB yet, return defaults mapped for this account
    if (!hours || hours.length === 0) {
      return NextResponse.json({
        business_hours: DEFAULT_DAYS.map((d) => ({ ...d, account_id: accountId })),
      });
    }

    // Ensure all 7 days (0..6) are present in the response
    const fullWeek = DEFAULT_DAYS.map((def) => {
      const existing = hours.find((h: any) => h.day_of_week === def.day_of_week);
      return existing || { ...def, account_id: accountId };
    });

    return NextResponse.json({ business_hours: fullWeek });
  } catch (err: any) {
    console.error('[business-hours] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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
      .select('account_id, role')
      .eq('user_id', user.id)
      .single();

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const accountId = profile.account_id;
    const body = await request.json();
    const items: BusinessHour[] = Array.isArray(body.business_hours) ? body.business_hours : [];

    if (items.length === 0) {
      return NextResponse.json({ error: 'No business hours provided' }, { status: 400 });
    }

    // Upsert each day
    const upsertRows = items.map((item) => ({
      account_id: accountId,
      day_of_week: item.day_of_week,
      is_open: Boolean(item.is_open),
      open_time: item.open_time || '09:00:00',
      close_time: item.close_time || '17:00:00',
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await service
      .from('business_hours')
      .upsert(upsertRows, { onConflict: 'account_id,day_of_week' })
      .select('*')
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('[business-hours] PUT error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, business_hours: data });
  } catch (err: any) {
    console.error('[business-hours] unexpected PUT error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
