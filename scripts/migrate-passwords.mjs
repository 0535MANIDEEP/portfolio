/**
 * One-off migration: converts any plaintext AdminUser.password into a scrypt
 * hash and flags the account so the owner must choose a new password at next
 * sign-in.
 *
 *   node --env-file=.env scripts/migrate-passwords.mjs
 *
 * Safe to re-run: already-hashed records are skipped.
 */
import { PrismaClient } from '@prisma/client'
import { randomBytes, scryptSync } from 'crypto'

const N = 16384, r = 8, p = 1, KEYLEN = 64

function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, KEYLEN, { N, r, p })
  return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${hash.toString('hex')}`
}

const db = new PrismaClient()

try {
  const users = await db.adminUser.findMany()
  let migrated = 0

  for (const user of users) {
    if (user.password.startsWith('scrypt$')) {
      console.log(`  already hashed: ${user.username}`)
      continue
    }

    await db.adminUser.update({
      where: { id: user.id },
      // The plaintext value is preserved as the hash input so the existing
      // credential still works exactly once; mustChangePassword then forces
      // a replacement before anything else can be done in the admin panel.
      data: { password: hashPassword(user.password), mustChangePassword: true },
    })
    migrated++
    console.log(`  migrated: ${user.username} (must change password at next sign-in)`)
  }

  console.log(`\n${migrated} account(s) migrated, ${users.length - migrated} already hashed.`)
} catch (e) {
  console.error('Migration failed:', e)
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
