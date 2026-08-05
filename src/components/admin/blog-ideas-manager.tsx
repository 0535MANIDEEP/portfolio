'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Lightbulb,
  Rocket,
  Flame,
  ArrowDownUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────

type IdeaStatus = 'idea' | 'drafting' | 'review' | 'published'
type IdeaPriority = 'low' | 'medium' | 'high'

interface BlogIdea {
  id: string
  title: string
  description: string
  tags: string
  status: IdeaStatus
  priority: IdeaPriority
  source: string
  notes: string
  createdAt: string
  updatedAt: string
}

interface BlogIdeaForm {
  title: string
  description: string
  tags: string
  status: IdeaStatus
  priority: IdeaPriority
  source: string
  notes: string
}

const emptyForm: BlogIdeaForm = {
  title: '',
  description: '',
  tags: '',
  status: 'idea',
  priority: 'medium',
  source: '',
  notes: '',
}

const STATUS_COLUMNS: { value: IdeaStatus | 'all'; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'drafting', label: 'Drafting' },
  { value: 'review', label: 'Review' },
  { value: 'published', label: 'Published' },
]

// ─── Status / Priority styling helpers ────────────────────────────

const STATUS_STYLES: Record<IdeaStatus, string> = {
  idea: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  drafting:
    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  review:
    'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  published:
    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
}

const PRIORITY_STYLES: Record<IdeaPriority, string> = {
  low: 'text-muted-foreground',
  medium: 'text-amber-500',
  high: 'text-red-500',
}

const PRIORITY_LABELS: Record<IdeaPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

// ─── Component ────────────────────────────────────────────────────

