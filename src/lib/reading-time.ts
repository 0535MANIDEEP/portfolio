/**
 * Estimate reading time for markdown/plain text.
 * Average adult reading speed: ~200 words per minute.
 * Returns minutes (minimum 1).
 */
export function estimateReadingTime(content: string, wpm = 200): number {
  if (!content) return 1
  // Strip markdown syntax for a more accurate word count
  const text = content
    .replace(/```[\s\S]*?```/g, ' ') // code blocks
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/!\[.*?\]\(.*?\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1') // links -> keep text
    .replace(/[#>*_~-]/g, ' ') // markdown symbols
    .replace(/\s+/g, ' ')
    .trim()
  const words = text ? text.split(' ').filter(Boolean).length : 0
  return Math.max(1, Math.ceil(words / wpm))
}

/**
 * Format a word count with thousands separator.
 */
export function formatWordCount(content: string): string {
  if (!content) return '0'
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return words.toLocaleString('en-US')
}
