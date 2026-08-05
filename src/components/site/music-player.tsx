'use client'

import { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { useMounted } from '@/hooks/use-mounted'

export function MusicPlayer() {
  const [muted, setMuted] = useState(true) // start muted (paused) until user interacts
  const [musicUrl, setMusicUrl] = useState<string | null>(null)
  const [enableMusic, setEnableMusic] = useState(false)
  const [ready, setReady] = useState(false)
  const mounted = useMounted()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Fetch music settings
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.musicUrl) {
          setMusicUrl(data.musicUrl)
          setEnableMusic(data.enableMusic !== false) // default true if URL set
        }
        setReady(true)
      })
      .catch(() => setReady(true))
  }, [])

  // Set up audio when musicUrl is available
  useEffect(() => {
    if (!mounted || !musicUrl || !enableMusic) return

    const audio = new Audio(musicUrl)
    audio.loop = true
    audio.volume = 0.3
    audioRef.current = audio

    // Browsers block autoplay with sound — play on first user interaction
    const playOnInteraction = () => {
      audio.play().then(() => {
        setMuted(false)
      }).catch(() => {})
      document.removeEventListener('click', playOnInteraction)
      document.removeEventListener('keydown', playOnInteraction)
      document.removeEventListener('touchstart', playOnInteraction)
    }

    document.addEventListener('click', playOnInteraction)
    document.addEventListener('keydown', playOnInteraction)
    document.addEventListener('touchstart', playOnInteraction)

    return () => {
      audio.pause()
      audio.src = ''
      document.removeEventListener('click', playOnInteraction)
      document.removeEventListener('keydown', playOnInteraction)
      document.removeEventListener('touchstart', playOnInteraction)
    }
  }, [mounted, musicUrl, enableMusic])

  // Don't render until we've checked settings
  if (!mounted || !ready || !musicUrl || !enableMusic) return null

  const toggleMute = () => {
    if (!audioRef.current) return
    if (muted) {
      audioRef.current.play().catch(() => {})
      setMuted(false)
    } else {
      audioRef.current.pause()
      setMuted(true)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="fixed bottom-20 left-6 z-40"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMute}
          className="h-9 gap-1.5 rounded-full px-3 text-xs shadow-sm bg-background/80 backdrop-blur-sm"
          title={muted ? 'Play music' : 'Mute music'}
          aria-label={muted ? 'Play music' : 'Mute music'}
        >
          {muted ? (
            <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
          <Music className="h-3 w-3" />
          <span className="hidden sm:inline">{muted ? 'Play' : 'Mute'}</span>
        </Button>
      </motion.div>
    </AnimatePresence>
  )
}
