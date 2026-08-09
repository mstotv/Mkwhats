import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  try {
    const serviceClient = createServiceClient()
    const { data: pages, error } = await serviceClient
      .from('content_pages')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[AdminContentPagesAPI] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch content pages' }, { status: 500 })
    }

    return NextResponse.json({ pages: pages || [] })
  } catch (err: any) {
    console.error('[AdminContentPagesAPI] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // 1. Authenticate super admin
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceClient()
    const { data: adminRow } = await serviceClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', adminUser.id)
      .maybeSingle()

    if (!adminRow) {
      return NextResponse.json(
        { error: 'Forbidden: Super-admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { slug, title, content_html, is_published } = body || {}

    if (!slug || !title) {
      return NextResponse.json({ error: 'Slug and title are required' }, { status: 400 })
    }

    const formattedSlug = String(slug).trim().toLowerCase().replace(/\s+/g, '_')

    const { data: newPage, error: insertError } = await serviceClient
      .from('content_pages')
      .insert({
        slug: formattedSlug,
        title: String(title).trim(),
        content_html: content_html ? String(content_html) : '',
        is_published: is_published !== undefined ? Boolean(is_published) : true,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('[AdminContentPagesAPI] Insert error:', insertError)
      return NextResponse.json(
        { error: insertError.message || 'Failed to create content page' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, page: newPage })
  } catch (err: any) {
    console.error('[AdminContentPagesAPI] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
