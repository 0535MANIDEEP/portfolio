# Gokul Saraswat — Portfolio

A production-grade, full-stack portfolio website built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **Prisma + SQLite**, and **shadcn/ui**. Features a complete admin CMS, RAG-powered AI chatbot, and pixel-perfect dark/light mode.

---

## Features

### Public Website
- **Homepage**: Animated hero with typing effect, skill matrix with project filtering (max 5), featured projects, recent blogs, courses
- **About Page**: Experience timeline, certifications (clickable links), achievements, engineering philosophy, resume download
- **Projects Page**: Filterable project cards with skill/technology multi-select filters (max 5), complexity ratings
- **Project Detail**: Tabbed view (Overview / Technical Deep-Dive / Process & Results) with architecture diagrams, CI/CD snippets, Swagger embeds, terminal sessions
- **Blog Page**: Type filters (article, youtube, spotify, tweet), tag-based filtering (max 5), search
- **Blog Detail**: Markdown rendering with syntax highlighting, embed support (YouTube, Spotify, Tweets), behind-the-scenes section, comments
- **Courses Page**: Course listing with chapter counts
- **Course Detail**: Chapter navigation with section grouping, markdown rendering, HLD/LLD/API design/code block chapter types
- **Contact Page**: Form with validation, contact info sidebar
- **Global Search**: Command-K style search across all content
- **Background Music**: Autoplay on first interaction, bottom-left mute/unmute button
- **AI Chatbot**: RAG-powered floating widget with streaming responses (requires OpenAI + Supabase pgvector setup)
- **Dark/Light Mode**: System-aware with manual toggle
- **SEO**: Auto-generated sitemap, OpenGraph/Twitter meta tags
- **404 Page**: Animated not-found page
- **Responsive**: Mobile-first design with sheet navigation

### Admin Panel (`/admin`)
- **Login**: Username/password auth with rate limiting (default: `admin` / `admin123`)
- **Dashboard**: Stats cards (blogs, projects, courses, unread messages), recent items
- **Blog Manager**: Full CRUD, search, sort, type selector, tag management, maker-checker (written by / accepted by), markdown editor with live preview
- **Project Manager**: Full CRUD with 20+ fields (banner, screenshots, architecture diagrams, DB schemas, ADR, CI/CD, IaC, observability, test coverage, Swagger, terminal sessions), complexity rating (1-3 stars)
- **Course Manager**: Course CRUD with drag-and-drop chapter ordering, nested sections, chapter types (content, HLD, LLD, API design, code block)
- **Message Manager**: Inbox with read/unread status, sort, detail view
- **Todo Manager**: Full task management with status workflow (draft → in-progress → review → done), priority levels, assignee tracking, inline status changes, completion with remarks, archiving, per-todo history, search, sort
- **Operation Logs**: Admin-only panel showing last 1000 operations across the entire system
- **AI Chat Bot Settings**: Enable/disable chatbot, configure Supabase and OpenAI keys, batch RAG ingestion
- **Backup Manager**: Export/import full database backup as JSON
- **Profile Settings**: Edit all profile fields (name, bio, social links, skills, certifications, typing animation lines, carousel images, chatbot toggle)
- **User Manager**: Create/manage admin users with role-based access (admin, blog_editor, project_editor, course_editor, viewer)
- **Theme Toggle**: Dark/light mode within admin panel
- **Logout**: Redirects to homepage

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Standalone output) |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Components | shadcn/ui (New York style), Lucide Icons |
| Animations | Framer Motion |
| Database | SQLite via Prisma ORM |
| Styling | CSS Variables (oklch), tw-animate-css |
| Auth | localStorage-based admin auth |
| Chatbot | OpenAI GPT-4o-mini + Supabase pgvector (optional) |
| Markdown | react-markdown, react-syntax-highlighter |
| Forms | react-hook-form + zod + hookform resolvers |
| Icons | Lucide React |

---


## Prerequisites

You need exactly **one** of these runtimes installed:

