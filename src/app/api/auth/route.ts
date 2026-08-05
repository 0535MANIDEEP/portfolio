import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logOperation } from '@/lib/log-operation'
import { verifyPassword, isHashed } from '@/lib/password'
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifySessionToken,
} from '@/lib/session'

/**
 * Admin authentication.
 *
 *   GET    -> current session (used by the admin UI instead of localStorage)
 *   POST   -> sign in, sets a signed HttpOnly session cookie
 *   DELETE -> sign out
 *
 * There is deliberately no default-credential bootstrap here. Seeding the
 * first admin is an operator action: `node --env-file=.env scripts/create-admin.mjs`.
 */

export async function GET(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 })
  }
  return NextResponse.json({
    authenticated: true,
    username: session.username,
    role: session.role,
    mustChangePassword: session.mustChangePassword === true,
  })
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const user = await db.adminUser.findUnique({ where: { username } })

    // A stored password that is not a scrypt hash is a legacy plaintext record.
    // Refuse it outright rather than silently trusting it.
    const ok = !!user && isHashed(user.password) && verifyPassword(password, user.password)

    if (!ok) {
      await logOperation({
        action: 'login_failed',
        entityType: 'auth',
        entityId: username,
        details: user && !isHashed(user.password)
          ? 'Account still has a legacy plaintext password; run scripts/migrate-passwords.mjs'
          : 'Invalid credentials',
        actor: username,
      })
      // Same message either way — do not reveal whether the username exists.
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await createSessionToken({
      sub: user.id,
      username: user.username,
      role: user.role || 'admin',
      mustChangePassword: user.mustChangePassword,
    })

    await db.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    await logOperation({
      action: 'login_success',
      entityType: 'auth',
      entityId: user.id,
      details: `User ${user.username} signed in`,
      actor: user.username,
    })

    const response = NextResponse.json({
      success: true,
      username: user.username,
      role: user.role || 'admin',
      mustChangePassword: user.mustChangePassword,
    })
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
    return response
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (session) {
    await logOperation({
      action: 'logout',
      entityType: 'auth',
      entityId: session.sub,
      details: `User ${session.username} signed out`,
      actor: session.username,
    })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0))
  return response
}
