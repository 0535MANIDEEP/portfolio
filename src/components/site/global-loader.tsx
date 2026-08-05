'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * GlobalLoader
 * - Initial branded splash on first page load (fades after mount).
 * - Slim top progress bar on every client-side route change.
 * Lightweight: pure SVG/CSS, no external deps beyond framer-motion.
 */

function BrandSplash() {
  return (
    <div className="flex flex-col items-center gap-5">
      <motion.div
        className="relative h-14 w-14"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-muted"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
        />
        {/* Center monogram */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">GS</span>
        </div>
      </motion.div>
      <motion.p
        className="text-[11px] font-medium text-muted-foreground tracking-[0.2em] uppercase"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        Loading
      </motion.p>
    </div>
  )
}

export function GlobalLoader() {
  const pathname = usePathname()
  const [showSplash, setShowSplash] = useState(true)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Initial splash: hide once first paint is done
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 700)
    return () => clearTimeout(t)
  }, [])

  // Top progress bar on route change
  useEffect(() => {
    // Skip the very first render (handled by splash)
    if (showSplash) return

    setVisible(true)
    setProgress(0)

    // Animate progress to ~90% quickly, then complete on finish
    let p = 0
    rafRef.current = setInterval(() => {
      p += Math.random() * 18 + 6
      if (p >= 90) {
        p = 90
        if (rafRef.current) clearInterval(rafRef.current)
      }
      setProgress(p)
    }, 120)

    // Complete + hide after a short delay
    timerRef.current = setTimeout(() => {
      setProgress(100)
      if (rafRef.current) clearInterval(rafRef.current)
      setTimeout(() => setVisible(false), 250)
    }, 500)

    return () => {
      if (rafRef.current) clearInterval(rafRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pathname])

  return (
    <>
      {/* Initial splash */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-background pointer-events-none"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <BrandSplash />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top progress bar */}
      <AnimatePresence>
        {visible && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-[150] h-0.5 bg-transparent pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="h-full bg-primary origin-left"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.2 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
