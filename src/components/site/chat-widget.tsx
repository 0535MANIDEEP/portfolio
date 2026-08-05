'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Mic,
  MicOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ---------------------------------------------------------------------------
// Web Speech API typing (not in TS DOM lib by default)
// ---------------------------------------------------------------------------
interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}
interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: ((event: Event) => void) | null
  onstart: ((event: Event) => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm Gokul's AI assistant. Ask me anything about his projects, blog posts, skills, or experience.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // ---------------------- Voice input state ----------------------
  const { toast } = useToast()
  const recognitionCtor = useMemo(getSpeechRecognitionCtor, [])
  const speechSupported = recognitionCtor !== null

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const [listening, setListening] = useState(false)
  // Track the text that was in the input when listening started so we can
  // append (not overwrite) the recognized transcript.
  const baseInputRef = useRef<string>('')
  // Track the latest interim transcript so we can replace it on the next update
  const interimRef = useRef<string>('')

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (open && inputRef.current && !listening) {
      inputRef.current.focus()
    }
  }, [open, listening])

  // ---------------------- Cleanup speech on unmount ----------------------
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          /* noop */
        }
        recognitionRef.current = null
      }
    }
  }, [])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    // Stop listening if user sends while still recording
    if (listening) stopListening()
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMsg }],
        }),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Request failed (${res.status})`)
      }
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        assistantContent += chunk

        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: assistantContent,
          }
          return updated
        })
      }

      if (!assistantContent) {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: "I couldn't generate a response. Please try again.",
          }
          return updated
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error (${msg}). Please try again.`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, listening])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ---------------------- Voice input handlers ----------------------
  const startListening = useCallback(() => {
    if (!recognitionCtor) return
    if (listening) return

    const recognition = new recognitionCtor()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    baseInputRef.current = input
    interimRef.current = ''

    recognition.onstart = () => {
      setListening(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let finalChunk = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result.item(0)?.transcript || ''
        if (result.isFinal) {
          finalChunk += transcript
        } else {
          interim += transcript
        }
      }

      if (finalChunk) {
        // Commit final results: append to the base, drop interim overlay.
        const base = baseInputRef.current
        const joined = (base ? base + ' ' : '') + finalChunk.trim()
        baseInputRef.current = joined
        interimRef.current = ''
        setInput(joined)
      } else if (interim) {
        // Show interim overlay on top of the committed base.
        interimRef.current = interim
        const base = baseInputRef.current
        setInput((base ? base + ' ' : '') + interim)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const code = event.error || 'unknown'
      console.warn('[SpeechRecognition] error:', code, event.message)

      if (code === 'not-allowed' || code === 'service-not-allowed') {
        toast({
          variant: 'destructive',
          title: 'Microphone access denied',
          description:
            'Please allow microphone access in your browser settings to use voice input.',
        })
      } else if (code === 'no-speech') {
        // Silent — user just didn't say anything. Treat as end.
      } else if (code === 'audio-capture') {
        toast({
          variant: 'destructive',
          title: 'No microphone found',
          description: 'Please connect a microphone to use voice input.',
        })
      } else if (code === 'network') {
        toast({
          variant: 'destructive',
          title: 'Network error',
          description: 'Speech recognition needs an internet connection.',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Voice input error',
          description: event.message || code,
        })
      }
    }

    recognition.onend = () => {
      setListening(false)
      // On end, drop any lingering interim so the input shows committed text.
      if (interimRef.current) {
        setInput(baseInputRef.current)
        interimRef.current = ''
      }
      // Refocus the input so the user can keep typing / send.
      if (inputRef.current) inputRef.current.focus()
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
    } catch (err) {
      console.error('[SpeechRecognition] start() failed:', err)
      setListening(false)
      toast({
        variant: 'destructive',
        title: 'Voice input failed',
        description: 'Could not start speech recognition. Please try again.',
      })
    }
  }, [recognitionCtor, listening, input, toast])

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec) {
      setListening(false)
      return
    }
    try {
      rec.stop()
    } catch {
      /* noop */
    }
    // onend will clear listening state, but set it defensively in case onend
    // doesn't fire (some browsers are flaky).
    setListening(false)
  }, [])

  const toggleListening = useCallback(() => {
    if (listening) stopListening()
    else startListening()
  }, [listening, startListening, stopListening])

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
            title="Chat with AI"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[520px] max-h-[calc(100vh-6rem)] rounded-2xl border bg-background shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">
                    Ask about Gokul
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    AI-powered portfolio assistant
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  if (listening) stopListening()
                  setOpen(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages - scrollable with native overflow */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-3">
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      {msg.content || (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" />
                        </span>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
                {loading &&
                  messages[messages.length - 1]?.role !== 'assistant' && (
                    <div className="flex gap-2">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-md px-3.5 py-2.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input - always visible, fixed at bottom */}
            <div className="border-t px-3 py-3 shrink-0 bg-background">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    // If the user types while listening, treat their typing as
                    // the new base text.
                    if (listening) {
                      baseInputRef.current = e.target.value
                      interimRef.current = ''
                    }
                    setInput(e.target.value)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    listening ? 'Listening… speak now' : 'Ask about projects, skills, blogs…'
                  }
                  disabled={loading}
                  className="flex-1 h-10 text-sm rounded-full px-4"
                />

                {/* Mic button — only when SpeechRecognition is supported */}
                {speechSupported ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant={listening ? 'destructive' : 'outline'}
                        onClick={toggleListening}
                        disabled={loading}
                        className={`h-10 w-10 rounded-full shrink-0 ${
                          listening ? 'animate-pulse' : ''
                        }`}
                        aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                        aria-pressed={listening}
                      >
                        {listening ? (
                          <MicOff className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {listening
                        ? 'Stop listening'
                        : 'Voice input — click and speak'}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          disabled
                          className="h-10 w-10 rounded-full shrink-0 opacity-50 cursor-not-allowed"
                          aria-label="Voice input not supported in this browser"
                        >
                          <MicOff className="h-4 w-4" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      Voice input not supported in this browser
                    </TooltipContent>
                  </Tooltip>
                )}

                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full shrink-0"
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
