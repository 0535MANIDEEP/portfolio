'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon, Github, Linkedin, Twitter, Mail, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlobalSearch } from '@/components/site/global-search'
import { NotificationBell } from '@/components/site/notification-bell'
import { useMounted } from '@/hooks/use-mounted'
export { Footer } from '@/components/site/footer'

const navLinks = [
  { href: '/', label: 'Home', desc: 'Start here' },
  { href: '/about', label: 'About', desc: 'My story & experience' },
  { href: '/projects', label: 'Projects', desc: 'Things I have built' },
  { href: '/blog', label: 'Blog', desc: 'Articles & notes' },
  { href: '/courses', label: 'Courses', desc: 'Learning paths' },
  { href: '/snippets', label: 'Snippets', desc: 'Reusable code' },
  { href: '/contact', label: 'Contact', desc: 'Get in touch' },
]

const socialLinks = [
  { href: 'https://github.com/gokulsaraswat', label: 'GitHub', icon: Github, hover: 'hover:text-foreground' },
  { href: 'https://www.linkedin.com/in/gokulsaraswat', label: 'LinkedIn', icon: Linkedin, hover: 'hover:text-[#0A66C2]' },
  { href: 'https://x.com/gokulsaraswat', label: 'X.com', icon: Twitter, hover: 'hover:text-foreground dark:hover:text-white' },
  { href: 'mailto:gokulsaraswat07@gmail.com', label: 'Email', icon: Mail, hover: 'hover:text-[#EA4335]' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  // resolvedTheme, not theme: with enableSystem the stored value can be
  // "system", and comparing that to "dark" is always false. The toggle then
  // set the theme to the mode already being displayed, so the first click
  // did nothing and the button looked dead (issue #1).
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Close menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isDark = resolvedTheme === 'dark'

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark')
  }, [isDark, setTheme])

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-md border-b shadow-sm' : 'bg-transparent'}`}>
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity">
            Gokul Saraswat
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent ${pathname === link.href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <GlobalSearch />
            <NotificationBell />
            {mounted && (
              <Button variant="ghost" size="icon" className="h-9 w-9" data-theme-toggle onClick={toggleTheme} aria-label="Toggle theme">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}

            <div className="hidden md:flex items-center gap-1">
              {socialLinks.map((s) => (
                <a key={s.label} href={s.href} target={s.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={`p-2 text-muted-foreground transition-all duration-300 hover:scale-125 ${s.hover}`} aria-label={s.label}>
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            {/* Mobile menu trigger */}
            <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Full-screen animated mobile navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[60] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-background/95 backdrop-blur-xl"
              initial={{ clipPath: 'circle(0% at 100% 0%)' }}
              animate={{ clipPath: 'circle(150% at 100% 0%)' }}
              exit={{ clipPath: 'circle(0% at 100% 0%)' }}
              transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            />

            {/* Content */}
            <div className="relative h-full flex flex-col">
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 h-16 border-b">
                <span className="text-lg font-bold tracking-tight">Menu</span>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Nav links with staggered entrance */}
              <nav className="flex-1 overflow-y-auto px-5 py-8 flex flex-col justify-center">
                {navLinks.map((link, i) => {
                  const isActive = pathname === link.href
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="group flex items-center justify-between py-3 border-b border-border/50"
                      >
                        <div className="flex items-baseline gap-3">
                          <span className="text-xs font-mono text-muted-foreground/60 tabular-nums">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className={`text-2xl font-semibold transition-colors ${isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                            {link.label}
                          </span>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>

              {/* Footer: theme toggle + socials */}
              <motion.div
                className="px-5 py-6 border-t flex items-center justify-between"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + navLinks.length * 0.06 + 0.1, duration: 0.4 }}
              >
                <div className="flex items-center gap-3">
                  {socialLinks.map((s) => (
                    <a key={s.label} href={s.href} target={s.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={`p-2 text-muted-foreground transition-colors ${s.hover}`} aria-label={s.label}>
                      <s.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
                {mounted && (
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={toggleTheme} aria-label="Toggle theme">
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
