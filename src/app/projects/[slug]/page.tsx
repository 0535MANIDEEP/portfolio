'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { ThemedCodeBlock } from '@/components/site/themed-code-block'
import { CommentSection } from '@/components/site/comment-section'
import {
  ArrowLeft, ExternalLink, Github, Download, Calendar,
  User, FolderGit2, Code2, Database, FileText, Terminal,
  BarChart3, Shield, Eye, BookOpen, Network, ZoomIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar, Footer } from '@/components/site/navbar'
import { format } from 'date-fns'
import { EmbedList } from "@/components/embed-renderer"
import { ContributorsDisplay } from "@/components/contributors-input"
import { ReadingProgress } from '@/components/site/reading-progress'
import { Breadcrumbs } from '@/components/site/breadcrumbs'
import { TableOfContents } from '@/components/site/table-of-contents'
import { ShareButtons } from '@/components/site/share-buttons'
import { RelatedContent } from '@/components/site/related-content'
import { ImageGallery, ImageLightbox } from '@/components/site/image-lightbox'
import { ViewCounter } from '@/components/site/view-counter'

interface Project {
  id: string; title: string; slug: string; description: string
  shortDesc: string; banner: string; website: string; downloadLink: string
  repository: string; stack: string; screenshots: string; role: string
  process: string; results: string; architectureDiagramUrl: string
  dbSchemaUrl: string; adrContent: string; cicdSnippet: string
  iacSnippet: string; observabilityUrl: string; testCoverageUrl: string
  performanceMetrics: string; securityImplementation: string
  swaggerUrl: string; terminalSessionUrl: string; behindTheScenes: string
  videoUrl: string
  featured: boolean; createdAt: string
  embeds: string; contributors: string; showTeam: boolean
  architectureDiagrams: string
}

type DiagramType = 'hld' | 'lld' | 'dfd' | 'sequence' | 'erd' | 'other'

interface DiagramEntry {
  title: string
  url: string
  description: string
  type: DiagramType
}

