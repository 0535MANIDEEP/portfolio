'use client'

/**
 * SkipToContent — accessibility link that becomes visible on focus.
 * Lets keyboard users jump directly to the main content, bypassing the navbar.
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
    >
      Skip to content
    </a>
  )
}
