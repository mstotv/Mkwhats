import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { validateSubdomain } from '@/lib/storefront/validation'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawSubdomain = searchParams.get('subdomain') || ''

    const validation = validateSubdomain(rawSubdomain)
    if (!validation.valid) {
      return NextResponse.json({
        available: false,
        reason: validation.reason,
        normalized: validation.normalized,
      })
    }

    const normalized = validation.normalized

    // Optional: detect if the checking user already owns this subdomain
    let userAccountId: string | null = null
    try {
      const supabaseUser = await createClient()
      const { data: { user } } = await supabaseUser.auth.getUser()
      if (user) {
        const { data: profile } = await supabaseUser
          .from('profiles')
          .select('account_id')
          .eq('user_id', user.id)
          .maybeSingle()
        userAccountId = profile?.account_id || null
      }
    } catch {
      // Unauthenticated check is fine
    }

    const service = createServiceClient()
    const { data: existing, error } = await service
      .from('storefronts')
      .select('id, account_id, subdomain')
      .eq('subdomain', normalized)
      .maybeSingle()

    if (error) {
      console.error('[check-subdomain] DB check error:', error)
      return NextResponse.json({ error: 'Database check failed' }, { status: 500 })
    }

    if (existing) {
      if (userAccountId && existing.account_id === userAccountId) {
        return NextResponse.json({
          available: true,
          isCurrent: true,
          normalized,
          message: 'هذا النطاق هو نطاق متجرك الحالي',
        })
      }
      return NextResponse.json({
        available: false,
        reason: 'هذا النطاق محجوز بالفعل لمتجر آخر',
        normalized,
      })
    }

    return NextResponse.json({
      available: true,
      normalized,
      message: 'النطاق متاح للاستخدام',
    })
  } catch (error: any) {
    console.error('[check-subdomain] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
