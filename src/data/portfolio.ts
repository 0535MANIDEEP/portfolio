export const portfolio = {
  name: "Manideep Daram",
  heroTitle: "Frontend & Full-Stack Developer",
  headline:
    "Frontend and full-stack developer building reliable web applications.",
  supportingCopy:
    "I'm Manideep Daram, a software engineer based in Hyderabad. I work with TypeScript, frontend frameworks, Node.js, REST APIs, databases, and AWS to build practical application workflows.",
  availability:
    "Open to junior roles in Hyderabad and remote roles across India · Available immediately",
  location: "Hyderabad, Telangana, India",
  email: "manideepdaram@gmail.com",
  phone: "+91 7386296828",
  linkedin: "https://www.linkedin.com/in/manideep-daram",
  github: "https://github.com/0535MANIDEEP",
  resumeLabel: "Request resume",
  resumeUrl:
    "mailto:manideepdaram@gmail.com?subject=Resume%20request%20for%20Manideep%20Daram",

  education: {
    degree: "B.Tech, Computer Science Engineering",
    school: "Vidya Jyothi Institute of Technology",
    years: "2020–2024",
    cgpa: "8.53 / 10",
  },

  coreStack:
    "TypeScript · JavaScript · Angular · React · Vue · Node.js · Express · MongoDB · PostgreSQL · MySQL · AWS · Docker",

  about:
    "I'm a 2024 Computer Science graduate and early-career software engineer. My experience includes frontend development, API integration, database-backed workflows, cloud storage, and application tooling. I care about typed code, clear documentation, practical testing, and shipping work that is easy for others to understand.",

  experience: [
    {
      role: "Full Stack Developer Intern",
      company: "Crystalline Software Technologies",
      location: "Hitech City, Hyderabad",
      period: "Dec 2023 – Jun 2024",
      bullets: [
        "Built a risk-management SPA using Vue and TypeScript.",
        "Migrated legacy JavaScript to TypeScript to improve frontend stability and build performance.",
        "Integrated AWS S3 for file storage and configured IAM policies for role-based access.",
        "Designed REST APIs and optimized MongoDB queries for document workflows.",
      ],
    },
    {
      role: "AI Data Engineering Contributor",
      company: "Viswam AI / Swecha Foundation (IIIT Hyderabad)",
      location: "Hyderabad",
      period: "Jun 2025 – Jul 2025",
      bullets: [
        "Curated and audited Telugu datasets for LLM training pipelines.",
        "Implemented preprocessing and bias-mitigation checks.",
      ],
    },
  ],

  projects: [
    {
      name: "DevPulse",
      summary:
        "A self-hosted API uptime monitoring tool that periodically checks endpoint health and displays status on a real-time dashboard.",
      github: "https://github.com/0535MANIDEEP/devpulse",
      live: "https://devpulse-app-sable.vercel.app",
      stack: [
        "React",
        "TypeScript",
        "Vite",
        "Tailwind CSS",
        "Recharts",
        "Socket.IO",
        "Express",
        "SQLite (sql.js)",
        "Zod",
        "Docker",
      ],
      features: [
        "Health check engine with exponential backoff retry logic",
        "Real-time dashboard updates via WebSocket",
        "Automatic incident lifecycle management",
        "Uptime calculation across 24h, 7d, and 30d periods",
      ],
      engineering: [
        "Chose sql.js for zero-dependency SQLite persistence without native compilation",
        "Implemented Socket.IO for live status push with 30-second polling fallback",
        "24 tests covering database setup, health checks, uptime calculations, and API routes",
      ],
    },
    {
      name: "OrderFlow",
      summary:
        "A mini e-commerce order management system with inventory reservation, idempotent order creation, and an admin dashboard.",
      github: "https://github.com/0535MANIDEEP/orderflow",
      live: "https://orderflow-app-one.vercel.app",
      stack: [
        "React",
        "TypeScript",
        "Vite",
        "Tailwind CSS",
        "Recharts",
        "Express",
        "PostgreSQL",
        "Zod",
        "Docker",
      ],
      features: [
        "Transactional order creation with FOR UPDATE row locks",
        "Idempotency keys to prevent duplicate orders",
        "Order state machine with stock rollback on cancellation",
        "Admin dashboard with revenue analytics",
      ],
      engineering: [
        "Used PostgreSQL transactions with row-level locking to prevent overselling",
        "Enforced a strict state machine: created → paid → shipped → delivered",
        "6 integration tests covering order creation, idempotency, and status transitions",
      ],
    },
  ],

  additionalWork: {
    name: "Sutra-Code",
    subtitle: "Socratic Mentor for Programmers",
    github: "https://github.com/0535MANIDEEP/sutra-code",
    description:
      "A programming-learning project featuring TypeScript and React UI work, backend API integration, prompt management, secure API proxying, unit tests, and documentation.",
  },

  navLinks: [
    { href: "#work", label: "Work" },
    { href: "#experience", label: "Experience" },
    { href: "#about", label: "About" },
    { href: "#contact", label: "Contact" },
  ],

  contactHeading: "Let's talk",
  contactCopy:
    "I'm available immediately for junior frontend, full-stack, backend/API, and software engineering opportunities.",
} as const;
