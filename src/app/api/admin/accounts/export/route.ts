import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceClient();

    const { data: accounts } = await supabase
      .from('accounts')
      .select(`
        id,
        name,
        created_at,
        is_suspended,
        subscriptions (
          status,
          billing_cycle,
          plan:plans (name, price_monthly)
        ),
        profiles (
          email,
          full_name,
          account_role
        )
      `)
      .order('created_at', { ascending: false });

    const rows: string[] = [];
    // CSV Header
    rows.push('Tenant ID,Company Name,Owner Email,Owner Name,Plan,Billing Cycle,Status,Created At');

    (accounts || []).forEach((acc: any) => {
      const activeSub = (acc.subscriptions || []).find(
        (s: any) => s.status === 'active' || s.status === 'trialing'
      );
      const owner = (acc.profiles || []).find((p: any) => p.account_role === 'owner') || (acc.profiles || [])[0];

      const tenantId = `tn-${acc.id.slice(0, 6)}`;
      const name = `"${(acc.name || '').replace(/"/g, '""')}"`;
      const email = `"${(owner?.email || '').replace(/"/g, '""')}"`;
      const ownerName = `"${(owner?.full_name || '').replace(/"/g, '""')}"`;
      const planName = `"${(activeSub?.plan?.name || 'Free Sandbox').replace(/"/g, '""')}"`;
      const cycle = activeSub?.billing_cycle || 'monthly';
      const status = acc.is_suspended ? 'Suspended' : activeSub?.status || 'active';
      const createdAt = acc.created_at ? new Date(acc.created_at).toISOString().slice(0, 10) : '';

      rows.push(`${tenantId},${name},${email},${ownerName},${planName},${cycle},${status},${createdAt}`);
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="tenants-directory-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error('[AdminAccountsExport] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
