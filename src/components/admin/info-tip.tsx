'use client'

import { Info } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

/**
 * Small "i" affordance that reveals explanatory copy on demand.
 *
 * Replaces the always-visible instruction boxes that used to take up space in
 * admin panels (issue #3). Shared so every panel gets the same behaviour.
 */
export function InfoTip({
  label,
  details,
  side = 'top',
  className = '',
}: {
  label: string
  details: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors ${className}`}
          aria-label={`More information about ${label}`}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-xs" side={side}>
        <div className="space-y-1.5">
          <p className="font-semibold text-foreground">{label}</p>
          <div className="text-muted-foreground space-y-2">{details}</div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
