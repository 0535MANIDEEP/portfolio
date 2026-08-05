'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'

/**
 * PageTransition — wraps page content with a subtle fade+slide animation
 * keyed on the pathname so transitions replay on route change.
 *
 * Usage: wrap the children of each page's <main>:
 *   <PageTransition>{content}</PageTransition>
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
