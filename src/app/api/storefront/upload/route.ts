import { NextResponse } from 'next/server'
import { requireRole, toErrorResponse } from '@/lib/auth/account'
import { createServiceClient } from '@/lib/supabase/service'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
])

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: Request) {
  try {
    const ctx = await requireRole('admin')

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'لم يتم إرسال أي ملف' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'نوع الملف غير مدعوم. يسمح فقط بالصور (PNG, JPG, WebP, SVG)' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'حجم الصورة يتجاوز الحد المسموح به (5 ميجابايت)' },
        { status: 400 }
      )
    }

    const ext = file.name.split('.').pop() || 'png'
    const fileName = `${ctx.accountId}/${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

    const service = createServiceClient()
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await service.storage
      .from('storefront-media')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('[Storefront Upload] Storage error:', uploadError)
      return NextResponse.json({ error: 'فشل رفع الصورة: ' + uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = service.storage
      .from('storefront-media')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
    })
  } catch (err) {
    return toErrorResponse(err)
  }
}
