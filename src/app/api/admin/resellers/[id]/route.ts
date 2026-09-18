import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = createServiceClient();

    // Fetch existing reseller
    const { data: existing, error: fetchErr } = await supabase
      .from('resellers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Reseller not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // 1. Status change
    if (body.status && ['active', 'grace_period', 'suspended', 'pending_setup'].includes(body.status)) {
      updates.status = body.status;
    }

    // 2. Extend subscription
    if (body.extend_days && typeof body.extend_days === 'number') {
      const currentExpiry = existing.subscription_expires_at
        ? new Date(existing.subscription_expires_at).getTime()
        : Date.now();
      const baseTime = Math.max(currentExpiry, Date.now());
      const newExpiry = new Date(baseTime + body.extend_days * 24 * 60 * 60 * 1000);
      updates.subscription_expires_at = newExpiry.toISOString();
      if (existing.status === 'suspended' || existing.status === 'grace_period') {
        updates.status = 'active';
      }
    } else if (body.subscription_expires_at) {
      updates.subscription_expires_at = body.subscription_expires_at;
    }

    // 3. Plan change
    if (body.plan_id) {
      updates.plan_id = body.plan_id;
    }

    // 4. Custom accounts limit
    if (body.custom_max_accounts !== undefined) {
      updates.custom_max_accounts = body.custom_max_accounts ? Number(body.custom_max_accounts) : null;
    }

    // 5. Domains & Contact
    if (body.custom_domain !== undefined) {
      updates.custom_domain = body.custom_domain ? body.custom_domain.trim().toLowerCase() : null;
    }
    if (body.display_name) updates.display_name = body.display_name;
    if (body.display_name_ar) updates.display_name_ar = body.display_name_ar;
    if (body.support_email !== undefined) updates.support_email = body.support_email;
    if (body.support_whatsapp !== undefined) updates.support_whatsapp = body.support_whatsapp;
    if (body.primary_color) updates.primary_color = body.primary_color;

    const { data: updated, error: updateErr } = await supabase
      .from('resellers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('[AdminResellerUpdateAPI] Update error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reseller: updated });
  } catch (err: any) {
    console.error('[AdminResellerUpdateAPI] Server error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createServiceClient();

    // Detach any accounts belonging to this reseller
    await supabase
      .from('accounts')
      .update({ reseller_id: null })
      .eq('reseller_id', id);

    // Delete reseller
    const { error: delError } = await supabase
      .from('resellers')
      .delete()
      .eq('id', id);

    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[AdminResellerDeleteAPI] Server error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
