'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CONSENT_KEY = 'cookie-consent-v1'

/**
 * CookieConsent — non-intrusive bottom banner that appears once.
 * Stores consent in localStorage. Respects prior choice.
 * Purely informational (this site uses localStorage for theme/admin auth).
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem(CONSENT_KEY)
      if (!consent) {
        // Small delay so it doesn't flash before page paint
        const t = setTimeout(() => setVisible(true), 1500)
        return () => clearTimeout(t)
      }
    } catch {
      // localStorage unavailable — don't show
    }
  }, [])

  const handle = (choice: 'accepted' | 'declined') => {
    try {
      localStorage.setItem(CONSENT_KEY, choice)
    } catch {
      // ignore
    }
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-4 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Cookie preferences</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  This site uses local storage for theme preference, admin session, and
                  your reading experience. No tracking cookies or third-party analytics.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" className="h-8 text-xs" onClick={() => handle('accepted')}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handle('declined')}>
                    Decline
                  </Button>
                </div>
              </div>
              <button
                onClick={() => handle('declined')}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
