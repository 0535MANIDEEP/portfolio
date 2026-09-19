# Manideep Daram — Portfolio

**Frontend & Full-Stack Developer (Hyderabad) — Retail-tech focus.**

This is not a generic showcase. It solves a real hiring problem: *Indian retail shops need GST billing that works without internet — can you prove you built it?* This portfolio answers with 4 shipped systems, live CMS, and measurable proof.

Live: **https://manideep-portfolio-navy.vercel.app** — ISR 60, OG `1200×630`, `ViewTracker` + `portfolio_views` analytics, `portfolio_versions` audit.

---

## 1. Real Problem It Solves

**For hiring managers:** Generic portfolios with 10 bullet points per project are unverifiable. Retail-tech hiring (POS/ERP, GST, offline) needs proof of offline-first, Indian compliance, and LAN deployment — not TODO apps.

**For developers:** Rebuilding portfolios wastes weeks. This is a **reusable template**: `npx create-portfolio --supabase` with CMS, auth, ISR, OG, and analytics in one `docker compose up` of docs.

---

## 2. Redesigned Feature List (Valuable, Not Hyped)

**Viewer:**
- Single-page `Hero → Work (4) → Experience → About → Contact` — each project **5-stack, 3 features, 3 engineering** (was 12/20/10, now scannable in 30s)
- `SubHunt` Privacy-first Android subscription tracker — free, Room offline, WorkManager reminders
- `QueueForge` Free queue & booking (QR live ETA) — Next 16 + Supabase, no paywall
- `SS Mart POS` **Flagship** Offline-first LAN POS `http://machine:1994` → Next proxies `/api` → Express → SQLite volume — GST HSN/SAC, barcode/ESC/POS, dues/returns (keeps `qrcode` on canvas, no cloud)
- `SS Mart ERP` Spec: Flutter + .NET 8 + PostgreSQL + Drift/Redis/S3, 14 modules designed (spec-only, honest)
- `Sutra-Code` Socratic AI mentor (React 18 + AWS CDK: Lambda/DynamoDB/Cognito/Bedrock/Bhashini 22 langs) — built, not docs
- `ViewTracker` `src/components/portfolio/view-tracker.tsx:8` POSTs `/api/views` with SHA256 IP hash; `GET /api/views` shows total views + `lastUpdated`
- `OG Image` `src/app/opengraph-image.tsx:7` edge `1200×630` with name, title, site, project count

**Creator:**
- `/admin` 7 tabs (profile/projects/experience/education/skills/navigation/contact) — Supabase Auth (`src/app/admin/page.tsx:19` `signInWithPassword`), Bearer token to `POST /api/portfolio` `src/app/api/portfolio/route.ts:37` `auth.getUser(token)` via service role, `revalidatePath("/")` `src/app/api/portfolio/route.ts:62`
- `portfolio_versions` audit: every `upsert` inserts `section,data` `src/app/api/portfolio/route.ts:58`, last 20 retained
- `robots.txt` `src/app/robots.txt/route.ts:5` + `sitemap.xml` `src/app/sitemap.xml/route.ts:5` dynamic from `NEXT_PUBLIC_SITE_URL`
- Security: `next.config.ts:3` CSP `default-src 'self'`, HSTS `63072000`, `X-Frame: SAMEORIGIN`; RLS `revoke all on portfolio_sections from anon, authenticated` `supabase/migrations/001_portfolio_schema.sql:40`

---

## 3. Architecture Plan (Corrected)

```
Browser → Vercel Edge (ISR 60, OG) → Next 15 (RSC page.tsx getPortfolio() + client Header/view-tracker)
  → Supabase Postgres (portfolio_sections jsonb, RLS revoke anon, service role via api/portfolio)
  → Fallback src/data/portfolio.ts (trimmed, as const) if fetch fails
  → Admin (client, anon key) → api/portfolio (service role, revalidatePath) → versions/views tables
```

