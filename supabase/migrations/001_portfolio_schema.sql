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
      "summary": "Privacy-first subscription tracker for Android that helps users monitor recurring payments without any bank linking or cloud sync. All data stays on the device. Built with Kotlin, Jetpack Compose, Material 3, Hilt, Room, WorkManager, and RevenueCat KMP integrated (billing module present but paywall disabled — all features included free and open source).",
      "github": "https://github.com/0535MANIDEEP/SubHunt",
      "live": null,
      "stack": ["Kotlin", "Jetpack Compose", "Material 3", "Hilt", "Room", "WorkManager", "RevenueCat KMP (billing present, not enforced)", "AGP 9.0.1 + Gradle 9.1.0"],
      "features": [
        "Track unlimited subscriptions — free and open source, no paywalls",
        "Smart dashboard with total monthly spending",
        "Bill reminders with customizable notification sounds",
        "Spending insights and health score (A-F)",
        "CSV and JSON data export",
        "Biometric or PIN app lock",
        "Material 3 UI with smooth animations",
        "Home screen widget"
      ],
      "engineering": [
        "Free and open source — no subscriptions, no paywalls (RevenueCat KMP present but disabled)",
        "MVVM + UDF architecture with Repository pattern",
        "Hilt for dependency injection",
        "Room SQLite for local-first data persistence",
        "WorkManager for offline reminders",
        "No cloud sync, no bank linking — privacy first"
      ]
    },
    {
      "name": "QueueForge",
      "summary": "Full-stack SaaS queue and booking platform for barbershops and salons. Manage walk-in queues, accept online bookings, and grow your business with a real-time dashboard. Free and open source — no subscriptions, no tiers (Stripe integration present but paywall disabled, all features included). Built with Next.js 16, Prisma, Supabase, NextAuth, Upstash Redis, Twilio, and Resend.",
      "github": "https://github.com/0535MANIDEEP/cutqueue",
      "live": "https://queueforge-lake.vercel.app",
      "stack": ["Next.js 16", "TypeScript", "Prisma 7", "PostgreSQL (Supabase)", "NextAuth v5", "Stripe (integration present, billing disabled)", "Upstash Redis (rate limiting)", "Resend (transactional email)", "Twilio (SMS notifications)", "n8n (automation workflows)", "Framer Motion", "Zod + React Hook Form"],
      "features": [
        "Real-time queue management — see who''s waiting, estimated wait times",
        "Online booking system — customers book slots, auto-accept or approve",
        "Service & staff management — define services, assign staff, set availability",
        "Revenue analytics — daily/weekly/monthly revenue, top services, peak hours",
        "Free and open source — no subscriptions, no tiers, all features included",
        "Customer CRM — history, repeat visit tracking, notes",
        "WhatsApp sharing — share queue status and booking confirmations",
        "Multi-location support — manage multiple shop branches (all plans)",
        "Role-based access — Admin, Staff, Customer roles"
      ],
      "engineering": [
        "Free and open source — no tiered pricing, all features included (Stripe present but not gating)",
        "Next.js 16 App Router + React 19",
        "Prisma 7 ORM with PostgreSQL on Supabase",
        "NextAuth v5 for authentication (credentials + JWT)",
        "Upstash Redis for rate limiting",
        "Resend for transactional emails",
        "Twilio for SMS notifications",
        "n8n webhooks for automations",
        "Role-based access control throughout"
      ]
    },
    {
      "name": "SS Mart POS",
      "summary": "Offline-first Point of Sale and inventory management system for small retail shops. Runs entirely locally — no internet required, no subscription, no data leaving the premises. Built with Next.js 16, Express, Prisma, SQLite, Tauri v2 desktop wrapper, PWA, and ESC/POS thermal receipt printing.",
      "github": "https://github.com/0535MANIDEEP/ssmart-pos",
      "live": null,
      "stack": ["Next.js 16 (App Router)", "React 19", "TypeScript", "Tailwind CSS 4", "Express 5", "Prisma 7", "SQLite (better-sqlite3 driver)", "Tauri v2", "PWA", "ESC/POS thermal printing", "jsbarcode + qrcode", "recharts"],
      "features": [
        "Offline-first — all operations work without internet",
        "Guided onboarding — first walk configures shop, currency, GST, loyalty",
        "Barcode-driven POS — scan to add to cart, Enter to checkout",
        "GST / tax per-product with HSN/SAC codes (CGST/SGST/IGST breakout)",
        "Discounts — percentage or flat-amount, per-product standing discounts",
        "Loyalty program — customers earn points, redeem at checkout",
        "Customer dues (''udhaar'') — track short payments, full payment history",
        "Returns & exchanges — safe partial & repeat returns",
        "Store credit — refund kept with customer for future purchases",
        "Multi-currency — 20+ major currencies, symbol flows through whole app",
        "Offline barcode & QR generator — EAN-13, no internet needed",
        "GSTIN / PAN live format validation",
        "Works on phones and tablets — slide-out nav below desktop width",
        "Customizable receipts — header, footer, GST breakdown",
        "Multiple payment methods — Cash, UPI, Card",
        "Staff accounts & roles — admin + cashier logins",
        "Sales history — searchable past invoices, one-click CSV export",
        "Inventory management — low-stock alerts, negative stock allowed",
        "Print or download receipts — HTML, PDF, or USB thermal printer",
        "Sales dashboard with charts — revenue trend, best sellers, payment mix"
      ],
      "engineering": [
        "Full offline-first architecture with SQLite local storage",
        "Two-container Docker Compose (frontend:1994 + backend)",
        "Next.js proxies /api/* to backend over internal Docker network",
        "Express + Zod validation, helmet, rate limiting",
        "bcrypt hashing, HttpOnly JWT cookies, admin/cashier roles",
        "Custom React hook for barcode scanner (HID keyboard input)",
        "jsbarcode/qrcode rendered client-side to canvas",
        "recharts for dashboard graphs",
        "multer + csv-parse for admin reference data imports",
        "Docker Compose deployment — single `docker compose up`",
        "Print via USB: direct ESC/POS bytes to thermal printer"
      ]
    },
    {
      "name": "SS Mart ERP",
      "summary": "Complete retail ERP/POS system with Flutter mobile/desktop client, .NET 8 backend API, and PostgreSQL database. Offline-first architecture with background synchronization — designed for Indian retail operations with GST, HSN/SAC, and B2B/B2C support.",
      "github": "https://github.com/0535MANIDEEP/ss-mart-erp",
      "live": null,
      "stack": ["Flutter 3.x", ".NET 8 ASP.NET Core", "PostgreSQL 15+", "SQLite + Drift (offline local DB)", "Redis (cache & message queue)", "S3-compatible storage", "JWT + Role-Based Auth"],
      "features": [
        "14 core modules: Billing/POS, Inventory, Purchase Management, Customer CRM, Loyalty Points, Employee Management, Shift Management, GST/Tax Engine, Reports & Analytics, Backup/Restore, Data Migration, Audit Logs, Admin/Permissions, Sync Engine",
        "Offline-first — all critical operations work without internet",
        "Local-First Writes — SQLite for immediate local storage",
        "Background Sync — queue-based synchronization when online",
        "Idempotent Operations — safe retry mechanisms",
        "Conflict Resolution — smart merge strategies for concurrent edits",
        "Indian Retail Focus — GST, HSN/SAC, B2B/B2C support",
        "Cross-platform — Flutter (mobile + desktop), .NET 8 (web API), PostgreSQL"
      ],
      "engineering": [
        "Full architecture documentation (1100+ lines in ARCHITECTURE.md)",
        "9-phase roadmap (MIND_MAP.md, ROADMAP.md)",
        "24 API controllers in .NET 8 Web API",
        "21 feature modules in Flutter mobile app",
        "Entity Framework Core 8 with PostgreSQL",
        "Drift SQLite for type-safe local operations",
        "Background sync engine with idempotent operations",
        "S3-compatible storage for files/images",
        "Redis caching & message queue",
        "JWT authentication with role-based access control",
        "Complete audit logging of all operations"
      ]
    }
  ],
  "additionalWork": {
    "name": "Sutra-Code",
    "subtitle": "Socratic AI Mentor for Indian Programmers",
    "github": "https://github.com/0535MANIDEEP/sutra-code",
    "description": "Socratic AI mentor that teaches programming through guided questioning, not answers. React 18 + AWS CDK stack (Lambda, DynamoDB, Cognito, API Gateway, Bedrock Claude 3 Haiku, Bhashini 22 languages). Features: cultural analogies (cricket/cooking/mandi), faded scaffolds, voice viva via S3 audio, DPDP Act 2023 compliant with KMS encryption and CloudWatch audit logs."
  }
}''::jsonb),

('experience'=====================================
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
