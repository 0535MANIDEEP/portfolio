'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Trash2, Pencil, Search, ExternalLink,
  Loader2, Check, X, Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

/**
 * Comment moderation.
 *
 * Comments could previously only be created — there was no way to read them
 * all in one place or remove one, so the only recourse for spam was the
 * database console.
 */

interface Comment {
  id: string
  name: string
  email: string
  content: string
  entityType: string
  entityId: string
  createdAt: string
}

const ENTITY_LABEL: Record<string, string> = {
  blog: 'Blog',
  project: 'Project',
  course: 'Course',
  snippet: 'Snippet',
}

function entityHref(c: Comment): string {
  switch (c.entityType) {
    case 'blog': return `/blog/${c.entityId}`
    case 'project': return `/projects/${c.entityId}`
    case 'course': return `/courses/${c.entityId}`
    case 'snippet': return `/snippets#${c.entityId}`
    default: return '#'
  }
}

export function CommentManager() {
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Comment | null>(null)

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/comments?all=true')
      if (!res.ok) throw new Error('Failed to load comments')
      setComments(await res.json())
    } catch {
      toast({ title: 'Could not load comments', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchComments() }, [fetchComments])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return comments.filter((c) => {
      if (typeFilter !== 'all' && c.entityType !== typeFilter) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q) ||
        c.entityId.toLowerCase().includes(q)
      )
    })
  }, [comments, search, typeFilter])

  const startEdit = (c: Comment) => {
    setEditingId(c.id)
    setEditValue(c.content)
  }

  const saveEdit = async (id: string) => {
    if (!editValue.trim()) {
      toast({ title: 'Comment cannot be empty', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editValue }),
      })
      if (!res.ok) throw new Error()
      setComments((prev) => prev.map((c) => (c.id === id ? { ...c, content: editValue.trim() } : c)))
      setEditingId(null)
      toast({ title: 'Comment updated' })
    } catch {
      toast({ title: 'Could not update comment', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const target = pendingDelete
    setPendingDelete(null)
    try {
      const res = await fetch(`/api/comments/${target.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setComments((prev) => prev.filter((c) => c.id !== target.id))
      toast({ title: 'Comment deleted' })
    } catch {
      toast({ title: 'Could not delete comment', variant: 'destructive' })
    }
  }

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of comments) counts[c.entityType] = (counts[c.entityType] || 0) + 1
    return counts
  }, [comments])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments
            <Badge variant="secondary">{comments.length}</Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Moderate comments left on blogs, projects, courses and snippets.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by author, content or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[190px]">
            <span className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All content ({comments.length})</SelectItem>
            {Object.keys(ENTITY_LABEL).map((t) => (
              <SelectItem key={t} value={t}>
                {ENTITY_LABEL[t]} ({typeCounts[t] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-12 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">
            {comments.length === 0
              ? 'No comments yet.'
              : 'No comments match the current filters.'}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filtered.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          {c.email && (
                            <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {ENTITY_LABEL[c.entityType] || c.entityType}
                        </Badge>
                        <a
                          href={entityHref(c)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                          title={`Open ${c.entityId}`}
                        >
                          {c.entityId}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    {editingId === c.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEdit(c.id)} disabled={saving} className="gap-1.5">
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="gap-1.5">
                            <X className="h-3.5 w-3.5" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(c.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                      {editingId !== c.id && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => startEdit(c)}
                            title="Edit comment"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setPendingDelete(c)}
                            title="Delete comment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && (
                <>
                  The comment by <strong>{pendingDelete.name}</strong> will be permanently
                  removed. This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
