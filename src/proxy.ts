import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

/**
 * Edge proxy: rate limiting + the outer half of admin authorisation.
 *
 * (The `middleware` file convention is deprecated in Next 16 and renamed to
 * `proxy`; this is the same interface under the new name.)
 *
 * The previous version accepted any request carrying an arbitrary
 * `x-admin-auth` header, and waved through anything same-origin — which
 * included every curl request, since those send no Origin header at all.
 * It now verifies a real signed session cookie.
 *
 * This is defence in depth, not the only check: each mutating route handler
 * independently calls requireAdmin(). A proxy can be bypassed by internal
 * rewrites, so it must never be the sole gate.
 */

const buckets = new Map<string, { count: number; resetAt: number }>()

const LIMITS = {
  auth: { max: 10, windowMs: 15 * 60 * 1000 },
  // The chat endpoint is anonymous and spends Gemini quota on every call,
  // so it needs its own ceiling.
  chat: { max: 20, windowMs: 10 * 60 * 1000 },
  contact: { max: 5, windowMs: 60 * 60 * 1000 },
  comments: { max: 10, windowMs: 60 * 60 * 1000 },
} as const

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function isRateLimited(key: keyof typeof LIMITS, ip: string): boolean {
  const { max, windowMs } = LIMITS[key]
  const now = Date.now()
  const id = `${key}:${ip}`
  const entry = buckets.get(id)

  if (!entry || now > entry.resetAt) {
    buckets.set(id, { count: 1, resetAt: now + windowMs })
    return false
  }

  // Opportunistic cleanup so the map cannot grow without bound.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now > v.resetAt) buckets.delete(k)
    }
  }

  entry.count++
  return entry.count > max
}

/**
 * Endpoints the public site legitimately writes to without being an admin.
 * Each is rate limited above, and each guards its own privileged methods
 * (for example DELETE /api/comments/[id] still requires a session).
 */
const PUBLIC_WRITE_ROUTES = [
  '/api/contact', // contact form
  '/api/comments', // visitors posting comments
  '/api/auth', // sign in / sign out / change own password
  '/api/chat', // the public RAG assistant
]

const MUTATING_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH'])

/** Maps a public path to its rate-limit bucket, if it has one. */
function rateLimitKey(pathname: string, method: string): keyof typeof LIMITS | null {
  if (method !== 'POST') return null
  if (pathname === '/api/auth') return 'auth'
  if (pathname === '/api/chat') return 'chat'
  if (pathname === '/api/contact') return 'contact'
  if (pathname === '/api/comments') return 'comments'
  return null
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const limitKey = rateLimitKey(pathname, request.method)
  if (limitKey && isRateLimited(limitKey, clientIp(request))) {
    return NextResponse.json(
      {
        success: false,
        error:
          limitKey === 'auth'
            ? 'Too many login attempts. Please try again later.'
            : 'Too many requests. Please slow down and try again shortly.',
      },
      { status: 429 }
    )
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
