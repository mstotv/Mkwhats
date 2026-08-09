import { createServiceClient } from '@/lib/supabase/service'

export interface AdminRateLimitResult {
  success: boolean
  remaining: number
  retryAfterSeconds?: number
}

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_WINDOW_MINUTES = 15

/**
 * Checks if the IP address or Email is currently rate-limited (locked out)
 * due to too many failed login attempts within the last 15 minutes.
 * Also performs lazy cleanup of attempts older than 24 hours.
 */
export async function checkAdminRateLimit(
  ip: string,
  email: string
): Promise<AdminRateLimitResult> {
  const supabase = createServiceClient()
  const normalizedEmail = email.toLowerCase().trim()

  // 1. Lazy cleanup: trigger 24-hour cleanup RPC (failsafed if function doesn't exist)
  try {
    await supabase.rpc('cleanup_old_admin_login_attempts')
  } catch {
    // Ignore RPC failure (e.g. if fallback SQL wasn't run yet)
  }

  // 2. Count failed attempts within the 15-minute window for either IP or Email
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('admin_login_attempts')
    .select('id, attempted_at', { count: 'exact' })
    .or(`ip_address.eq.${ip},email.eq.${normalizedEmail}`)
    .gte('attempted_at', windowStart)
    .order('attempted_at', { ascending: false })

  if (error) {
    console.error('[AdminRateLimit] Error checking rate limit:', error)
    // Fail-open for checking errors so database issues don't lock out valid admins completely,
    // but log the error.
    return { success: true, remaining: 1 }
  }

  const count = data?.length || 0

  if (count >= MAX_FAILED_ATTEMPTS) {
    // Calculate retryAfterSeconds based on oldest attempt in window
    const oldestAttempt = new Date(data[data.length - 1].attempted_at).getTime()
    const lockoutExpiresAt = oldestAttempt + LOCKOUT_WINDOW_MINUTES * 60 * 1000
    const retryAfterSeconds = Math.max(1, Math.ceil((lockoutExpiresAt - Date.now()) / 1000))

    return {
      success: false,
      remaining: 0,
      retryAfterSeconds,
    }
  }

  return {
    success: true,
    remaining: MAX_FAILED_ATTEMPTS - count,
  }
}

/**
 * Records a failed admin login attempt.
 */
export async function recordFailedAttempt(ip: string, email: string): Promise<void> {
  const supabase = createServiceClient()
  const normalizedEmail = email.toLowerCase().trim()

  const { error } = await supabase.from('admin_login_attempts').insert({
    ip_address: ip,
    email: normalizedEmail,
  })

  if (error) {
    console.error('[AdminRateLimit] Error recording failed attempt:', error)
  }
}

/**
 * Clears failed attempts for the IP and Email upon successful login.
 */
export async function clearAttempts(ip: string, email: string): Promise<void> {
  const supabase = createServiceClient()
  const normalizedEmail = email.toLowerCase().trim()

  const { error } = await supabase
    .from('admin_login_attempts')
    .delete()
    .or(`ip_address.eq.${ip},email.eq.${normalizedEmail}`)

  if (error) {
    console.error('[AdminRateLimit] Error clearing attempts:', error)
  }
}
