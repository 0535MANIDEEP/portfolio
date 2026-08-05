import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logOperation } from '@/lib/log-operation'
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/password'
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifySessionToken,
} from '@/lib/session'

/**
 * POST /api/auth/password — change the signed-in admin's own password.
 *
 * Requires the current password even though the caller already holds a valid
 * session, so a stolen session alone cannot lock the real owner out.
 */
export async function POST(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { currentPassword, newPassword } = await request.json()

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 })
    }

    const weak = validatePasswordStrength(newPassword)
    if (weak) return NextResponse.json({ error: weak }, { status: 400 })

    const user = await db.adminUser.findUnique({ where: { id: session.sub } })
    if (!user || !verifyPassword(currentPassword, user.password)) {
      await logOperation({
        action: 'password_change_failed',
        entityType: 'auth',
        entityId: session.sub,
        details: 'Current password did not match',
        actor: session.username,
      })
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    if (verifyPassword(newPassword, user.password)) {
      return NextResponse.json({ error: 'New password must differ from the current one' }, { status: 400 })
    }

    await db.adminUser.update({
      where: { id: user.id },
      data: { password: hashPassword(newPassword), mustChangePassword: false },
    })

    await logOperation({
      action: 'password_changed',
      entityType: 'auth',
      entityId: user.id,
      details: `Password updated for ${user.username}`,
      actor: user.username,
    })

    // Re-issue the session so mustChangePassword is cleared in the token too.
    const token = await createSessionToken({
      sub: user.id,
      username: user.username,
      role: user.role || 'admin',
      mustChangePassword: false,
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
    return response
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}
