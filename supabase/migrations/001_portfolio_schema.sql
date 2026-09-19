-- ============================================================
-- Portfolio CMS Schema
-- Run this in the Supabase SQL Editor before using the app.
-- ============================================================

-- portfolio_sections
-- One row per section. The `data` column holds the full JSON
-- payload for that section (profile, projects, experience, etc.)
create table if not exists public.portfolio_sections (
  section    text        primary key,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Keep updated_at current on every update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_portfolio_sections_updated_at on public.portfolio_sections;
create trigger trg_portfolio_sections_updated_at
  before update on public.portfolio_sections
  for each row
  execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
-- The anon key is used only for Supabase Auth on the client.
-- All data queries go through server-side API routes using the
-- service role key, so public read access is intentionally disabled.
alter table public.portfolio_sections enable row level security;

-- Revoke all access from anon and authenticated roles.
-- The service role key bypasses RLS entirely.
revoke all on public.portfolio_sections from anon, authenticated;

-- ── Portfolio versions (audit) & views (analytics) ──────────────────────────
create table if not exists public.portfolio_versions (
  id         uuid primary key default gen_random_uuid(),
  section    text not null,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.portfolio_views (
  id         uuid primary key default gen_random_uuid(),
  path       text not null default '/',
  viewed_at  timestamptz not null default now(),
  ip_hash    text
);
alter table public.portfolio_versions enable row level security;
alter table public.portfolio_views enable row level security;
revoke all on public.portfolio_versions from anon, authenticated;
revoke all on public.portfolio_views from anon, authenticated;
-- service role bypasses RLS; optionally allow anon insert for views via API only

-- ── Seed data ─────────────────────────────────────────────────────────────────
-- Insert all 7 sections with realistic defaults.
-- Re-running is safe — upsert on the primary key.

insert into public.portfolio_sections (section, data) values

('profile', '{
  "name": "Manideep Daram",
  "heroTitle": "Frontend & Full-Stack Developer",
  "headline": "Frontend and full-stack developer building reliable web applications.",
  "supportingCopy": "I''m Manideep Daram, a software engineer based in Hyderabad. I specialize in TypeScript, React, Node.js, and cloud infrastructure. My focus is on clean code, practical testing, and shipping work that''s easy to maintain.",
  "availability": "Open to full-stack, frontend, and backend roles · Available immediately",
  "location": "Hyderabad, Telangana, India",
  "email": "manideepdaram@gmail.com",
  "phone": "+91 7386296828",
  "linkedin": "https://www.linkedin.com/in/manideep-daram",
  "github": "https://github.com/0535MANIDEEP",
  "resumeLabel": "Request resume",
  "resumeUrl": "mailto:manideepdaram@gmail.com?subject=Resume%20request%20for%20Manideep%20Daram",
  "about": "I''m a 2024 Computer Science graduate and early-career software engineer. I work with React, TypeScript, Node.js, PostgreSQL, and Flutter. I care about typed code, clear docs, and shipping maintainable, production-ready apps.",
  "contactCopy": "Available immediately for full-stack, frontend, and backend roles. Let''s discuss how I can help your team."
}'::jsonb),

('projects', '{
  "items": [
    {
      "name": "SubHunt",
      "summary": "Privacy-first Android subscription tracker — all data stays on device, no bank linking. Free and open source.",
      "github": "https://github.com/0535MANIDEEP/SubHunt",
      "live": null,
      "stack": ["Kotlin", "Jetpack Compose", "Material 3", "Room", "WorkManager"],
      "features": [
        "Dashboard with total monthly spending + health score (A-F)",
        "Bill reminders with customizable notifications",
        "Offline export (CSV/JSON) + biometric app lock"
      ],
      "engineering": [
        "MVVM + UDF + Repository, Hilt DI",
        "Room SQLite offline-first, WorkManager reminders",
        "Free and open source — paywall disabled"
      ]
    },
    {
      "name": "QueueForge",
      "summary": "Free and open source queue & booking platform for barbershops/salons — real-time queue, online bookings, analytics.",
      "github": "https://github.com/0535MANIDEEP/cutqueue",
      "live": "https://queueforge-lake.vercel.app",
      "stack": ["Next.js 16", "TypeScript", "Prisma 7", "Supabase", "NextAuth v5"],
      "features": [
        "Real-time queue with live ETA, remote join via QR",
        "Online bookings with staff/service management",
        "WhatsApp sharing + multi-location support"
      ],
      "engineering": [
        "Next.js 16 App Router + React 19, Prisma + Supabase",
        "NextAuth v5 (JWT), Upstash Redis rate limiting",
        "Free — Stripe present but not gating"
      ]
    },
    {
      "name": "SS Mart POS",
      "summary": "Offline-first POS for small retail — runs locally, no internet, no subscription. Billing + GST + receipts.",
      "github": "https://github.com/0535MANIDEEP/ssmart-pos",
      "live": null,
      "stack": ["Next.js 16", "Express 5", "Prisma 7", "SQLite", "Tauri v2"],
      "features": [
        "Barcode-driven checkout — scan to cart, Enter to bill",
        "Per-product GST/HSN/SAC + CGST/SGST breakout + discounts",
        "Dues/returns/store credit + offline barcode generator"
      ],
      "engineering": [
        "Docker Compose (frontend:1994 → backend internal), SQLite volume",
        "Express + Zod + Helmet, HttpOnly JWT (admin/cashier)",
        "ESC/POS thermal printing + jsbarcode/qrcode on canvas"
      ]
    },
    {
      "name": "SS Mart ERP",
      "summary": "Retail ERP/POS with Flutter client + .NET 8 API + PostgreSQL — offline-first with background sync for Indian retail.",
      "github": "https://github.com/0535MANIDEEP/ss-mart-erp",
      "live": null,
      "stack": ["Flutter 3.x", ".NET 8", "PostgreSQL", "SQLite + Drift", "Redis"],
      "features": [
        "14 modules: Billing, Inventory, CRM, GST/tax, loyalty, reports, audit logs",
        "Offline-first: local writes → background sync queue",
        "Indian retail: GST, HSN/SAC, B2B/B2C"
      ],
      "engineering": [
        "EF Core 8 + PostgreSQL, Drift SQLite for local ops",
        "Background sync with idempotent retries + conflict merge",
        "Redis + S3 storage, JWT + RBAC, full audit logs"
      ]
    }
  ],
  "additionalWork": {
    "name": "Sutra-Code",
    "subtitle": "Socratic AI Mentor",
    "github": "https://github.com/0535MANIDEEP/sutra-code",
    "description": "Teaches programming via Socratic questioning + Indian analogies (cricket/cooking/mandi), faded scaffolds, voice viva. React 18 + AWS CDK (Lambda, DynamoDB, Cognito, Bedrock Claude, Bhashini 22 languages)."
  }
}'::jsonb),

('experience', '{
  "items": [
    {
      "role": "Full Stack Developer Intern",
      "company": "Crystalline Software Technologies",
      "location": "Hitech City, Hyderabad",
      "period": "Dec 2023 – Jun 2024",
      "bullets": [
        "Built a risk-management SPA using Vue and TypeScript.",
        "Migrated legacy JavaScript to TypeScript to improve frontend stability and build performance.",
        "Integrated AWS S3 for file storage and configured IAM policies for role-based access.",
        "Designed REST APIs and optimized MongoDB queries for document workflows."
      ]
    },
    {
      "role": "AI Data Engineering Contributor",
      "company": "Viswam AI / Swecha Foundation (IIIT Hyderabad)",
      "location": "Hyderabad",
      "period": "Jun 2025 – Present",
      "bullets": [
        "Curated and audited Telugu datasets for LLM training pipelines.",
        "Implemented preprocessing and bias-mitigation checks."
      ]
    }
  ]
}'::jsonb),

('education', '{
  "degree": "B.Tech, Computer Science Engineering",
  "school": "Vidya Jyothi Institute of Technology",
  "years": "2020–2024",
  "cgpa": "8.53 / 10"
}'::jsonb),

('skills', '{
  "coreStack": "TypeScript · JavaScript · React · Node.js · Express · Prisma · Supabase · PostgreSQL · Docker · Flutter"
}'::jsonb),

('navigation', '{
  "links": [
    { "href": "#work",       "label": "Work"       },
    { "href": "#experience", "label": "Experience" },
    { "href": "#about",      "label": "About"      },
    { "href": "#contact",    "label": "Contact"    }
  ]
}'::jsonb),

('contact', '{
  "heading": "Let''s talk",
  "copy": "Available immediately for full-stack, frontend, and backend roles. Let''s discuss how I can help your team."
}'::jsonb)

on conflict (section) do update
  set data       = excluded.data,
      updated_at = now();
