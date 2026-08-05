/**
 * Rebuilds the RAG index in Supabase from the content in Postgres.
 *
 *   node --env-file=.env scripts/rag-ingest.mjs            # incremental
 *   node --env-file=.env scripts/rag-ingest.mjs --purge    # wipe first
 *
 * Chunks are keyed by (type, source_id) so re-running replaces a source's
 * chunks instead of duplicating them.
 */
import { PrismaClient } from '@prisma/client'
import { GoogleGenAI } from '@google/genai'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const GEMINI_KEY = process.env.GEMINI_API_KEY

if (!SUPABASE_URL || !SERVICE_KEY || !GEMINI_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / GEMINI_API_KEY')
  process.exit(1)
}

const db = new PrismaClient()
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY })

const CHUNK_CHARS = 1500
const OVERLAP = 150

const sbHeaders = {
  'Content-Type': 'application/json',
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
}

/** Strip markdown/HTML so embeddings describe prose, not syntax. */
function toPlainText(input = '') {
  return String(input)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`|-]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Split on sentence-ish boundaries, keeping a small overlap for context. */
function chunk(text) {
  const clean = toPlainText(text)
  if (!clean) return []
  if (clean.length <= CHUNK_CHARS) return [clean]

  const out = []
  let start = 0
  while (start < clean.length) {
    let end = Math.min(start + CHUNK_CHARS, clean.length)
    if (end < clean.length) {
      const brk = clean.lastIndexOf('. ', end)
      if (brk > start + CHUNK_CHARS * 0.5) end = brk + 1
    }
    out.push(clean.slice(start, end).trim())
    if (end >= clean.length) break
    start = end - OVERLAP
  }
  return out.filter(Boolean)
}

async function embed(text) {
  const res = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
    config: { outputDimensionality: 768 },
  })
  const values = res.embeddings?.[0]?.values
  if (!values) throw new Error('no embedding returned')
  return values
}

async function deleteSource(type, sourceId) {
  const url = `${SUPABASE_URL}/rest/v1/documents?type=eq.${encodeURIComponent(type)}&source_id=eq.${encodeURIComponent(sourceId)}`
  const res = await fetch(url, { method: 'DELETE', headers: sbHeaders })
  if (!res.ok) throw new Error(`delete failed: ${await res.text()}`)
}

async function insertChunks(rows) {
  if (!rows.length) return
  const res = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
    method: 'POST',
    headers: sbHeaders,
    body: JSON.stringify(rows),
  })
  if (!res.ok) throw new Error(`insert failed: ${await res.text()}`)
}

/** Embed + replace all chunks for one logical source. */
async function ingest({ type, sourceId, sourceTitle, text, metadata = {} }) {
  const parts = chunk(text)
  if (!parts.length) return 0

  await deleteSource(type, sourceId)

  const rows = []
  for (const part of parts) {
    rows.push({
      content: part,
      type,
      source_id: sourceId,
      source_title: sourceTitle,
      metadata,
      embedding: await embed(part),
    })
    // Stay well under the free-tier embedding rate limit.
    await new Promise((r) => setTimeout(r, 120))
  }

  await insertChunks(rows)
  console.log(`  ${type}/${sourceId} -> ${rows.length} chunk(s)`)
  return rows.length
}

async function main() {
  if (process.argv.includes('--purge')) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/documents?id=not.is.null`, {
      method: 'DELETE',
      headers: sbHeaders,
    })
    console.log('purged existing documents:', res.ok)
  }

  let total = 0

  // ── Profile / resume ────────────────────────────────────────────
  const profile = await db.profile.findFirst()
  if (profile) {
    const skills = safeJson(profile.skills, [])
      .map((g) => `${g.category}: ${(g.items || []).join(', ')}`)
      .join('. ')
    const certs = safeJson(profile.certifications, []).join(', ')

    total += await ingest({
      type: 'profile',
      sourceId: 'profile',
      sourceTitle: profile.name,
      text: [
        `${profile.name} is a ${profile.occupation} at ${profile.company}, based in ${profile.location}.`,
        `Contact: ${profile.email}. Website: ${profile.website}. GitHub: ${profile.github}. LinkedIn: ${profile.linkedin}.`,
        profile.tagline,
        profile.bio,
        skills && `Skills and technologies. ${skills}.`,
        certs && `Certifications: ${certs}.`,
        profile.codeReviewPhilosophy && `Code review philosophy: ${profile.codeReviewPhilosophy}`,
        profile.agileExperience && `Agile experience: ${profile.agileExperience}`,
      ].filter(Boolean).join('\n'),
    })
  }

  // ── Blog posts ──────────────────────────────────────────────────
  for (const b of await db.blogPost.findMany({ where: { published: true } })) {
    total += await ingest({
      type: 'blog',
      sourceId: b.slug,
      sourceTitle: b.title,
      text: `${b.title}. ${b.excerpt} ${b.content}`,
      metadata: { slug: b.slug, tags: b.tags, category: b.category, url: `/blog/${b.slug}` },
    })
  }

  // ── Projects ────────────────────────────────────────────────────
  for (const p of await db.project.findMany()) {
    const stack = safeJson(p.stack, []).join(', ')
    total += await ingest({
      type: 'project',
      sourceId: p.slug,
      sourceTitle: p.title,
      text: [
        `${p.title}. ${p.shortDesc}`,
        p.description,
        stack && `Tech stack: ${stack}.`,
        p.role && `Role: ${p.role}`,
        p.process, p.results, p.performanceMetrics, p.securityImplementation,
        p.repository && `Repository: ${p.repository}`,
        p.website && `Live site: ${p.website}`,
      ].filter(Boolean).join('\n'),
      metadata: { slug: p.slug, featured: p.featured, url: `/projects/${p.slug}` },
    })
  }

  // ── Courses (with their chapters) ───────────────────────────────
  for (const c of await db.course.findMany({ include: { chapters: true } })) {
    const body = c.chapters
      .sort((a, b) => a.order - b.order)
      .map((ch) => `${ch.title}. ${ch.content}`)
      .join('\n')
    total += await ingest({
      type: 'course',
      sourceId: c.slug,
      sourceTitle: c.title,
      text: `${c.title}. ${c.description}\n${body}`,
      metadata: { slug: c.slug, chapters: c.chapters.length, url: `/courses/${c.slug}` },
    })
  }

  // ── Code snippets flagged for RAG ───────────────────────────────
  for (const s of await db.codeSnippet.findMany({ where: { published: true } })) {
    total += await ingest({
      type: 'snippet',
      sourceId: s.slug,
      sourceTitle: s.title,
      text: `${s.title}. ${s.description} ${s.comment}`,
      metadata: { slug: s.slug, language: s.language, url: `/snippets#${s.slug}` },
    })
  }

  console.log(`\nDone. ${total} chunk(s) indexed.`)
}

function safeJson(raw, fallback) {
  try {
    const v = JSON.parse(raw || '')
    return v ?? fallback
  } catch {
    return fallback
  }
}

main()
  .catch((e) => { console.error('Ingest failed:', e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
