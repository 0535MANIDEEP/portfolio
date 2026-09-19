# Manideep Daram — Portfolio

Personal portfolio website for **Manideep Daram**, Frontend & Full-Stack Developer based in Hyderabad.

Built with **Next.js 15**, **React 19**, **TypeScript**, **Tailwind CSS 4**, and **Supabase** (Postgres). Content is managed through a built-in admin CMS — no redeploys needed to update projects, experience, or any section.

Live: [manideep-portfolio-navy.vercel.app](https://manideep-portfolio-navy.vercel.app)

---

## Features

- **Single-page portfolio** — Hero, Work, Experience, About, Contact, Footer
- **Admin CMS** (`/admin`) — edit every section live via Supabase; changes reflect immediately
- **Resume button** — `mailto:` link that requests a resume via email; no 404 routes
- **Responsive header** — sticky nav with mobile hamburger menu
- **Accessible** — skip-to-content, focus-visible styles, reduced-motion support
- **Security headers** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.
- **SEO** — OpenGraph meta, robots.txt, structured metadata

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Database | Supabase Postgres (JSONB per section) |
| Validation | Zod |
| Auth | Supabase Auth (admin login) |
| Hosting | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — fonts, metadata, viewport
│   ├── page.tsx                # Home page — fetches all sections, renders components
│   ├── globals.css             # Tailwind v4 + CSS custom properties
│   ├── admin/
│   │   ├── page.tsx            # Admin login (Supabase Auth)
│   │   └── dashboard/
│   │       └── page.tsx        # Admin CMS — edit all 7 sections
│   └── api/
│       ├── portfolio/
│       │   └── route.ts        # GET (read all sections) + POST (upsert one section)
│       └── auth/
│           └── route.ts        # Admin sign-in via service role key
├── components/
│   └── portfolio/
│       ├── header.tsx          # Sticky nav, mobile menu, resume button
│       ├── hero.tsx            # Headline, supporting copy, CTA buttons
│       ├── work.tsx            # Projects list + additional work card
│       ├── experience.tsx      # Experience timeline
│       ├── about.tsx           # About text, core stack badges, education
│       ├── contact.tsx         # Contact CTA section
│       └── footer.tsx          # Footer with links
├── data/
│   └── portfolio.ts            # Static fallback data (mirrors Supabase seed)
└── lib/
    ├── portfolio-data.ts       # getPortfolio() — fetches + types Supabase data
    └── supabase.ts             # Supabase client + admin client factory
supabase/
└── migrations/
    └── 001_portfolio_schema.sql  # Table definition, RLS, and seed data
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier is fine)

### 1. Clone and install

```bash
git clone https://github.com/0535MANIDEEP/portfolio
cd portfolio
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://your-portfolio.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get the Supabase keys from your Supabase dashboard → **Settings → API**.

Set `NEXT_PUBLIC_SITE_URL` to your deployed Vercel URL for proper SEO metadata.

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` is server-side only. It is never sent to the browser.

### 3. Set up the database

Open your Supabase project → **SQL Editor**, paste the full contents of
`supabase/migrations/001_portfolio_schema.sql`, and run it.

This creates the `portfolio_sections` table, sets RLS (no public access), and
seeds all 7 sections with default content.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Database Schema

One table: `portfolio_sections`

| Column | Type | Description |
|--------|------|-------------|
| `section` | `text` (PK) | Section name: `profile`, `projects`, `experience`, `education`, `skills`, `navigation`, `contact` |
| `data` | `jsonb` | Full JSON payload for the section |
| `updated_at` | `timestamptz` | Auto-updated on every write |

### Section shapes

**`profile`**
```json
{
  "name": "Manideep Daram",
  "heroTitle": "Frontend & Full-Stack Developer",
  "headline": "...",
  "supportingCopy": "...",
  "availability": "...",
  "location": "Hyderabad, Telangana, India",
  "email": "manideepdaram@gmail.com",
  "phone": "+91 7386296828",
  "linkedin": "https://www.linkedin.com/in/manideep-daram",
  "github": "https://github.com/0535MANIDEEP",
  "resumeLabel": "Request resume",
  "resumeUrl": "mailto:manideepdaram@gmail.com?subject=Resume%20request%20for%20Manideep%20Daram",
  "about": "...",
  "contactCopy": "..."
}
```

**`projects`**
```json
{
  "items": [
    {
      "name": "SubHunt",
      "summary": "...",
      "stack": ["Kotlin", "Jetpack Compose"],
      "live": null,
      "github": "https://github.com/0535MANIDEEP/SubHunt",
      "features": ["..."],
      "engineering": ["..."]
    }
  ],
  "additionalWork": {
    "name": "Sutra-Code",
    "subtitle": "Socratic Mentor for Programmers",
    "description": "...",
    "github": "https://github.com/0535MANIDEEP/sutra-code"
  }
}
```

> `live` must be a URL string or `null`. A `null` value hides the "Live demo" button.

**`experience`**
```json
{
  "items": [
    {
      "role": "Full Stack Developer Intern",
      "company": "Crystalline Software Technologies",
      "location": "Hitech City, Hyderabad",
      "period": "Dec 2023 – Jun 2024",
      "bullets": ["..."]
    }
  ]
}
```

**`education`**
```json
{
  "degree": "B.Tech, Computer Science Engineering",
  "school": "Vidya Jyothi Institute of Technology",
  "years": "2020–2024",
  "cgpa": "8.53 / 10"
}
```

**`skills`**
```json
{ "coreStack": "TypeScript · JavaScript · React · Node.js · Express · Prisma · Supabase · PostgreSQL · Docker · Flutter" }
```

**`navigation`**
```json
{
  "links": [
    { "href": "#work",       "label": "Work"       },
    { "href": "#experience", "label": "Experience" },
    { "href": "#about",      "label": "About"      },
    { "href": "#contact",    "label": "Contact"    }
  ]
}
```

**`contact`**
```json
{
  "heading": "Let's talk",
  "copy": "..."
}
```

---

## Admin CMS

Visit `/admin` and sign in with your Supabase Auth credentials.

The dashboard has 7 tabs — one per section. Edit fields and press **Save** to upsert
that section's row in Supabase. Changes appear on the public site within 60 seconds
(the home page uses `revalidate = 60`).

To create an admin account: Supabase dashboard → **Authentication → Users → Invite user**.

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/portfolio` | Returns all sections as `{ section: data, ... }` |
| `POST` | `/api/portfolio` | Upserts one section. Body: `{ section, data }`. Requires Bearer token. |

All routes use the service role key server-side. The anon key is only used for client-side authentication.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Yes | Your deployed site URL (used for SEO metadata) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (used for client-side Auth) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key — server-side only, bypasses RLS |

---

## Deployment (Vercel)

```bash
npm i -g vercel
vercel
```

Set the three environment variables in the Vercel dashboard under
**Settings → Environment Variables**. The `SUPABASE_SERVICE_ROLE_KEY` should
be set as a **server-only** variable (not exposed to the browser).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

---

## Pre-flight

```bash
npm run lint
npm run typecheck
npm run build
```

---

## License

Private — All rights reserved.

Built by [Manideep Daram](https://manideep-portfolio-navy.vercel.app)
