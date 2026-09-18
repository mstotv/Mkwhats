import { NextResponse } from 'next/server';
import { getEffectiveSiteSettings } from '@/lib/reseller/settings';

export async function GET() {
  try {
    const settings = await getEffectiveSiteSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    console.error('[PublicSiteSettingsAPI] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

