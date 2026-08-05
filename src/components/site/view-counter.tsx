'use client'

import { useState, useEffect } from 'react'
import { Eye } from 'lucide-react'

/**
 * ViewCounter — privacy-friendly view counter using localStorage.
 * Increments once per page visit (per entity) per browser.
 * No tracking, no cookies, no backend — purely local engagement signal.
 */
export function ViewCounter({ id, label = 'views' }: { id: string; label?: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    try {
      const key = `views:${id}`
      const seenKey = `viewed:${id}:${new Date().toDateString()}`
      const raw = localStorage.getItem(key)
      const current = raw ? parseInt(raw, 10) || 0 : 0

      // Increment once per day per entity
      if (!localStorage.getItem(seenKey)) {
        const next = current + 1
        localStorage.setItem(key, String(next))
        localStorage.setItem(seenKey, '1')
        setCount(next)
      } else {
        setCount(current)
      }
    } catch {
      setCount(null)
    }
  }, [id])

  if (count === null) return null

  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <Eye className="h-3.5 w-3.5" />
      {count.toLocaleString('en-US')} {label}
    </span>
  )
}
