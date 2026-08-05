'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  X,
  CheckSquare,
  Square,
  EyeOff,
  Clock,
  Upload,
  Link2,
  FileVideo,
  Image as ImageIcon,
  ExternalLink,
  Paperclip,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { EmbedUrlInput, parseCustomEmbed } from "@/components/embed-renderer"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import { SortBar, SortOption } from './sort-bar'
import { SeoPreview } from "@/components/admin/seo-preview"

// ─── Feature #16 Part A: Resource Links sub-component ────────────────────
//
// Modeled after ContributorsInput — manages a JSON-stringified array of
// { label, url, description } internally; the parent form just stores
// the string in `form.resourceLinks`.

interface ResourceLink {
  label: string
  url: string
  description: string
}

interface ResourceLinksInputProps {
  value: string // JSON string
  onChange: (val: string) => void
}

function parseResourceLinks(raw: string): ResourceLink[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .filter((x) => x && typeof x === 'object')
        .map((x) => ({
          label: typeof x.label === 'string' ? x.label : '',
          url: typeof x.url === 'string' ? x.url : '',
          description: typeof x.description === 'string' ? x.description : '',
        }))
    }
  } catch {
    /* fall through to empty */
  }
  return []
}

function ResourceLinksInput({ value, onChange }: ResourceLinksInputProps) {
  const links = useMemo(() => parseResourceLinks(value), [value])

  const commit = useCallback(
    (next: ResourceLink[]) => {
      onChange(JSON.stringify(next))
    },
    [onChange],
  )

  const addLink = useCallback(() => {
    commit([...links, { label: '', url: '', description: '' }])
  }, [links, commit])

  const removeLink = useCallback(
    (index: number) => {
      commit(links.filter((_, i) => i !== index))
    },
    [links, commit],
  )

  const updateLink = useCallback(
    (index: number, field: keyof ResourceLink, val: string) => {
      const next = [...links]
      next[index] = { ...next[index], [field]: val }
      commit(next)
    },
    [links, commit],
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label>Resource Links</Label>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            External links shown in the blog sidebar (docs, related articles, tools, etc.).
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addLink} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Link
        </Button>
      </div>

      {links.length === 0 && (
        <div className="text-center py-6 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
          <ExternalLink className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
          No resource links added yet
        </div>
      )}

      <div className="space-y-2">
        {links.map((link, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                #{i + 1}
              </span>
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="p-1 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`Remove resource link #${i + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                value={link.label}
                onChange={(e) => updateLink(i, 'label', e.target.value)}
                placeholder="Label (e.g. Official Docs)"
                className="text-sm"
              />
              <Input
                value={link.url}
                onChange={(e) => updateLink(i, 'url', e.target.value)}
                placeholder="https://example.com"
                className="text-sm font-mono"
              />
            </div>
            <Input
              value={link.description}
              onChange={(e) => updateLink(i, 'description', e.target.value)}
              placeholder="Short description (optional)"
              className="text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Feature #16 Part B: Custom Embed Uploader Dialog ────────────────────
//
// Lets the admin either paste an embed URL OR upload a file (image/video)
// which is converted to a base64 data URL via FileReader and appended to
// the embeds field (newline-separated).

interface CustomEmbedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  embeds: string // current newline-separated embeds
  onChange: (next: string) => void
}

const MAX_RECOMMENDED_BYTES = 2 * 1024 * 1024 // 2 MB

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function CustomEmbedDialog({ open, onOpenChange, embeds, onChange }: CustomEmbedDialogProps) {
  const { toast } = useToast()
  const [mode, setMode] = useState<'url' | 'file'>('url')
  const [urlInput, setUrlInput] = useState('')
  const [filePreview, setFilePreview] = useState<{ name: string; size: number; type: string; dataUrl: string } | null>(null)
  const [reading, setReading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Current embeds list (newline-separated → array)
  const embedList = useMemo(() => {
    return (embeds || '')
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)
  }, [embeds])

  const appendEmbed = useCallback(
    (entry: string) => {
      const trimmed = entry.trim()
      if (!trimmed) return
      const next = [...embedList, trimmed]
      onChange(next.join('\n'))
    },
    [embedList, onChange],
  )

  const removeEmbed = useCallback(
    (index: number) => {
      const next = embedList.filter((_, i) => i !== index)
      onChange(next.join('\n'))
    },
    [embedList, onChange],
  )

  const handleAddUrl = useCallback(() => {
    const url = urlInput.trim()
    if (!url) {
      toast({ title: 'Enter a URL first', variant: 'destructive' })
      return
    }
    // Validate: either a known embed URL or any http(s) URL or a data URL.
    const isHttp = /^https?:\/\//i.test(url)
    const isData = /^data:(image|video)\//i.test(url)
    if (!isHttp && !isData) {
      toast({ title: 'URL must start with http(s):// or data:image/ / data:video:', variant: 'destructive' })
      return
    }
    appendEmbed(url)
    setUrlInput('')
    toast({ title: 'Embed added', description: 'URL appended to embeds.' })
  }, [urlInput, appendEmbed, toast])

  const handleFileSelected = useCallback(
    (file: File) => {
      if (!file) return
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      if (!isImage && !isVideo) {
        toast({
          title: 'Unsupported file type',
          description: 'Please upload an image (PNG, JPG, GIF, WebP) or a video (MP4, WebM).',
          variant: 'destructive',
        })
        return
      }
      setReading(true)
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : ''
        setFilePreview({ name: file.name, size: file.size, type: file.type, dataUrl })
        setReading(false)
      }
      reader.onerror = () => {
        setReading(false)
        toast({ title: 'Failed to read file', variant: 'destructive' })
      }
      reader.readAsDataURL(file)
    },
    [toast],
  )

  const handleAddFile = useCallback(() => {
    if (!filePreview) {
      toast({ title: 'Upload a file first', variant: 'destructive' })
      return
    }
    appendEmbed(filePreview.dataUrl)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    toast({
      title: 'Asset added',
      description: `${filePreview.name} (${formatBytes(filePreview.size)}) embedded as a data URL.`,
    })
  }, [filePreview, appendEmbed, toast])

  const handleClose = useCallback(() => {
    setUrlInput('')
    setFilePreview(null)
    setMode('url')
    if (fileInputRef.current) fileInputRef.current.value = ''
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : handleClose())}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Custom Embed Uploader
          </DialogTitle>
          <DialogDescription>
            Add embeddable URLs (YouTube, Spotify, Tweets, CodePen, any URL) or upload an
            image/video file (stored inline as a base64 data URL).
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-1 rounded-lg bg-muted p-1 mb-3">
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'url'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setMode('url')}
          >
            <Link2 className="inline h-3.5 w-3.5 mr-1.5" />
            Paste URL
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'file'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setMode('file')}
          >
            <Upload className="inline h-3.5 w-3.5 mr-1.5" />
            Upload File
          </button>
        </div>

        {mode === 'url' ? (
          <div className="space-y-2">
            <Label htmlFor="embed-url-input">Embed URL</Label>
            <div className="flex gap-2">
              <Input
                id="embed-url-input"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or any URL"
                className="font-mono text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddUrl()
                  }
                }}
              />
              <Button type="button" onClick={handleAddUrl} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Supports YouTube (videos/shorts/playlists), Spotify, Twitter/X, CodePen, or any
              iframe-able URL.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="embed-file-input">Upload Image or Video</Label>
              <input
                ref={fileInputRef}
                id="embed-file-input"
                type="file"
                accept="image/*,video/*"
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer mt-1"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelected(file)
                }}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Files larger than 2 MB will work but are not recommended — base64 data URLs
                inflate the embeds field significantly and slow down the admin/blog load.
              </p>
            </div>

            {reading && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                Reading file…
              </div>
            )}

            {filePreview && (
              <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">
                    {filePreview.type.startsWith('image/') ? (
                      <ImageIcon className="inline h-3.5 w-3.5 mr-1" />
                    ) : (
                      <FileVideo className="inline h-3.5 w-3.5 mr-1" />
                    )}
                    {filePreview.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFilePreview(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Clear preview"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {filePreview.type} · {formatBytes(filePreview.size)}
                  {filePreview.size > MAX_RECOMMENDED_BYTES && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                      ⚠ Exceeds 2 MB — embedding will bloat the blog record.
                    </span>
                  )}
                </div>
                {/* Live preview */}
                <div className="rounded-md overflow-hidden border bg-background max-h-72 flex items-center justify-center">
                  {filePreview.type.startsWith('image/') ? (
                    <img
                      src={filePreview.dataUrl}
                      alt={filePreview.name}
                      className="max-h-72 w-auto object-contain"
                    />
                  ) : (
                    <video
                      src={filePreview.dataUrl}
                      controls
                      className="max-h-72 w-full"
                    />
                  )}
                </div>
                <Button type="button" size="sm" onClick={handleAddFile} className="w-full">
                  <Plus className="h-4 w-4 mr-1" /> Add to Embeds
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Current embeds list */}
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">
              Current Embeds
              <Badge variant="secondary" className="ml-2 text-[10px]">{embedList.length}</Badge>
            </Label>
          </div>
          {embedList.length === 0 ? (
            <div className="text-center py-4 rounded-lg border border-dashed text-muted-foreground text-xs">
              No embeds yet. Add one above.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {embedList.map((url, i) => {
                const info = parseCustomEmbed(url)
                const isData = url.startsWith('data:')
                const display = isData
                  ? `data:${info?.dataKind || 'asset'}/… (${formatBytes(
                      Math.ceil((url.length * 3) / 4),
                    )})`
                  : url
                return (
                  <div
                    key={`${i}-${display.slice(0, 40)}`}
                    className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-xs"
                  >
                    {info?.type === 'youtube' && <span className="text-red-600 dark:text-red-400">▶</span>}
                    {info?.type === 'spotify' && <span className="text-green-600 dark:text-green-400">♪</span>}
                    {info?.type === 'twitter' && <span className="text-blue-600 dark:text-blue-400">𝕏</span>}
                    {info?.type === 'custom' && <Link2 className="h-3 w-3 text-muted-foreground" />}
                    {info?.type === 'data' && info.dataKind === 'image' && (
                      <ImageIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    )}
                    {info?.type === 'data' && info.dataKind === 'video' && (
                      <FileVideo className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <span className="truncate flex-1 font-mono">{display}</span>
                    <button
                      type="button"
                      onClick={() => removeEmbed(i)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      aria-label={`Remove embed #${i + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface Blog {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  tags: string
  type: string
  embeds: string
  resourceLinks: string
  published: boolean
  writtenBy: string
  acceptedBy: string
  category: string
  scheduledAt: string
  createdAt: string
  updatedAt: string
}

interface BlogForm {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  tags: string
  type: string
  embeds: string
  resourceLinks: string
  published: boolean
  writtenBy: string
  acceptedBy: string
  category: string
  scheduledAt: string
}

const CATEGORY_SUGGESTIONS = ['Technology', 'Tutorial', 'Career', 'Personal', 'DevOps', 'System Design', 'Database', 'Open Source']

const emptyForm: BlogForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  tags: '',
  type: 'article',
  embeds: '',
  resourceLinks: '[]',
  published: false,
  writtenBy: '',
  acceptedBy: '',
  category: '',
  scheduledAt: '',
}

const blogSortOptions: SortOption[] = [
  { value: 'title:asc', label: 'Title A → Z' },
  { value: 'title:desc', label: 'Title Z → A' },
  { value: 'status:asc', label: 'Status Draft First' },
  { value: 'status:desc', label: 'Status Published First' },
  { value: 'date:desc', label: 'Date Newest' },
  { value: 'date:asc', label: 'Date Oldest' },
]

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function formatDatetimeLocal(isoString: string): string {
  const d = new Date(isoString)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function BlogManager() {
  const { toast } = useToast()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date:desc')

  // Editor dialog
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)
  const [form, setForm] = useState<BlogForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Preview dialog
  const [previewBlog, setPreviewBlog] = useState<Blog | null>(null)

  // Active tab in editor
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit')

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  // Feature #16 Part B: Custom Embed uploader dialog
  const [customEmbedOpen, setCustomEmbedOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        const res = await fetch(`/api/blogs?${params.toString()}`)
        if (!cancelled && res.ok) {
          const data = await res.json()
          setBlogs(data)
        }
      } catch {
        if (!cancelled) {
          toast({ title: 'Failed to fetch blogs', variant: 'destructive' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [search, toast])

  const sortedBlogs = useMemo(() => {
    const [field, dir] = sortBy.split(':')
    const sorted = [...blogs].sort((a, b) => {
      let cmp = 0
      if (field === 'title') {
        cmp = a.title.localeCompare(b.title)
      } else if (field === 'status') {
        const statusVal = (p: boolean) => (p ? 1 : 0)
        cmp = statusVal(a.published) - statusVal(b.published)
      } else if (field === 'date') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return dir === 'desc' ? -cmp : cmp
    })
    return sorted
  }, [blogs, sortBy])

  const openCreate = () => {
    setEditingBlog(null)
    setForm(emptyForm)
    setEditorTab('edit')
    setEditorOpen(true)
  }

  const openEdit = (blog: Blog) => {
    setEditingBlog(blog)
    setForm({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      coverImage: blog.coverImage,
      tags: blog.tags,
      type: blog.type,
      embeds: blog.embeds || '',
      resourceLinks: blog.resourceLinks || '[]',
      published: blog.published,
      writtenBy: blog.writtenBy || '',
      acceptedBy: blog.acceptedBy || '',
      category: blog.category || '',
      scheduledAt: blog.scheduledAt ? formatDatetimeLocal(blog.scheduledAt) : '',
    })
    setEditorTab('edit')
    setEditorOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const url = editingBlog ? `/api/blogs/${editingBlog.id}` : '/api/blogs'
      const method = editingBlog ? 'PUT' : 'POST'

      const body: Record<string, unknown> = { ...form }
      if (!editingBlog) {
        body.slug = form.slug || generateSlug(form.title)
      } else {
        if (form.title !== editingBlog.title) {
          body.slug = form.slug || generateSlug(form.title)
        }
      }

      // Convert scheduledAt from datetime-local to ISO string, or null
      if (form.scheduledAt) {
        body.scheduledAt = new Date(form.scheduledAt).toISOString()
      } else {
        body.scheduledAt = null
      }

      // Do NOT auto-publish when scheduling — API handles auto-publish at scheduled time

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
        title: editingBlog ? 'Blog updated' : 'Blog created',
        description: `"${form.title}" has been saved successfully.`,
      })
      setEditorOpen(false)
      void (async () => {
        try {
          const params = new URLSearchParams()
          if (search) params.set('search', search)
          const res = await fetch(`/api/blogs?${params.toString()}`)
          if (res.ok) {
            const data = await res.json()
            setBlogs(data)
          }
        } catch {
          toast({ title: 'Failed to fetch blogs', variant: 'destructive' })
        }
      })()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save blog',
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
      const res = await fetch(`/api/blogs/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast({ title: 'Blog deleted', description: `"${deleteTarget.title}" has been removed.` })
      setDeleteTarget(null)
      void (async () => {
        try {
          const params = new URLSearchParams()
          if (search) params.set('search', search)
          const res = await fetch(`/api/blogs?${params.toString()}`)
          if (res.ok) {
            const data = await res.json()
            setBlogs(data)
          }
        } catch {
          toast({ title: 'Failed to fetch blogs', variant: 'destructive' })
        }
      })()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete blog', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  // ─── Bulk selection helpers ───────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === sortedBlogs.length) return new Set()
      return new Set(sortedBlogs.map((b) => b.id))
    })
  }, [sortedBlogs])

  const deselectAll = useCallback(() => setSelectedIds(new Set()), [])

  const isAllSelected = sortedBlogs.length > 0 && selectedIds.size === sortedBlogs.length
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < sortedBlogs.length

  // ─── Bulk actions ─────────────────────────────────────────
  const refreshBlogs = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/blogs?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setBlogs(data)
      }
    } catch {
      toast({ title: 'Failed to refresh blogs', variant: 'destructive' })
    }
  }, [search, toast])

  const bulkPublish = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    let success = 0
    let failed = 0
    const ids = [...selectedIds]
    await Promise.allSettled(
      ids.map(async (id) => {
        try {
          const res = await fetch(`/api/blogs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ published: true }),
          })
          if (res.ok) success++
          else failed++
        } catch {
          failed++
        }
      })
    )
    setBulkLoading(false)
    setSelectedIds(new Set())
    toast({
      title: 'Bulk Publish Complete',
      description: `${success} published, ${failed} failed.`,
      variant: failed > 0 ? 'destructive' : 'default',
    })
    void refreshBlogs()
  }

  const bulkUnpublish = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    let success = 0
    let failed = 0
    const ids = [...selectedIds]
    await Promise.allSettled(
      ids.map(async (id) => {
        try {
          const res = await fetch(`/api/blogs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ published: false }),
          })
          if (res.ok) success++
          else failed++
        } catch {
          failed++
        }
      })
    )
    setBulkLoading(false)
    setSelectedIds(new Set())
    toast({
      title: 'Bulk Unpublish Complete',
      description: `${success} unpublished, ${failed} failed.`,
      variant: failed > 0 ? 'destructive' : 'default',
    })
    void refreshBlogs()
  }

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    let success = 0
    let failed = 0
    const ids = [...selectedIds]
    await Promise.allSettled(
      ids.map(async (id) => {
        try {
          const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' })
          if (res.ok) success++
          else failed++
        } catch {
          failed++
        }
      })
    )
    setBulkLoading(false)
    setBulkDeleteOpen(false)
    setSelectedIds(new Set())
    toast({
      title: 'Bulk Delete Complete',
      description: `${success} deleted, ${failed} failed.`,
      variant: failed > 0 ? 'destructive' : 'default',
    })
    void refreshBlogs()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search blogs..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setLoading(true)
              }}
              className="pl-9"
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSearch('')
                  setLoading(true)
                }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <SortBar options={blogSortOptions} value={sortBy} onChange={setSortBy} />
        </div>
        <Button onClick={openCreate} size="sm" className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          New Blog
        </Button>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="sticky bottom-0 z-10 rounded-lg border bg-primary/5 backdrop-blur-sm p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span>{selectedIds.size} selected</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={bulkPublish}
                disabled={bulkLoading}
                className="text-xs"
              >
                {bulkLoading ? 'Publishing...' : 'Publish'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={bulkUnpublish}
                disabled={bulkLoading}
                className="text-xs"
              >
                {bulkLoading ? 'Unpublishing...' : 'Unpublish'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={bulkLoading}
                className="text-xs"
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={deselectAll}
                className="text-xs"
              >
                Deselect All
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">No blogs found.</p>
              <Button variant="link" className="mt-2" onClick={openCreate}>
                Create your first blog
              </Button>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] pl-4">
                      <Checkbox
                        checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
                        onCheckedChange={toggleSelectAll}
                        className="h-4 w-4"
                      />
                    </TableHead>
                    <TableHead className="w-[40%]">Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBlogs.map((blog) => (
                    <TableRow key={blog.id} data-selected={selectedIds.has(blog.id) ? '' : undefined}>
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={selectedIds.has(blog.id)}
                          onCheckedChange={() => toggleSelect(blog.id)}
                          className="h-4 w-4"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{blog.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            /{blog.slug}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-xs capitalize">
                            {blog.type}
                          </Badge>
                          {blog.category && (
                            <Badge variant="secondary" className="text-[10px]">
                              {blog.category}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {blog.tags
                            .split(',')
                            .filter(Boolean)
                            .slice(0, 3)
                            .map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {tag.trim()}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={blog.published ? 'default' : 'secondary'}
                            className="text-xs w-fit"
                          >
                            {blog.published ? 'Published' : 'Draft'}
                          </Badge>
                          {blog.scheduledAt && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(blog.scheduledAt), 'MMM d, yyyy HH:mm')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {format(new Date(blog.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPreviewBlog(blog)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(blog)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(blog)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog — improved layout for laptop */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBlog ? 'Edit Blog' : 'Create Blog'}</DialogTitle>
            <DialogDescription>
              {editingBlog ? 'Update the blog post details.' : 'Fill in the details to create a new blog post.'}
            </DialogDescription>
          </DialogHeader>

          {/* Tab toggle for edit/preview */}
          <div className="flex gap-1 rounded-lg bg-muted p-1 mb-4">
            <button
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                editorTab === 'edit'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setEditorTab('edit')}
            >
              Edit
            </button>
            <button
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                editorTab === 'preview'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setEditorTab('preview')}
            >
              Preview
            </button>
          </div>

          {editorTab === 'edit' ? (
            <div className="flex flex-col gap-4">
              {/* Row 1: Title + Slug + Type on one line on lg */}
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_160px]">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="blog-title">Title *</Label>
                  <Input
                    id="blog-title"
                    placeholder="Blog post title"
                    value={form.title}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="blog-slug">Slug</Label>
                  <Input
                    id="blog-slug"
                    placeholder="auto-generated-from-title"
                    value={form.slug}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, slug: e.target.value }))
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="blog-type">Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(val) => setForm((f) => ({ ...f, type: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="spotify">Spotify</SelectItem>
                      <SelectItem value="tweet">Tweet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Embeds + Custom Embed Uploader (Feature #16 Part B) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Embeds</Label>
                    {form.embeds &&
                      form.embeds
                        .split('\n')
                        .map((u) => u.trim())
                        .filter(Boolean).length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {form.embeds.split('\n').map((u) => u.trim()).filter(Boolean).length} embed(s)
                        </Badge>
                      )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomEmbedOpen(true)}
                    className="h-7 text-xs"
                  >
                    <Paperclip className="h-3.5 w-3.5 mr-1" />
                    Custom Embed
                  </Button>
                </div>
                {form.type !== 'article' ? (
                  <EmbedUrlInput
                    value={form.embeds}
                    onChange={(v) => setForm((f) => ({ ...f, embeds: v }))}
                  />
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    No manual embed URLs for article-type posts. Use{' '}
                    <button
                      type="button"
                      className="text-primary underline-offset-2 hover:underline"
                      onClick={() => setCustomEmbedOpen(true)}
                    >
                      Custom Embed
                    </button>{' '}
                    to attach images, videos, or other embeddable URLs.
                  </p>
                )}
              </div>

              {/* Resource Links (Feature #16 Part A) */}
              <div className="rounded-lg border p-3 bg-muted/30">
                <ResourceLinksInput
                  value={form.resourceLinks}
                  onChange={(v) => setForm((f) => ({ ...f, resourceLinks: v }))}
                />
              </div>

              

              {/* Row 2: Excerpt + Cover Image side by side on lg */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="blog-excerpt">Excerpt</Label>
                  <Textarea
                    id="blog-excerpt"
                    placeholder="Short description of the blog post"
                    value={form.excerpt}
                    onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="blog-cover">Cover Image URL</Label>
                  <Input
                    id="blog-cover"
                    placeholder="https://..."
                    value={form.coverImage}
                    onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                  />
                  <Label htmlFor="blog-tags" className="mt-2">Tags (comma-separated)</Label>
                  <Input
                    id="blog-tags"
                    placeholder="react, nextjs, typescript"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  />
                  <Label htmlFor="blog-category" className="mt-2">Category</Label>
                  <Input
                    id="blog-category"
                    placeholder="e.g. Technology, Tutorial, Career"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {CATEGORY_SUGGESTIONS.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`text-xs px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                          form.category === cat
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                        }`}
                        onClick={() => setForm((f) => ({ ...f, category: cat }))}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="blog-written-by">Written By (Maker)</Label>
                  <Input
                    id="blog-written-by"
                    placeholder="Author name"
                    value={form.writtenBy}
                    onChange={(e) => setForm((f) => ({ ...f, writtenBy: e.target.value }))}
                  />
                  <Label htmlFor="blog-accepted-by">Accepted By (Checker)</Label>
                  <Input
                    id="blog-accepted-by"
                    placeholder="Reviewer name"
                    value={form.acceptedBy}
                    onChange={(e) => setForm((f) => ({ ...f, acceptedBy: e.target.value }))}
                  />
                </div>
              </div>

              {/* SEO Preview */}
              <SeoPreview
                title={form.title}
                slug={form.slug}
                description={form.excerpt}
              />

              {/* Content — full width, taller on lg */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="blog-content">Content (Markdown)</Label>
                <Textarea
                  id="blog-content"
                  placeholder="Write your blog content in markdown..."
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={14}
                  className="font-mono text-sm lg:row-[20]"
                />
              </div>

              {/* Published toggle + Schedule */}
              <div className="flex flex-col gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.published}
                    onCheckedChange={(checked) => setForm((f) => ({ ...f, published: checked }))}
                  />
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Published</Label>
                    {form.scheduledAt && !form.published && (
                      <Badge className="bg-amber-500 text-white border-amber-500 text-[10px]">Scheduled</Badge>
                    )}
                    {form.scheduledAt && form.published && (
                      <Badge className="bg-green-600 text-white border-green-600 text-[10px]">Published</Badge>
                    )}
                    {!form.scheduledAt && !form.published && (
                      <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                    )}
                    {!form.scheduledAt && form.published && (
                      <Badge variant="default" className="text-[10px]">Published</Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Make this blog visible to the public
                </p>
                <div className="flex flex-col gap-1.5 mt-1">
                  <Label htmlFor="blog-scheduled-at" className="text-sm font-medium">Schedule Publishing</Label>
                  <Input
                    id="blog-scheduled-at"
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                    className="max-w-xs"
                  />
                  {form.scheduledAt && !form.published && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Will auto-publish at the scheduled time. Keep published off.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-[200px] rounded-lg border p-6 prose prose-sm dark:prose-invert max-w-none">
              {form.title && <h1 className="text-2xl font-bold mb-2">{form.title}</h1>}
              {form.excerpt && (
                <p className="text-muted-foreground mb-4 italic">{form.excerpt}</p>
              )}
              {form.content ? (
                <ReactMarkdown>{form.content}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground">No content to preview.</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingBlog ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog (from table) */}
      <Dialog open={!!previewBlog} onOpenChange={() => setPreviewBlog(null)}>
        <DialogContent className="max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewBlog?.title}</DialogTitle>
            <DialogDescription>
              {previewBlog && format(new Date(previewBlog.createdAt), 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          {previewBlog && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {previewBlog.excerpt && (
                <p className="text-muted-foreground italic mb-4">{previewBlog.excerpt}</p>
              )}
              {previewBlog.content ? (
                <ReactMarkdown>{previewBlog.content}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground">No content.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be
              undone.
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

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Blogs?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} selected blog{selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={bulkDelete}
              disabled={bulkLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkLoading ? 'Deleting...' : `Delete ${selectedIds.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Feature #16 Part B: Custom Embed Uploader Dialog */}
      <CustomEmbedDialog
        open={customEmbedOpen}
        onOpenChange={setCustomEmbedOpen}
        embeds={form.embeds}
        onChange={(v) => setForm((f) => ({ ...f, embeds: v }))}
      />
    </div>
  )
}
