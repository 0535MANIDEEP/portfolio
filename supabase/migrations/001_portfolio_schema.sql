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

-- ── Seed data ─────────────────────────────────────────────────────────────────
-- Insert all 7 sections with realistic defaults.
-- Re-running is safe — upsert on the primary key.

insert into public.portfolio_sections (section, data) values

('profile', '{
  "name": "Manideep Daram",
  "heroTitle": "Frontend & Full-Stack Developer",
  "headline": "Frontend and full-stack developer building production-grade applications.",
  "supportingCopy": "I''m Manideep Daram, a software engineer based in Hyderabad. I specialize in building reliable web applications with TypeScript, React, Node.js, and cloud infrastructure. My focus is on clean code, proper documentation, and shipping work that''s easy for others to maintain.",
  "availability": "Open to full-stack, frontend, and backend roles across India · Available immediately",
  "location": "Hyderabad, Telangana, India",
  "email": "manideepdaram@gmail.com",
  "phone": "+91 7386296828",
  "linkedin": "https://www.linkedin.com/in/manideep-daram",
  "github": "https://github.com/0535MANIDEEP",
  "resumeLabel": "Request resume",
  "resumeUrl": "mailto:manideepdaram@gmail.com?subject=Resume%20request%20for%20Manideep%20Daram",
  "about": "I''m a 2024 Computer Science graduate and early-career software engineer. My experience includes frontend development with React and TypeScript, full-stack builds with Node.js and PostgreSQL, and mobile development with Flutter. I care about typed code, clear documentation, practical testing, and building applications that are production-ready.",
  "contactCopy": "I''m available immediately for full-stack, frontend, backend/API, and software engineering opportunities. Let''s discuss how I can help build production-ready applications for your team."
}'::jsonb),

('projects', '{
  "items": [
    {
      "name": "SubHunt",
      "summary": "Privacy-first subscription tracker for Android. All data stays on the device — no bank linking, no cloud sync. Built with Kotlin, Jetpack Compose, Material 3, Hilt, Room, and WorkManager.",
      "github": "https://github.com/0535MANIDEEP/SubHunt",
      "live": null,
      "stack": ["Kotlin", "Jetpack Compose", "Material 3", "Hilt", "Room", "WorkManager", "RevenueCat KMP", "AGP 9.0 + Gradle 9.1"],
      "features": [
        "Track unlimited subscriptions (Free — no limits)",
        "Smart dashboard with total monthly spending",
        "Bill reminders with customizable notification sounds",
        "Spending insights and health score (A-F)",
        "CSV and JSON data export",
        "Biometric or PIN app lock",
        "Material 3 UI with smooth animations",
        "Home screen widget"
      ],
      "engineering": [
        "Made everything free — removed all paywalls and subscription limits",
        "MVVM + UDF architecture with Repository pattern",
        "Hilt for dependency injection",
        "Room SQLite for local-first data persistence",
        "WorkManager for offline reminders",
        "No cloud sync, no bank linking — privacy first"
      ]
    },
    {
      "name": "QueueForge",
      "summary": "Full-stack SaaS queue and booking platform for barbershops and salons. Manage walk-in queues, accept online bookings, process payments via Stripe, and grow your business with a real-time dashboard.",
      "github": "https://github.com/0535MANIDEEP/cutqueue",
      "live": "https://cutqueue-amber.vercel.app",
      "stack": ["Next.js 15", "TypeScript", "Prisma 7", "PostgreSQL (Supabase)", "NextAuth v5", "Stripe", "Upstash Redis", "Resend", "Twilio", "Framer Motion", "Zod + React Hook Form"],
      "features": [
        "Real-time queue management — see who''s waiting, estimated wait times",
        "Online booking system — customers book slots, auto-accept or approve",
        "Revenue analytics — daily/weekly/monthly revenue, top services, peak hours",
        "Subscription billing — Stripe-powered plans (Free trial, Starter, Pro, Business)",
        "Customer CRM — history, repeat visit tracking, notes",
        "Role-based access — Admin, Staff, Customer roles"
      ],
      "engineering": [
        "Full SaaS platform with tiered pricing in INR",
        "Next.js 15 App Router + React 19",
        "Prisma 7 ORM with PostgreSQL on Supabase",
        "NextAuth v5 for authentication (credentials + JWT)",
        "Stripe Subscriptions with trial periods",
        "Upstash Redis for rate limiting"
      ]
    }
  ],
  "additionalWork": {
    "name": "Sutra-Code",
    "subtitle": "Socratic Mentor for Programmers",
    "github": "https://github.com/0535MANIDEEP/sutra-code",
    "description": "A programming-learning project featuring TypeScript and React UI work, backend API integration, prompt management, secure API proxying, unit tests, and documentation."
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
  "heading": "Let'\''s talk",
  "copy": "I'\''m available immediately for full-stack, frontend, backend/API, and software engineering opportunities. Let'\''s discuss how I can help build production-ready applications for your team."
}'::jsonb)

on conflict (section) do update
  set data       = excluded.data,
      updated_at = now();
