'use client'

import { useEffect, useState } from 'react'

/**
 * Asks the server whether the current visitor is a signed-in admin.
 *
 * The answer comes from the HttpOnly session cookie via /api/auth, so it
 * cannot be spoofed from the client the way the old localStorage flag could.
 * Used to hide admin-only affordances on public pages.
 */

export interface AdminSession {
  authenticated: boolean
  username?: string
  role?: string
  mustChangePassword?: boolean
}

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetch('/api/auth', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { authenticated: false }))
      .then((data: AdminSession) => {
        if (!cancelled) setSession(data)
      })
      .catch(() => {
        if (!cancelled) setSession({ authenticated: false })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return {
    session,
    isAdmin: session?.authenticated === true && !session?.mustChangePassword,
    loading,
  }
}
