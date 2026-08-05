'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Briefcase, MapPin, FileDown, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * About section for the home page.
 *
 * Reads from the Profile record rather than repeating the hardcoded copy on
 * /about, so editing the bio in the admin panel updates both places.
 */

export interface AboutProfile {
  name?: string
  occupation?: string
  company?: string
  location?: string
  bio?: string
  tagline?: string
  avatar?: string
  resumeUrl?: string
  certifications?: string[]
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

/** Split the bio into paragraphs; long single-blob bios still read well. */
function toParagraphs(bio: string): string[] {
  const byBlankLine = bio.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  if (byBlankLine.length > 1) return byBlankLine

  const sentences = bio.match(/[^.!?]+[.!?]+(\s|$)/g)
  if (!sentences || sentences.length < 4) return [bio]

  const mid = Math.ceil(sentences.length / 2)
  return [sentences.slice(0, mid).join('').trim(), sentences.slice(mid).join('').trim()].filter(Boolean)
}

/** Initials badge, used when there is no avatar or the file is missing. */
function InitialsAvatar({ name }: { name?: string }) {
  const initials = (name || 'G')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-semibold text-primary">
      {initials}
    </div>
  )
}

export function AboutSection({ profile }: { profile: AboutProfile }) {
  // Profile.avatar points at a file that may not have been uploaded yet, so
  // fall back to initials rather than rendering a broken image.
  const [avatarFailed, setAvatarFailed] = useState(false)

  const bio = (profile.bio || profile.tagline || '').trim()
  if (!bio) return null

  const paragraphs = toParagraphs(bio)
  const certifications = profile.certifications ?? []
  const showImage = Boolean(profile.avatar) && !avatarFailed

  return (
    <section id="about" className="py-20 px-4 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold sm:text-3xl">About Me</h2>
          <p className="text-muted-foreground mt-1">A little background on how I work</p>
        </motion.div>

        <div className="grid gap-10 md:grid-cols-[auto_1fr] md:items-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto md:mx-0"
          >
            <div className="relative h-40 w-40 overflow-hidden rounded-2xl border bg-card shadow-sm">
              {showImage ? (
                <Image
                  src={profile.avatar as string}
                  alt={profile.name ? `Portrait of ${profile.name}` : 'Profile photo'}
                  fill
                  sizes="160px"
                  className="object-cover"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <InitialsAvatar name={profile.name} />
              )}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="min-w-0"
          >
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {profile.occupation && (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-primary" />
                  {profile.occupation}
                  {profile.company ? ` · ${profile.company}` : ''}
                </span>
              )}
              {profile.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {profile.location}
                </span>
              )}
            </div>

            <div className="mt-5 space-y-4">
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={i === 0 ? 'text-lg leading-relaxed text-foreground/90' : 'leading-relaxed text-muted-foreground'}
                >
                  {p}
                </p>
              ))}
            </div>

            {certifications.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Certifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert) => (
                    <span
                      key={cert}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium"
                    >
                      <Award className="h-3 w-3 text-primary" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link href="/about" className="gap-2">
                  Read full background <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {profile.resumeUrl && (
                <Button variant="outline" asChild>
                  <a href={profile.resumeUrl} download className="gap-2">
                    <FileDown className="h-4 w-4" /> Resume
                  </a>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
