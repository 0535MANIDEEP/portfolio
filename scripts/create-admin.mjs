/**
 * Creates or resets an admin account. Replaces the old behaviour where
 * /api/auth silently created an `admin` / `admin123` account on first request.
 *
 *   node --env-file=.env scripts/create-admin.mjs <username> [password]
 *
 * With no password, a strong one is generated and printed once.
 */
import { PrismaClient } from '@prisma/client'
import { randomBytes, scryptSync } from 'crypto'

const N = 16384, r = 8, p = 1, KEYLEN = 64

function hashPassword(password) {
  const salt = randomBytes(16)
  return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${scryptSync(password, salt, KEYLEN, { N, r, p }).toString('hex')}`
}

function generatePassword() {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*'
  const bytes = randomBytes(24)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

const username = process.argv[2]
if (!username) {
  console.error('Usage: node --env-file=.env scripts/create-admin.mjs <username> [password]')
  process.exit(1)
}

const password = process.argv[3] || generatePassword()
const generated = !process.argv[3]

if (password.length < 12) {
  console.error('Password must be at least 12 characters.')
  process.exit(1)
}

const db = new PrismaClient()
try {
  const existing = await db.adminUser.findUnique({ where: { username } })

  if (existing) {
    await db.adminUser.update({
      where: { id: existing.id },
      data: { password: hashPassword(password), mustChangePassword: false },
    })
    console.log(`Password reset for existing admin "${username}".`)
  } else {
    await db.adminUser.create({
      data: { username, password: hashPassword(password), role: 'admin', mustChangePassword: false },
    })
    console.log(`Admin "${username}" created.`)
  }

  if (generated) {
    console.log('\n  Generated password (shown once, store it in a password manager):\n')
    console.log(`    ${password}\n`)
  }
} catch (e) {
  console.error('Failed:', e)
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
