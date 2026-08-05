'use client'

import { useMemo } from 'react'

/**
 * "Tech I work with" — two horizontal tracks scrolling in opposite directions.
 *
 * Items come from Profile.skills in the database, so the admin panel is the
 * single source of truth. Each chip doubles as a project filter, matching the
 * behaviour of the skills grid below it.
 *
 * The seamless loop relies on rendering the row twice and translating by
 * exactly -50%; see .marquee-track in globals.css.
 */

interface TechMarqueeProps {
  items: string[]
  activeSkills?: string[]
  onSkillToggle?: (skill: string) => void
  maxSkills?: number
  /** Seconds for one full pass. Lower is faster. */
  durationTop?: number
  durationBottom?: number
}

function Chip({
  label,
  isActive,
  isDisabled,
  onClick,
  interactive,
}: {
  label: string
  isActive: boolean
  isDisabled: boolean
  onClick?: () => void
  interactive: boolean
}) {
  const base =
    'mx-1.5 inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors'

  if (!interactive) {
    return <span className={`${base} border-border bg-card text-foreground/80`}>{label}</span>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-pressed={isActive}
      title={isDisabled ? 'Maximum filters selected' : `Filter projects by ${label}`}
      className={`${base} ${
        isActive
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : isDisabled
            ? 'border-border bg-card opacity-40 cursor-not-allowed'
            : 'border-border bg-card hover:border-primary/50 hover:bg-accent cursor-pointer'
      }`}
    >
      {label}
    </button>
  )
}

function Row({
  items,
  direction,
  duration,
  activeSkills,
  onSkillToggle,
  maxSkills,
}: {
  items: string[]
  direction: 'left' | 'right'
  duration: number
  activeSkills: string[]
  onSkillToggle?: (skill: string) => void
  maxSkills: number
}) {
  if (items.length === 0) return null

  const interactive = typeof onSkillToggle === 'function'

  // Rendered twice: the duplicate is what makes the wrap invisible.
  const copy = (ariaHidden: boolean) => (
    <div className="flex" aria-hidden={ariaHidden || undefined}>
      {items.map((item, i) => {
        const isActive = activeSkills.includes(item)
        return (
          <Chip
            key={`${item}-${i}`}
            label={item}
            isActive={isActive}
            isDisabled={activeSkills.length >= maxSkills && !isActive}
            onClick={onSkillToggle ? () => onSkillToggle(item) : undefined}
            interactive={interactive && !ariaHidden}
          />
        )
      })}
    </div>
  )

  return (
    <div className="marquee-viewport overflow-hidden py-2">
      <div
        className="marquee-track"
        data-direction={direction}
        style={{ ['--marquee-duration' as string]: `${duration}s` }}
      >
        {copy(false)}
        {copy(true)}
      </div>
    </div>
  )
}

export function TechMarquee({
  items,
  activeSkills = [],
  onSkillToggle,
  maxSkills = 5,
  durationTop = 45,
  durationBottom = 55,
}: TechMarqueeProps) {
  // Split into two tracks by alternating, so both rows stay a similar length
  // even when the source list is grouped by category.
  const [topRow, bottomRow] = useMemo(() => {
    const unique = Array.from(new Set(items.filter(Boolean)))
    const top: string[] = []
    const bottom: string[] = []
    unique.forEach((item, i) => (i % 2 === 0 ? top : bottom).push(item))
    return [top, bottom]
  }, [items])

  if (topRow.length === 0 && bottomRow.length === 0) return null

  return (
    <div className="space-y-1">
      <Row
        items={topRow}
        direction="left"
        duration={durationTop}
        activeSkills={activeSkills}
        onSkillToggle={onSkillToggle}
        maxSkills={maxSkills}
      />
      <Row
        items={bottomRow}
        direction="right"
        duration={durationBottom}
        activeSkills={activeSkills}
        onSkillToggle={onSkillToggle}
        maxSkills={maxSkills}
      />
    </div>
  )
}
