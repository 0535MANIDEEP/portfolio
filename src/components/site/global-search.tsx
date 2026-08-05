'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, FileText, FolderKanban, GraduationCap, Code2, ArrowRight,
  X,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface SearchResult {
  type: 'blog' | 'project' | 'course' | 'snippet'
  title: string
  slug: string
  description: string
}

/** Highlights the matched query substring within text using <mark>. */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const q = query.trim()
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-primary/20 px-0.5 text-foreground">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [])

  // Declared before the effect that calls it: it was defined further down the
  // component and referenced here, and was also missing from the dependency
  // array, so the listener could close over a stale router.
  const handleSelect = useCallback((result: SearchResult) => {
    setOpen(false)
    setQuery('')
    const pathMap = { blog: '/blog/', project: '/projects/', course: '/courses/', snippet: '/snippets?view=' }
    router.push(pathMap[result.type] + result.slug)
  }, [router])

  // Keyboard navigation within results (arrow keys + Enter)
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(prev => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && results[activeIndex]) {
        e.preventDefault()
        handleSelect(results[activeIndex])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, results, activeIndex, handleSelect])

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [blogsRes, projectsRes, coursesRes, snippetsRes] = await Promise.all([
          fetch('/api/blogs?published=true').then(r => r.json()),
          fetch('/api/projects').then(r => r.json()),
          fetch('/api/courses').then(r => r.json()),
          fetch('/api/snippets?published=true&limit=20').then(r => r.json()),
        ])

        const q = query.toLowerCase()
        const all: SearchResult[] = [
          ...blogsRes.map((b: { title: string; slug: string; excerpt: string }) => ({ type: 'blog' as const, title: b.title, slug: b.slug, description: b.excerpt })),
          ...projectsRes.map((p: { title: string; slug: string; shortDesc: string }) => ({ type: 'project' as const, title: p.title, slug: p.slug, description: p.shortDesc })),
          ...coursesRes.map((c: { title: string; slug: string; description: string }) => ({ type: 'course' as const, title: c.title, slug: c.slug, description: c.description })),
          ...(Array.isArray(snippetsRes) ? snippetsRes : []).map((s: { title: string; slug: string; description: string }) => ({ type: 'snippet' as const, title: s.title, slug: s.slug, description: s.description })),
        ].filter(item =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        ).slice(0, 10)

        setResults(all)
      } catch { /* ignore */ } finally { setLoading(false) }
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const typeIcons = { blog: FileText, project: FolderKanban, course: GraduationCap, snippet: Code2 }
  const typeLabels = { blog: 'Blog', project: 'Project', course: 'Course', snippet: 'Snippet' }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors min-w-[180px]"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">Search</DialogTitle>

          {/* Search Input */}
          <div className="flex items-center border-b px-4">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search blogs, projects, courses, snippets..."
              className="flex-1 bg-transparent py-3 px-3 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Searching...</div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results for &ldquo;{query}&rdquo;
              </div>
            )}

            {!loading && !query && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Type to search across all content
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={query}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {results.map((result, idx) => {
                  const Icon = typeIcons[result.type]
                  const isActive = idx === activeIndex
                  return (
                    <button
                      key={result.slug + result.type}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b last:border-0 ${isActive ? 'bg-accent' : 'hover:bg-accent'}`}
                    >
                      <div className={`rounded-md p-1.5 shrink-0 ${isActive ? 'bg-primary/15' : 'bg-muted'}`}>
                        <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate"><HighlightMatch text={result.title} query={query} /></p>
                        <p className="text-xs text-muted-foreground truncate"><HighlightMatch text={result.description} query={query} /></p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          {typeLabels[result.type]}
                        </span>
                        <ArrowRight className={`h-3 w-3 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                    </button>
                  )
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><kbd className="rounded border bg-muted px-1">↑↓</kbd> to navigate</span>
            <span className="flex items-center gap-1"><kbd className="rounded border bg-muted px-1">↵</kbd> to select</span>
            <span className="flex items-center gap-1"><kbd className="rounded border bg-muted px-1">Esc</kbd> to close</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}