import { NextResponse } from 'next/server';
import { requireRole, toErrorResponse } from '@/lib/auth/account';
import {
  getAccountStoreById,
  disconnectStore,
} from '@/lib/ecommerce/store-crud';

/**
 * GET /api/ecommerce/stores/[storeId] — Get single store info
 */
export async function GET(
  _request: Request,
  props: { params: Promise<{ storeId: string }> }
) {
  try {
    const params = await props.params;
    const ctx = await requireRole('viewer');
    const store = await getAccountStoreById(
      ctx.supabase,
      ctx.accountId,
      params.storeId
    );

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ store });
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * DELETE /api/ecommerce/stores/[storeId] — Disconnect store (admins only)
 */
export async function DELETE(
  _request: Request,
  props: { params: Promise<{ storeId: string }> }
) {
  try {
    const params = await props.params;
    const ctx = await requireRole('admin');

    const ok = await disconnectStore(ctx.supabase, ctx.accountId, params.storeId);
    if (!ok) {
      return NextResponse.json(
        { error: 'Failed to disconnect store' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
