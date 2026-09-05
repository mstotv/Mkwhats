import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const headers = request.headers
    const forwarded = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown'
    const ip = forwarded.split(',')[0].trim()

    // Rate limit: Max 120 click tracking requests per IP per minute
    const rl = checkRateLimit(`storefront-click:${ip}`, { limit: 120, windowMs: 60_000 })
    if (!rl.success) {
      return rateLimitResponse(rl)
    }

    const body = (await request.json().catch(() => null)) as {
      storefront_id?: string
      account_id?: string
      link_id?: string
      link_title?: string
      link_url?: string
    } | null

    if (!body?.storefront_id || !body?.account_id || !body?.link_id) {
      return NextResponse.json({ ok: false, error: 'Missing required tracking fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase.from('storefront_link_clicks').insert({
      account_id: body.account_id,
      storefront_id: body.storefront_id,
      link_id: body.link_id,
      link_title: (body.link_title || '').slice(0, 150),
      link_url: (body.link_url || '').slice(0, 500),
    })

    if (error) {
      console.warn('[TrackClick] Insert error:', error.message)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[TrackClick] Error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
