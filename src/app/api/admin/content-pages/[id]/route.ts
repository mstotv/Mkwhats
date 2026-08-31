import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import DOMPurify from 'isomorphic-dompurify'

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'a', 'img', 'ul', 'ol', 'li',
    'strong', 'em', 'b', 'i', 'u', 'br', 'hr',
    'div', 'span', 'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'class', 'id', 'rel', 'style'],
  ALLOW_DATA_ATTR: false,
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pageId } = await params
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
    const { title, title_en, content_html, content_html_en, is_published } = body || {}

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) updateData.title = String(title).trim()
    if (title_en !== undefined) updateData.title_en = title_en ? String(title_en).trim() : null
    if (content_html !== undefined) {
      updateData.content_html = DOMPurify.sanitize(String(content_html), SANITIZE_CONFIG)
    }
    if (content_html_en !== undefined) {
      updateData.content_html_en = content_html_en ? DOMPurify.sanitize(String(content_html_en), SANITIZE_CONFIG) : null
    }
    if (is_published !== undefined) updateData.is_published = Boolean(is_published)

    const { data: updatedPage, error: updateError } = await serviceClient
      .from('content_pages')
      .update(updateData)
      .eq('id', pageId)
      .select('*')
      .single()

    if (updateError) {
      console.error('[AdminContentPagesAPI] Patch error:', updateError)
      return NextResponse.json({ 
        error: updateError.message || 'Failed to update content page',
        code: updateError.code,
        details: updateError.details,
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, page: updatedPage })
  } catch (err: any) {
    console.error('[AdminContentPagesAPI] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pageId } = await params
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

    const { error: deleteError } = await serviceClient
      .from('content_pages')
      .delete()
      .eq('id', pageId)

    if (deleteError) {
      console.error('[AdminContentPagesAPI] Delete error:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete content page' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[AdminContentPagesAPI] Unexpected delete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
