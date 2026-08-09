import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

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
    const { title, content_html, is_published } = body || {}

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) updateData.title = String(title).trim()
    if (content_html !== undefined) updateData.content_html = String(content_html)
    if (is_published !== undefined) updateData.is_published = Boolean(is_published)

    const { data: updatedPage, error: updateError } = await serviceClient
      .from('content_pages')
      .update(updateData)
      .eq('id', pageId)
      .select('*')
      .single()

    if (updateError) {
      console.error('[AdminContentPagesAPI] Patch error:', updateError)
      return NextResponse.json({ error: 'Failed to update content page' }, { status: 500 })
    }

    return NextResponse.json({ success: true, page: updatedPage })
  } catch (err: any) {
    console.error('[AdminContentPagesAPI] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
