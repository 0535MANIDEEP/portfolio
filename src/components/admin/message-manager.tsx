'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Mail,
  MailOpen,
  MailCheck,
  Circle,
  Trash2,
  Eye,
  EyeOff,
  Reply,
  ExternalLink,
  CheckCheck,
  Filter,
  Inbox,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { SortBar, SortOption } from './sort-bar'

interface Message {
  id: string
  name: string
  email: string
  subject: string
  message: string
  read: boolean
  createdAt: string
  replied: boolean
  repliedAt: string | null
  replyNote: string
}

type FilterValue = 'all' | 'unread' | 'replied'

const messageSortOptions: SortOption[] = [
  { value: 'name:asc', label: 'Name A → Z' },
  { value: 'name:desc', label: 'Name Z → A' },
  { value: 'status:asc', label: 'Unread First' },
  { value: 'status:desc', label: 'Read First' },
  { value: 'date:desc', label: 'Date Newest' },
  { value: 'date:asc', label: 'Date Oldest' },
]

export function MessageManager() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [sortBy, setSortBy] = useState('date:desc')
  const [filter, setFilter] = useState<FilterValue>('all')

  // Confirmation dialogs
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  // Internal reply-note draft in the detail dialog
  const [replyNoteDraft, setReplyNoteDraft] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // ----- Data fetching -----------------------------------------------------
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/messages')
      if (res.ok) {
        const data = (await res.json()) as Message[]
        setMessages(data)
      } else {
        toast({ title: 'Failed to fetch messages', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to fetch messages', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // ----- Derived counts ----------------------------------------------------
  const unreadCount = useMemo(
    () => messages.filter((m) => !m.read).length,
    [messages]
  )
  const repliedCount = useMemo(
    () => messages.filter((m) => m.replied).length,
    [messages]
  )

  // ----- Sorted + filtered list -------------------------------------------
  const sortedMessages = useMemo(() => {
    const [field, dir] = sortBy.split(':')
    const sorted = [...messages].sort((a, b) => {
      let cmp = 0
      if (field === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else if (field === 'status') {
        const statusVal = (r: boolean) => (r ? 1 : 0)
        cmp = statusVal(a.read) - statusVal(b.read)
      } else if (field === 'date') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return dir === 'desc' ? -cmp : cmp
    })
    if (filter === 'unread') return sorted.filter((m) => !m.read)
    if (filter === 'replied') return sorted.filter((m) => m.replied)
    return sorted
  }, [messages, sortBy, filter])

  // ----- PATCH helper ------------------------------------------------------
  const patchMessage = useCallback(
    async (id: string, patch: Partial<Pick<Message, 'read' | 'replied' | 'replyNote'>>) => {
      try {
        const res = await fetch(`/api/messages/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Update failed')
        }
        const updated = (await res.json()) as Message
        setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)))
        setSelectedMessage((prev) => (prev && prev.id === id ? updated : prev))
        return updated
      } catch (err) {
        toast({
          title: 'Update failed',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'destructive',
        })
        return null
      }
    },
    [toast]
  )

  // ----- Row actions -------------------------------------------------------
  const openMessage = useCallback(
    (message: Message) => {
      setSelectedMessage(message)
      setReplyNoteDraft(message.replyNote || '')
      if (!message.read) {
        void patchMessage(message.id, { read: true })
      }
    },
    [patchMessage]
  )

  const toggleRead = useCallback(
    async (message: Message) => {
      await patchMessage(message.id, { read: !message.read })
    },
    [patchMessage]
  )

  const buildMailto = useCallback((message: Message) => {
    const subject = `Re: ${message.subject || 'Your message'}`
    const bodyLines = [
      `Hi ${message.name},`,
      '',
      'Thanks for reaching out!',
      '',
      '— Gokul',
    ]
    const body = bodyLines.join('\n')
    return `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`
  }, [])

  const replyViaEmail = useCallback(
    async (message: Message) => {
      // Mark as replied + record timestamp
      const updated = await patchMessage(message.id, { replied: true })
      // Open mailto in a new tab/window
      if (typeof window !== 'undefined') {
        window.location.href = buildMailto(message)
      }
      if (updated) {
        toast({
          title: 'Replied via email',
          description: `Marked "${message.subject || 'message'}" as replied and opened your mail client.`,
        })
      }
    },
    [patchMessage, buildMailto, toast]
  )

  const markAsReplied = useCallback(
    async (message: Message) => {
      const updated = await patchMessage(message.id, { replied: true })
      if (updated) {
        toast({ title: 'Marked as replied' })
      }
    },
    [patchMessage, toast]
  )

  const unmarkReplied = useCallback(
    async (message: Message) => {
      const updated = await patchMessage(message.id, { replied: false })
      if (updated) {
        toast({ title: 'Reply flag cleared' })
      }
    },
    [patchMessage, toast]
  )

  const saveReplyNote = useCallback(async () => {
    if (!selectedMessage) return
    setSavingNote(true)
    await patchMessage(selectedMessage.id, { replyNote: replyNoteDraft })
    setSavingNote(false)
    toast({ title: 'Reply note saved' })
  }, [selectedMessage, replyNoteDraft, patchMessage, toast])

  // ----- Delete actions ----------------------------------------------------
  const deleteMessage = useCallback(
    async (message: Message) => {
      try {
        const res = await fetch(`/api/messages/${message.id}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Delete failed')
        }
        setMessages((prev) => prev.filter((m) => m.id !== message.id))
        if (selectedMessage?.id === message.id) setSelectedMessage(null)
        toast({
          title: 'Message deleted',
          description: `Message from ${message.name} has been deleted.`,
        })
      } catch (err) {
        toast({
          title: 'Error',
          description:
            err instanceof Error ? err.message : 'Failed to delete message',
          variant: 'destructive',
        })
      }
    },
    [selectedMessage, toast]
  )

  const deleteAllRead = useCallback(async () => {
    try {
      const res = await fetch('/api/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: 'read' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Bulk delete failed')
      }
      const data = (await res.json()) as { deletedCount?: number }
      const count = data.deletedCount ?? 0
      setMessages((prev) => prev.filter((m) => !m.read))
      toast({
        title: `${count} read message${count === 1 ? '' : 's'} deleted`,
        description:
          count === 0
            ? 'No read messages to delete.'
            : 'All read messages have been removed.',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to bulk delete',
        variant: 'destructive',
      })
    }
  }, [toast])

  // ----- Loading skeleton --------------------------------------------------
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary + filter + actions bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {messages.length} total
          </span>
        </div>
        <Badge variant={unreadCount > 0 ? 'default' : 'secondary'} className="text-xs">
          {unreadCount} unread
        </Badge>
        <Badge variant={repliedCount > 0 ? 'default' : 'secondary'} className="text-xs">
          <MailCheck className="h-3 w-3 mr-1" />
          {repliedCount} replied
        </Badge>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Filter dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Select
              value={filter}
              onValueChange={(v) => setFilter(v as FilterValue)}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All messages</SelectItem>
                <SelectItem value="unread">Unread only</SelectItem>
                <SelectItem value="replied">Replied only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SortBar options={messageSortOptions} value={sortBy} onChange={setSortBy} />

          {/* Bulk: delete all read */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 border-red-200 dark:border-red-800/30"
                disabled={messages.every((m) => !m.read)}
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete all read
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete all messages marked as read</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MailOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No messages yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Messages from the contact form will appear here.
              </p>
            </div>
          ) : sortedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Filter className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No messages match this filter.</p>
            </div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Status</TableHead>
                    <TableHead className="w-[20%]">From</TableHead>
                    <TableHead className="hidden sm:table-cell w-[28%]">Subject</TableHead>
                    <TableHead className="hidden md:table-cell w-[32%]">Preview</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMessages.map((msg) => (
                    <TableRow
                      key={msg.id}
                      className={`cursor-pointer ${!msg.read ? 'bg-primary/5' : ''}`}
                      onClick={() => openMessage(msg)}
                    >
                      <TableCell>
                        {msg.read ? (
                          <MailOpen className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <div className="relative">
                            <Mail className="h-4 w-4 text-primary" />
                            <Circle className="absolute -top-0.5 -right-0.5 h-2 w-2 fill-primary text-primary" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p
                              className={`truncate text-sm ${
                                !msg.read ? 'font-semibold' : 'font-medium'
                              }`}
                            >
                              {msg.name}
                            </p>
                            {msg.replied && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] py-0 px-1.5 h-4 gap-0.5 shrink-0"
                              >
                                <MailCheck className="h-2.5 w-2.5" />
                                Replied
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {msg.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <p className={`truncate text-sm ${!msg.read ? 'font-medium' : ''}`}>
                          {msg.subject || (
                            <span className="italic text-muted-foreground">No subject</span>
                          )}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="truncate text-sm text-muted-foreground">
                          {msg.message.slice(0, 80)}
                          {msg.message.length > 80 ? '...' : ''}
                        </p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(msg.createdAt), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {/* Reply via email */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                aria-label={`Reply via email to ${msg.name}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  void replyViaEmail(msg)
                                }}
                              >
                                <Reply className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reply via email</TooltipContent>
                          </Tooltip>

                          {/* Toggle read / unread */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                aria-label={msg.read ? 'Mark as unread' : 'Mark as read'}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  void toggleRead(msg)
                                }}
                              >
                                {msg.read ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {msg.read ? 'Mark as unread' : 'Mark as read'}
                            </TooltipContent>
                          </Tooltip>

                          {/* Delete (with confirmation) */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                                aria-label={`Delete message from ${msg.name}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteTarget(msg)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete message</TooltipContent>
                          </Tooltip>
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

      {/* Message Detail Dialog */}
      <Dialog
        open={!!selectedMessage}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMessage(null)
            setReplyNoteDraft('')
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedMessage?.read ? (
                <MailOpen className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Mail className="h-5 w-5 text-primary" />
              )}
              <DialogTitle className="flex-1 min-w-0">
                {selectedMessage?.subject || 'No Subject'}
              </DialogTitle>
              {selectedMessage?.replied && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <MailCheck className="h-3 w-3" />
                  Replied
                  {selectedMessage?.repliedAt && (
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(selectedMessage.repliedAt), 'MMM d, h:mm a')}
                    </span>
                  )}
                </Badge>
              )}
            </div>
            <DialogDescription>
              From{' '}
              <span className="font-medium text-foreground">
                {selectedMessage?.name}
              </span>{' '}
              ({selectedMessage?.email}) &middot;{' '}
              {selectedMessage &&
                format(new Date(selectedMessage.createdAt), 'MMMM d, yyyy h:mm a')}
            </DialogDescription>
          </DialogHeader>

          <Separator />

          {selectedMessage && (
            <div className="max-h-[240px] overflow-y-auto rounded-md border border-border/60 p-3 bg-muted/30">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {selectedMessage.message}
              </div>
            </div>
          )}

          {/* Reply note */}
          <div className="space-y-2">
            <label htmlFor="reply-note" className="text-xs font-medium text-muted-foreground">
              Internal reply note
            </label>
            <Textarea
              id="reply-note"
              placeholder="Optional note about how/when you replied (internal, not sent to sender)..."
              value={replyNoteDraft}
              onChange={(e) => setReplyNoteDraft(e.target.value)}
              className="min-h-[72px] text-sm"
            />
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={savingNote || replyNoteDraft === (selectedMessage?.replyNote || '')}
                onClick={() => void saveReplyNote()}
              >
                {savingNote ? 'Saving…' : 'Save note'}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {selectedMessage?.read ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MailCheck className="h-3.5 w-3.5" />
                  Read
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-primary">
                  <Circle className="h-2 w-2 fill-primary text-primary" />
                  Unread
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {selectedMessage && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => void replyViaEmail(selectedMessage)}
                >
                  <Reply className="h-3.5 w-3.5 mr-1" />
                  Reply via Email
                  <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
                </Button>
              )}
              {selectedMessage && !selectedMessage.replied && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void markAsReplied(selectedMessage)}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Mark as Replied
                </Button>
              )}
              {selectedMessage && selectedMessage.replied && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => void unmarkReplied(selectedMessage)}
                >
                  Clear replied flag
                </Button>
              )}
              {selectedMessage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 border-red-200 dark:border-red-800/30"
                  onClick={() => setDeleteTarget(selectedMessage)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedMessage(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Single delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  This will permanently delete the message from{' '}
                  <span className="font-medium text-foreground">
                    {deleteTarget.name}
                  </span>{' '}
                  ({deleteTarget.email})
                  {deleteTarget.subject
                    ? ` with subject "${deleteTarget.subject}".`
                    : '.'}{' '}
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (deleteTarget) void deleteMessage(deleteTarget)
                setDeleteTarget(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete-all-read confirmation */}
      <AlertDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all read messages?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <span className="font-medium text-foreground">
                {messages.filter((m) => m.read).length} read message
                {messages.filter((m) => m.read).length === 1 ? '' : 's'}
              </span>
              . Unread and replied-flagged (but unread) messages will be kept. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setBulkDeleteOpen(false)
                void deleteAllRead()
              }}
            >
              Delete all read
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
