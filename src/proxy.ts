import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  verifyImpersonationToken,
  IMPERSONATION_COOKIE_NAME,
} from '@/lib/admin-impersonation'
import { extractStoreSubdomain } from '@/lib/storefront/subdomain'
import { extractResellerHostInfo } from '@/lib/reseller/subdomain'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const pathname = request.nextUrl.pathname

  // Helper to attach rotated cookies to any redirect / JSON response
  const withRefreshedCookies = <T extends NextResponse>(
    response: T,
    sourceResponse: NextResponse = supabaseResponse
  ): T => {
    sourceResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie)
    })
    return response
  }

  // ─────────────────────────────────────────────────────────────
  // 0. WHITE-LABEL RESELLER & STOREFRONT ROUTING
  // ─────────────────────────────────────────────────────────────
  const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const hostInfo = extractResellerHostInfo(hostHeader)

  // Pass through Next.js internal assets, static files, and API requests without rewriting
  const isInternalAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')

  if (!hostInfo.isMainPlatform && !isInternalAsset) {
    // 0.1 Check Reseller Tenant Cache or Database
    let resellerData: { id: string; subdomain: string; status: string } | null = null
    const cachedCookie = request.cookies.get('wacrm_reseller_ctx')?.value
    if (cachedCookie) {
      try {
        const parsed = JSON.parse(cachedCookie)
        if (
          parsed &&
          ((hostInfo.subdomain && parsed.subdomain === hostInfo.subdomain) ||
           (hostInfo.customDomain && parsed.customDomain === hostInfo.customDomain))
        ) {
          resellerData = parsed
        }
      } catch {}
    }

    if (!resellerData) {
      try {
        const serviceClient = createServiceClient()
        let query = serviceClient.from('resellers').select('id, subdomain, status, custom_domain')
        if (hostInfo.subdomain) {
          query = query.eq('subdomain', hostInfo.subdomain)
        } else if (hostInfo.customDomain) {
          query = query.eq('custom_domain', hostInfo.customDomain)
        }
        const { data: resRow } = await query.maybeSingle()
        if (resRow) {
          resellerData = {
            id: resRow.id,
            subdomain: resRow.subdomain,
            status: resRow.status,
          }
        }
      } catch (err) {
        console.error('[proxy] Reseller lookup error:', err)
      }
    }

    // If matching Reseller found
    if (resellerData) {
      // Inject reseller tenant headers into downstream request
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-reseller-id', resellerData.id)
      requestHeaders.set('x-reseller-subdomain', resellerData.subdomain)
      requestHeaders.set('x-reseller-status', resellerData.status)

      supabaseResponse = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })

      // Set cookie on response for 60 seconds
      supabaseResponse.cookies.set('wacrm_reseller_ctx', JSON.stringify(resellerData), {
        path: '/',
        maxAge: 60,
        sameSite: 'lax',
      })

      // If suspended, rewrite to /reseller-suspended
      if (resellerData.status === 'suspended' && pathname !== '/reseller-suspended') {
        const suspendedUrl = request.nextUrl.clone()
        suspendedUrl.pathname = '/reseller-suspended'
        return withRefreshedCookies(NextResponse.rewrite(suspendedUrl))
      }
    } else {
      // If NOT a reseller, check if it is a storefront subdomain
      const storeSubdomain = extractStoreSubdomain(hostHeader)
      if (storeSubdomain) {
        try {
          const serviceClient = createServiceClient()
          const { data: storeRow } = await serviceClient
            .from('storefronts')
            .select('id')
            .eq('subdomain', storeSubdomain)
            .maybeSingle()

          if (storeRow) {
            const storeUrl = request.nextUrl.clone()
            storeUrl.pathname = `/store/${storeSubdomain}`

            const requestHeaders = new Headers(request.headers)
            requestHeaders.set('x-storefront-subdomain', storeSubdomain)

            return NextResponse.rewrite(storeUrl, {
              request: {
                headers: requestHeaders,
              },
            })
          }
        } catch (err) {
          console.error('[proxy] Storefront check error:', err)
        }
      }
    }
  }

  // Helper to create safe redirect URLs that preserve incoming host/protocol (from x-forwarded headers or site settings)
  const createRedirectResponse = (targetPath: string, extraParams?: URLSearchParams) => {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host')

    let targetUrl: URL

    if (forwardedHost) {
      targetUrl = new URL(targetPath, `${forwardedProto}://${forwardedHost}`)
    } else if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      const proto = request.headers.get('x-forwarded-proto') || (request.nextUrl.protocol.replace(':', '') || 'https')
      targetUrl = new URL(targetPath, `${proto}://${host}`)
    } else if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('example.com')) {
      targetUrl = new URL(targetPath, process.env.NEXT_PUBLIC_SITE_URL)
    } else {
      targetUrl = request.nextUrl.clone()
      targetUrl.pathname = targetPath
    }

    if (extraParams) {
      extraParams.forEach((val, key) => {
        targetUrl.searchParams.set(key, val)
      })
    }

    return withRefreshedCookies(NextResponse.redirect(targetUrl))
  }

  // ─────────────────────────────────────────────────────────────
  // PLATFORM ADMIN ROUTES (/admin/* and /api/admin/*)
  // Completely isolated from regular user routes below.
  // ─────────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const isApiAdmin = pathname.startsWith('/api/admin')

    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user: adminUser } } = await adminSupabase.auth.getUser()

    // 1. Admin Login Page (/admin/login)
    if (pathname === '/admin/login') {
      if (adminUser) {
        // If user already logged in, check if they are actually a platform super-admin
        try {
          const serviceClient = createServiceClient()
          const { data: adminRow } = await serviceClient
            .from('platform_admins')
            .select('user_id')
            .eq('user_id', adminUser.id)
            .maybeSingle()

          if (adminRow) {
            // Already logged in as super-admin -> redirect to admin dashboard
            return createRedirectResponse('/admin/dashboard')
          }
        } catch (e) {
          console.error('[Middleware/Proxy] Admin check error on login:', e)
        }
      }
      // Not logged in or logged in as regular user -> allow rendering admin login page
      return supabaseResponse
    }

    // 2. Protected Admin Pages & API Routes
    if (!adminUser) {
      if (isApiAdmin) {
        return withRefreshedCookies(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        )
      }
      return createRedirectResponse('/admin/login')
    }

    // Verify platform super-admin role in DB using service_role key (bypasses RLS)
    try {
      const serviceClient = createServiceClient()
      const { data: adminRow } = await serviceClient
        .from('platform_admins')
        .select('user_id')
        .eq('user_id', adminUser.id)
        .maybeSingle()

      if (!adminRow) {
        if (isApiAdmin) {
          return withRefreshedCookies(
            NextResponse.json({ error: 'Forbidden: Super-admin access required' }, { status: 403 })
          )
        }
        // Logged in user is NOT a platform super-admin -> redirect to main app home
        return createRedirectResponse('/')
      }
    } catch (e) {
      console.error('[Middleware/Proxy] Admin authorization check error:', e)
      if (isApiAdmin) {
        return withRefreshedCookies(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        )
      }
      return createRedirectResponse('/admin/login')
    }

    return supabaseResponse
  }

  // ─────────────────────────────────────────────────────────────
  // REGULAR APP ROUTES (User Auth & Protected Routes)
  // ─────────────────────────────────────────────────────────────

  // OAuth Callback Fallback: Redirect any incoming request containing auth 'code' parameter
  // to /auth/callback if it lands on root '/' or login/signup instead.
  if (request.nextUrl.searchParams.has('code') && !pathname.startsWith('/auth/callback') && !pathname.startsWith('/api')) {
    return createRedirectResponse('/auth/callback', request.nextUrl.searchParams)
  }

  // 0. Active Admin Impersonation Session Check (Highest priority for app routes)
  const impersonationCookie = request.cookies.get(IMPERSONATION_COOKIE_NAME)?.value
  if (impersonationCookie) {
    const impersonationPayload = await verifyImpersonationToken(impersonationCookie)
    if (impersonationPayload) {
      // Impersonation mode active: Inject context headers and bypass account suspension checks
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-impersonation-context', JSON.stringify(impersonationPayload))
      requestHeaders.set('x-impersonation-user-id', impersonationPayload.target_user_id)
      requestHeaders.set('x-impersonation-account-id', impersonationPayload.target_account_id)

      supabaseResponse = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
      return supabaseResponse
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    // Evict stale invalid auth cookies to prevent repeated 'refresh_token_not_found' errors
    request.cookies.getAll().forEach((c) => {
      if (c.name.includes('sb-') && c.name.includes('-auth-token')) {
        supabaseResponse.cookies.set(c.name, '', { maxAge: 0, path: '/' })
      }
    })
  }

  // Account Status Check for Authenticated Users (Enforces Suspension with 60s Cache Cookie)
  if (user) {
    let isSuspended = false
    const cachedStatusCookie = request.cookies.get('wacrm_acc_status')?.value

    if (cachedStatusCookie === 'suspended') {
      isSuspended = true
    } else if (cachedStatusCookie !== 'active') {
      try {
        const serviceClient = createServiceClient()
        const { data: profile } = await serviceClient
          .from('profiles')
          .select('account_id, accounts!inner(status)')
          .eq('user_id', user.id)
          .maybeSingle()

        const status = (profile?.accounts as any)?.status || 'active'
        if (status === 'suspended') {
          isSuspended = true
        }

        // Cache account status in HTTP-only cookie for 60 seconds (reduces DB load by 99%)
        supabaseResponse.cookies.set('wacrm_acc_status', status, {
          maxAge: 60,
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
        })
      } catch (e) {
        console.error('[Middleware/Proxy] Account status check error:', e)
      }
    }

    if (isSuspended) {
      const searchParams = new URLSearchParams()
      searchParams.set('error', 'account_suspended')
      const evictedResponse = createRedirectResponse('/login', searchParams)

      // Evict user: terminate session and clear auth cookies immediately
      request.cookies.getAll().forEach((c) => {
        if (c.name.includes('sb-') || c.name === 'wacrm_acc_status') {
          evictedResponse.cookies.set(c.name, '', { maxAge: 0, path: '/' })
        }
      })
      return evictedResponse
    }
  }

  // Auth pages - redirect to dashboard if already logged in.
  if (user && (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup' ||
    request.nextUrl.pathname === '/forgot-password'
  )) {
    const inviteToken = request.nextUrl.searchParams.get('invite')
    if (
      inviteToken &&
      (request.nextUrl.pathname === '/login' ||
        request.nextUrl.pathname === '/signup')
    ) {
      return createRedirectResponse(`/join/${encodeURIComponent(inviteToken)}`)
    } else {
      return createRedirectResponse('/dashboard')
    }
  }

  // Protected pages - redirect to login if not authenticated
  const protectedPaths = ['/dashboard', '/inbox', '/contacts', '/pipelines', '/broadcasts', '/automations', '/settings', '/orders']
  if (!user && protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return createRedirectResponse('/login')
  }

  // API routes that need auth (not webhooks)
  if (!user && request.nextUrl.pathname.startsWith('/api/whatsapp/') &&
      !request.nextUrl.pathname.includes('/webhook')) {
    return withRefreshedCookies(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )
  }

  return supabaseResponse
}

// Backward compatibility alias for tests
export const middleware = proxy

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
