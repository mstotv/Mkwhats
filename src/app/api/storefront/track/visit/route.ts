import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const headers = request.headers
    const forwarded = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown'
    const ip = forwarded.split(',')[0].trim()

    // Rate limit: Max 60 visit tracking requests per IP per minute
    const rl = checkRateLimit(`storefront-visit:${ip}`, { limit: 60, windowMs: 60_000 })
    if (!rl.success) {
      return rateLimitResponse(rl)
    }

    const body = (await request.json().catch(() => null)) as {
      storefront_id?: string
      account_id?: string
      referrer?: string
    } | null

    if (!body?.storefront_id || !body?.account_id) {
      return NextResponse.json({ ok: false, error: 'Missing storefront_id or account_id' }, { status: 400 })
    }
    const userAgent = headers.get('user-agent') || ''

    // Hash IP for basic uniqueness without storing raw PII
    let ipHash = ''
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder()
      const data = encoder.encode(ip + (new Date().toISOString().slice(0, 10)))
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      ipHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
    } else {
      ipHash = ip.slice(0, 16)
    }

    const supabase = createServiceClient()

    const { error } = await supabase.from('storefront_visits').insert({
      account_id: body.account_id,
      storefront_id: body.storefront_id,
      visitor_ip_hash: ipHash,
      user_agent: userAgent.slice(0, 200),
      referrer: (body.referrer || headers.get('referer') || '').slice(0, 300),
    })

    if (error) {
      console.warn('[TrackVisit] Insert error:', error.message)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[TrackVisit] Error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
