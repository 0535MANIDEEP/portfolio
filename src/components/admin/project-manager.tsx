'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, Github, Download, ChevronDown, ChevronUp, Search, X, Network, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { SortBar, SortOption } from './sort-bar'
import { ContributorsInput } from "@/components/contributors-input"
import { SeoPreview } from "@/components/admin/seo-preview"

export type ArchitectureDiagramType = 'hld' | 'lld' | 'dfd' | 'sequence' | 'erd' | 'other'

export interface ArchitectureDiagram {
  title: string
  url: string
  description: string
  type: ArchitectureDiagramType
}

export const DIAGRAM_TYPE_OPTIONS: { value: ArchitectureDiagramType; label: string; description: string }[] = [
  { value: 'hld', label: 'HLD', description: 'High-Level Design' },
  { value: 'lld', label: 'LLD', description: 'Low-Level Design' },
  { value: 'dfd', label: 'DFD', description: 'Data Flow Diagram' },
  { value: 'sequence', label: 'Sequence', description: 'Sequence Diagram' },
  { value: 'erd', label: 'ERD', description: 'Entity-Relationship Diagram' },
  { value: 'other', label: 'Other', description: 'Other diagram type' },
]

interface Project {
  id: string
  title: string
  slug: string
  description: string
  shortDesc: string
  banner: string
  website: string
  downloadLink: string
  repository: string
  stack: string
  screenshots: string
  videoUrl: string
  role: string
  process: string
  results: string
  architectureDiagramUrl: string
  dbSchemaUrl: string
  adrContent: string
  cicdSnippet: string
  iacSnippet: string
  observabilityUrl: string
  testCoverageUrl: string
  performanceMetrics: string
  securityImplementation: string
  swaggerUrl: string
  terminalSessionUrl: string
  behindTheScenes: string
  featured: boolean
  complexity: number
  createdAt: string
  updatedAt: string
  architectureDiagrams: string
  contributors: string
  showTeam: boolean
  embeds: string
}

interface ProjectForm {
  title: string
  slug: string
  description: string
  shortDesc: string
  banner: string
  website: string
  downloadLink: string
  repository: string
  stack: string
  screenshots: string
  videoUrl: string
  role: string
  process: string
  results: string
  architectureDiagramUrl: string
  dbSchemaUrl: string
  adrContent: string
  cicdSnippet: string
  iacSnippet: string
  observabilityUrl: string
  testCoverageUrl: string
  performanceMetrics: string
  securityImplementation: string
  swaggerUrl: string
  terminalSessionUrl: string
  behindTheScenes: string
  featured: boolean
  complexity: number
  architectureDiagrams: ArchitectureDiagram[]
  contributors: string
  showTeam: boolean
  embeds: string
}

const emptyForm: ProjectForm = {
  title: '',
  slug: '',
  description: '',
  shortDesc: '',
  banner: '',
  website: '',
  downloadLink: '',
  repository: '',
  stack: '',
  screenshots: '',
  videoUrl: '',
  role: '',
  process: '',
  results: '',
  architectureDiagramUrl: '',
  dbSchemaUrl: '',
  adrContent: '',
  cicdSnippet: '',
  iacSnippet: '',
  observabilityUrl: '',
  testCoverageUrl: '',
  performanceMetrics: '',
  securityImplementation: '',
  swaggerUrl: '',
  terminalSessionUrl: '',
  behindTheScenes: '',
  featured: false,
  complexity: 1,
  architectureDiagrams: [],
  contributors: '[]',
  showTeam: false,
  embeds: '[]',
}

const projectSortOptions: SortOption[] = [
  { value: 'title:asc', label: 'Title A → Z' },
  { value: 'title:desc', label: 'Title Z → A' },
  { value: 'status:desc', label: 'Featured First' },
  { value: 'status:asc', label: 'Non-Featured First' },
  { value: 'date:desc', label: 'Date Newest' },
  { value: 'date:asc', label: 'Date Oldest' },
]

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function parseStack(stack: string): string[] {
  if (!stack) return []
  try {
    const parsed = JSON.parse(stack)
    if (Array.isArray(parsed)) return parsed
  } catch { }
  return stack.split(',').map((s) => s.trim()).filter(Boolean)
}

