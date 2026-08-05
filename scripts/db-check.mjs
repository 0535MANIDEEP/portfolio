// Connectivity smoke test: verifies Prisma can reach Supabase Postgres.
// Run with: node --env-file=.env scripts/db-check.mjs
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
try {
  const [profile, blogs, projects, courses, comments, admins, snippets] = await Promise.all([
    db.profile.count(),
    db.blogPost.count(),
    db.project.count(),
    db.course.count(),
    db.comment.count(),
    db.adminUser.count(),
    db.codeSnippet.count(),
  ])
  console.log('PRISMA CONNECTION OK')
  console.table({ profile, blogs, projects, courses, comments, admins, snippets })
} catch (e) {
  console.error('PRISMA CONNECTION FAILED:', e.message)
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