- **Server/Client boundaries:** `src/app/page.tsx:12` `async getPortfolio()` RSC; `src/components/portfolio/header.tsx:1` `"use client"` + `useState` for mobile; `src/app/admin/dashboard/page.tsx:1` client with `getSupabaseClient()` singleton `src/lib/supabase.ts:35`
- **Supabase JSON:** `section text PK, data jsonb, updated_at trigger set_updated_at()` `supabase/migrations/001_portfolio_schema.sql:16-30`; keys stable `profile/projects/experience/education/skills/navigation/contact` + `metrics` derived from `portfolio_views` count
- **Routing:** `/` ISR, `/admin` client, `/admin/dashboard` client, `/api/portfolio` dynamic, `/robots.txt` `/sitemap.xml` static, `/_not-found` `src/app/not-found.tsx:4` metadata `404`. Resume `mailto:` is ` <a href={resumeUrl}>` `src/components/portfolio/header.tsx:31` — never `Link`, so no 404 prefetch.

---

## 4. Project Structure

```
src/
├── app/
│   ├── layout.tsx (Inter, metadataBase, skip-to-content, viewport)
│   ├── page.tsx (revalidate 60, getPortfolio + ViewTracker)
│   ├── opengraph-image.tsx (edge OG 1200x630)
│   ├── not-found.tsx, loading.tsx, error.tsx, admin/dashboard/error.tsx
│   ├── admin/{page.tsx, dashboard/page.tsx}
│   └── api/{portfolio/route.ts, views/route.ts, robots.txt/route.ts, sitemap.xml/route.ts}
├── components/portfolio/{header, hero, work, experience, about, contact, footer, view-tracker}
├── data/portfolio.ts (fallback, 5-stack/3+3, matches Supabase seed)
└── lib/{supabase.ts, portfolio-data.ts (assertString, buildPortfolioData), validation.ts (Zod)}
supabase/migrations/001_portfolio_schema.sql (portfolio_sections + portfolio_versions + portfolio_views + RLS + seed 7 sections, 4 projects)
```

---

## 5. Getting Started

```bash
git clone https://github.com/0535MANIDEEP/portfolio && cd portfolio
npm install
cp .env.example .env.local # fill 4 vars
# NEXT_PUBLIC_SITE_URL=https://your.vercel.app
# NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
# SUPABASE_SERVICE_ROLE_KEY=<service_role> # server-only
# In Supabase SQL Editor: paste supabase/migrations/001_portfolio_schema.sql → Run (seeds 7 sections + 4 projects + creates versions/views)
npm run dev # http://localhost:3000  /admin → Supabase Auth → Invite user
```

---

## 6. Supabase Schema (Corrected)

`portfolio_sections(section text PK, data jsonb, updated_at timestamptz trigger)` + `portfolio_versions(id uuid pk, section text, data jsonb, created_at)` + `portfolio_views(id uuid, path text, viewed_at, ip_hash)`. All `enable RLS`, `revoke all anon/authenticated`, service role bypasses. Seed includes 4 projects (5-stack/3+3) and `additionalWork Sutra-Code`.

---

## 7. Workflows Added

- **View:** `ViewTracker` POST `/api/views` on mount → `portfolio_views` + `GET /api/views` for badge
- **Edit:** `/admin` → edit tab → Save → `POST /api/portfolio` with Bearer → `upsert portfolio_sections` → `insert portfolio_versions` → `revalidatePath("/")` → live in 60s
- **Share:** `opengraph-image.tsx` generated at `https://your.vercel.app/opengraph-image`

---

## 8. API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/portfolio` | — | `{section: data, ...}` |
| POST | `/api/portfolio` | `Bearer <supabase_jwt>` | `{section,data}` upsert + version + revalidate |
| POST | `/api/views` | — | `{path}` insert view (ip hash) |
| GET | `/api/views` | — | `{views, lastUpdated}` |

---

## 9. Deployment (Vercel)

`vercel` → set 4 envs (`SUPABASE_SERVICE_ROLE_KEY` Sensitive, not `NEXT_PUBLIC`). `next.config.ts:14` `poweredByHeader:false`.

---

## 10. Scripts

`npm run dev` `build` `start` `lint` `typecheck` — all must pass. `build` collects `9` routes: `/ (948B ISR 60)`, `/_not-found`, `/admin`, `/admin/dashboard`, `/api/portfolio` dynamic, `/robots.txt`, `/sitemap.xml`, `/opengraph-image`.

---

Built by [Manideep Daram](https://manideep-portfolio-navy.vercel.app) — MIT, free & open source.