const DIAGRAM_TYPE_META: Record<DiagramType, { label: string; badgeClass: string }> = {
  hld: { label: 'HLD', badgeClass: 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30' },
  lld: { label: 'LLD', badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30' },
  dfd: { label: 'DFD', badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30' },
  sequence: { label: 'Sequence', badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30' },
  erd: { label: 'ERD', badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30' },
  other: { label: 'Other', badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30' },
}

function parseArchitectureDiagrams(raw: string | undefined | null): DiagramEntry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const knownTypes: DiagramType[] = ['hld', 'lld', 'dfd', 'sequence', 'erd', 'other']
    return parsed
      .filter((d) => d && typeof d === 'object' && (d.url || d.title))
      .map((d) => ({
        title: typeof d.title === 'string' ? d.title : '',
        url: typeof d.url === 'string' ? d.url : '',
        description: typeof d.description === 'string' ? d.description : '',
        type: (knownTypes.includes(d.type) ? d.type : 'other') as DiagramType,
      }))
  } catch {
    return []
  }
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(url)
}

function isSvgUrl(url: string): boolean {
  return /\.svg(\?.*)?$/i.test(url)
}

function CodeBlock({ title, code, language }: { title: string; code: string; language?: string }) {
  if (!code) return null
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ThemedCodeBlock language={language || 'yaml'}>{code}</ThemedCodeBlock>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ImageBlock({ title, url }: { title: string; url: string }) {
  if (!url) return null
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <img src={url} alt={title} className="w-full rounded-lg" loading="lazy" />
        </CardContent>
      </Card>
    </motion.div>
  )
}

function MarkdownBlock({ title, content, icon: Icon }: { title: string; content: string; icon?: React.ElementType }) {
  if (!content) return null
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-primary" />}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Architecture Diagrams Gallery                                              */
/* -------------------------------------------------------------------------- */

function ArchitectureDiagramsGallery({ diagrams }: { diagrams: DiagramEntry[] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Build the list of lightboxable images (raster images only). SVG + embed URLs
  // are not lightboxable via the existing ImageLightbox component (which uses <img>).
  const lightboxImages = useMemo(
    () => diagrams.filter((d) => d.url && (isImageUrl(d.url) || isSvgUrl(d.url))).map((d) => d.url),
    [diagrams]
  )

  const openLightbox = (url: string) => {
    const idx = lightboxImages.indexOf(url)
    if (idx >= 0) {
      setLightboxIndex(idx)
      setLightboxOpen(true)
    }
  }

  if (diagrams.length === 0) return null

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  }

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
    >
      <div className="flex items-center gap-2">
        <Network className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight">Architecture Diagrams</h3>
        <Badge variant="secondary" className="text-[10px]">{diagrams.length}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {diagrams.map((d, i) => {
          const meta = DIAGRAM_TYPE_META[d.type] ?? DIAGRAM_TYPE_META.other
          const hasImg = d.url && (isImageUrl(d.url) || isSvgUrl(d.url))
          const isSvg = d.url && isSvgUrl(d.url)
          return (
            <motion.div key={`${d.url}-${i}`} variants={itemVariants}>
              <Card className="overflow-hidden h-full flex flex-col">
                <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
                  <CardTitle className="text-sm flex items-center gap-2 leading-tight">
                    <span className="truncate">{d.title || `Diagram ${i + 1}`}</span>
                  </CardTitle>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${meta.badgeClass}`}>
                    {meta.label}
                  </Badge>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3">
                  {d.url ? (
                    hasImg ? (
                      <button
                        type="button"
                        onClick={() => openLightbox(d.url)}
                        className="group relative block w-full overflow-hidden rounded-lg border bg-muted/30 aspect-video cursor-zoom-in"
                        aria-label={`Open ${d.title || 'diagram'} in lightbox`}
                      >
                        <img
                          src={d.url}
                          alt={d.title || `Diagram ${i + 1}`}
                          loading="lazy"
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                          draggable={false}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/30">
                          <div className="rounded-full bg-white/90 p-2 opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
                            <ZoomIn className="h-4 w-4 text-foreground" />
                          </div>
                        </div>
                        {isSvg && (
                          <Badge variant="secondary" className="absolute left-2 top-2 text-[9px] bg-background/80">SVG</Badge>
                        )}
                      </button>
                    ) : (
                      // Embed URL (Mermaid, Excalidraw, etc.) — render in an iframe.
                      <div className="overflow-hidden rounded-lg border aspect-video bg-background">
                        <iframe
                          src={d.url}
                          title={d.title || `Diagram ${i + 1}`}
                          loading="lazy"
                          className="h-full w-full"
                          sandbox="allow-scripts allow-same-origin allow-popups"
                        />
                      </div>
                    )
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                      No URL provided
                    </div>
                  )}

                  {d.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{d.description}</p>
                  )}

                  {d.url && (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open original
                    </a>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {lightboxImages.length > 0 && (
        <ImageLightbox
          key={lightboxIndex}
          images={lightboxImages}
          alt="Architecture diagram"
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </motion.div>
  )
}

export default function ProjectDetailPage() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/projects`)
      .then(r => r.json())
      .then(data => {
        const found = data.find((p: Project) => p.slug === params.slug)
        if (found) setProject(found)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main id="main-content" className="flex-1 py-20 px-4">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="h-8 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-64 w-full rounded-xl bg-muted animate-pulse mt-6" />
          </div>
        </main>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main id="main-content" className="flex-1 py-20 px-4 text-center">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <Button asChild variant="outline"><Link href="/projects" className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Projects</Link></Button>
        </main>
        <Footer />
      </div>
    )
  }

  const stack: string[] = project.stack ? JSON.parse(project.stack) : []
  const screenshots: string[] = project.screenshots ? JSON.parse(project.screenshots) : []
  const allImages = [project.banner, ...screenshots].filter(Boolean) as string[]
  const diagrams = parseArchitectureDiagrams(project.architectureDiagrams)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'technical', label: 'Technical Deep-Dive' },
    { id: 'process', label: 'Process & Results' },
  ]

  const hasTechnical = diagrams.length > 0 ||
    project.architectureDiagramUrl || project.dbSchemaUrl || project.adrContent ||
    project.cicdSnippet || project.iacSnippet || project.observabilityUrl || project.testCoverageUrl ||
    project.performanceMetrics || project.securityImplementation || project.swaggerUrl || project.terminalSessionUrl

  return (
    <div className="min-h-screen flex flex-col">
      <ReadingProgress />
      <Navbar />
      <main id="main-content" className="flex-1 py-20 px-4">
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[1fr_200px] lg:gap-8">
        <motion.div
          ref={contentRef}
          className="max-w-4xl mx-auto lg:max-w-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back + Breadcrumbs */}
          <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/projects"><ArrowLeft className="h-4 w-4" />Back to Projects</Link>
          </Button>
          <Breadcrumbs items={[{ label: 'Projects', href: '/projects' }, { label: project.title }]} />

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{project.title}</h1>
            {project.shortDesc && <p className="mt-2 text-lg text-muted-foreground">{project.shortDesc}</p>}
            {project.role && (
              <p className="mt-1 text-sm text-primary font-medium">Role: {project.role}</p>
            )}
            <div className="mt-2"><ViewCounter id={`project:${project.slug}`} label="views" /></div>
            <div className="flex flex-wrap gap-2 mt-4">
              {stack.map(s => (
                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {project.website && (
                <Button size="sm" asChild><a href={project.website} target="_blank" rel="noreferrer" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" />Visit</a></Button>
              )}
              {project.downloadLink && (
                <Button size="sm" variant="outline" asChild><a href={project.downloadLink} target="_blank" rel="noreferrer" className="gap-1.5"><Download className="h-3.5 w-3.5" />Download</a></Button>
              )}
              {project.repository && (
                <Button size="sm" variant="outline" asChild><a href={project.repository} target="_blank" rel="noreferrer" className="gap-1.5"><Github className="h-3.5 w-3.5" />Source</a></Button>
              )}
            </div>
          </motion.div>

          {/* Banner / Screenshots */}
          {allImages.length > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="mb-8">
              <ImageGallery images={allImages} alt={project.title} />
            </motion.div>
          )}

          {/* Video */}
          {project.videoUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <video
                  src={project.videoUrl}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-contain"
                />
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b mb-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-6 pb-8">
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <ReactMarkdown>{project.description}</ReactMarkdown>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(project.createdAt), 'MMMM yyyy')}
                </div>

                {/* Embeds */}
                {project.embeds && <EmbedList urls={project.embeds} />}

                  {/* Team / Contributors */}

                  {project.showTeam && project.contributors && (
                    <ContributorsDisplay
                      contributorsJson={project.contributors}
                      showTeam={project.showTeam}
                    />
                  )}
              </motion.div>
            )}

            {activeTab === 'technical' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {!hasTechnical ? (
                  <div className="rounded-xl border-2 border-dashed p-10 text-center">
                    <Code2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No technical details added yet. The admin can add architecture diagrams, CI/CD configs, DB schemas, and more.</p>
                  </div>
                ) : (
                  <>
                    {/* New architecture diagrams gallery (preferred) */}
                    {diagrams.length > 0 && <ArchitectureDiagramsGallery diagrams={diagrams} />}

                    {/* Legacy single architecture diagram URL (backward compat) */}
                    {project.architectureDiagramUrl && diagrams.length === 0 && (
                      <ImageBlock title="Architecture Diagram" url={project.architectureDiagramUrl} />
                    )}

                    <ImageBlock title="Database Schema" url={project.dbSchemaUrl} />
                    <MarkdownBlock title="Architecture Decision Records" content={project.adrContent} icon={BookOpen} />
                    <CodeBlock title="CI/CD Pipeline" code={project.cicdSnippet} language="yaml" />
                    <CodeBlock title="Infrastructure as Code" code={project.iacSnippet} language="hcl" />
                    <ImageBlock title="Observability / Monitoring" url={project.observabilityUrl} />
                    <ImageBlock title="Test Coverage" url={project.testCoverageUrl} />
                    <MarkdownBlock title="Performance Metrics" content={project.performanceMetrics} icon={BarChart3} />
                    <MarkdownBlock title="Security Implementation" content={project.securityImplementation} icon={Shield} />
                    {project.swaggerUrl && (
                      <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              API Documentation (Swagger)
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <iframe src={project.swaggerUrl} className="w-full rounded-lg border" style={{ minHeight: 400 }} />
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                    {project.terminalSessionUrl && (
                      <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Terminal className="h-4 w-4 text-primary" />
                              Terminal Session
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <iframe src={project.terminalSessionUrl} className="w-full rounded-lg border bg-black" style={{ minHeight: 300 }} />
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'process' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <MarkdownBlock title="My Process" content={project.process} icon={FolderGit2} />
                <MarkdownBlock title="Results & Impact" content={project.results} icon={BarChart3} />
                <MarkdownBlock title="Behind the Scenes" content={project.behindTheScenes} icon={Eye} />
              </motion.div>
            )}
          </div>
          {/* Related Content */}

          <RelatedContent
            entityType="project"
            currentSlug={project.slug}
            currentTags={stack}
          />

          {/* Share */}
          <div className="mt-8 flex items-center justify-end border-t pt-6">
            <ShareButtons />
          </div>

          {/* Comments */}
          <CommentSection entityType="project" entityId={project.slug} />
        </motion.div>
        <TableOfContents containerRef={contentRef} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