export function BlogIdeasManager() {
  const { toast } = useToast()

  const [ideas, setIdeas] = useState<BlogIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'priority' | 'title'>(
    'date-desc'
  )

  // Editor dialog
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BlogIdeaForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<BlogIdea | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Promote loading state per-idea
  const [promotingId, setPromotingId] = useState<string | null>(null)

  const fetchIdeas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/blog-ideas?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setIdeas(Array.isArray(data) ? data : [])
      } else {
        toast({ title: 'Failed to fetch blog ideas', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to fetch blog ideas', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, toast])

  useEffect(() => {
    void fetchIdeas()
  }, [fetchIdeas])

  // Group ideas by status for the kanban-style columns
  const grouped = useMemo(() => {
    const sorted = [...ideas].sort((a, b) => {
      if (sortBy === 'date-desc')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'date-asc')
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      // priority: high > medium > low
      const order: Record<IdeaPriority, number> = { high: 0, medium: 1, low: 2 }
      return order[a.priority] - order[b.priority]
    })

    if (statusFilter !== 'all') {
      return [{ status: statusFilter, items: sorted }]
    }
    return STATUS_COLUMNS.map((col) => ({
      status: col.value as IdeaStatus,
      items: sorted.filter((i) => i.status === col.value),
    }))
  }, [ideas, sortBy, statusFilter])

  // ─── Editor handlers ───────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setEditorOpen(true)
  }

  const openEdit = (idea: BlogIdea) => {
    setEditingId(idea.id)
    setForm({
      title: idea.title,
      description: idea.description,
      tags: idea.tags,
      status: idea.status,
      priority: idea.priority,
      source: idea.source,
      notes: idea.notes,
    })
    setEditorOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, tags: form.tags.trim() }
      const isEditing = !!editingId
      const url = isEditing
        ? `/api/blog-ideas/${editingId}`
        : '/api/blog-ideas'
      const method = isEditing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save')
      }
      toast({
        title: isEditing ? 'Idea updated' : 'Idea created',
        description: form.title,
      })
      setEditorOpen(false)
      await fetchIdeas()
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete handler ────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/blog-ideas/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast({
        title: 'Idea deleted',
        description: deleteTarget.title,
      })
      setDeleteTarget(null)
      await fetchIdeas()
    } catch (e) {
      toast({
        title: 'Delete failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  // ─── Promote to BlogPost ───────────────────────────────────────

  const handlePromote = async (idea: BlogIdea) => {
    setPromotingId(idea.id)
    try {
      // Step 1: create a draft BlogPost via POST /api/blogs
      const createRes = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: idea.title,
          excerpt: idea.description || '',
          tags: idea.tags || '',
          published: false,
          status: 'draft',
          type: 'article',
          content: '',
        }),
      })
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create blog post')
      }
      const blogPost = await createRes.json()

      // Step 2: mark idea as published via PUT /api/blog-ideas/{id}
      const updateRes = await fetch(`/api/blog-ideas/${idea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      })
      if (!updateRes.ok) {
        throw new Error('Blog post created, but failed to update idea status')
      }

      toast({
        title: 'Promoted to Blog Post',
        description: `Draft "${blogPost.title}" created and idea marked as published.`,
      })
      await fetchIdeas()
    } catch (e) {
      toast({
        title: 'Promotion failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setPromotingId(null)
    }
  }

  // ─── Derived ───────────────────────────────────────────────────

  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      idea: 0,
      drafting: 0,
      review: 0,
      published: 0,
    }
    for (const i of ideas) counts[i.status] = (counts[i.status] || 0) + 1
    return counts
  }, [ideas])

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search ideas by title, tags, source..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as IdeaStatus | 'all')}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="idea">Idea</SelectItem>
              <SelectItem value="drafting">Drafting</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <span className="flex items-center gap-1.5">
                <ArrowDownUp className="h-3 w-3 text-muted-foreground" />
                <SelectValue placeholder="Sort" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest first</SelectItem>
              <SelectItem value="date-asc">Oldest first</SelectItem>
              <SelectItem value="priority">By priority</SelectItem>
              <SelectItem value="title">Title A → Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={openCreate} size="sm" className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          New Idea
        </Button>
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STATUS_COLUMNS.map((col) => {
          const count = stats[col.value as IdeaStatus] || 0
          const isActive = statusFilter === col.value
          return (
            <button
              key={col.value}
              onClick={() =>
                setStatusFilter(isActive ? 'all' : (col.value as IdeaStatus))
              }
              className={`text-left rounded-lg border p-3 transition-colors ${
                isActive
                  ? 'border-primary bg-primary/5'
                  : 'bg-card hover:bg-accent/50 border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {col.label}
                </span>
                <span
                  className={`inline-flex h-2 w-2 rounded-full ${
                    col.value === 'idea'
                      ? 'bg-amber-500'
                      : col.value === 'drafting'
                      ? 'bg-blue-500'
                      : col.value === 'review'
                      ? 'bg-purple-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>
              <div className="text-2xl font-bold mt-1">{count}</div>
            </button>
          )
        })}
      </div>

      {/* Kanban / List */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Lightbulb className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No blog ideas yet</p>
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your filters.'
                  : 'Click "New Idea" to capture your first article concept.'}
              </p>
            </div>
            {!search && statusFilter === 'all' && (
              <Button onClick={openCreate} size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" /> New Idea
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            statusFilter === 'all'
              ? 'grid gap-4 lg:grid-cols-4 md:grid-cols-2'
              : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
          }
        >
          {grouped.map((col) => (
            <div key={col.status} className="flex flex-col gap-3">
              {statusFilter === 'all' && (
                <div className="sticky top-0 z-10 flex items-center justify-between rounded-md bg-card/80 backdrop-blur-sm px-3 py-2 border">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {col.status}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {col.items.length}
                  </Badge>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {col.items.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      onEdit={() => openEdit(idea)}
                      onDelete={() => setDeleteTarget(idea)}
                      onPromote={() => handlePromote(idea)}
                      promoting={promotingId === idea.id}
                    />
                  ))}
                </AnimatePresence>

                {col.items.length === 0 && statusFilter === 'all' && (
                  <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg">
                    No items
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Blog Idea' : 'New Blog Idea'}
            </DialogTitle>
            <DialogDescription>
              Capture the concept, status, priority, and source for your next
              article.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="idea-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="idea-title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g. Comparing message queues: Kafka vs NATS"
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="idea-description">Description</Label>
              <Textarea
                id="idea-description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="A short pitch or outline of the article..."
                rows={3}
              />
            </div>

            {/* Tags */}
            <div className="grid gap-2">
              <Label htmlFor="idea-tags">Tags</Label>
              <Input
                id="idea-tags"
                value={form.tags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tags: e.target.value }))
                }
                placeholder="messaging, kafka, nats (comma-separated)"
              />
              <p className="text-[11px] text-muted-foreground">
                Comma-separated keywords.
              </p>
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v as IdeaStatus }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="drafting">Drafting</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, priority: v as IdeaPriority }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Source */}
            <div className="grid gap-2">
              <Label htmlFor="idea-source">Source</Label>
              <Input
                id="idea-source"
                value={form.source}
                onChange={(e) =>
                  setForm((f) => ({ ...f, source: e.target.value }))
                }
                placeholder="e.g. work, personal, research, link..."
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="idea-notes">Notes</Label>
              <Textarea
                id="idea-notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Outline points, references, todo checklist..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditorOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create idea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{deleteTarget?.title}&rdquo;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
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

// ─── Idea Card ────────────────────────────────────────────────────

function IdeaCard({
  idea,
  onEdit,
  onDelete,
  onPromote,
  promoting,
}: {
  idea: BlogIdea
  onEdit: () => void
  onDelete: () => void
  onPromote: () => void
  promoting: boolean
}) {
  const tagsList = useMemo(
    () =>
      idea.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [idea.tags]
  )

  const descriptionPreview = useMemo(() => {
    const text = (idea.description || '').trim()
    if (!text) return ''
    return text.length > 140 ? text.slice(0, 140) + '…' : text
  }, [idea.description])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-snug line-clamp-2">
              {idea.title}
            </h3>
            {idea.priority === 'high' && (
              <Flame
                className={`h-4 w-4 shrink-0 ${PRIORITY_STYLES.high}`}
                aria-label="High priority"
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="px-3 pb-3 pt-1 space-y-3">
          {/* Description preview */}
          {descriptionPreview && (
            <p className="text-xs text-muted-foreground line-clamp-3">
              {descriptionPreview}
            </p>
          )}

          {/* Tags */}
          {tagsList.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tagsList.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 font-normal"
                >
                  {tag}
                </Badge>
              ))}
              {tagsList.length > 4 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{tagsList.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-[10px] capitalize ${STATUS_STYLES[idea.status]}`}
            >
              {idea.status}
            </Badge>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className={`capitalize font-medium ${PRIORITY_STYLES[idea.priority]}`}>
                {PRIORITY_LABELS[idea.priority]}
              </span>
              <span aria-hidden>·</span>
              <span>{format(new Date(idea.createdAt), 'MMM d')}</span>
            </div>
          </div>

          {idea.source && (
            <div className="text-[10px] text-muted-foreground truncate">
              Source: <span className="font-medium">{idea.source}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 pt-1 border-t">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={onEdit}
              disabled={promoting}
            >
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs hover:text-destructive"
              onClick={onDelete}
              disabled={promoting}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs ml-auto text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              onClick={onPromote}
              disabled={promoting || idea.status === 'published'}
              title={
                idea.status === 'published'
                  ? 'Already promoted'
                  : 'Create a draft BlogPost from this idea'
              }
            >
              <Rocket className="h-3 w-3 mr-1" />
              {promoting ? 'Promoting...' : 'Promote'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
