/**
 * Password hashing with scrypt from node:crypto.
 *
 * No external dependency needed — scrypt is memory-hard and is the right
 * primitive here. Node-only, so never import this from middleware.
 *
 * Stored format:  scrypt$N$r$p$<salt-hex>$<hash-hex>
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const N = 16384 // CPU/memory cost
const r = 8 // block size
const p = 1 // parallelisation
const KEYLEN = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, KEYLEN, { N, r, p })
  return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${hash.toString('hex')}`
}

/**
 * Constant-time verification. Returns false for any malformed or
 * legacy plaintext record — those must be migrated, never trusted.
 */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !stored.startsWith('scrypt$')) return false

  const parts = stored.split('$')
  if (parts.length !== 6) return false

  const [, nStr, rStr, pStr, saltHex, hashHex] = parts
  const salt = Buffer.from(saltHex, 'hex')
  const expected = Buffer.from(hashHex, 'hex')
  if (salt.length === 0 || expected.length === 0) return false

  try {
    const actual = scryptSync(password, salt, expected.length, {
      N: Number(nStr),
      r: Number(rStr),
      p: Number(pStr),
    })
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export function isHashed(stored: string): boolean {
  return typeof stored === 'string' && stored.startsWith('scrypt$')
}

/** Rejects the weak passwords this project shipped with. */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 12) return 'Password must be at least 12 characters.'
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.'
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must contain a number.'
  if (/^(admin|password|letmein|welcome|portfolio)/i.test(password)) {
    return 'Password is too predictable. Choose something less guessable.'
  }
  return null
}
