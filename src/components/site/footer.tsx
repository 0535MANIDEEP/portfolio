'use client'

import Link from 'next/link'
import { Code2, Github, Linkedin, Twitter, Mail, Shield, ArrowUpRight, Heart } from 'lucide-react'

const footerNav = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Projects', href: '/projects' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'Courses', href: '/courses' },
      { label: 'Snippets', href: '/snippets' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Contact', href: '/contact' },
    ],
  },
]

const socials = [
  { href: 'https://github.com/gokulsaraswat', label: 'GitHub', icon: Github, hover: 'hover:bg-foreground hover:text-background' },
  { href: 'https://www.linkedin.com/in/gokulsaraswat', label: 'LinkedIn', icon: Linkedin, hover: 'hover:bg-[#0A66C2] hover:text-white' },
  { href: 'https://x.com/gokulsaraswat', label: 'X.com', icon: Twitter, hover: 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black' },
  { href: 'mailto:gokulsaraswat07@gmail.com', label: 'Email', icon: Mail, hover: 'hover:bg-[#EA4335] hover:text-white' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand + tagline */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors w-fit">
              <Code2 className="h-5 w-5" />
              <span className="font-bold text-lg tracking-tight">Gokul Saraswat</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Backend Engineer architecting high-availability microservices for enterprise banking.
              Specializing in Java, Spring Boot, and distributed systems.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className={`flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-all duration-300 hover:scale-110 hover:rotate-3 ${s.hover}`}
                  aria-label={s.label}
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          {footerNav.map((col) => (
            <div key={col.title} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {col.title}
              </h3>
              {col.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm text-foreground/80 hover:text-primary transition-colors w-fit group inline-flex items-center gap-1"
                >
                  {l.label}
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} Gokul Saraswat. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/admin" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Shield className="h-3 w-3" />
              Admin
            </Link>
            <span className="flex items-center gap-1">
              Built with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> Gokul Saraswat
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
