'use client'

import { motion } from 'framer-motion'

/**
 * Skills grouped by category.
 *
 * Categories come from Profile.skills in the database so the admin panel is
 * the single source of truth. DEFAULT_SKILL_CATEGORIES is only a fallback for
 * a profile that has not been filled in yet — it used to be the *only* source,
 * which meant editing skills in admin changed nothing on the site.
 */

export interface SkillCategory {
  category: string
  items: string[]
}

export const DEFAULT_SKILL_CATEGORIES: SkillCategory[] = [
  { category: 'Languages', items: ['Java 8/17', 'SQL', 'PL/SQL', 'C++', 'Python', 'JavaScript', 'TypeScript'] },
  { category: 'Frameworks', items: ['Spring Boot', 'Oracle JET', 'Knockout.js', 'JUnit', 'Mockito', 'React', 'Next.js'] },
  { category: 'Cloud & DevOps', items: ['Kubernetes', 'Docker', 'AWS', 'GCP', 'OCI', 'Terraform', 'Grafana', 'Prometheus'] },
  { category: 'APIs & Architecture', items: ['RESTful APIs', 'SOAP', 'Microservices', 'JWT', 'OAuth 2.0', 'GraphQL'] },
  { category: 'Tools & Platforms', items: ['Git', 'Linux', 'Postman', 'Flyway', 'Weblogic', 'Flexcube', 'Oracle BIP'] },
]

/**
 * Accepts the shapes the Profile.skills column has held over time:
 *   [{ category, items: [] }]   — current
 *   [{ name, skills: [] }]      — older admin builds
 *   ["Java", "SQL"]             — flat list
 */
export function parseSkillCategories(raw: string | null | undefined): SkillCategory[] {
  if (!raw) return DEFAULT_SKILL_CATEGORIES

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SKILL_CATEGORIES

    if (typeof parsed[0] === 'string') {
      return [{ category: 'Skills', items: parsed.filter(Boolean) }]
    }

    const groups = parsed
      .map((g: Record<string, unknown>) => ({
        category: String(g.category ?? g.name ?? 'Skills'),
        items: (Array.isArray(g.items) ? g.items : Array.isArray(g.skills) ? g.skills : [])
          .map((s: unknown) => String(s))
          .filter(Boolean),
      }))
      .filter((g: SkillCategory) => g.items.length > 0)

    return groups.length > 0 ? groups : DEFAULT_SKILL_CATEGORIES
  } catch {
    return DEFAULT_SKILL_CATEGORIES
  }
}

/** Flattened, de-duplicated list — used by the marquee. */
export function flattenSkills(categories: SkillCategory[]): string[] {
  return Array.from(new Set(categories.flatMap((c) => c.items)))
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export function SkillsMatrix({
  activeSkills,
  onSkillToggle,
  maxSkills = 5,
  categories = DEFAULT_SKILL_CATEGORIES,
}: {
  activeSkills: string[]
  onSkillToggle: (skill: string) => void
  maxSkills?: number
  categories?: SkillCategory[]
}) {
  return (
    <motion.div
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-50px' }}
    >
      {categories.map((cat) => (
        <motion.div key={cat.category} variants={item}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            {cat.category}
          </h3>
          <div className="flex flex-wrap gap-2">
            {cat.items.map((skill) => {
              const isActive = activeSkills.includes(skill)
              const isMaxed = activeSkills.length >= maxSkills && !isActive
              return (
                <button
                  key={skill}
                  onClick={() => !isMaxed && onSkillToggle(skill)}
                  disabled={isMaxed}
                  aria-pressed={isActive}
                  className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : isMaxed
                        ? 'border-border bg-card opacity-40 cursor-not-allowed'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-accent cursor-pointer'
                  }`}
                  title={isMaxed ? `Maximum ${maxSkills} skills selected` : `Filter by ${skill}`}
                >
                  {skill}
                </button>
              )
            })}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