| Runtime | Minimum Version | Install |
|---------|----------------|---------|
| **Node.js** | 20.x+ | [nodejs.org](https://nodejs.org) or `nvm install 20` |
| **Bun** | Latest | `curl -fsSL https://bun.sh/install \| bash` |

> **Recommended:** Node.js 22 LTS. The project works with both `npm` and `bun`, but `npm` is more universally available.

For Music add background-music.mp3 in public/background-music.mp3



### 1. Clone and Install

```bash
git clone <your-repo-url>
cd portfolio
npm install #Install Dependencies OR: bun install

You should see: `src/`, `prisma/`, `public/`, `package.json`, `seed.ts`, `.env.example`, etc.

# or: bun install
```

### 2. Set Up/Create Environment file

```bash
cp .env.example .env.local
# Edit .env.local if you want to enable the RAG chatbot means the .env
```
**That's it for basic usage.** The SQLite database URL is pre-configured:
```
DATABASE_URL="file:./db/custom.db"
```

or 

like this 


# =============================================
# Gokul Saraswat - Portfolio Application
# =============================================
# Copy this file to .env.local and fill in the values

# Database (SQLite - relative path from project root)
DATABASE_URL="file:./db/custom.db"

# =============================================
# Optional: RAG Chatbot (OpenAI + Supabase pgvector)
# =============================================
# If these are not set, the chatbot will show a "not configured" message
# and the admin panel's AI Chat Bot section will display setup instructions.

# OpenAI API Key (for embeddings + chat completions)
# OPENAI_API_KEY="sk-..."

# Supabase Project URL
# NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"

# Supabase Service Role Key (server-side only, NEVER expose to client)
# SUPABASE_SERVICE_ROLE_KEY="eyJ..."

### 3. Initialize Database


```bash
npx prisma generate    # Generates the Prisma client (TypeScript types)
npx prisma db push     # Creates/updates SQLite tables from schema.prisma
```

Then seed with sample data:
```bash
npx tsx seed.ts
# OR: bun run seed
```
This creates:
- 1 admin user (`admin` / `admin123`)
- 1 profile (your name, skills, social links)
- 5 sample blog posts
- 1 sample project
- 2 sample courses
- 17 sample todo items

### 4. Run Development Server

```bash
npm run dev
# or: bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Admin Access

Navigate to `/admin` and log in with:
- **Username**: `admin`
- **Password**: `admin123`

> Change the default credentials immediately after first login via the User Manager.

---

## Production Deployment

### Option A: Node.js Standalone

```bash
npm run build
npm run start
npm add react-syntax-highlighter @types/react-syntax-highlighter
```

This runs the optimized standalone build on port 3000.

### Option B: Docker

```bash
docker build -t portfolio .
docker run -p 3000:3000 -v ./db:/app/db portfolio
```

### Option C: Caddy Reverse Proxy

A `Caddyfile` is included. Use it with:

```
your-domain.com {
    reverse_proxy localhost:3000
}
```

---

## Project Structure

```
portfolio/
├── prisma/
│   └── schema.prisma           # 11 database models
├── public/
│   ├── logo.svg                # Site logo
│   └── robots.txt              # Search engine directives
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Homepage
│   │   ├── layout.tsx          # Root layout (theme, chat widget, music)
│   │   ├── globals.css         # Tailwind CSS 4 + CSS variables
│   │   ├── not-found.tsx       # Animated 404
│   │   ├── sitemap.ts          # Dynamic sitemap.xml
│   │   ├── middleware.ts       # Auth rate limiting + security headers
│   │   ├── admin/              # Admin panel (login + CMS layout)
│   │   ├── about/              # About page
│   │   ├── blog/               # Blog listing + [slug] detail
│   │   ├── projects/           # Projects listing + [slug] detail
│   │   ├── courses/            # Courses listing + [slug] detail
│   │   ├── contact/            # Contact form
│   │   ├── privacy/            # Privacy policy
│   │   └── api/                # REST API routes
│   │       ├── auth/           # Admin login
│   │       ├── blogs/          # Blog CRUD
│   │       ├── projects/       # Project CRUD
│   │       ├── courses/        # Course + Chapter CRUD
│   │       ├── todos/          # Todo CRUD + per-todo history
│   │       ├── messages/       # Contact messages
│   │       ├── profile/        # Profile settings
│   │       ├── comments/       # Comment system
│   │       ├── contact/        # Contact form submission
│   │       ├── chat/           # RAG chatbot (streaming)
│   │       ├── chat-status/    # Chat widget visibility check
│   │       ├── operation-logs/ # Operation log retrieval
│   │       ├── backup/         # Database export/import
│   │       ├── ingest/         # RAG batch document ingestion
│   │       └── admin-users/    # User management
│   ├── components/
│   │   ├── admin/              # Admin panel components (13 files)
│   │   ├── site/               # Public-facing components (14 files)
│   │   └── ui/                 # shadcn/ui primitives (48 files)
│   ├── hooks/                  # React hooks
│   └── lib/
│       ├── db.ts               # Prisma singleton client
│       ├── utils.ts            # cn() utility
│       ├── slug.ts             # URL slug generator
│       └── log-operation.ts    # Operation audit logger (cap: 1000)
├── supabase/
│   └── migrations/
│       └── 001_rag_schema.sql  # RAG tables (run in Supabase SQL Editor)
├── upload/
│   └── Gokul_Saraswat.pdf     # Resume PDF
├── db/
│   └── custom.db              # SQLite database (auto-created)
├── seed.ts                    # Database seeder
├── Dockerfile                 # Multi-stage production Docker build
├── Caddyfile                  # Caddy reverse proxy config
├── .env.example               # Environment variable template
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── next.config.ts             # Next.js (standalone output, security headers)
├── tailwind.config.ts         # Tailwind CSS 4 configuration
├── postcss.config.mjs         # PostCSS config
├── eslint.config.mjs          # ESLint config
└── components.json            # shadcn/ui config (New York style)
```

---

## Database Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **AdminUser** | Admin accounts | username, password, role, TOTP 2FA |
| **Profile** | Your personal info | name, bio, skills (JSON), social links, chatbot toggle |
| **BlogPost** | Blog posts | title, slug, content (Markdown), type, tags, maker-checker |
| **Project** | Portfolio projects | 20+ fields: banners, screenshots, ADR, CI/CD, complexity (1-3) |
| **Course** | Online courses | title, slug, chapters (nested) |
| **CourseChapter** | Course sections | title, content, type (content/HLD/LLD/API/code), self-referential tree |
| **ContactMessage** | Contact form | name, email, message, read status |
| **Todo** | Task management | status workflow, priority, assignee, entity linking |
| **TodoHistory** | Todo audit trail | action, field, oldValue, newValue, actor |
| **Comment** | Polymorphic comments | entityType, entityId (works on blogs/projects) |
| **OperationLog** | System audit log | action, entityType, entityId, actor (auto-capped at 1000) |

---

## Admin Panel Features

| Section | What You Can Do |
|---------|----------------|
| **Dashboard** | See stats: total blogs, projects, courses, unread messages |
| **Blogs** | Create/edit/delete posts, Markdown editor with live preview, type selector (article/YouTube/Spotify/tweet), tag management, search, sort, maker-checker (written by / accepted by) |
| **Projects** | Full CRUD with 20+ fields, complexity rating (1-3 stars), tech stack, architecture diagrams, DB schemas, ADR, CI/CD snippets, IaC, observability, test coverage, Swagger embeds, terminal sessions |
| **Courses** | Course CRUD with drag-and-drop chapter ordering, nested sections, chapter types (content, HLD, LLD, API design, code block) |
| **Messages** | View contact form submissions, mark read/unread, sort |
| **Todos** | Task management: draft -> in-progress -> review -> done, priority levels, assignee, completion with remarks, archiving, per-todo history, search, sort |
| **Operation Logs** | Admin-only panel: last 1000 operations across the entire system with filters |
| **AI Chat Bot** | Enable/disable chatbot, configure Supabase + OpenAI keys, batch RAG ingestion |
| **Backup** | Export full database as JSON, import from backup |
| **Users** | Create/manage admin accounts with roles (admin, blog_editor, project_editor, course_editor, viewer) |
| **Settings** | Edit profile: name, bio, social links, skills, certifications, typing animation lines, carousel images, chatbot toggle |

---

## Database Schema

8 models: `AdminUser`, `Profile`, `BlogPost`, `Project`, `Course`, `CourseChapter`, `ContactMessage`, `Todo`, `TodoHistory`, `Comment`, `OperationLog`

Key features:
- **Maker-Checker** on BlogPost (`writtenBy`, `acceptedBy`)
- **Operation Logging** with automatic 1000-record cap
- **Todo History** tracking all field changes with actor info
- **Course Chapters** with self-referential parent/child for nested sections
- **Project Complexity** rating (1-3 scale)

---

## Security

- Rate limiting on auth endpoint (10 attempts per 15 minutes)
- Security headers on all API routes (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy)
- Admin panel protected from clickjacking (SAMEORIGIN frame policy)
- `poweredByHeader` disabled to hide Next.js signature
- Prisma query logging disabled in production
- Graceful database connection shutdown

---

## Scripts

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 (hot reload) |
| `npm run build` | Production build (standalone output in `.next/standalone/`) |
| `npm run start` | Run production build on port 3000 |
| `npm run lint` | ESLint check |
| `npx prisma generate` | Regenerate Prisma client types |
| `npx prisma db push` | Push schema changes to SQLite |
| `npx prisma studio` | Open visual database browser |
| `npx tsx seed.ts` | Seed/refresh sample data |
| `npm run db:push` | Alias for `prisma db push` |
| `npm run db:generate` | Alias for `prisma generate` |

---


## RAG Chatbot Setup (Optional)

The chatbot uses **Supabase (pgvector)** for vector storage + **OpenAI** for embeddings and chat. Typical cost: **<$1/month**.

### Step-by-step

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (Free Tier)
2. **Run the SQL migration** in Supabase SQL Editor:
   - Copy the full contents of `supabase/migrations/001_rag_schema.sql` and execute it
3. **Get your API keys:**
   - Supabase: Dashboard > Settings > API
   - OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
4. **Add to `.env.local`:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   OPENAI_API_KEY=sk-...
   ```
5. **Restart your dev server** (env changes require restart)
6. **In Admin > AI Chat Bot:**
   - Your keys should auto-detect
   - Click "Batch Ingest" to embed your blog/project/course content
   - Toggle "Show chat widget on website" to ON
7. The floating chat widget will now appear on all public pages

### How It Works
- `/api/ingest` generates OpenAI `text-embedding-3-small` vectors and stores them in Supabase
- `/api/chat` takes a user message, generates an embedding, finds the top 5 most relevant chunks via cosine similarity, then sends the context + question to `gpt-4o-mini` with streaming
- Chat history is session-only (cleared on page refresh) — no persistent chat storage

---

## Production Deployment

### Option A: Node.js (Simplest)

```bash
npm run build
npm run start    # Runs on port 3000

npm pack # to pack all in small files 
```

### Option B: Docker

```bash
docker build -t portfolio .
docker run -p 3000:3000 -v ./db:/app/db portfolio
```

The Dockerfile uses multi-stage builds for a minimal final image.

### Option C: Caddy (HTTPS + Auto-renew)

```
your-domain.com {
    reverse_proxy localhost:3000
}
```

### Option D: Vercel

```bash
npm i -g vercel
vercel
```

> For Vercel: Set env vars in the dashboard. Use Backup Manager to export your local SQLite DB and import it in production.

---

## Customization Guide

### Change to Your Own Name/Info

1. **Fastest:** Log into Admin > Settings and edit all profile fields (name, bio, skills, social links, certifications, typing animation lines, carousel images)
2. **Code level:** Edit `seed.ts` and change the profile defaults, then re-run `npx tsx seed.ts`

### Add Your Resume PDF

Place your PDF at `public/your-resume.pdf`, then update the resume URL in Admin > Settings.

### Add Your Avatar

Place your photo at `public/avatar.jpeg` (or `.png`), then update the avatar URL in Admin > Settings.

### Change Admin Credentials

1. Go to Admin > Users
2. Edit the `admin` user or create a new one
3. Delete the default user if desired

### Change Port

```bash
PORT=4000 npm run dev
# or set HOSTNAME="0.0.0.0" for external access
```

---

---
## Troubleshooting

| Issue | Solution |
|-------|---------|
| `prisma generate` fails | Ensure Node.js 20+ is installed. Run `npm install -D @prisma/client prisma` then retry |
| `npx prisma db push` says "No datasource" | Make sure `.env.local` exists and contains `DATABASE_URL="file:./db/custom.db"` |
| Port 3000 already in use | Run `PORT=3001 npm run dev` or kill the process on 3000: `lsof -ti:3000 \| xargs kill` |
| Chatbot shows "not configured" | Either set the 3 env vars (OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) or ignore it — the site works perfectly without the chatbot |
| Seed fails with "unique constraint" | The seed uses `upsert`, so re-running it is safe. If it still fails, delete `db/custom.db` and run `npx prisma db push` again |
| Images not loading | Place your images in `public/` folder. They're accessible at `/filename.ext` |
| Build fails with type errors | Run `npx prisma generate` first, then `npm run build` |
| Docker build fails | Ensure you have Docker 20+. If using Bun lockfile, the Dockerfile handles it via `bun install --frozen-lockfile` |

---

--- 

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./db/custom.db` | SQLite database path (relative to project root) |
| `OPENAI_API_KEY` | No (chatbot only) | — | OpenAI API key for embeddings + chat |
| `NEXT_PUBLIC_SUPABASE_URL` | No (chatbot only) | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | No (chatbot only) | — | Supabase service role key (server-side only) |

---

## License

Private — All rights reserved.

Built by [Gokul Saraswat](https://gokulsaraswat.com)



Commands

git add * 
git commit -m "Commit #2 fix: add prisma generate to postinstall for vercel build " 
git push origin main

To Check before running if any error is there run 
npm run lint       # fix warnings first
npx tsc --noEmit   # fix type errors
npm run build      # final confirmation This is ok vercel is ok   
npx prisma generate
npx prisma db pull
creates a file with errors
(echo "=== LINT ===" && npm run lint; echo "=== TSC ===" && npx tsc --noEmit; echo "=== BUILD ===" && npm run build) 2>&1 | tee all-errors.txt