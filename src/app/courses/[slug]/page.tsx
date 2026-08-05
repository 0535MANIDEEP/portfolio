'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { ThemedCodeBlock } from '@/components/site/themed-code-block'
import {
  ArrowLeft, ChevronRight, ChevronDown, BookOpen,
  CheckCircle2, Circle, GraduationCap,
  FileText, Code2, Link as LinkIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Navbar, Footer } from '@/components/site/navbar'
import { EmbedList } from "@/components/embed-renderer"
import { Breadcrumbs } from '@/components/site/breadcrumbs'
import { CommentSection } from '@/components/site/comment-section'

interface Chapter {
  id: string; title: string; slug: string; content: string
  order: number; sectionName: string; parentId: string | null
  chapterType: string; children?: Chapter[]
  // Feature #17: linked content
  linkedBlogSlug?: string
  linkedSnippetSlug?: string
  titleOverride?: string
}

interface Course {
  id: string; title: string; slug: string; description: string; banner: string; embeds: string
  chapters: Chapter[]
}

interface LinkedBlog {
  id: string; title: string; slug: string; excerpt: string; content: string
  category?: string; type?: string
}

interface LinkedSnippet {
  id: string; title: string; slug: string; description: string; content: string
  language?: string; type?: string
}

const chapterTypeLabels: Record<string, string> = {
  content: '',
  hld: 'HLD',
  lld: 'LLD',
  'api-design': 'API',
  code: 'Code',
}

const chapterTypeColors: Record<string, string> = {
  hld: 'bg-violet-500/10 text-violet-500 border-violet-500/30',
  lld: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  'api-design': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  code: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
}

