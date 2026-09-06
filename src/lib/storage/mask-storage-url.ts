/**
 * Utility to mask raw Supabase Storage URLs and rewrite them to the platform's
 * internal proxy route `/api/storage/[bucket]/[...path]`.
 *
 * This ensures that:
 * 1. The backend Supabase project ref (*.supabase.co) is NEVER exposed to users.
 * 2. All media requests appear natively under the platform's domain.
 * 3. External URLs (e.g. Unsplash, CDNs) remain untouched.
 */

export function isInternalStorageUrl(url?: string | null): boolean {
  if (!url) return false
  return (
    url.startsWith('/api/storage/') ||
    url.includes('.supabase.co/storage/v1/object/public/')
  )
}

export function maskStorageUrl(url?: string | null): string {
  if (!url) return ''

  // Already masked internal proxy path
  if (url.startsWith('/api/storage/')) {
    return url
  }

  // Raw Supabase Storage public URL:
  // https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const supabaseStorageRegex = /^https?:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/i
  const match = url.match(supabaseStorageRegex)

  if (match) {
    const bucket = match[1]
    const path = match[2]
    return `/api/storage/${bucket}/${path}`
  }

  // External URL (e.g., Unsplash, Cloudinary, Imgur, etc.)
  return url
}