function parseScreenshots(screenshots: string): string[] {
  if (!screenshots) return []
  try {
    const parsed = JSON.parse(screenshots)
    if (Array.isArray(parsed)) return parsed
  } catch { }
  return screenshots.split('\n').map((s) => s.trim()).filter(Boolean)
}

function parseArchitectureDiagrams(raw: string | undefined | null): ArchitectureDiagram[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((d) => d && typeof d === 'object')
      .map((d) => ({
        title: typeof d.title === 'string' ? d.title : '',
        url: typeof d.url === 'string' ? d.url : '',
        description: typeof d.description === 'string' ? d.description : '',
        type: (DIAGRAM_TYPE_OPTIONS.some((o) => o.value === d.type) ? d.type : 'other') as ArchitectureDiagramType,
      }))
  } catch {
    return []
  }
}

function FieldSection({ title, children, defaultOpen = false, className = '' }: { title: string; children: React.ReactNode; defaultOpen?: boolean; className?: string }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-sm font-medium"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  )
}

export function ProjectManager() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date:desc')

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form, setForm] = useState<ProjectForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch {
      toast({ title: 'Failed to fetch projects', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const sortedProjects = useMemo(() => {
    const [field, dir] = sortBy.split(':')
    const filtered = search
      ? projects.filter(p =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.shortDesc.toLowerCase().includes(search.toLowerCase()) ||
          p.stack.toLowerCase().includes(search.toLowerCase())
        )
      : projects
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0
      if (field === 'title') {
        cmp = a.title.localeCompare(b.title)
      } else if (field === 'status') {
        const statusVal = (p: boolean) => (p ? 1 : 0)
        cmp = statusVal(a.featured) - statusVal(b.featured)
      } else if (field === 'date') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return dir === 'desc' ? -cmp : cmp
    })
    return sorted
  }, [projects, sortBy, search])

  const openCreate = () => {
    setEditingProject(null)
    setForm(emptyForm)
    setEditorOpen(true)
  }

  const openEdit = (project: Project) => {
    setEditingProject(project)
    const stackArr = parseStack(project.stack)
    const screenshotsArr = parseScreenshots(project.screenshots)
    setForm({
      title: project.title,
      slug: project.slug,
      description: project.description,
      shortDesc: project.shortDesc,
      banner: project.banner,
      website: project.website,
      downloadLink: project.downloadLink || '',
      repository: project.repository,
      stack: stackArr.join(', '),
      screenshots: screenshotsArr.join('\n'),
      videoUrl: project.videoUrl || '',
      role: project.role || '',
      process: project.process || '',
      results: project.results || '',
      architectureDiagramUrl: project.architectureDiagramUrl || '',
      dbSchemaUrl: project.dbSchemaUrl || '',
      adrContent: project.adrContent || '',
      cicdSnippet: project.cicdSnippet || '',
      iacSnippet: project.iacSnippet || '',
      observabilityUrl: project.observabilityUrl || '',
      testCoverageUrl: project.testCoverageUrl || '',
      performanceMetrics: project.performanceMetrics || '',
      securityImplementation: project.securityImplementation || '',
      swaggerUrl: project.swaggerUrl || '',
      terminalSessionUrl: project.terminalSessionUrl || '',
      behindTheScenes: project.behindTheScenes || '',
      featured: project.featured,
      complexity: project.complexity || 1,
      architectureDiagrams: parseArchitectureDiagrams(project.architectureDiagrams),
      contributors: project.contributors || '[]',
      showTeam: project.showTeam || false,
      embeds: project.embeds || '[]',
    })
    setEditorOpen(true)
  }

  // --- Architecture diagrams helpers ---
  const addDiagram = useCallback(() => {
    setForm((f) => ({
      ...f,
      architectureDiagrams: [
        ...f.architectureDiagrams,
        { title: '', url: '', description: '', type: 'hld' as ArchitectureDiagramType },
      ],
    }))
  }, [])

  const updateDiagram = useCallback((index: number, patch: Partial<ArchitectureDiagram>) => {
    setForm((f) => ({
      ...f,
      architectureDiagrams: f.architectureDiagrams.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    }))
  }, [])

  const removeDiagram = useCallback((index: number) => {
    setForm((f) => ({
      ...f,
      architectureDiagrams: f.architectureDiagrams.filter((_, i) => i !== index),
    }))
  }, [])

  const moveDiagram = useCallback((index: number, dir: -1 | 1) => {
    setForm((f) => {
      const arr = [...f.architectureDiagrams]
      const target = index + dir
      if (target < 0 || target >= arr.length) return f
      ;[arr[index], arr[target]] = [arr[target], arr[index]]
      return { ...f, architectureDiagrams: arr }
    })
  }, [])

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' })
      return
    }
    if (!form.description.trim()) {
      toast({ title: 'Description is required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects'
      const method = editingProject ? 'PUT' : 'POST'

      const stackArr = form.stack.split(',').map((s) => s.trim()).filter(Boolean)
      const screenshotsArr = form.screenshots.split('\n').map((s) => s.trim()).filter(Boolean)

      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        shortDesc: form.shortDesc,
        banner: form.banner,
        website: form.website,
        downloadLink: form.downloadLink,
        repository: form.repository,
        stack: stackArr,
        screenshots: screenshotsArr,
        videoUrl: form.videoUrl,
        role: form.role,
        process: form.process,
        results: form.results,
        architectureDiagramUrl: form.architectureDiagramUrl,
        dbSchemaUrl: form.dbSchemaUrl,
        adrContent: form.adrContent,
        cicdSnippet: form.cicdSnippet,
        iacSnippet: form.iacSnippet,
        observabilityUrl: form.observabilityUrl,
        testCoverageUrl: form.testCoverageUrl,
        performanceMetrics: form.performanceMetrics,
        securityImplementation: form.securityImplementation,
        swaggerUrl: form.swaggerUrl,
        terminalSessionUrl: form.terminalSessionUrl,
        behindTheScenes: form.behindTheScenes,
        featured: form.featured,
        complexity: form.complexity,
        // Multi-diagram architecture gallery — send as an array; API normalizes to JSON string.
        architectureDiagrams: form.architectureDiagrams,
        // Team / contributors / embeds (kept in sync with DB)
        contributors: form.contributors,
        showTeam: form.showTeam,
        embeds: form.embeds,
      }

      if (!editingProject) {
        body.slug = form.slug || generateSlug(form.title)
      } else if (form.title !== editingProject.title) {
        body.slug = form.slug || generateSlug(form.title)
      } else if (form.slug) {
        body.slug = form.slug
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      toast({
        title: editingProject ? 'Project updated' : 'Project created',
        description: `"${form.title}" has been saved successfully.`,
      })
      setEditorOpen(false)
      fetchProjects()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save project',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast({ title: 'Project deleted', description: `"${deleteTarget.title}" has been removed.` })
      setDeleteTarget(null)
      fetchProjects()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete project', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearch('')}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <SortBar options={projectSortOptions} value={sortBy} onChange={setSortBy} />
        </div>
        <Button onClick={openCreate} size="sm" className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">No projects found.</p>
              <Button variant="link" className="mt-2" onClick={openCreate}>
                Create your first project
              </Button>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Stack</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProjects.map((project) => {
                    const stack = parseStack(project.stack)
                    const diagramCount = parseArchitectureDiagrams(project.architectureDiagrams).length
                    return (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{project.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {project.shortDesc || project.slug}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {stack.slice(0, 3).map((tech) => (
                              <Badge key={tech} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {tech}
                              </Badge>
                            ))}
                            {stack.length > 3 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                +{stack.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {project.featured && <Badge className="text-xs">Featured</Badge>}
                            {project.downloadLink && <Badge variant="outline" className="text-xs gap-1"><Download className="h-3 w-3" />App</Badge>}
                            {diagramCount > 0 && (
                              <Badge variant="outline" className="text-xs gap-1" title={`${diagramCount} architecture diagram${diagramCount === 1 ? '' : 's'}`}>
                                <Network className="h-3 w-3" />{diagramCount}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {format(new Date(project.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {project.website && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <a href={project.website} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {project.repository && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <a href={project.repository} target="_blank" rel="noopener noreferrer">
                                  <Github className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(project)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(project)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog — improved 2-column layout on PC */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'Create Project'}</DialogTitle>
            <DialogDescription>
              {editingProject ? 'Update the project details.' : 'Fill in the details to create a new project.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Two-column layout on lg+ for Basic Info and Links side by side */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Basic Information */}
              <FieldSection title="Basic Information" defaultOpen className="lg:col-span-1">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="proj-title">Title *</Label>
                  <Input id="proj-title" placeholder="Project name" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="proj-slug">Slug</Label>
                    <Input id="proj-slug" placeholder="auto-generated" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="proj-role">Your Role</Label>
                    <Input id="proj-role" placeholder="e.g. Lead Developer" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="proj-short">Short Description</Label>
                  <Input id="proj-short" placeholder="One-line description for card preview" value={form.shortDesc} onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))} />
                </div>
                 <SeoPreview
                  title={form.title}
                  slug={form.slug}
                  description={form.shortDesc}
                />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="proj-desc">Description (Markdown) *</Label>
                  <Textarea id="proj-desc" placeholder="Detailed project description..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={8} className="font-mono text-sm" />
                </div>
              </FieldSection>

              {/* Links & Media */}
              <FieldSection title="Links & Media" defaultOpen className="lg:col-span-1">
                <div className="grid gap-3 grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="proj-website">Website URL</Label>
                    <Input id="proj-website" placeholder="https://..." value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="proj-download">Download Link</Label>
                    <Input id="proj-download" placeholder="Store/direct link" value={form.downloadLink} onChange={(e) => setForm((f) => ({ ...f, downloadLink: e.target.value }))} />
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="proj-repo">Repository URL</Label>
                    <Input id="proj-repo" placeholder="https://github.com/..." value={form.repository} onChange={(e) => setForm((f) => ({ ...f, repository: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="proj-banner">Banner Image URL</Label>
                    <Input id="proj-banner" placeholder="https://..." value={form.banner} onChange={(e) => setForm((f) => ({ ...f, banner: e.target.value }))} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="proj-video">Video URL</Label>
                  <Input id="proj-video" placeholder="https://example.com/demo.mp4" value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="proj-screenshots">Screenshots (one URL per line)</Label>
                  <Textarea id="proj-screenshots" placeholder={"https://screenshot1.com\nhttps://screenshot2.com"} value={form.screenshots} onChange={(e) => setForm((f) => ({ ...f, screenshots: e.target.value }))} rows={3} className="font-mono text-sm" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="proj-stack">Stack (comma-separated)</Label>
                  <Input id="proj-stack" placeholder="React, Next.js, TypeScript" value={form.stack} onChange={(e) => setForm((f) => ({ ...f, stack: e.target.value }))} />
                </div>
              </FieldSection>
            </div>

            {/* Two-column layout for Technical and Process/Results on lg+ */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Technical Deep-Dive */}
              <FieldSection title="Technical Deep-Dive" defaultOpen className="lg:col-span-1">
                <div className="grid gap-3 grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="proj-arch">Architecture Diagram URL (legacy)</Label>
                    <Input id="proj-arch" placeholder="https://..." value={form.architectureDiagramUrl} onChange={(e) => setForm((f) => ({ ...f, architectureDiagramUrl: e.target.value }))} />
                    <p className="text-[11px] text-muted-foreground">Single-diagram legacy field. Prefer the gallery below.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="proj-dbschema">DB Schema URL</Label>
                    <Input id="proj-dbschema" placeholder="https://..." value={form.dbSchemaUrl} onChange={(e) => setForm((f) => ({ ...f, dbSchemaUrl: e.target.value }))} />
                  </div>
                </div>

                {/* Architecture Diagrams gallery editor */}
                <div className="rounded-lg border border-dashed p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Architecture Diagrams</span>
                      {form.architectureDiagrams.length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">{form.architectureDiagrams.length}</Badge>
                      )}
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={addDiagram}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Add diagram
                    </Button>
                  </div>

                  {form.architectureDiagrams.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No diagrams yet. Click <span className="font-medium">Add diagram</span> to attach an HLD, LLD, DFD, sequence, ERD, or other diagram (image / SVG / embed URL).
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {form.architectureDiagrams.map((diagram, idx) => {
                        const typeOption = DIAGRAM_TYPE_OPTIONS.find((o) => o.value === diagram.type)
                        return (
                          <div key={idx} className="rounded-md border bg-card p-3 space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="flex flex-col gap-0.5 pt-1">
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                  onClick={() => moveDiagram(idx, -1)}
                                  disabled={idx === 0}
                                  aria-label="Move up"
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                  onClick={() => moveDiagram(idx, 1)}
                                  disabled={idx === form.architectureDiagrams.length - 1}
                                  aria-label="Move down"
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="grid gap-2 grid-cols-1 sm:grid-cols-[1fr_140px] flex-1">
                                <div className="flex flex-col gap-1">
                                  <Label htmlFor={`diag-title-${idx}`} className="text-[11px] text-muted-foreground">Title</Label>
                                  <Input
                                    id={`diag-title-${idx}`}
                                    placeholder="e.g. High-Level Architecture"
                                    value={diagram.title}
                                    onChange={(e) => updateDiagram(idx, { title: e.target.value })}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Label htmlFor={`diag-type-${idx}`} className="text-[11px] text-muted-foreground">Type</Label>
                                  <Select
                                    value={diagram.type}
                                    onValueChange={(v) => updateDiagram(idx, { type: v as ArchitectureDiagramType })}
                                  >
                                    <SelectTrigger id={`diag-type-${idx}`}>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {DIAGRAM_TYPE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                          <span className="font-medium">{opt.label}</span>
                                          <span className="ml-2 text-xs text-muted-foreground">{opt.description}</span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive shrink-0 mt-5"
                                onClick={() => removeDiagram(idx)}
                                aria-label={`Remove diagram ${idx + 1}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor={`diag-url-${idx}`} className="text-[11px] text-muted-foreground">URL (image / SVG / embed)</Label>
                              <Input
                                id={`diag-url-${idx}`}
                                placeholder="https://... .png / .svg / mermaid / excalidraw"
                                value={diagram.url}
                                onChange={(e) => updateDiagram(idx, { url: e.target.value })}
                                className="font-mono text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor={`diag-desc-${idx}`} className="text-[11px] text-muted-foreground">Description (optional)</Label>
                              <Textarea
                                id={`diag-desc-${idx}`}
                                placeholder="What does this diagram show?"
                                value={diagram.description}
                                onChange={(e) => updateDiagram(idx, { description: e.target.value })}
                                rows={2}
                                className="text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <Badge variant="outline" className="text-[10px] capitalize">{typeOption?.label ?? diagram.type}</Badge>
                              {diagram.url && (
                                <span className="truncate max-w-[200px]" title={diagram.url}>{diagram.url}</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="proj-adr">Architecture Decision Records</Label>
                  <Textarea id="proj-adr" placeholder="Key architecture decisions..." value={form.adrContent} onChange={(e) => setForm((f) => ({ ...f, adrContent: e.target.value }))} rows={3} className="font-mono text-sm" />
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="proj-obs">Observability URL</Label>
                    <Input id="proj-obs" placeholder="Grafana/Datadog URL" value={form.observabilityUrl} onChange={(e) => setForm((f) => ({ ...f, observabilityUrl: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="proj-test">Test Coverage URL</Label>
                    <Input id="proj-test" placeholder="Coverage report URL" value={form.testCoverageUrl} onChange={(e) => setForm((f) => ({ ...f, testCoverageUrl: e.target.value }))} />
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="proj-swagger">Swagger/API Docs URL</Label>
                    <Input id="proj-swagger" placeholder="https://api.example.com/docs" value={form.swaggerUrl} onChange={(e) => setForm((f) => ({ ...f, swaggerUrl: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="proj-terminal">Terminal Session URL</Label>
                    <Input id="proj-terminal" placeholder="https://asciinema.org/..." value={form.terminalSessionUrl} onChange={(e) => setForm((f) => ({ ...f, terminalSessionUrl: e.target.value }))} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="proj-cicd">CI/CD Pipeline Config</Label>
                  <Textarea id="proj-cicd" placeholder={"# .github/workflows/deploy.yml\nname: Deploy"} value={form.cicdSnippet} onChange={(e) => setForm((f) => ({ ...f, cicdSnippet: e.target.value }))} rows={3} className="font-mono text-sm" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="proj-iac">Infrastructure as Code</Label>
                  <Textarea id="proj-iac" placeholder={"# Terraform / CloudFormation\nresource \"aws_instance\""} value={form.iacSnippet} onChange={(e) => setForm((f) => ({ ...f, iacSnippet: e.target.value }))} rows={3} className="font-mono text-sm" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="proj-perf">Performance Metrics</Label>
                  <Textarea id="proj-perf" placeholder="Load times, throughput, latency..." value={form.performanceMetrics} onChange={(e) => setForm((f) => ({ ...f, performanceMetrics: e.target.value }))} rows={3} className="font-mono text-sm" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="proj-security">Security Implementation</Label>
                  <Textarea id="proj-security" placeholder="Auth, encryption, compliance..." value={form.securityImplementation} onChange={(e) => setForm((f) => ({ ...f, securityImplementation: e.target.value }))} rows={3} className="font-mono text-sm" />
                </div>
              </FieldSection>

              {/* Process & Results */}
              <FieldSection title="Process & Results" className="lg:col-span-1">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="proj-process">My Process (Markdown)</Label>
                  <Textarea id="proj-process" placeholder="How you approached and built this project..." value={form.process} onChange={(e) => setForm((f) => ({ ...f, process: e.target.value }))} rows={6} className="font-mono text-sm" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="proj-results">Results & Impact (Markdown)</Label>
                  <Textarea id="proj-results" placeholder="What was achieved, metrics, impact..." value={form.results} onChange={(e) => setForm((f) => ({ ...f, results: e.target.value }))} rows={6} className="font-mono text-sm" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="proj-bts">Behind the Scenes (Markdown)</Label>
                  <Textarea id="proj-bts" placeholder="Challenges faced, lessons learned..." value={form.behindTheScenes} onChange={(e) => setForm((f) => ({ ...f, behindTheScenes: e.target.value }))} rows={6} className="font-mono text-sm" />
                </div>
              </FieldSection>
            </div>

            {/* Team / Contributors */}
            <FieldSection title="Team & Contributors" className="">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Switch
                  checked={form.showTeam}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, showTeam: checked }))}
                />
                <div>
                  <Label className="text-sm font-medium">Show Team Section</Label>
                  <p className="text-xs text-muted-foreground">
                    Display contributors publicly on the project detail page.
                  </p>
                </div>
              </div>
              <ContributorsInput
                value={form.contributors}
                onChange={(val) => setForm((f) => ({ ...f, contributors: val }))}
              />
            </FieldSection>

            {/* Featured Toggle + Complexity */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Switch
                  checked={form.featured}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, featured: checked }))}
                />
                <div>
                  <Label className="text-sm font-medium">Featured</Label>
                  <p className="text-xs text-muted-foreground">
                    Show in featured section on homepage
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border p-3">
                <Label className="text-sm font-medium">Complexity</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, complexity: level }))}
                      className="transition-colors"
                    >
                      <svg
                        className={`h-6 w-6 ${form.complexity >= level ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30 fill-muted-foreground/30'}`}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        fill="currentColor"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">
                    {form.complexity === 1 ? 'Simple Tool' : form.complexity === 2 ? 'Medium Project' : 'Enterprise Level'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingProject ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