function ChapterTree({
  chapters,
  activeChapterId,
  onSelect,
  depth = 0,
}: {
  chapters: Chapter[]
  activeChapterId: string | null
  onSelect: (ch: Chapter) => void
  depth?: number
}) {
  return (
    <div className="space-y-0.5">
      {chapters.map(ch => (
        <div key={ch.id}>
          <button
            onClick={() => onSelect(ch)}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              activeChapterId === ch.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${ch.children && ch.children.length > 0 ? '' : 'opacity-0'}`} />
            <span className="truncate flex-1">{ch.title}</span>
            {(ch.linkedBlogSlug || ch.linkedSnippetSlug) && (
              <LinkIcon className="h-3 w-3 shrink-0 text-muted-foreground/70" aria-label="Linked content" />
            )}
            {chapterTypeLabels[ch.chapterType] && (
              <Badge variant="outline" className={`text-[9px] px-1 py-0 ${chapterTypeColors[ch.chapterType] || ''}`}>
                {chapterTypeLabels[ch.chapterType]}
              </Badge>
            )}
          </button>
          {ch.children && ch.children.length > 0 && activeChapterId === ch.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden"
            >
              <ChapterTree chapters={ch.children} activeChapterId={activeChapterId} onSelect={onSelect} depth={depth + 1} />
            </motion.div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function CourseDetailPage() {
  const params = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Feature #17: lazy caches for linked-content catalogs
  const [blogsCache, setBlogsCache] = useState<LinkedBlog[]>([])
  const [blogsCacheLoaded, setBlogsCacheLoaded] = useState(false)
  const [snippetsCache, setSnippetsCache] = useState<LinkedSnippet[]>([])
  const [snippetsCacheLoaded, setSnippetsCacheLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/courses?slug=${encodeURIComponent(params.slug as string)}`)
      .then(r => r.json())
      .then((found: Course & { chapters?: Chapter[] }) => {
        if (found && found.id) {
          // Build tree from flat list
          const chapters = found.chapters || []
          const map = new Map<string, Chapter>()
          const roots: Chapter[] = []
          chapters.forEach((ch: Chapter) => { map.set(ch.id, { ...ch, children: [] }) })
          chapters.forEach((ch: Chapter) => {
            const node = map.get(ch.id)!
            if (ch.parentId && map.has(ch.parentId)) {
              map.get(ch.parentId)!.children!.push(node)
            } else {
              roots.push(node)
            }
          })
          const sorted = roots.sort((a, b) => a.order - b.order)
          setCourse({ ...found, chapters: sorted })
          if (sorted.length > 0) setActiveChapter(sorted[0])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.slug])

  // Feature #17: lazily fetch the blogs catalog when a chapter with linkedBlogSlug is viewed
  const ensureBlogsLoaded = useCallback(async () => {
    if (blogsCacheLoaded) return
    try {
      const res = await fetch('/api/blogs?published=true')
      if (res.ok) {
        const data = await res.json()
        setBlogsCache(Array.isArray(data) ? data : [])
      }
    } catch {
      /* non-fatal */
    } finally {
      setBlogsCacheLoaded(true)
    }
  }, [blogsCacheLoaded])

  // Feature #17: lazily fetch the snippets catalog when a chapter with linkedSnippetSlug is viewed
  const ensureSnippetsLoaded = useCallback(async () => {
    if (snippetsCacheLoaded) return
    try {
      const res = await fetch('/api/snippets?published=true')
      if (res.ok) {
        const data = await res.json()
        setSnippetsCache(Array.isArray(data) ? data : [])
      }
    } catch {
      /* non-fatal */
    } finally {
      setSnippetsCacheLoaded(true)
    }
  }, [snippetsCacheLoaded])

  // Trigger lazy fetches based on the active chapter's link state
  useEffect(() => {
    if (!activeChapter) return
    if (activeChapter.linkedBlogSlug) void ensureBlogsLoaded()
    if (activeChapter.linkedSnippetSlug) void ensureSnippetsLoaded()
  }, [activeChapter, ensureBlogsLoaded, ensureSnippetsLoaded])

  // Resolve the linked blog/snippet (if any) for the active chapter
  const linkedBlog = activeChapter?.linkedBlogSlug
    ? blogsCache.find(b => b.slug === activeChapter.linkedBlogSlug) || null
    : null
  const linkedSnippet = activeChapter?.linkedSnippetSlug
    ? snippetsCache.find(s => s.slug === activeChapter.linkedSnippetSlug) || null
    : null

  // The effective title for the active chapter (title override wins, then linked title, then chapter title)
  const resolvedChapterTitle = activeChapter
    ? (activeChapter.titleOverride?.trim()
        || linkedBlog?.title
        || linkedSnippet?.title
        || activeChapter.title)
    : ''

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main id="main-content" className="flex-1 py-20 px-4">
          <div className="mx-auto max-w-6xl space-y-4">
            <div className="h-8 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
          </div>
        </main>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main id="main-content" className="flex-1 py-20 px-4 text-center">
          <p className="text-muted-foreground mb-4">Course not found</p>
          <Button asChild variant="outline"><Link href="/courses" className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Courses</Link></Button>
        </main>
        <Footer />
      </div>
    )
  }

  // Flatten all chapters for counting
  const allChapters = course.chapters

  // Render content based on link state
  const renderChapterContent = () => {
    if (!activeChapter) return null

    // Linked blog → render blog content (markdown)
    if (activeChapter.linkedBlogSlug) {
      if (!blogsCacheLoaded) {
        return <p className="text-muted-foreground text-sm">Loading linked blog…</p>
      }
      if (!linkedBlog) {
        return (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Linked blog &quot;{activeChapter.linkedBlogSlug}&quot; could not be found or is not published.
          </div>
        )
      }
      return (
        <motion.article
          className="prose prose-neutral dark:prose-invert max-w-none
            prose-headings:font-semibold prose-headings:tracking-tight
            prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-transparent prose-pre:p-0
            prose-img:rounded-xl"
        >
          {linkedBlog.excerpt && (
            <p className="lead text-muted-foreground">{linkedBlog.excerpt}</p>
          )}
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                const inline = !match
                return inline ? (
                  <code className={className} {...props}>{children}</code>
                ) : (
                  <ThemedCodeBlock language={match[1]}>{String(children)}</ThemedCodeBlock>
                )
              },
            }}
          >
            {linkedBlog.content || ''}
          </ReactMarkdown>
        </motion.article>
      )
    }

    // Linked snippet → render snippet content as code
    if (activeChapter.linkedSnippetSlug) {
      if (!snippetsCacheLoaded) {
        return <p className="text-muted-foreground text-sm">Loading linked snippet…</p>
      }
      if (!linkedSnippet) {
        return (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Linked snippet &quot;{activeChapter.linkedSnippetSlug}&quot; could not be found or is not published.
          </div>
        )
      }
      return (
        <div className="space-y-3">
          {linkedSnippet.description && (
            <p className="text-muted-foreground text-sm">{linkedSnippet.description}</p>
          )}
          <ThemedCodeBlock language={linkedSnippet.language || 'text'}>
            {linkedSnippet.content || ''}
          </ThemedCodeBlock>
        </div>
      )
    }

    // Default: manual content (markdown)
    return (
      <motion.article
        className="prose prose-neutral dark:prose-invert max-w-none
          prose-headings:font-semibold prose-headings:tracking-tight
          prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-transparent prose-pre:p-0
          prose-img:rounded-xl"
      >
        <ReactMarkdown
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              const inline = !match
              return inline ? (
                <code className={className} {...props}>{children}</code>
              ) : (
                <ThemedCodeBlock language={match[1]}>{String(children)}</ThemedCodeBlock>
              )
            },
          }}
        >
          {activeChapter.content}
        </ReactMarkdown>
      </motion.article>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 pt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Course Header */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button variant="ghost" size="sm" className="mb-2 -ml-2 gap-1.5 text-muted-foreground hover:text-foreground" asChild>
              <Link href="/courses"><ArrowLeft className="h-4 w-4" />Back to Courses</Link>
            </Button>
            <Breadcrumbs items={[{ label: 'Courses', href: '/courses' }, { label: course.title }]} />
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                {course.description && (
                  <p className="mt-1 text-muted-foreground">{course.description}</p>
                )}
              </div>
              <Badge className="gap-1 shrink-0 ml-4">
                <GraduationCap className="h-3 w-3" />
                {allChapters.length} chapters
              </Badge>
            </div>
          </motion.div>
          {/* Embeds */}
          {course.embeds && <EmbedList urls={course.embeds} />}
          {/* Content */}
          <div className="flex gap-6 pb-12">
            {/* Sidebar */}
            <motion.aside
              className={`shrink-0 ${sidebarOpen ? 'w-64 hidden lg:block' : 'hidden'}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="sticky top-24 rounded-xl border bg-card p-3">
                <ScrollArea className="h-[calc(100vh-140px)]">
                  <ChapterTree
                    chapters={allChapters}
                    activeChapterId={activeChapter?.id || null}
                    onSelect={ch => setActiveChapter(ch)}
                  />
                </ScrollArea>
              </div>
            </motion.aside>

            {/* Main Content */}
            <motion.div
              className="flex-1 min-w-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Mobile chapter selector */}
              <div className="mb-4 lg:hidden">
                <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full justify-between">
                  <span className="truncate">{activeChapter?.title || 'Select chapter'}</span>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </Button>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 rounded-xl border bg-card p-3 max-h-64 overflow-y-auto">
                        <ChapterTree
                          chapters={allChapters}
                          activeChapterId={activeChapter?.id || null}
                          onSelect={ch => { setActiveChapter(ch); setSidebarOpen(false) }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chapter Content */}
              {activeChapter ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeChapter.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <h2 className="text-xl font-bold">{resolvedChapterTitle}</h2>
                      {/* Linked-from badge */}
                      {activeChapter.linkedBlogSlug && (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Linked from Blog
                        </Badge>
                      )}
                      {activeChapter.linkedSnippetSlug && (
                        <Badge variant="secondary" className="gap-1">
                          <Code2 className="h-3 w-3" />
                          Linked from Snippet
                        </Badge>
                      )}
                      {chapterTypeLabels[activeChapter.chapterType] && (
                        <Badge variant="outline" className={chapterTypeColors[activeChapter.chapterType] || ''}>
                          {chapterTypeLabels[activeChapter.chapterType]}
                        </Badge>
                      )}
                    </div>
                    {renderChapterContent()}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="rounded-xl border-2 border-dashed p-16 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Select a chapter from the sidebar to start reading.</p>
                </div>
              )}

              {/* Courses previously had no discussion thread, unlike blogs
                  and projects. Keyed by course slug, not chapter, so one
                  conversation covers the whole course. */}
              {course && <CommentSection entityType="course" entityId={course.slug} />}
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
