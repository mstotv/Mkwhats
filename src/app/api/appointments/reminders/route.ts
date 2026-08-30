import { NextResponse } from 'next/server';
import { processDueReminders } from '@/lib/appointments/reminder-runner';

export const dynamic = 'force-dynamic';

/**
 * Endpoint to trigger appointment reminders.
 * Can be called with `?force=true` or normally by Cron.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isForce = searchParams.get('force') === 'true';

    const result = await processDueReminders(isForce);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[appointment-reminders] API error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
