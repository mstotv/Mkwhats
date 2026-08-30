import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  checkSlotAvailability,
  createAppointment,
  loadAppointmentSettings,
} from '@/lib/appointments/appointment-service';

export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const search = searchParams.get('search');

    let query = service
      .from('appointments')
      .select(`
        *,
        contacts (
          id,
          name,
          phone,
          avatar_url
        )
      `)
      .eq('account_id', accountId)
      .order('scheduled_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (search && search.trim()) {
      const q = search.trim();
      query = query.or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,service_name.ilike.%${q}%`);
    }

    const [appointmentsRes, settingsRes] = await Promise.all([
      query,
      loadAppointmentSettings(service, accountId),
    ]);

    if (appointmentsRes.error) {
      console.error('[appointments] GET error:', appointmentsRes.error);
      return NextResponse.json({ error: appointmentsRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      appointments: appointmentsRes.data || [],
      settings: settingsRes,
    });
  } catch (err: any) {
    console.error('[appointments] unexpected GET error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

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
      .select('account_id, role')
      .eq('user_id', user.id)
      .single();

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const accountId = profile.account_id;
    const body = await request.json();

    const {
      customer_name,
      customer_phone,
      service_name,
      scheduled_at,
      duration_minutes,
      conversation_id,
      contact_id,
      notes,
    } = body;

    if (!customer_name || !customer_phone || !scheduled_at) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, customer_phone, scheduled_at' },
        { status: 400 }
      );
    }

    // 1. Check availability
    const avail = await checkSlotAvailability(service, accountId, scheduled_at);
    if (!avail.available) {
      return NextResponse.json(
        {
          error: avail.message || 'الموعد المحدد غير متاح',
          reason: avail.reason,
          details: avail,
        },
        { status: 409 }
      );
    }

    // 2. Create appointment
    const res = await createAppointment(service, accountId, {
      customerName: customer_name,
      customerPhone: customer_phone,
      scheduledAtUtc: scheduled_at,
      serviceName: service_name,
      durationMinutes: duration_minutes,
      conversationId: conversation_id,
      contactId: contact_id,
      notes,
    });

    if (!res.appointment) {
      return NextResponse.json({ error: res.error || 'Failed to create appointment' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      appointment: res.appointment,
    });
  } catch (err: any) {
    console.error('[appointments] unexpected POST error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
    const { id, status, notes, service_name, scheduled_at, duration_minutes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (service_name !== undefined) updates.service_name = service_name;
    if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;

    if (scheduled_at !== undefined) {
      // Check availability if scheduled_at is being changed
      const avail = await checkSlotAvailability(service, accountId, scheduled_at, id);
      if (!avail.available) {
        return NextResponse.json(
          {
            error: avail.message || 'الموعد المحدد غير متاح',
            reason: avail.reason,
            details: avail,
          },
          { status: 409 }
        );
      }
      updates.scheduled_at = new Date(scheduled_at).toISOString();
    }

    const { data, error } = await service
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .eq('account_id', accountId)
      .select('*')
      .single();

    if (error) {
      console.error('[appointments] PATCH error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointment: data });
  } catch (err: any) {
    console.error('[appointments] unexpected PATCH error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });
    }

    const { error } = await service
      .from('appointments')
      .delete()
      .eq('id', id)
      .eq('account_id', accountId);

    if (error) {
      console.error('[appointments] DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[appointments] unexpected DELETE error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
