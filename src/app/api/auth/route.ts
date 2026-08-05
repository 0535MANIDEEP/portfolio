import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logOperation } from '@/lib/log-operation'

// Default credentials (used to bootstrap the first admin if none exists and no env is set).
// In production, set ADMIN_USERNAME / ADMIN_PASSWORD env vars.
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || process.env.USERNAME || 'admin'
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.PASSWORD || 'admin123'

export async function POST(request: NextRequest) {
  try {
    // Ensure at least one admin user exists (bootstrap from env or defaults)
    const adminCount = await db.adminUser.count()
    if (adminCount === 0) {
      await db.adminUser.create({
        data: {
          username: DEFAULT_ADMIN_USERNAME,
          password: DEFAULT_ADMIN_PASSWORD,
          totpSecret: '',
          totpEnabled: false,
          role: 'admin',
        },
      })
    }

    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 })
    }

    const user = await db.adminUser.findUnique({ where: { username } })

    if (!user || user.password !== password) {
      await logOperation({
        action: 'login_failed',
        entityType: 'auth',
        entityId: String(username),
        details: 'Invalid credentials',
        actor: String(username),
      })
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    await logOperation({
      action: 'login_success',
      entityType: 'auth',
      entityId: user.id,
      details: `User ${user.username} logged in`,
      actor: user.username,
    })

    return NextResponse.json({ success: true, username: user.username, role: user.role || 'admin' })
  } catch (error) {
    console.error('Auth error:', error)
    await logOperation({
      action: 'login_error',
      entityType: 'auth',
      details: `Login error: ${error instanceof Error ? error.message : String(error)}`,
      actor: 'system',
    }).catch(() => {})
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
