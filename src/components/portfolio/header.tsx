"use client";

import Link from "next/link";
import { useState } from "react";

interface HeaderProps {
  name: string;
  navLinks: { href: string; label: string }[];
  resumeLabel: string;
  resumeUrl: string;
}

export function Header({ name, navLinks, resumeLabel, resumeUrl }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#fafaf9]/90 backdrop-blur-sm border-b border-[#e7e5e4]">
      <nav
        className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6"
        aria-label="Main navigation"
      >
        <Link href="/" aria-label="Home" className="text-sm font-semibold tracking-tight text-[#1c1917]">
          {name}
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="px-3 py-1.5 text-sm text-[#78716c] hover:text-[#1c1917] transition-colors">
              {link.label}
            </a>
          ))}
          <a
            href={resumeUrl}
            className="ml-2 inline-flex items-center rounded-md bg-[#1c1917] px-3 py-1.5 text-sm font-medium text-[#fafaf9] hover:bg-[#44403c] transition-colors"
          >
            {resumeLabel}
          </a>
        </div>

        <button
          className="md:hidden p-1.5 text-[#78716c] hover:text-[#1c1917]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#e7e5e4] bg-[#fafaf9]">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm text-[#78716c] hover:text-[#1c1917] hover:bg-[#f5f5f4] rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href={resumeUrl}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-[#fafaf9] bg-[#1c1917] rounded-md text-center hover:bg-[#44403c] transition-colors"
            >
              {resumeLabel}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
