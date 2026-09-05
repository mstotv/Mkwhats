import { NextResponse } from 'next/server'
import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account'
import { createServiceClient } from '@/lib/supabase/service'
import type { StorefrontAnalyticsSummary } from '@/lib/storefront/types'

export async function GET() {
  try {
    const ctx = await getCurrentAccount()
    const supabase = createServiceClient()

    // 1. Fetch visits for this account
    const { data: visits, error: visitsErr } = await supabase
      .from('storefront_visits')
      .select('id, visitor_ip_hash, visited_at')
      .eq('account_id', ctx.accountId)

    if (visitsErr) {
      console.error('[Analytics] visits query error:', visitsErr)
      return NextResponse.json({ error: 'Failed to load visits' }, { status: 500 })
    }

    // 2. Fetch link clicks for this account
    const { data: clicks, error: clicksErr } = await supabase
      .from('storefront_link_clicks')
      .select('id, link_id, link_title, link_url, clicked_at')
      .eq('account_id', ctx.accountId)

    if (clicksErr) {
      console.error('[Analytics] clicks query error:', clicksErr)
      return NextResponse.json({ error: 'Failed to load clicks' }, { status: 500 })
    }

    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    const total_visits = visits?.length || 0
    const uniqueHashes = new Set((visits || []).map((v) => v.visitor_ip_hash).filter(Boolean))
    const unique_visits = uniqueHashes.size || total_visits

    let last_7_days = 0
    let last_30_days = 0

    for (const v of visits || []) {
      const time = new Date(v.visited_at).getTime()
      if (time >= sevenDaysAgo) last_7_days++
      if (time >= thirtyDaysAgo) last_30_days++
    }

    // Group clicks by link_id
    const clickMap = new Map<string, { link_id: string; title: string; url: string; clicks: number }>()
    for (const c of clicks || []) {
      const existing = clickMap.get(c.link_id)
      if (existing) {
        existing.clicks++
      } else {
        clickMap.set(c.link_id, {
          link_id: c.link_id,
          title: c.link_title || 'رابط بدون عنوان',
          url: c.link_url || '#',
          clicks: 1,
        })
      }
    }

    const top_links = Array.from(clickMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 15)

    const summary: StorefrontAnalyticsSummary = {
      total_visits,
      unique_visits,
      last_7_days,
      last_30_days,
      top_links,
    }

    return NextResponse.json({ analytics: summary })
  } catch (err) {
    return toErrorResponse(err)
  }
}
