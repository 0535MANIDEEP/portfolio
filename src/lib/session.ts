/**
 * Signed session tokens.
 *
 * Deliberately built on Web Crypto (not node:crypto) so the exact same
 * verification runs in middleware on the Edge runtime and in Node route
 * handlers. Password hashing lives in `@/lib/password` instead, because
 * scrypt is Node-only and is never needed at the edge.
 *
 * Token format:  base64url(payload) "." base64url(HMAC-SHA256(payload))
 */

export const SESSION_COOKIE = 'admin_session'
export const SESSION_MAX_AGE = 60 * 60 * 8 // 8 hours

export interface SessionPayload {
  sub: string // AdminUser id
  username: string
  role: string
  /** True while the account still has a password the user must replace. */
  mustChangePassword?: boolean
  iat: number
  exp: number
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET is missing or too short. Generate one with: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    )
  }
  return secret
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  // Backed by a plain ArrayBuffer (not SharedArrayBuffer) so it satisfies
  // BufferSource for crypto.subtle.
  const out = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function createSessionToken(
  data: Omit<SessionPayload, 'iat' | 'exp'>
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const payload: SessionPayload = { ...data, iat: now, exp: now + SESSION_MAX_AGE }

  const encoded = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)))
  const sig = await crypto.subtle.sign('HMAC', await importKey(), new TextEncoder().encode(encoded))

  return `${encoded}.${b64urlEncode(new Uint8Array(sig))}`
}

/**
 * Returns the payload only if the signature is valid and the token is unexpired.
 * Never throws on malformed input — callers treat null as "not authenticated".
 */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null

  const dot = token.indexOf('.')
  if (dot < 1) return null

  const encoded = token.slice(0, dot)
  const signature = token.slice(dot + 1)

  try {
    // crypto.subtle.verify is constant-time, so this is not a timing oracle.
    const ok = await crypto.subtle.verify(
      'HMAC',
      await importKey(),
      b64urlDecode(signature),
      new TextEncoder().encode(encoded)
    )
    if (!ok) return null

    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(encoded))) as SessionPayload
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null
    if (!payload.sub || !payload.username) return null

    return payload
  } catch {
    return null
  }
}

export function sessionCookieOptions(maxAge: number = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}
