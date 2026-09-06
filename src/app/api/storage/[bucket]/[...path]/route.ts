import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Allowed public/media buckets for proxy streaming
const ALLOWED_BUCKETS = new Set([
  'storefront-media',
  'avatars',
  'support-attachments',
  'flow-media',
  'chat-media',
  'receipts',
])

const MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  pdf: 'application/pdf',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  mp4: 'video/mp4',
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bucket: string; path: string[] }> }
) {
  try {
    const { bucket, path } = await context.params

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: 'Bucket not allowed' }, { status: 403 })
    }

    if (!path || path.length === 0) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    const fullPath = path.join('/')
    const ext = fullPath.split('.').pop()?.toLowerCase() || ''
    const fallbackMime = MIME_MAP[ext] || 'application/octet-stream'

    const service = createServiceClient()
    const { data: blob, error } = await service.storage
      .from(bucket)
      .download(fullPath)

    if (error || !blob) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const contentType = blob.type && blob.type !== 'application/octet-stream' ? blob.type : fallbackMime

    // Stream blob directly to response with strong CDN & browser caching
    return new Response(blob.stream(), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[Storage Proxy] Error fetching file:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
