import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Server-side check if the logged-in user is a registered platform super-admin.
 */
export async function checkIsSuperAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { createServiceClient } = await import('@/lib/supabase/service');
    const serviceClient = createServiceClient();
    const { data: adminRow } = await serviceClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    return !!adminRow;
  } catch (err) {
    console.error('[checkIsSuperAdmin] Error checking admin status:', err);
    return false;
  }
}

/**
 * Server-side route guard for Super Admin pages. Redirects non-admins to /admin/login.
 */
export async function requireSuperAdmin() {
  const isAdmin = await checkIsSuperAdmin();
  if (!isAdmin) {
    redirect('/admin/login');
  }
}
