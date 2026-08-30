import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { AppointmentSettings } from '@/lib/appointments/types';

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

    // Fetch appointment settings & ai_configs for appointments_enabled
    const [settingsRes, aiConfigRes] = await Promise.all([
      service
        .from('appointment_settings')
        .select('*')
        .eq('account_id', accountId)
        .maybeSingle(),
      service
        .from('ai_configs')
        .select('appointments_enabled')
        .eq('account_id', accountId)
        .maybeSingle(),
    ]);

    const settings: AppointmentSettings = settingsRes.data || {
      account_id: accountId,
      slot_duration_minutes: 60,
      timezone: 'Asia/Baghdad',
      booking_confirmation_msg: 'تم تأكيد موعدك بنجاح! نحن بانتظارك. ✨',
      service_label: 'الخدمة',
    };

    const appointmentsEnabled = Boolean(aiConfigRes.data?.appointments_enabled);

    return NextResponse.json({
      settings,
      appointments_enabled: appointmentsEnabled,
    });
  } catch (err: any) {
    console.error('[appointment-settings] GET error:', err);
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

    const {
      slot_duration_minutes,
      timezone,
      booking_confirmation_msg,
      service_label,
      appointments_enabled,
    } = body;

    // 1. Upsert appointment_settings
    const settingsPayload: Record<string, any> = {
      account_id: accountId,
      updated_at: new Date().toISOString(),
    };

    if (slot_duration_minutes !== undefined) {
      settingsPayload.slot_duration_minutes = Math.max(15, parseInt(slot_duration_minutes, 10) || 60);
    }
    if (timezone !== undefined) {
      settingsPayload.timezone = String(timezone).trim() || 'Asia/Baghdad';
    }
    if (booking_confirmation_msg !== undefined) {
      settingsPayload.booking_confirmation_msg = booking_confirmation_msg;
    }
    if (service_label !== undefined) {
      settingsPayload.service_label = service_label;
    }

    const { data: updatedSettings, error: settingsErr } = await service
      .from('appointment_settings')
      .upsert(settingsPayload, { onConflict: 'account_id' })
      .select('*')
      .single();

    if (settingsErr) {
      console.error('[appointment-settings] PUT error:', settingsErr);
      return NextResponse.json({ error: settingsErr.message }, { status: 500 });
    }

    // 2. If appointments_enabled was passed, update ai_configs
    if (appointments_enabled !== undefined) {
      await service
        .from('ai_configs')
        .update({
          appointments_enabled: Boolean(appointments_enabled),
          updated_at: new Date().toISOString(),
        })
        .eq('account_id', accountId);
    }

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      appointments_enabled: appointments_enabled !== undefined ? Boolean(appointments_enabled) : undefined,
    });
  } catch (err: any) {
    console.error('[appointment-settings] unexpected PUT error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
