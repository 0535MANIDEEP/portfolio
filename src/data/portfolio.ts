export const portfolioFallback = {
  profile: {
    name: "Manideep Daram",
    heroTitle: "Frontend & Full-Stack Developer",
    headline: "Frontend and full-stack developer building reliable web applications.",
    supportingCopy:
      "I'm Manideep Daram, a software engineer based in Hyderabad. I specialize in TypeScript, React, Node.js, and cloud infrastructure. My focus is on clean code, practical testing, and shipping work that's easy to maintain.",
    availability: "Open to full-stack, frontend, and backend roles · Available immediately",
    location: "Hyderabad, Telangana, India",
    email: "manideepdaram@gmail.com",
    phone: "+91 7386296828",
    linkedin: "https://www.linkedin.com/in/manideep-daram",
    github: "https://github.com/0535MANIDEEP",
    resumeLabel: "Request resume",
    resumeUrl: "mailto:manideepdaram@gmail.com?subject=Resume%20request%20for%20Manideep%20Daram",
    about:
      "I'm a 2024 Computer Science graduate and early-career software engineer. I work with React, TypeScript, Node.js, PostgreSQL, and Flutter. I care about typed code, clear docs, and shipping maintainable, production-ready apps.",
    contactCopy: "Available immediately for full-stack, frontend, and backend roles. Let's discuss how I can help your team.",
  },

  education: {
    degree: "B.Tech, Computer Science Engineering",
    school: "Vidya Jyothi Institute of Technology",
    years: "2020–2024",
    cgpa: "8.53 / 10",
  },

  skills: {
    coreStack: "TypeScript · JavaScript · React · Node.js · Express · Prisma · Supabase · PostgreSQL · Docker · Flutter",
  },

  experience: {
    items: [
      {
        role: "Full Stack Developer Intern",
        company: "Crystalline Software Technologies",
        location: "Hitech City, Hyderabad",
        period: "Dec 2023 – Jun 2024",
        bullets: [
          "Built a risk-management SPA using Vue and TypeScript.",
          "Migrated legacy JavaScript to TypeScript to improve stability and build performance.",
          "Integrated AWS S3 for file storage and configured IAM policies for role-based access.",
          "Designed REST APIs and optimized MongoDB queries for document workflows.",
        ],
      },
      {
        role: "AI Data Engineering Contributor",
        company: "Viswam AI / Swecha Foundation (IIIT Hyderabad)",
        location: "Hyderabad",
        period: "Jun 2025 – Present",
        bullets: [
          "Curated and audited Telugu datasets for LLM training pipelines.",
          "Implemented preprocessing and bias-mitigation checks.",
        ],
      },
    ],
  },

  projects: {
    items: [
      {
        name: "SubHunt",
        summary: "Privacy-first Android subscription tracker — all data stays on device, no bank linking. Free and open source.",
        github: "https://github.com/0535MANIDEEP/SubHunt",
        live: null,
        stack: ["Kotlin", "Jetpack Compose", "Material 3", "Room", "WorkManager"],
        features: [
          "Dashboard with total monthly spending + health score (A-F)",
          "Bill reminders with customizable notifications",
          "Offline export (CSV/JSON) + biometric app lock",
        ],
        engineering: [
          "MVVM + UDF + Repository, Hilt DI",
          "Room SQLite offline-first, WorkManager reminders",
          "Free and open source — paywall disabled",
        ],
      },
      {
        name: "QueueForge",
        summary: "Free and open source queue & booking platform for barbershops/salons — real-time queue, online bookings, analytics.",
        github: "https://github.com/0535MANIDEEP/cutqueue",
        live: "https://queueforge-lake.vercel.app",
        stack: ["Next.js 16", "TypeScript", "Prisma 7", "Supabase", "NextAuth v5"],
        features: [
          "Real-time queue with live ETA, remote join via QR",
          "Online bookings with staff/service management",
          "WhatsApp sharing + multi-location support",
        ],
        engineering: [
          "Next.js 16 App Router + React 19, Prisma + Supabase",
          "NextAuth v5 (JWT), Upstash Redis rate limiting",
          "Free — Stripe present but not gating",
        ],
      },
      {
        name: "SS Mart POS",
        summary: "Offline-first POS for small retail — runs locally, no internet, no subscription. Billing + GST + receipts.",
        github: "https://github.com/0535MANIDEEP/ssmart-pos",
        live: null,
        stack: ["Next.js 16", "Express 5", "Prisma 7", "SQLite", "Tauri v2"],
        features: [
          "Barcode-driven checkout — scan to cart, Enter to bill",
          "Per-product GST/HSN/SAC + CGST/SGST breakout + discounts",
          "Dues/returns/store credit + offline barcode generator",
        ],
        engineering: [
          "Docker Compose (frontend:1994 → backend internal), SQLite volume",
          "Express + Zod + Helmet, HttpOnly JWT (admin/cashier)",
          "ESC/POS thermal printing + jsbarcode/qrcode on canvas",
        ],
      },
      {
        name: "SS Mart ERP",
        summary: "Retail ERP/POS with Flutter client + .NET 8 API + PostgreSQL — offline-first with background sync for Indian retail.",
        github: "https://github.com/0535MANIDEEP/ss-mart-erp",
        live: null,
        stack: ["Flutter 3.x", ".NET 8", "PostgreSQL", "SQLite + Drift", "Redis"],
        features: [
          "14 modules: Billing, Inventory, CRM, GST/tax, loyalty, reports, audit logs",
          "Offline-first: local writes → background sync queue",
          "Indian retail: GST, HSN/SAC, B2B/B2C",
        ],
        engineering: [
          "EF Core 8 + PostgreSQL, Drift SQLite for local ops",
          "Background sync with idempotent retries + conflict merge",
          "Redis + S3 storage, JWT + RBAC, full audit logs",
        ],
      },
    ],
    additionalWork: {
      name: "Sutra-Code",
      subtitle: "Socratic AI Mentor",
      github: "https://github.com/0535MANIDEEP/sutra-code",
      description: "Teaches programming via Socratic questioning + Indian analogies (cricket/cooking/mandi), faded scaffolds, voice viva. React 18 + AWS CDK (Lambda, DynamoDB, Cognito, Bedrock Claude, Bhashini 22 languages).",
    },
  },

  navigation: {
    links: [
      { href: "#work", label: "Work" },
      { href: "#experience", label: "Experience" },
      { href: "#about", label: "About" },
      { href: "#contact", label: "Contact" },
    ],
  },

  contact: {
    heading: "Let's talk",
    copy: "Available immediately for full-stack, frontend, and backend roles. Let's discuss how I can help your team.",
  },
} as const;
