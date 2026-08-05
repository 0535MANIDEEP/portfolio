import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

/**
 * Edge middleware: rate limiting + the outer half of admin authorisation.
 *
 * The previous version accepted any request carrying an arbitrary
 * `x-admin-auth` header, and waved through anything same-origin — which
 * included every curl request, since those send no Origin header at all.
 * It now verifies a real signed session cookie.
 *
 * This is defence in depth, not the only check: each mutating route handler
 * independently calls requireAdmin(). Middleware can be bypassed by internal
 * rewrites, so it must never be the sole gate.
 */

const authAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_AUTH_ATTEMPTS = 10
const AUTH_WINDOW_MS = 15 * 60 * 1000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = authAttempts.get(ip)

  if (!entry || now > entry.resetAt) {
    authAttempts.set(ip, { count: 1, resetAt: now + AUTH_WINDOW_MS })
    return false
  }

  // Opportunistic cleanup so the map cannot grow without bound.
  if (authAttempts.size > 5000) {
    for (const [key, value] of authAttempts) {
      if (now > value.resetAt) authAttempts.delete(key)
    }
  }

  entry.count++
  return entry.count > MAX_AUTH_ATTEMPTS
}

/** Endpoints the public site legitimately writes to without being an admin. */
const PUBLIC_WRITE_ROUTES = [
  '/api/contact', // contact form
  '/api/comments', // visitors posting comments (DELETE is guarded in the handler)
  '/api/auth', // sign in / sign out
]

const MUTATING_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH'])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/api/auth' && request.method === 'POST') {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }
  }

  // Guard every mutating API call except the explicitly public ones.
  if (pathname.startsWith('/api/') && MUTATING_METHODS.has(request.method)) {
    const isPublicWrite = PUBLIC_WRITE_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + '/')
    )

    if (!isPublicWrite) {
      const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized. Admin sign-in required.' }, { status: 401 })
      }
      // Signed in with a credential we already know is compromised — the only
      // action allowed is replacing it.
      if (session.mustChangePassword) {
        return NextResponse.json(
          { error: 'Password change required before performing this action.' },
          { status: 403 }
        )
      }
    }
  }

  const response = NextResponse.next()
  if (pathname.startsWith('/admin')) {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
  }
  return response
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
}
