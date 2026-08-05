'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        setProgress(Math.min((scrollTop / docHeight) * 100, 100))
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const rounded = Math.round(progress)
  // Show the percentage badge when the user has scrolled but hasn't reached the end
  const showBadge = progress > 2 && progress < 98

  return (
    <>
      {/* Top progress bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-primary/20"
        role="progressbar"
        aria-valuenow={rounded}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      >
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating percentage badge (bottom-right, appears on scroll) */}
      <AnimatePresence>
        {showBadge && (
          <motion.div
            className="fixed bottom-6 right-6 z-40 pointer-events-none select-none"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border px-2.5 py-1 shadow-sm">
              <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                {rounded}
              </span>
              <span className="text-[9px] text-muted-foreground/70">%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
